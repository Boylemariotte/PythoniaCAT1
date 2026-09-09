import "./style.css";
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { world, lessons } from "./lessons.js";
import { loadPyodideRuntime, runLesson } from "./pyRunner.js";
import { checkBackendHealth, fetchProgress, saveProgress } from "./progress.js";

const app = document.getElementById("app");

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
  screen: "picker", // picker | map | lesson | world-complete
  player: null,
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

function getLessonById(id) {
  return lessons.find((l) => l.id === id);
}

function navigate(screen, extra = {}) {
  state.screen = screen;
  Object.assign(state, extra);
  render();
}

// Delegación global: estas dos acciones aparecen en varias pantallas
// (topbar y encabezado de lección), así que se conectan una sola vez aquí
// en vez de repetir el addEventListener en cada función de render.
app.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) {
    if (actionTarget.dataset.action === "switch-player") navigate("picker");
    if (actionTarget.dataset.action === "back-to-map") navigate("map");
    return;
  }

  // Bloques "Recordar" y "Analizar": la primera respuesta que se elige queda
  // fijada (no se puede cambiar), y se revela cuál era la correcta.
  const quizTarget = event.target.closest("[data-quiz-kind]");
  if (quizTarget) {
    const lessonId = state.currentLessonId;
    const kind = quizTarget.dataset.quizKind;
    if (!state.quizAnswers[lessonId]) state.quizAnswers[lessonId] = {};
    const answers = state.quizAnswers[lessonId];
    if (answers[kind] !== undefined) return;
    answers[kind] = Number(quizTarget.dataset.optionIndex);
    renderLesson();
    persistProgress();
  }
});

function topbarHtml() {
  const level = levelFor(state.xp);
  return `
    <div class="topbar">
      <div class="brand">
        <h1>Pythonia</h1>
        <span class="eyebrow">${world.title}</span>
      </div>
      <div style="display:flex; align-items:center; gap:0.7rem;">
        <span class="player-badge">${state.player} · ${level.name}</span>
        <span class="xp-counter" id="xp-counter">✦ ${state.xp} XP</span>
        <span class="backend-status ${state.backendStatus}" id="backend-status">${
          { checking: "⏳ conectando…", online: "☁ guardado", offline: "⚠ sin conexión al servidor" }[state.backendStatus]
        }</span>
        <button class="btn-link" data-action="switch-player">cambiar jugador</button>
      </div>
    </div>
  `;
}

function renderPicker() {
  app.innerHTML = `
    <div class="picker">
      <div class="picker-card">
        <span class="eyebrow">Pythonia</span>
        <h1>¿Quién explora hoy?</h1>
        <p>Elige tu perfil para empezar (o continuar) el Mundo 1 · Los Cimientos.</p>
        <div class="player-options">
          <button class="player-option" data-player="Cata">
            <div class="avatar">C</div>
            <div class="name">Cata</div>
          </button>
          <button class="player-option" data-player="Jugador 2">
            <div class="avatar">2</div>
            <div class="name">Jugador 2</div>
          </button>
        </div>
      </div>
    </div>
  `;
  app.querySelectorAll("[data-player]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const player = btn.dataset.player;
      state.player = player;
      state.xp = 0;
      state.completed = new Set();
      state.drafts = {};
      state.revealedHints = {};
      state.quizAnswers = {};
      navigate("map");

      try {
        const saved = await fetchProgress(player);
        if (state.player !== player) return; // el jugador cambió mientras cargaba
        state.xp = saved.xp || 0;
        state.completed = new Set(saved.completed || []);
        state.quizAnswers = saved.quizAnswers || {};
        state.revealedHints = saved.revealedHints || {};
        state.backendStatus = "online";
        if (state.screen === "map") renderMap();
      } catch (err) {
        console.warn("No se pudo cargar el progreso guardado:", err.message);
        state.backendStatus = "offline";
        updateBackendStatusUI();
      }
    });
  });
}

function renderMap() {
  const doneCount = lessons.filter((l) => state.completed.has(l.id)).length;
  const pct = Math.round((doneCount / lessons.length) * 100);

  const rows = lessons
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

  app.innerHTML = `
    <div class="shell">
      ${topbarHtml()}
      ${state.player === "Cata" ? `<div class="welcome-banner">Bienvenida, Cata 💙</div>` : ""}

      <div class="world-card">
        <div class="mundo-head" style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem;">
          <h2>${world.title}</h2>
        </div>
        <span class="world-target">${world.target}</span>
        <div class="world-progress">
          <div class="bar"><i style="width:${pct}%"></i></div>
          <span class="label">${doneCount} / ${lessons.length} lecciones completadas</span>
        </div>
        <div class="lesson-list">${rows}</div>
      </div>

      <div class="locked-world">
        <div><strong>Mundo 2 · El Bosque de los Ciclos</strong><br>ciclos y lógica — próximamente</div>
        <span class="mono" style="color:var(--text-dim);">🔒</span>
      </div>
      <div class="locked-world">
        <div><strong>Mundo 3 · Las Cuevas de las Matrices</strong><br>lectura y llenado de matrices — próximamente</div>
        <span class="mono" style="color:var(--text-dim);">🔒</span>
      </div>
      <div class="locked-world">
        <div><strong>Mundo 4 · La Torre de las Clases</strong><br>herencia y POO — próximamente</div>
        <span class="mono" style="color:var(--text-dim);">🔒</span>
      </div>
    </div>
  `;

  app.querySelectorAll("[data-lesson]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate("lesson", { currentLessonId: btn.dataset.lesson });
    });
  });
}

function renderWorldComplete() {
  app.innerHTML = `
    <div class="shell">
      ${topbarHtml()}
      <div class="complete-card">
        <div class="badge-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h11l3 3v13H5z"/></svg>
        </div>
        <span class="eyebrow">Insignia obtenida</span>
        <h2>${world.badge.title}</h2>
        <p>${world.badge.description} — ¡Mundo 1 completo! Sumaste ${state.xp} XP como ${state.player}. Ahora eres <strong>${levelFor(state.xp).name}</strong>.</p>
        <div style="margin-top:1.5rem;">
          <button class="btn primary" data-action="back-to-map">Volver al mapa</button>
        </div>
      </div>
    </div>
  `;
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
      ? `<div class="quiz-feedback ${lesson.check.options[answered].correct ? "correct" : "incorrect"}">${
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
      ? `<div class="quiz-feedback ${lesson.analyze.options[answered].correct ? "correct" : "incorrect"}">${
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
    <div class="shell">
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
        <button class="btn" id="reset-btn">Reiniciar código</button>
      </div>

      <div class="console" id="console">
        <span class="console-label">Consola</span>
        <span id="console-text">${state.pyodideReady ? "Escribe tu código y presiona «Ejecutar y comprobar»." : state.pyodideStatus || ""}</span>
      </div>

      <div class="hints" id="hints">
        ${revealed < lesson.hints.length ? `<button class="hint-btn" id="hint-btn">💡 Mostrar pista ${revealed + 1}/${lesson.hints.length}</button>` : ""}
        ${lesson.hints
          .slice(0, revealed)
          .map((h, i) => `<div class="hint-text">Pista ${i + 1}: ${h}</div>`)
          .join("")}
      </div>

      <div id="success-slot"></div>
    </div>
  `;

  mountEditor(document.getElementById("code-editor"), lesson);

  document.getElementById("run-btn").addEventListener("click", handleRun);
  document.getElementById("reset-btn").addEventListener("click", () => {
    delete state.drafts[lesson.id];
    mountEditor(document.getElementById("code-editor"), lesson);
    setConsole("Código reiniciado a su punto de partida.", "neutral");
  });
  const hintBtn = document.getElementById("hint-btn");
  if (hintBtn) {
    hintBtn.addEventListener("click", () => {
      state.revealedHints[lesson.id] = (state.revealedHints[lesson.id] || 0) + 1;
      renderLesson();
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

function setConsole(text, kind = "neutral") {
  const consoleEl = document.getElementById("console");
  const textEl = document.getElementById("console-text");
  if (!consoleEl || !textEl) return;
  consoleEl.classList.remove("has-error", "has-success");
  if (kind === "error") consoleEl.classList.add("has-error");
  if (kind === "success") consoleEl.classList.add("has-success");
  textEl.textContent = text;
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
      setConsole(
        (result.output ? result.output + "\n\n" : "") + "Error: " + result.error,
        "error"
      );
    } else if (!result.success) {
      setConsole(
        (result.output ? "Salida:\n" + result.output + "\n\n" : "") + "✗ " + result.message,
        "error"
      );
    } else {
      setConsole((result.output ? "Salida:\n" + result.output : "(sin salida impresa)"), "success");
      if (!state.completed.has(lesson.id)) {
        state.completed.add(lesson.id);
        state.xp += lesson.xp;
        document.getElementById("xp-counter").textContent = `✦ ${state.xp} XP`;
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
  const isLast = lesson.num === lessons.length;
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
      navigate("world-complete");
    } else {
      const next = lessons[lesson.num];
      navigate("lesson", { currentLessonId: next.id });
    }
  });
}

function render() {
  document.body.classList.toggle("theme-blue", state.player === "Cata");
  if (editorView && state.screen !== "lesson") {
    editorView.destroy();
    editorView = null;
  }
  if (state.screen === "picker") return renderPicker();
  if (state.screen === "map") return renderMap();
  if (state.screen === "lesson") return renderLesson();
  if (state.screen === "world-complete") return renderWorldComplete();
}

render();
