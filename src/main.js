import "./style.css";
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { worlds } from "./worlds/index.js";
import { loadPyodideRuntime, runLesson, runFreeCode } from "./pyRunner.js";
import { checkBackendHealth, fetchProgress, saveProgress } from "./progress.js";
import { errorPanelHtml } from "./pyErrors.js";
import { expectedComparisonHtml } from "./compare.js";
import { openStepper } from "./stepper.js";
import { pulseXpCounter, floatXpGain, celebrateLevelUp } from "./animations.js";

const app = document.getElementById("app");

const PLAYER_ID = "Jugador";

const LEVELS = [
  { name: "Aprendiz Errante", xp: 0 },
  { name: "Tejedor de Cadenas", xp: 50 },
  { name: "Domador de Bucles", xp: 100 },
  { name: "Explorador de Matrices", xp: 160 },
  { name: "Guardián de Datos", xp: 220 },
  { name: "Iniciado en Clases", xp: 300 },
  { name: "Arquitecto de Herencias", xp: 380 },
  { name: "Maestro de Pythonia", xp: 480 },
];

function levelFor(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp) current = lvl;
  }
  return current;
}

const state = {
  screen: "loading", // loading | map | lesson | world-complete | playground
  player: PLAYER_ID,
  xp: 0,
  completed: new Set(),
  drafts: {},
  revealedHints: {},
  quizAnswers: {}, // { [lessonId]: { check: optionIndex, analyze: optionIndex } }
  currentLessonId: null,
  pyodideStatus: "Cargando el intérprete de Python (Pyodide)…",
  pyodideReady: false,
  backendStatus: "checking", // checking | online | offline
};

let editorView = null;

// Anuncia texto a lectores de pantalla sin mover el foco (respuesta de quiz,
// pista revelada): esas dos acciones reconstruyen toda la lección con
// renderLesson(), así que un aria-live puesto en el HTML no sobrevive al
// remplazo — este nodo vive fuera de #app (ver index.html) y no se destruye.
// El pequeño retraso y el vaciado previo hacen que el lector note el cambio
// incluso si el texto nuevo es igual al anterior.
function announce(text) {
  const el = document.getElementById("a11y-announcer");
  if (!el) return;
  el.textContent = "";
  window.setTimeout(() => {
    el.textContent = text;
  }, 30);
}

// Al cambiar de pantalla dentro de la app (no en la primera carga), lleva el
// foco al título de la nueva pantalla — si no, el foco queda "perdido" en
// <body> porque el botón que se pulsó ya no existe tras el rerender, y quien
// navega con teclado o lector de pantalla no se entera de que la vista cambió.
let hasNavigatedOnce = false;
function focusMainContent() {
  const main = document.getElementById("main-content");
  if (!main) return;
  const heading = main.querySelector("h2");
  const target = heading || main;
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: false });
}

loadPyodideRuntime((status) => {
  state.pyodideStatus = status;
  if (!status) state.pyodideReady = true;
  updatePyodideStatusUI();
}).catch((err) => {
  state.pyodideStatus = "No se pudo cargar Pyodide: " + err.message;
  updatePyodideStatusUI();
});

checkBackendHealth().then((ok) => {
  state.backendStatus = ok ? "online" : "offline";
  updateBackendStatusUI();
});

// Guarda el progreso actual en el servidor (y en Mongo, a través de él).
// Si el backend no responde, el juego sigue funcionando solo en memoria —
// por eso siempre se falla en silencio y solo se actualiza el indicador.
async function persistProgress() {
  if (!state.player) return;
  try {
    await saveProgress(state.player, {
      xp: state.xp,
      completed: Array.from(state.completed),
      quizAnswers: state.quizAnswers,
      revealedHints: state.revealedHints,
    });
    state.backendStatus = "online";
  } catch (err) {
    console.warn("No se pudo guardar el progreso:", err.message);
    state.backendStatus = "offline";
  }
  updateBackendStatusUI();
}

function updateBackendStatusUI() {
  const el = document.getElementById("backend-status");
  if (!el) return;
  el.textContent = { checking: "⏳ conectando…", online: "☁ guardado", offline: "⚠ sin conexión al servidor" }[
    state.backendStatus
  ];
  el.className = "backend-status " + state.backendStatus;
}

function formatTeachText(text) {
  return text
    .split("\n\n")
    .map((para) => `<p>${para.replace(/`([^`]+)`/g, "<code>$1</code>")}</p>`)
    .join("");
}

// Ubica una lección por id en cualquier mundo y devuelve el contexto completo
// (a qué mundo pertenece, la lista de lecciones de ese mundo, y su índice).
function getLessonContext(id) {
  for (let worldIndex = 0; worldIndex < worlds.length; worldIndex++) {
    const entry = worlds[worldIndex];
    const lessonIndex = entry.lessons.findIndex((l) => l.id === id);
    if (lessonIndex !== -1) {
      return { worldIndex, world: entry.world, lessons: entry.lessons, lesson: entry.lessons[lessonIndex], lessonIndex };
    }
  }
  return null;
}

function getLessonById(id) {
  return getLessonContext(id)?.lesson;
}

function isWorldComplete(worldIndex) {
  return worlds[worldIndex].lessons.every((l) => state.completed.has(l.id));
}

function isWorldUnlocked(worldIndex) {
  // TEMPORAL: todos los mundos desbloqueados para poder probarlos.
  // Revertir a `worldIndex === 0 || isWorldComplete(worldIndex - 1)` antes de lanzar.
  return true;
}

// El mundo "activo" para mostrar en la barra superior fuera de una lección:
// el primero que todavía no se ha completado (o el último, si ya se completó todo).
function frontierWorldIndex() {
  const idx = worlds.findIndex((_, i) => !isWorldComplete(i));
  return idx === -1 ? worlds.length - 1 : idx;
}

function navigate(screen, extra = {}) {
  state.screen = screen;
  Object.assign(state, extra);
  render();
  if (hasNavigatedOnce) focusMainContent();
  hasNavigatedOnce = true;
}

// Delegación global: estas dos acciones aparecen en varias pantallas
// (topbar y encabezado de lección), así que se conectan una sola vez aquí
// en vez de repetir el addEventListener en cada función de render.
app.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) {
    const action = actionTarget.dataset.action;
    if (action === "back-to-map") navigate("map");
    if (action === "nav-map") navigate("map");
    if (action === "nav-playground") navigate("playground");
    if (action === "toggle-sidebar") toggleSidebar();
    if (action === "close-sidebar") toggleSidebar(false);
    return;
  }

  // Bloques "Recordar" y "Analizar": la primera respuesta que se elige queda
  // fijada (no se puede cambiar), y se revela cuál era la correcta.
  const quizTarget = event.target.closest("[data-quiz-kind]");
  if (quizTarget) {
    const lessonId = state.currentLessonId;
    const kind = quizTarget.dataset.quizKind;
    const lesson = getLessonById(lessonId);
    if (!state.quizAnswers[lessonId]) state.quizAnswers[lessonId] = {};
    const answers = state.quizAnswers[lessonId];
    if (answers[kind] !== undefined) return;
    const optionIndex = Number(quizTarget.dataset.optionIndex);
    answers[kind] = optionIndex;
    const block = kind === "check" ? lesson.check : lesson.analyze;
    const opt = block.options[optionIndex];
    const feedbackText =
      kind === "check"
        ? (opt.correct ? "Correcto. " : "Incorrecto. ") + (opt.correct ? block.feedbackCorrect : block.feedbackIncorrect)
        : (opt.correct ? "Correcto. " : "Incorrecto. ") + block.explanation;
    renderLesson();
    // renderLesson() reconstruye la pantalla entera (incluida la opción que se
    // acaba de pulsar), así que un aria-live puesto en el HTML no alcanza a
    // anunciar este cambio — se anuncia aparte y se le devuelve el foco a la
    // opción elegida, que sigue en el mismo lugar visual pero es un nodo nuevo.
    announce(feedbackText);
    // La opción elegida queda disabled tras el render (no puede recibir foco),
    // así que el foco va al bloque de retroalimentación que aparece junto a ella.
    document.querySelector(`.${kind === "check" ? "check" : "analyze"}-block .quiz-feedback`)?.focus();
    persistProgress();
  }
});

// Cerrada, la barra lateral queda fuera de pantalla (transform) pero seguía
// siendo alcanzable con Tab — quien navega con teclado caía en botones
// invisibles antes de llegar al contenido. `inert` la saca por completo del
// orden de tabulación y de lectores de pantalla mientras está cerrada, sin
// afectar la animación visual (que sigue siendo solo CSS).
function toggleSidebar(force) {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  const toggleBtn = document.querySelector('[data-action="toggle-sidebar"]');
  if (!sidebar) return;
  const open = force !== undefined ? force : !sidebar.classList.contains("open");
  sidebar.classList.toggle("open", open);
  overlay?.classList.toggle("open", open);
  sidebar.inert = !open;
  sidebar.setAttribute("aria-hidden", String(!open));
  toggleBtn?.setAttribute("aria-expanded", String(open));
  if (open) sidebar.querySelector(".sidebar-item, .icon-btn")?.focus();
}

function sidebarHtml() {
  return `
    <div class="sidebar-overlay" data-action="close-sidebar"></div>
    <nav class="sidebar" id="app-sidebar" aria-label="Menú principal" inert aria-hidden="true">
      <div class="sidebar-head">
        <span class="eyebrow">Menú</span>
        <button class="icon-btn" data-action="close-sidebar" aria-label="Cerrar menú"><span aria-hidden="true">✕</span></button>
      </div>
      <button class="sidebar-item ${state.screen === "map" ? "active" : ""}" data-action="nav-map">🗺️ Mapa de mundos</button>
      <button class="sidebar-item ${state.screen === "playground" ? "active" : ""}" data-action="nav-playground">🐍 Editor libre de Python</button>
    </nav>
  `;
}

function topbarHtml() {
  const level = levelFor(state.xp);
  const activeWorld =
    state.screen === "lesson" ? getLessonContext(state.currentLessonId)?.world : worlds[frontierWorldIndex()].world;
  return `
    <div class="topbar">
      <div style="display:flex; align-items:center; gap:0.8rem;">
        <button class="icon-btn" data-action="toggle-sidebar" aria-label="Abrir menú" aria-expanded="false" aria-controls="app-sidebar"><span aria-hidden="true">☰</span></button>
        <div class="brand">
          <h1>Pythonia</h1>
          <span class="eyebrow">${activeWorld?.title ?? ""}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:0.7rem;">
        <span class="player-badge">${level.name}</span>
        <span class="xp-counter" id="xp-counter">✦ ${state.xp} XP</span>
        <span class="backend-status ${state.backendStatus}" id="backend-status">${
          { checking: "⏳ conectando…", online: "☁ guardado", offline: "⚠ sin conexión al servidor" }[state.backendStatus]
        }</span>
      </div>
    </div>
  `;
}

// Skeleton con la forma real de la pantalla que va a reemplazar (topbar +
// dos tarjetas de mundo con sus filas de lección) en vez de un spinner
// genérico: se ve la estructura de la app antes de que lleguen los datos.
// Es puramente visual (aria-hidden) — el texto de estado real que sí anuncian
// los lectores de pantalla va aparte, en el <p class="sr-only">.
function skeletonWorldCard() {
  return `
    <div class="skeleton-card">
      <div class="skeleton skeleton-line title"></div>
      <div class="skeleton skeleton-line subtitle"></div>
      <div class="skeleton skeleton-bar"></div>
      <div class="skeleton skeleton-row"></div>
      <div class="skeleton skeleton-row"></div>
      <div class="skeleton skeleton-row"></div>
    </div>
  `;
}

function renderLoading() {
  app.innerHTML = `
    <div class="skeleton-screen" aria-hidden="true">
      <div class="skeleton-topbar">
        <div class="skeleton brand-skel"></div>
        <div class="skeleton badge-skel"></div>
      </div>
      ${skeletonWorldCard()}
      ${skeletonWorldCard()}
    </div>
    <p class="sr-only" role="status">Cargando tu progreso…</p>
  `;
}

function renderMap() {
  const worldCards = worlds
    .map(({ world: w, lessons: worldLessons }, worldIndex) => {
      if (!isWorldUnlocked(worldIndex)) {
        return `
          <div class="locked-world">
            <div><strong>${w.title}</strong><br>${w.target.replace(/^objetivo: /, "")} — próximamente</div>
            <span class="mono" style="color:var(--text-dim);" aria-hidden="true">🔒</span>
          </div>
        `;
      }

      const doneCount = worldLessons.filter((l) => state.completed.has(l.id)).length;
      const pct = Math.round((doneCount / worldLessons.length) * 100);
      const rows = worldLessons
        .map((l) => {
          const done = state.completed.has(l.id);
          return `
            <button class="lesson-row playable ${done ? "done" : ""} ${l.final ? "final" : ""}" data-lesson="${l.id}">
              <span class="status">${done ? "✓" : l.num}</span>
              <span class="name">${l.title}</span>
              <span class="xp">+${l.xp} XP</span>
            </button>
          `;
        })
        .join("");

      return `
        <div class="world-card">
          <div class="mundo-head" style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem;">
            <h2>${w.title}</h2>
          </div>
          <span class="world-target">${w.target}</span>
          <div class="world-progress">
            <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-valuetext="${doneCount} de ${worldLessons.length} lecciones completadas"><i style="width:${pct}%"></i></div>
            <span class="label">${doneCount} / ${worldLessons.length} lecciones completadas</span>
          </div>
          <div class="lesson-list">${rows}</div>
        </div>
      `;
    })
    .join("");

  app.innerHTML = `
    ${sidebarHtml()}
    <main class="shell" id="main-content">
      ${topbarHtml()}

      ${worldCards}
    </main>
  `;

  app.querySelectorAll("[data-lesson]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate("lesson", { currentLessonId: btn.dataset.lesson });
    });
  });
}

function renderWorldComplete() {
  const worldIndex = state.completedWorldIndex ?? 0;
  const { world } = worlds[worldIndex];
  const nextWorld = worlds[worldIndex + 1];

  app.innerHTML = `
    ${sidebarHtml()}
    <main class="shell" id="main-content">
      ${topbarHtml()}
      <div class="complete-card">
        <div class="badge-icon" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h11l3 3v13H5z"/></svg>
        </div>
        <span class="eyebrow">Insignia obtenida</span>
        <h2>${world.badge.title}</h2>
        <p>${world.badge.description} — ¡${world.title} completo! Sumaste ${state.xp} XP en total. Ahora eres <strong>${levelFor(state.xp).name}</strong>.</p>
        <div style="margin-top:1.5rem; display:flex; gap:0.7rem; flex-wrap:wrap;">
          ${
            nextWorld
              ? `<button class="btn primary" id="next-world-btn">Continuar a ${nextWorld.world.title} →</button>`
              : `<span class="mono" style="color:var(--text-dim);">¡Completaste todos los mundos disponibles por ahora!</span>`
          }
          <button class="btn" data-action="back-to-map">Volver al mapa</button>
        </div>
      </div>
    </main>
  `;

  const nextWorldBtn = document.getElementById("next-world-btn");
  if (nextWorldBtn) {
    nextWorldBtn.addEventListener("click", () => {
      navigate("lesson", { currentLessonId: nextWorld.lessons[0].id });
    });
  }
}

function renderQuizOptions(options, kind, lessonId) {
  const answered = state.quizAnswers[lessonId]?.[kind];
  return options
    .map((opt, i) => {
      let cls = "quiz-option";
      if (answered !== undefined) {
        if (opt.correct) cls += " correct";
        else if (i === answered) cls += " incorrect";
      }
      return `<button class="${cls}" data-quiz-kind="${kind}" data-option-index="${i}" ${
        answered !== undefined ? "disabled" : ""
      }>${opt.text}</button>`;
    })
    .join("");
}

function renderCheckBlock(lesson) {
  if (!lesson.check) return "";
  const answered = state.quizAnswers[lesson.id]?.check;
  const feedback =
    answered !== undefined
      ? `<div class="quiz-feedback ${lesson.check.options[answered].correct ? "correct" : "incorrect"}" tabindex="-1">${
          lesson.check.options[answered].correct
            ? "✓ " + lesson.check.feedbackCorrect
            : "✗ " + lesson.check.feedbackIncorrect
        }</div>`
      : "";
  return `
    <div class="quiz-block check-block">
      <span class="tag">🧠 Recordar</span>
      <p>${lesson.check.question}</p>
      <div class="quiz-options">${renderQuizOptions(lesson.check.options, "check", lesson.id)}</div>
      ${feedback}
    </div>
  `;
}

function renderAnalyzeBlock(lesson) {
  if (!lesson.analyze) return "";
  const answered = state.quizAnswers[lesson.id]?.analyze;
  const feedback =
    answered !== undefined
      ? `<div class="quiz-feedback ${lesson.analyze.options[answered].correct ? "correct" : "incorrect"}" tabindex="-1">${
          lesson.analyze.options[answered].correct ? "✓ ¡Correcto! " : "✗ No exactamente. "
        }${lesson.analyze.explanation}</div>`
      : "";
  return `
    <div class="quiz-block analyze-block">
      <span class="tag">🔍 Analizar</span>
      <div class="example-code"><pre>${lesson.analyze.codeHtml}</pre></div>
      <p>${lesson.analyze.question}</p>
      <div class="quiz-options">${renderQuizOptions(lesson.analyze.options, "analyze", lesson.id)}</div>
      ${feedback}
    </div>
  `;
}

function renderLesson() {
  const lesson = getLessonById(state.currentLessonId);
  const revealed = state.revealedHints[lesson.id] || 0;

  app.innerHTML = `
    ${sidebarHtml()}
    <main class="shell" id="main-content">
      ${topbarHtml()}
      <button class="btn-link" data-action="back-to-map">&larr; volver al mapa</button>

      <div class="lesson-header" style="margin-top:1rem;">
        <h2>${lesson.title}</h2>
        <span class="mono" style="color:var(--text-dim); font-size:0.8rem;">+${lesson.xp} XP</span>
      </div>

      ${lesson.teach ? `
        <div class="teach-block">
          <span class="tag">📘 Comprender · antes de programar</span>
          ${formatTeachText(lesson.teach.intro)}
          <div class="example-code">
            <pre>${lesson.teach.exampleHtml}</pre>
          </div>
        </div>
      ` : ""}

      ${renderCheckBlock(lesson)}
      ${renderAnalyzeBlock(lesson)}

      <div class="quest-brief">
        <span class="tag">🛠️ Aplicar · ${lesson.tag}</span>
        <p>${lesson.brief}</p>
      </div>

      <div class="editor-wrap">
        <div class="editor-bar"><span></span><span></span><span></span></div>
        <div id="code-editor"></div>
      </div>

      <div class="actions-row">
        <button class="btn primary" id="run-btn" ${state.pyodideReady ? "" : "disabled"}>
          ${state.pyodideReady ? "▶ Ejecutar y comprobar" : "Cargando Python…"}
        </button>
        <button class="btn" id="step-btn" ${state.pyodideReady ? "" : "disabled"} title="Mira cómo se ejecuta tu código línea por línea">🔍 Ver paso a paso</button>
        <button class="btn" id="reset-btn">Reiniciar código</button>
      </div>

      <div class="console" id="console" role="status" aria-live="polite" aria-atomic="true">
        <span class="console-label">Consola</span>
        <span id="console-text">${state.pyodideReady ? "Escribe tu código y presiona «Ejecutar y comprobar»." : state.pyodideStatus || ""}</span>
        <div id="console-extra"></div>
      </div>

      <div class="hints" id="hints" tabindex="-1">
        ${revealed < lesson.hints.length ? `<button class="hint-btn" id="hint-btn">💡 Mostrar pista ${revealed + 1}/${lesson.hints.length}</button>` : ""}
        ${lesson.hints
          .slice(0, revealed)
          .map((h, i) => `<div class="hint-text">Pista ${i + 1}: ${h}</div>`)
          .join("")}
      </div>

      <div id="success-slot" role="status" aria-live="polite" aria-atomic="true"></div>
    </main>
  `;

  mountEditor(document.getElementById("code-editor"), lesson);

  document.getElementById("run-btn").addEventListener("click", handleRun);
  document.getElementById("step-btn").addEventListener("click", () => handleStepThrough(lesson));
  document.getElementById("reset-btn").addEventListener("click", () => {
    delete state.drafts[lesson.id];
    mountEditor(document.getElementById("code-editor"), lesson);
    setConsole("Código reiniciado a su punto de partida.", "neutral");
  });
  const hintBtn = document.getElementById("hint-btn");
  if (hintBtn) {
    hintBtn.addEventListener("click", () => {
      const newCount = (state.revealedHints[lesson.id] || 0) + 1;
      state.revealedHints[lesson.id] = newCount;
      renderLesson();
      // renderLesson() reconstruye toda la pantalla, así que el foco no sigue
      // en el botón que se acaba de pulsar — se anuncia por separado y se
      // devuelve el foco al botón de "mostrar siguiente pista" (o, si ya no
      // quedan, al bloque de pistas) para no dejarlo perdido en <body>.
      announce(`Pista ${newCount}: ${lesson.hints[newCount - 1]}`);
      (document.getElementById("hint-btn") || document.getElementById("hints"))?.focus();
      persistProgress();
    });
  }

  if (state.completed.has(lesson.id)) {
    showSuccessPanel(lesson, { alreadyDone: true });
  }
}

function mountEditor(container, lesson) {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
  const initialCode = state.drafts[lesson.id] ?? lesson.starterCode;
  editorView = new EditorView({
    state: EditorState.create({
      doc: initialCode,
      extensions: [
        basicSetup,
        python(),
        oneDark,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            state.drafts[lesson.id] = update.state.doc.toString();
          }
        }),
      ],
    }),
    parent: container,
  });
}

// `extraHtml` va debajo del texto: el error traducido o la comparación
// entre lo esperado y lo que salió (ya viene escapado por quien lo genera).
function setConsole(text, kind = "neutral", extraHtml = "") {
  const consoleEl = document.getElementById("console");
  const textEl = document.getElementById("console-text");
  if (!consoleEl || !textEl) return;
  consoleEl.classList.remove("has-error", "has-success");
  if (kind === "error") consoleEl.classList.add("has-error");
  if (kind === "success") consoleEl.classList.add("has-success");
  textEl.textContent = text;
  textEl.hidden = text === "";
  const extraEl = document.getElementById("console-extra");
  if (extraEl) extraEl.innerHTML = extraHtml;
}

// Abre el visualizador con el código actual del editor. En una lección usa los
// mismos datos de prueba para input() que la comprobación.
async function handleStepThrough(lesson) {
  const stepBtn = document.getElementById("step-btn");
  if (stepBtn) stepBtn.disabled = true;
  try {
    const pyodide = await loadPyodideRuntime();
    await openStepper({
      pyodide,
      code: editorView.state.doc.toString(),
      inputs: lesson?.simulatedInputs ? [...lesson.simulatedInputs] : [],
    });
  } catch (err) {
    console.warn("No se pudo abrir el visualizador:", err);
  } finally {
    if (stepBtn) stepBtn.disabled = !state.pyodideReady;
  }
}

function updatePyodideStatusUI() {
  const runBtn = document.getElementById("run-btn");
  const textEl = document.getElementById("console-text");
  if (runBtn) {
    runBtn.disabled = !state.pyodideReady;
    runBtn.textContent = state.pyodideReady ? "▶ Ejecutar y comprobar" : "Cargando Python…";
  }
  if (textEl && !state.pyodideReady) {
    textEl.textContent = state.pyodideStatus || "";
  } else if (textEl && state.pyodideReady && textEl.textContent.includes("Cargando")) {
    textEl.textContent = "Python listo. Escribe tu código y presiona «Ejecutar y comprobar».";
  }

  for (const id of ["step-btn", "playground-step-btn"]) {
    const stepBtn = document.getElementById(id);
    if (stepBtn) stepBtn.disabled = !state.pyodideReady;
  }

  const pgRunBtn = document.getElementById("playground-run-btn");
  const pgTextEl = document.getElementById("playground-console-text");
  if (pgRunBtn) {
    pgRunBtn.disabled = !state.pyodideReady;
    pgRunBtn.textContent = state.pyodideReady ? "▶ Ejecutar" : "Cargando Python…";
  }
  if (pgTextEl && !state.pyodideReady) {
    pgTextEl.textContent = state.pyodideStatus || "";
  } else if (pgTextEl && state.pyodideReady && pgTextEl.textContent.includes("Cargando")) {
    pgTextEl.textContent = "Python listo. Escribe tu código y presiona «Ejecutar».";
  }
}

async function handleRun() {
  const lesson = getLessonById(state.currentLessonId);
  const runBtn = document.getElementById("run-btn");
  runBtn.disabled = true;
  runBtn.textContent = "Ejecutando…";
  setConsole("Ejecutando tu código…", "neutral");

  try {
    const pyodide = await loadPyodideRuntime();
    const code = editorView.state.doc.toString();
    const result = await runLesson(pyodide, lesson, code);

    if (!result.success && result.error) {
      setConsole(result.output ? "Salida antes del error:\n" + result.output : "", "error", errorPanelHtml(result.errorInfo));
    } else if (!result.success) {
      setConsole(
        (result.output ? "Salida:\n" + result.output + "\n\n" : "") + "✗ " + result.message,
        "error",
        expectedComparisonHtml(lesson, result)
      );
    } else {
      setConsole((result.output ? "Salida:\n" + result.output : "(sin salida impresa)"), "success");
      if (!state.completed.has(lesson.id)) {
        const prevLevel = levelFor(state.xp);
        state.completed.add(lesson.id);
        state.xp += lesson.xp;
        const xpCounterEl = document.getElementById("xp-counter");
        xpCounterEl.textContent = `✦ ${state.xp} XP`;
        pulseXpCounter(xpCounterEl);
        floatXpGain(lesson.xp, xpCounterEl);
        const newLevel = levelFor(state.xp);
        if (newLevel.name !== prevLevel.name) {
          celebrateLevelUp(newLevel.name);
          // El aviso animado es aria-hidden (ver animations.js) porque un
          // nodo insertado y animado no es fiable para lectores de pantalla;
          // el anuncio real de la subida de nivel va por announce().
          announce(`¡Subiste de nivel! Ahora eres ${newLevel.name}.`);
        }
        persistProgress();
      }
      showSuccessPanel(lesson, { message: result.message });
    }
  } catch (err) {
    setConsole("Error inesperado ejecutando Python: " + err.message, "error");
  } finally {
    runBtn.disabled = !state.pyodideReady;
    runBtn.textContent = "▶ Ejecutar y comprobar";
  }
}

function showSuccessPanel(lesson, { message, alreadyDone } = {}) {
  const slot = document.getElementById("success-slot");
  if (!slot) return;
  const context = getLessonContext(lesson.id);
  const isLast = lesson.num === context.lessons.length;
  slot.innerHTML = `
    <div class="success-panel">
      <div>
        <div class="t">✓ ${alreadyDone ? "Lección ya completada" : "¡Correcto!"}</div>
        <p style="margin-top:0.2rem;">${message || "Ya superaste este reto antes."}</p>
      </div>
      <div style="display:flex; align-items:center; gap:1rem;">
        ${!alreadyDone ? `<span class="xp-gain">+${lesson.xp} XP</span>` : ""}
        <button class="btn primary" id="next-btn">${isLast ? "Ver resumen del mundo" : "Siguiente lección →"}</button>
      </div>
    </div>
    ${lesson.bonus ? `
      <div class="quiz-block bonus-block">
        <span class="tag">🚀 Crear · desafío extra (opcional)</span>
        <p>${lesson.bonus}</p>
      </div>
    ` : ""}
  `;
  document.getElementById("next-btn").addEventListener("click", () => {
    if (isLast) {
      navigate("world-complete", { completedWorldIndex: context.worldIndex });
    } else {
      const next = context.lessons[lesson.num];
      navigate("lesson", { currentLessonId: next.id });
    }
  });
}

function renderPlayground() {
  app.innerHTML = `
    ${sidebarHtml()}
    <main class="shell" id="main-content">
      ${topbarHtml()}

      <div class="lesson-header" style="margin-top:1rem;">
        <h2>Editor libre de Python</h2>
      </div>
      <p>Escribe cualquier código Python y ejecútalo. No afecta tu progreso ni tu XP — es solo para practicar.</p>

      <div class="editor-wrap" style="margin-top:1.2rem;">
        <div class="editor-bar"><span></span><span></span><span></span></div>
        <div id="playground-editor"></div>
      </div>

      <div class="actions-row">
        <button class="btn primary" id="playground-run-btn" ${state.pyodideReady ? "" : "disabled"}>
          ${state.pyodideReady ? "▶ Ejecutar" : "Cargando Python…"}
        </button>
        <button class="btn" id="playground-step-btn" ${state.pyodideReady ? "" : "disabled"} title="Mira cómo se ejecuta tu código línea por línea">🔍 Ver paso a paso</button>
        <button class="btn" id="playground-clear-btn">Limpiar consola</button>
      </div>

      <div class="console" id="playground-console" role="status" aria-live="polite" aria-atomic="true">
        <span class="console-label">Salida</span>
        <span id="playground-console-text">${
          state.pyodideReady ? "Escribe tu código y presiona «Ejecutar»." : state.pyodideStatus || ""
        }</span>
        <div id="playground-console-extra"></div>
      </div>
    </main>
  `;

  mountPlaygroundEditor(document.getElementById("playground-editor"));

  document.getElementById("playground-run-btn").addEventListener("click", handlePlaygroundRun);
  document.getElementById("playground-step-btn").addEventListener("click", () => handleStepThrough(null));
  document.getElementById("playground-clear-btn").addEventListener("click", () => {
    setPlaygroundConsole("Consola limpiada.", "neutral");
  });
}

function mountPlaygroundEditor(container) {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
  const initialCode = state.playgroundCode ?? 'print("Hello world")';
  editorView = new EditorView({
    state: EditorState.create({
      doc: initialCode,
      extensions: [
        basicSetup,
        python(),
        oneDark,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            state.playgroundCode = update.state.doc.toString();
          }
        }),
      ],
    }),
    parent: container,
  });
}

function setPlaygroundConsole(text, kind = "neutral", extraHtml = "") {
  const consoleEl = document.getElementById("playground-console");
  const textEl = document.getElementById("playground-console-text");
  if (!consoleEl || !textEl) return;
  consoleEl.classList.remove("has-error", "has-success");
  if (kind === "error") consoleEl.classList.add("has-error");
  if (kind === "success") consoleEl.classList.add("has-success");
  textEl.textContent = text;
  textEl.hidden = text === "";
  const extraEl = document.getElementById("playground-console-extra");
  if (extraEl) extraEl.innerHTML = extraHtml;
}

async function handlePlaygroundRun() {
  const runBtn = document.getElementById("playground-run-btn");
  runBtn.disabled = true;
  runBtn.textContent = "Ejecutando…";
  setPlaygroundConsole("Ejecutando tu código…", "neutral");

  try {
    const pyodide = await loadPyodideRuntime();
    const code = editorView.state.doc.toString();
    const result = await runFreeCode(pyodide, code);

    if (!result.success) {
      setPlaygroundConsole(
        result.output ? "Salida antes del error:\n" + result.output : "",
        "error",
        errorPanelHtml(result.errorInfo)
      );
    } else {
      setPlaygroundConsole(result.output || "(sin salida impresa)", "success");
    }
  } catch (err) {
    setPlaygroundConsole("Error inesperado ejecutando Python: " + err.message, "error");
  } finally {
    runBtn.disabled = !state.pyodideReady;
    runBtn.textContent = "▶ Ejecutar";
  }
}

function render() {
  if (editorView && state.screen !== "lesson" && state.screen !== "playground") {
    editorView.destroy();
    editorView = null;
  }
  if (state.screen === "loading") return renderLoading();
  if (state.screen === "map") return renderMap();
  if (state.screen === "lesson") return renderLesson();
  if (state.screen === "world-complete") return renderWorldComplete();
  if (state.screen === "playground") return renderPlayground();
}

(async function boot() {
  render(); // pantalla de carga mientras llega el progreso guardado
  try {
    const saved = await fetchProgress(state.player);
    state.xp = saved.xp || 0;
    state.completed = new Set(saved.completed || []);
    state.quizAnswers = saved.quizAnswers || {};
    state.revealedHints = saved.revealedHints || {};
    state.backendStatus = "online";
  } catch (err) {
    console.warn("No se pudo cargar el progreso guardado:", err.message);
    state.backendStatus = "offline";
  }
  navigate("map");
})();
