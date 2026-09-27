// Interfaz del visualizador de ejecución paso a paso: muestra el código con la
// línea actual resaltada, las variables de cada marco (globales y de función),
// listas, matrices y objetos con su herencia, y la salida impresa hasta ese punto.

import { traceCode } from "./tracer.js";
import { escapeHtml as esc, errorPanelHtml } from "./pyErrors.js";

const PRIMITIVES = new Set(["int", "float", "bool", "none", "str"]);
const SPEEDS = { slow: 1200, normal: 700, fast: 300 };

let active = null; // { close } de la instancia abierta, para no abrir dos a la vez

// ---------- Render de valores ----------

function primitiveHtml(v) {
  switch (v.t) {
    case "int":
    case "float":
      return `<span class="tv tv-num">${esc(v.v)}</span>`;
    case "bool":
      return `<span class="tv tv-bool">${esc(v.v)}</span>`;
    case "none":
      return `<span class="tv tv-none">None</span>`;
    case "str":
      return `<span class="tv tv-str">"${esc(v.v)}"</span>`;
    default:
      return `<span class="tv">${esc(v.v ?? "?")}</span>`;
  }
}

function isMatrix(v) {
  return (
    v.t === "list" &&
    v.items.length > 0 &&
    v.items.every((row) => (row.t === "list" || row.t === "tuple") && row.items.every((c) => PRIMITIVES.has(c.t)))
  );
}

function matrixHtml(v) {
  const cols = Math.max(...v.items.map((r) => r.items.length));
  const head = Array.from({ length: cols }, (_, c) => `<th>${c}</th>`).join("");
  const body = v.items
    .map(
      (row, r) =>
        `<tr><th>${r}</th>${Array.from({ length: cols }, (_, c) =>
          row.items[c] ? `<td>${primitiveHtml(row.items[c])}</td>` : `<td class="tv-empty"></td>`
        ).join("")}</tr>`
    )
    .join("");
  return `
    <div class="tv-matrix-wrap">
      <span class="tv-kind">matriz ${v.items.length}×${cols}</span>
      <table class="tv-matrix"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table>
    </div>`;
}

function listHtml(v) {
  const kind = { list: "lista", tuple: "tupla", set: "conjunto" }[v.t];
  if (v.items.length === 0) return `<span class="tv-kind">${kind} vacía</span>`;
  const cells = v.items
    .map(
      (item, i) =>
        `<div class="tv-cell"><span class="tv-idx">${v.t === "set" ? "" : i}</span><div class="tv-cell-val">${valueHtml(item)}</div></div>`
    )
    .join("");
  const more = v.more > 0 ? `<span class="tv-kind">… y ${v.more} más</span>` : "";
  return `<div class="tv-list-wrap"><span class="tv-kind">${kind}</span><div class="tv-list">${cells}${more}</div></div>`;
}

function objectHtml(v) {
  const parents = v.mro.slice(1);
  const relation = parents.length
    ? `hereda de ${parents.map(esc).join(" → ")}`
    : "instancia";
  const attrs = v.attrs.length
    ? v.attrs.map(([k, val]) => `<tr><td class="tv-attr">${esc(k)}</td><td>${valueHtml(val)}</td></tr>`).join("")
    : `<tr><td colspan="2" class="tv-kind">sin atributos</td></tr>`;
  return `
    <div class="tv-obj">
      <div class="tv-obj-head"><strong>${esc(v.cls)}</strong><span>${relation}</span></div>
      <table>${attrs}</table>
    </div>`;
}

function valueHtml(v) {
  if (PRIMITIVES.has(v.t)) return primitiveHtml(v);
  switch (v.t) {
    case "list":
      return isMatrix(v) ? matrixHtml(v) : listHtml(v);
    case "tuple":
    case "set":
      return listHtml(v);
    case "dict": {
      if (v.items.length === 0) return `<span class="tv-kind">diccionario vacío</span>`;
      const rows = v.items
        .map(([k, val]) => `<tr><td class="tv-attr">${valueHtml(k)}</td><td>${valueHtml(val)}</td></tr>`)
        .join("");
      return `<div class="tv-obj"><div class="tv-obj-head"><strong>diccionario</strong></div><table>${rows}</table></div>`;
    }
    case "obj":
      return objectHtml(v);
    case "func":
      return `<span class="tv tv-func">ƒ ${esc(v.v)}()</span>`;
    case "class":
      return `<span class="tv tv-func">class ${esc(v.v)}</span>`;
    default:
      return `<span class="tv">${esc(v.v ?? "?")}</span>`;
  }
}

// Versión corta en texto plano de un valor (para "devuelve …").
function plain(v) {
  if (PRIMITIVES.has(v.t)) return v.t === "str" ? `"${v.v}"` : v.v;
  if (v.t === "list") return "[" + v.items.map(plain).join(", ") + (v.more > 0 ? ", …" : "") + "]";
  if (v.t === "tuple") return "(" + v.items.map(plain).join(", ") + ")";
  if (v.t === "set") return "{" + v.items.map(plain).join(", ") + "}";
  if (v.t === "obj") return `objeto ${v.cls}`;
  if (v.t === "dict") return "{…}";
  return v.v ?? "?";
}

// ---------- Marcos de variables ----------

function framesHtml(step, prevStep) {
  const stack = step.stack;
  return stack
    .map((frame, fi) => {
      const prevFrame = prevStep?.stack?.[fi];
      const prevVars = new Map();
      if (prevFrame && prevFrame.name === frame.name) {
        for (const [k, val] of prevFrame.vars) prevVars.set(k, JSON.stringify(val));
      }
      const isActive = fi === stack.length - 1;
      const defs = [];
      const rows = [];
      for (const [name, val] of frame.vars) {
        if (frame.module && (val.t === "func" || val.t === "class")) {
          defs.push(
            val.t === "class"
              ? `class ${val.v}${val.bases?.length ? "(" + val.bases.join(", ") + ")" : ""}`
              : `${val.v}()`
          );
          continue;
        }
        const changed = prevVars.get(name) !== JSON.stringify(val);
        rows.push(`
          <tr class="${changed ? "tr-changed" : ""}">
            <td class="tr-name">${esc(name)}</td>
            <td class="tr-value">${valueHtml(val)}</td>
          </tr>`);
      }
      const label = frame.module ? "Variables globales" : `${esc(frame.name)}()`;
      return `
        <div class="tr-frame ${isActive ? "active" : ""}">
          <div class="tr-frame-head">${label}${isActive && !frame.module ? " <span>· función en ejecución</span>" : ""}</div>
          ${
            rows.length
              ? `<table class="tr-vars-table">${rows.join("")}</table>`
              : `<div class="tr-empty">${frame.module ? "Todavía no hay variables." : "Sin variables locales."}</div>`
          }
          ${defs.length ? `<div class="tr-defs">Definido: ${defs.map((d) => `<code>${esc(d)}</code>`).join(" ")}</div>` : ""}
        </div>`;
    })
    .join("");
}

// ---------- Ventana ----------

// Selector de "cosas que se pueden enfocar con Tab", para la trampa de foco.
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export async function openStepper({ pyodide, code, inputs = [] }) {
  if (active) active.close();

  // Quien abrió el visualizador (el botón "Ver paso a paso"): recupera el
  // foco ahí al cerrar, para no dejarlo perdido en <body>.
  const opener = document.activeElement;

  const overlay = document.createElement("div");
  overlay.className = "tracer-overlay";
  overlay.innerHTML = `
    <div class="tracer-modal" role="dialog" aria-modal="true" aria-label="Ejecución paso a paso" tabindex="-1">
      <div class="tracer-head">
        <h3>🔍 Ejecución paso a paso</h3>
        <button class="icon-btn" data-tr="close" aria-label="Cerrar"><span aria-hidden="true">✕</span></button>
      </div>
      <div class="tracer-loading"><div class="spinner"></div><p>Ejecutando tu código y registrando cada paso…</p></div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // El diálogo es modal de verdad: el resto de la página (el mapa, la lección
  // detrás) queda fuera del foco por teclado y de lectores de pantalla
  // mientras está abierto — si no, Tab se escapa hacia botones que están
  // visualmente tapados por el overlay.
  const inertedSiblings = [];
  for (const child of document.body.children) {
    if (child !== overlay && !child.inert) {
      child.inert = true;
      inertedSiblings.push(child);
    }
  }

  let timer = null;
  let onKey = null;
  const close = () => {
    clearInterval(timer);
    if (onKey) document.removeEventListener("keydown", onKey);
    overlay.remove();
    document.body.style.overflow = "";
    for (const el of inertedSiblings) el.inert = false;
    if (active && active.close === close) active = null;
    opener?.focus?.();
  };
  active = { close };
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest('[data-tr="close"]')) close();
  });
  onKey = (e) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key !== "Tab") return;
    // Trampa de foco: Tab/Shift+Tab da vueltas dentro del diálogo, no se
    // escapa hacia una página que ya está inert (la mayoría de navegadores lo
    // impiden solos, pero no todos con `inert`, así que se refuerza a mano).
    const focusable = Array.from(overlay.querySelectorAll(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener("keydown", onKey);
  overlay.querySelector(".tracer-modal").focus();

  // Dejar que el navegador pinte el indicador de carga antes del trabajo pesado.
  await new Promise((r) => setTimeout(r, 30));

  let data;
  try {
    data = await traceCode(pyodide, code, inputs);
  } catch (err) {
    overlay.querySelector(".tracer-loading").innerHTML = `<p class="tr-fail">No se pudo ejecutar el visualizador: ${esc(err.message)}</p>`;
    return;
  }
  if (!overlay.isConnected) return; // lo cerraron mientras se ejecutaba

  const { steps, output, error, truncated } = data;
  const codeLines = code.split("\n");
  const modal = overlay.querySelector(".tracer-modal");

  const codeHtml = codeLines
    .map((text, i) => `<div class="tr-line" data-line="${i + 1}"><span class="tr-ln">${i + 1}</span><code>${esc(text) || "&nbsp;"}</code></div>`)
    .join("");

  modal.querySelector(".tracer-loading").remove();
  modal.insertAdjacentHTML(
    "beforeend",
    `
    <div class="tracer-body">
      <div class="tracer-code" id="tr-code">${codeHtml}</div>
      <div class="tracer-side">
        <div class="tr-status" id="tr-status" role="status" aria-live="polite"></div>
        <div class="tr-section-title">Variables</div>
        <div id="tr-vars"></div>
        <div class="tr-section-title">Salida</div>
        <pre class="tr-output" id="tr-output"></pre>
        <div id="tr-error"></div>
      </div>
    </div>
    <div class="tracer-controls">
      <div class="tracer-buttons">
        <button class="btn" data-tr="first" title="Ir al inicio">⏮</button>
        <button class="btn" data-tr="prev">◀ Anterior</button>
        <button class="btn primary" data-tr="play">▶ Reproducir</button>
        <button class="btn" data-tr="next">Siguiente ▶</button>
        <button class="btn" data-tr="last" title="Ir al final">⏭</button>
        <select id="tr-speed" aria-label="Velocidad">
          <option value="slow">Lento</option>
          <option value="normal" selected>Normal</option>
          <option value="fast">Rápido</option>
        </select>
      </div>
      <div class="tracer-slider">
        <label for="tr-slider" class="sr-only">Ir al paso</label>
        <input type="range" id="tr-slider" min="0" max="${Math.max(steps.length - 1, 0)}" value="0" aria-describedby="tr-counter" />
        <span id="tr-counter"></span>
      </div>
      <p class="tracer-hint">Atajos: ← → para avanzar y retroceder · Espacio para reproducir · Esc para cerrar. Las variables que cambian se resaltan.</p>
    </div>`
  );
  // Ya hay contenido real que operar: el primer parón lógico del teclado es
  // el botón de cerrar (el título del diálogo ya se anunció al enfocar el
  // contenedor un momento antes).
  modal.querySelector('[data-tr="close"]').focus();

  const $ = (sel) => modal.querySelector(sel);
  const errorHtml = error ? errorPanelHtml(error) : "";

  // Sin pasos: el código ni siquiera pudo empezar (error de sintaxis).
  if (steps.length === 0) {
    modal.querySelector(".tracer-controls").remove();
    $("#tr-status").innerHTML = error ? "El programa no llegó a ejecutarse." : "El programa no tiene instrucciones que ejecutar.";
    $("#tr-vars").innerHTML = `<div class="tr-empty">No hay nada que mostrar todavía.</div>`;
    $("#tr-output").textContent = output || "(sin salida)";
    $("#tr-error").innerHTML = errorHtml;
    if (error?.line) modal.querySelector(`.tr-line[data-line="${error.line}"]`)?.classList.add("err");
    return;
  }

  let idx = 0;

  const setPlaying = (on) => {
    clearInterval(timer);
    timer = null;
    const btn = $('[data-tr="play"]');
    btn.textContent = on ? "⏸ Pausar" : "▶ Reproducir";
    if (on) {
      if (idx >= steps.length - 1) go(0);
      timer = setInterval(() => {
        if (idx >= steps.length - 1) return setPlaying(false);
        go(idx + 1);
      }, SPEEDS[$("#tr-speed").value]);
    }
  };

  function go(i) {
    idx = Math.min(Math.max(i, 0), steps.length - 1);
    const step = steps[idx];
    const prev = steps[idx - 1];
    const isLast = idx === steps.length - 1;
    // Si se cortó por exceso de pasos, el error ocurrió después del último paso guardado.
    const failedHere = isLast && error && !truncated;

    // Código: línea actual resaltada.
    modal.querySelectorAll(".tr-line.cur, .tr-line.err").forEach((el) => el.classList.remove("cur", "err"));
    const lineEl = modal.querySelector(`.tr-line[data-line="${step.line}"]`);
    if (lineEl) {
      lineEl.classList.add(failedHere ? "err" : "cur");
      lineEl.scrollIntoView({ block: "nearest" });
    }

    // Estado del paso.
    let status;
    if (step.ev === "return") {
      status =
        step.func === "<module>"
          ? "Fin del programa."
          : `Termina <code>${esc(step.func)}()</code> y devuelve <code>${esc(step.ret ? plain(step.ret) : "None")}</code>.`;
    } else {
      status = `A punto de ejecutar la línea <strong>${step.line}</strong>${
        step.func !== "<module>" ? ` dentro de <code>${esc(step.func)}()</code>` : ""
      }.`;
    }
    $("#tr-status").innerHTML = status;

    $("#tr-vars").innerHTML = framesHtml(step, prev);

    const before = output.slice(0, prev ? prev.n : 0);
    const added = output.slice(prev ? prev.n : 0, step.n);
    $("#tr-output").innerHTML = step.n === 0 ? `<span class="tr-empty">(todavía no se imprimió nada)</span>` : `${esc(before)}<span class="new">${esc(added)}</span>`;

    $("#tr-counter").textContent = `Paso ${idx + 1} / ${steps.length}`;
    $("#tr-slider").value = String(idx);

    let extra = "";
    if (failedHere) extra = `<div class="tr-stopped">⛔ El programa se detuvo aquí con un error.</div>${errorHtml}`;
    else if (isLast && error) extra = `<div class="tr-stopped">Solo se registraron los primeros ${steps.length} pasos. Después de eso, el programa se detuvo con este error:</div>${errorHtml}`;
    else if (isLast && truncated) extra = `<div class="tr-stopped">Solo se registraron los primeros ${steps.length} pasos; el programa siguió ejecutándose, pero no se muestra el resto.</div>`;
    else if (isLast) extra = `<div class="tr-done">✓ El programa terminó sin errores.</div>`;
    $("#tr-error").innerHTML = extra;

    $('[data-tr="prev"]').disabled = idx === 0;
    $('[data-tr="first"]').disabled = idx === 0;
    $('[data-tr="next"]').disabled = isLast;
    $('[data-tr="last"]').disabled = isLast;
  }

  modal.addEventListener("click", (e) => {
    const action = e.target.closest("[data-tr]")?.dataset.tr;
    if (action === "prev") { setPlaying(false); go(idx - 1); }
    if (action === "next") { setPlaying(false); go(idx + 1); }
    if (action === "first") { setPlaying(false); go(0); }
    if (action === "last") { setPlaying(false); go(steps.length - 1); }
    if (action === "play") setPlaying(!timer);
  });
  $("#tr-slider").addEventListener("input", (e) => { setPlaying(false); go(Number(e.target.value)); });
  $("#tr-speed").addEventListener("change", () => { if (timer) setPlaying(true); });

  // Este handler reemplaza al que se registró al abrir (arriba): aquel solo
  // sabía cerrar y atrapar Tab, porque go()/setPlaying() todavía no existían.
  // Se le suma aquí la trampa de foco (Tab/Shift+Tab) para no perderla.
  document.removeEventListener("keydown", onKey);
  onKey = (e) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "Tab") {
      const focusable = Array.from(overlay.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if (e.key === "ArrowRight") { e.preventDefault(); setPlaying(false); go(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setPlaying(false); go(idx - 1); }
    else if (e.key === " " && !["SELECT", "INPUT", "BUTTON"].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      setPlaying(!timer);
    }
  };
  document.addEventListener("keydown", onKey);

  go(0);
}
