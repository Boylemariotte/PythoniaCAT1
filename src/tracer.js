// Motor del visualizador de ejecución paso a paso. Corre el código del
// alumno con sys.settrace y registra, en cada línea ejecutada, el estado del
// programa: variables globales y locales (con listas, matrices, objetos y su
// herencia) y lo que se ha impreso hasta ese momento.

import { explainPythonError } from "./pyErrors.js";

// Cuántos pasos se guardan para mostrar, y cuántas líneas se ejecutan como
// máximo antes de cortar (protección contra bucles infinitos).
const MAX_RECORDED_STEPS = 2500;
const MAX_TOTAL_STEPS = 200000;

// String.raw para que las barras invertidas del código Python lleguen intactas.
const TRACE_SETUP = String.raw`
def __pythonia_run_trace(code, inputs_json, max_steps, max_total):
    import sys, json, types
    try:
        import js as _js
    except Exception:
        _js = None

    inputs = json.loads(inputs_json)
    FILENAME = "<pythonia>"
    steps = []
    exc_frames = set()
    state = {"total": 0, "truncated": False}
    out = {"parts": [], "n": 0}

    class _Capture:
        def write(self, s):
            s = str(s)
            out["parts"].append(s)
            out["n"] += len(s)
            return len(s)
        def flush(self):
            pass

    def ser(v, depth=0):
        try:
            t = type(v)
            if v is None:
                return {"t": "none", "v": "None"}
            if t is bool:
                return {"t": "bool", "v": "True" if v else "False"}
            if t is int:
                return {"t": "int", "v": str(v)}
            if t is float:
                return {"t": "float", "v": repr(v)}
            if t is str:
                return {"t": "str", "v": v if len(v) <= 60 else v[:57] + "..."}
            if isinstance(v, type):
                return {"t": "class", "v": v.__name__, "bases": [b.__name__ for b in v.__bases__ if b is not object]}
            if isinstance(v, (types.FunctionType, types.BuiltinFunctionType, types.MethodType)):
                return {"t": "func", "v": getattr(v, "__name__", "?")}
            if depth >= 4:
                return {"t": "other", "v": "..."}
            if t in (list, tuple, set, frozenset):
                kind = "list" if t is list else ("tuple" if t is tuple else "set")
                items = list(v)[:40]
                return {"t": kind, "items": [ser(x, depth + 1) for x in items], "more": len(v) - len(items)}
            if t is dict:
                items = list(v.items())[:30]
                return {
                    "t": "dict",
                    "items": [[ser(k, depth + 1), ser(x, depth + 1)] for k, x in items],
                    "more": max(0, len(v) - len(items)),
                }
            attrs = vars(v)
            mro = [c.__name__ for c in t.__mro__ if c is not object]
            return {
                "t": "obj",
                "cls": t.__name__,
                "mro": mro,
                "attrs": [[k, ser(x, depth + 1)] for k, x in list(attrs.items())[:30]],
            }
        except Exception:
            try:
                return {"t": "other", "v": repr(v)[:60]}
            except Exception:
                return {"t": "other", "v": "?"}

    def is_class_body(frame):
        # Un cuerpo de clase no es ni el módulo ni una función (las funciones
        # llevan la marca CO_OPTIMIZED); sus pasos son solo ruido de definición.
        code = frame.f_code
        return code.co_name != "<module>" and not (code.co_flags & 0x1)

    def frame_vars(frame, is_module):
        d = frame.f_globals if is_module else frame.f_locals
        res = []
        for k, v in list(d.items()):
            if k.startswith("__"):
                continue
            if is_module and k == "input" and v is _input:
                continue
            res.append([k, ser(v)])
        return res

    def build_stack(frame):
        stack = []
        f = frame
        while f is not None:
            if f.f_code.co_filename == FILENAME and not is_class_body(f):
                is_module = f.f_code.co_name == "<module>"
                stack.append({
                    "name": "Global" if is_module else getattr(f.f_code, "co_qualname", f.f_code.co_name),
                    "module": is_module,
                    "vars": frame_vars(f, is_module),
                })
            f = f.f_back
        stack.reverse()
        return stack

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != FILENAME:
            return None
        if event == "call":
            return tracer
        if event == "exception":
            exc_frames.add(id(frame))
            return tracer
        if event in ("line", "return"):
            if not frame.f_lineno:
                return tracer
            state["total"] += 1
            if state["total"] > max_total:
                raise RuntimeError(
                    "Se detuvo la ejecución: esto parece un bucle infinito (se superó el límite de pasos permitido). "
                    "Revisa la condición de tu while/for y que algo dentro del ciclo la vaya acercando a False."
                )
            if is_class_body(frame):
                return tracer
            if len(steps) < max_steps:
                step = {
                    "line": frame.f_lineno,
                    "ev": event,
                    "n": out["n"],
                    "stack": build_stack(frame),
                    "func": frame.f_code.co_name,
                }
                if event == "return" and frame.f_code.co_name != "<module>":
                    step["ret"] = ser(arg)
                if event == "return" and id(frame) in exc_frames:
                    step["unwind"] = True
                steps.append(step)
            else:
                state["truncated"] = True
        return tracer

    def _input(prompt=""):
        if inputs:
            v = str(inputs.pop(0))
        else:
            v = _js.prompt(str(prompt)) if _js else None
            v = "" if v is None else str(v)
        sys.stdout.write(str(prompt) + v + "\n")
        return v

    ns = {"__name__": "__main__", "input": _input}
    error = None
    old_out, old_err = sys.stdout, sys.stderr
    cap = _Capture()
    sys.stdout = cap
    sys.stderr = cap
    try:
        try:
            compiled = compile(code, FILENAME, "exec")
        except SyntaxError as e:
            error = {"type": type(e).__name__, "detail": e.msg, "line": e.lineno}
        else:
            sys.settrace(tracer)
            try:
                exec(compiled, ns)
            except BaseException as e:
                line = None
                tb = e.__traceback__
                while tb is not None:
                    if tb.tb_frame.f_code.co_filename == FILENAME:
                        line = tb.tb_lineno
                    tb = tb.tb_next
                error = {"type": type(e).__name__, "detail": str(e), "line": line}
            finally:
                sys.settrace(None)
    finally:
        sys.stdout, sys.stderr = old_out, old_err

    # Cuando el error no se atrapa, cada marco "retorna" mientras se desenrolla la
    # pila. Esos retornos no son parte del programa: el último paso útil es la
    # línea que falló.
    if error:
        while steps and steps[-1].get("unwind"):
            steps.pop()

    return json.dumps({
        "steps": steps,
        "output": "".join(out["parts"]),
        "error": error,
        "truncated": state["truncated"],
    })
`;

/**
 * Ejecuta `code` registrando cada paso. Devuelve
 * { steps, output, error, truncated }, donde `error` (si hubo) ya viene
 * explicado en español.
 */
export async function traceCode(pyodide, code, inputs = []) {
  pyodide.runPython(TRACE_SETUP);
  const run = pyodide.globals.get("__pythonia_run_trace");
  let raw;
  try {
    raw = run(code, JSON.stringify(inputs), MAX_RECORDED_STEPS, MAX_TOTAL_STEPS);
  } finally {
    run.destroy?.();
  }
  const data = JSON.parse(raw);
  if (data.error) data.error = explainPythonError(data.error, code);
  return data;
}
