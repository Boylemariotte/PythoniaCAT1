// Muestra lado a lado lo que se esperaba y lo que produjo el código del
// alumno. Cada lección puede declarar (opcional):
//
//   expected: { output: "línea 1\nlínea 2", vars: { nombre: "Ada", edad: 16 } }
//
// `output` se compara línea por línea con la salida impresa y `vars` compara
// el valor final de cada variable. Una lección puede tener una, otra o ambas.

import { escapeHtml } from "./pyErrors.js";

// Representación al estilo de Python: 'texto', True, None, [1, 2].
export function pyRepr(value) {
  if (value === undefined) return "(no definida)";
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const quote = value.includes("'") && !value.includes('"') ? '"' : "'";
    return quote + value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n") + quote;
  }
  if (Array.isArray(value)) return "[" + value.map(pyRepr).join(", ") + "]";
  if (value instanceof Map) {
    return "{" + [...value].map(([k, v]) => `${pyRepr(k)}: ${pyRepr(v)}`).join(", ") + "}";
  }
  return String(value);
}

function deepEqual(a, b) {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-6;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  }
  return a === b;
}

function outputComparison(expectedText, actualText) {
  const norm = (text) => text.replace(/\s+$/, "").split("\n").map((l) => l.replace(/\s+$/, ""));
  const expected = norm(expectedText);
  const actual = actualText.trim() === "" ? [] : norm(actualText.replace(/^\n+/, ""));
  const total = Math.max(expected.length, actual.length);

  let firstDiff = -1;
  const rows = [];
  for (let i = 0; i < total; i++) {
    const e = expected[i];
    const a = actual[i];
    const ok = e === a;
    if (!ok && firstDiff === -1) firstDiff = i + 1;
    const cell = (text, kind) =>
      text === undefined
        ? `<td class="cmp-missing">(nada)</td>`
        : `<td class="${kind}"><code>${escapeHtml(text) || "&nbsp;"}</code></td>`;
    rows.push(`
      <tr class="${ok ? "cmp-ok" : "cmp-bad"}">
        <td class="cmp-n">${i + 1}</td>
        ${cell(e, "cmp-exp")}
        ${cell(a, "cmp-act")}
      </tr>`);
  }

  const summary =
    firstDiff === -1
      ? "La salida tiene el mismo texto, pero algo más en la comprobación no coincide."
      : actual.length === 0
        ? "Tu código no imprimió nada."
        : `La primera diferencia está en la línea ${firstDiff}.` +
          (actual.length < expected.length
            ? ` Faltan ${expected.length - actual.length} línea(s).`
            : actual.length > expected.length
              ? ` Sobran ${actual.length - expected.length} línea(s).`
              : "");

  return `
    <div class="cmp-block">
      <div class="cmp-head">📋 Salida esperada vs. la tuya <span class="cmp-summary">${escapeHtml(summary)}</span></div>
      <div class="cmp-scroll">
        <table class="cmp-table">
          <thead><tr><th></th><th>Esperada</th><th>La tuya</th></tr></thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </div>
    </div>`;
}

function varsComparison(expectedVars, actualVars) {
  const rows = Object.entries(expectedVars).map(([name, expected]) => {
    const actual = actualVars?.[name];
    const ok = deepEqual(expected, actual);
    return `
      <tr class="${ok ? "cmp-ok" : "cmp-bad"}">
        <td class="cmp-n">${ok ? "✓" : "✗"}</td>
        <td class="cmp-var"><code>${escapeHtml(name)}</code></td>
        <td class="cmp-exp"><code>${escapeHtml(pyRepr(expected))}</code></td>
        <td class="cmp-act"><code>${escapeHtml(pyRepr(actual))}</code></td>
      </tr>`;
  });
  return `
    <div class="cmp-block">
      <div class="cmp-head">📋 Valores esperados vs. los tuyos <span class="cmp-summary">Al terminar el programa, cada variable debería valer esto.</span></div>
      <div class="cmp-scroll">
        <table class="cmp-table">
          <thead><tr><th></th><th>Variable</th><th>Esperado</th><th>El tuyo</th></tr></thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </div>
    </div>`;
}

/** HTML de la comparación para una lección, o "" si no declara `expected`. */
export function expectedComparisonHtml(lesson, { output, vars }) {
  const expected = lesson.expected;
  if (!expected) return "";
  const parts = [];
  if (typeof expected.output === "string") parts.push(outputComparison(expected.output, output || ""));
  if (expected.vars) parts.push(varsComparison(expected.vars, vars));
  return parts.join("");
}
