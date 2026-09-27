// Envuelve Pyodide (Python real compilado a WebAssembly) para ejecutar
// el código de cada lección y compararlo contra lo que se espera.

let pyodideReadyPromise = null;

export function loadPyodideRuntime(onStatus) {
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = (async () => {
      onStatus?.("Cargando el intérprete de Python (Pyodide)...");
      const pyodide = await window.loadPyodide();
      onStatus?.(null);
      return pyodide;
    })();
  }
  return pyodideReadyPromise;
}

function toJsValue(pyValue) {
  if (pyValue && typeof pyValue.toJs === "function") {
    return pyValue.toJs();
  }
  return pyValue;
}

// A partir de Mundo 2 el alumno escribe while/for por su cuenta, y un error
// típico (olvidar el decremento, una condición que nunca se vuelve falsa) es
// un bucle infinito de verdad. Pyodide corre en el hilo principal sin hilos
// de por medio, así que no se puede "interrumpir desde afuera" — en cambio,
// se instala un sys.settrace que cuenta líneas ejecutadas y aborta con un
// error de Python (RuntimeError) si se pasa de un límite generoso, muy por
// encima de lo que cualquier ejercicio de este curso necesita.
const MAX_TRACED_STEPS = 200000;

const WATCHDOG_SETUP = `
import sys as __pythonia_sys

__pythonia_steps = 0

def __pythonia_watchdog(frame, event, arg):
    global __pythonia_steps
    if event == "line":
        __pythonia_steps += 1
        if __pythonia_steps > ${MAX_TRACED_STEPS}:
            raise RuntimeError(
                "Se detuvo la ejecución: esto parece un bucle infinito (se superó el límite de pasos permitido). Revisa la condición de tu while/for y que algo dentro del ciclo la vaya acercando a False."
            )
    return __pythonia_watchdog

__pythonia_sys.settrace(__pythonia_watchdog)
`;

const WATCHDOG_TEARDOWN = `
import sys as __pythonia_sys
__pythonia_sys.settrace(None)
`;

async function runWithStepLimit(pyodide, code) {
  pyodide.runPython(WATCHDOG_SETUP);
  try {
    await pyodide.runPythonAsync(code);
  } finally {
    pyodide.runPython(WATCHDOG_TEARDOWN);
  }
}

/**
 * Ejecuta el código de una lección con datos de prueba simulados para input(),
 * captura la salida y devuelve el resultado del validador de la lección.
 */
export async function runLesson(pyodide, lesson, code) {
  const outputLines = [];
  const inputsQueue = lesson.simulatedInputs ? [...lesson.simulatedInputs] : null;

  for (const name of lesson.expectedVars || []) {
    try {
      pyodide.globals.delete(name);
    } catch {
      // no existía todavía, no pasa nada
    }
  }

  pyodide.setStdout({
    batched: (line) => outputLines.push(line),
  });
  pyodide.setStderr({
    batched: (line) => outputLines.push(line),
  });

  pyodide.globals.set("input", (prompt = "") => {
    if (inputsQueue && inputsQueue.length > 0) {
      const value = inputsQueue.shift();
      outputLines.push(`${prompt}${value}`);
      return value;
    }
    return window.prompt(prompt) ?? "";
  });

  let runError = null;
  try {
    await runWithStepLimit(pyodide, code);
  } catch (err) {
    runError = err;
  } finally {
    pyodide.setStdout({});
    pyodide.setStderr({});
  }

  const output = outputLines.join("\n");

  if (runError) {
    return {
      success: false,
      output,
      error: cleanErrorMessage(String(runError.message || runError)),
    };
  }

  const vars = {};
  for (const name of lesson.expectedVars || []) {
    const raw = pyodide.globals.get(name);
    vars[name] = toJsValue(raw);
  }

  const result = lesson.validate({ vars, output, code });

  return {
    success: !!result.ok,
    output,
    message: result.message,
  };
}

/**
 * Ejecuta código Python arbitrario (sin validador ni variables esperadas) y
 * devuelve la salida capturada. Para el editor libre del panel lateral.
 */
export async function runFreeCode(pyodide, code) {
  const outputLines = [];

  pyodide.setStdout({
    batched: (line) => outputLines.push(line),
  });
  pyodide.setStderr({
    batched: (line) => outputLines.push(line),
  });
  pyodide.globals.set("input", (prompt = "") => window.prompt(prompt) ?? "");

  let runError = null;
  try {
    await runWithStepLimit(pyodide, code);
  } catch (err) {
    runError = err;
  } finally {
    pyodide.setStdout({});
    pyodide.setStderr({});
  }

  const output = outputLines.join("\n");

  if (runError) {
    return { success: false, output, error: cleanErrorMessage(String(runError.message || runError)) };
  }
  return { success: true, output };
}

function cleanErrorMessage(message) {
  const lines = message.trim().split("\n");
  return lines[lines.length - 1] || message;
}
