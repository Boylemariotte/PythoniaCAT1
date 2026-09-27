// Traduce los errores de Python (en inglés y crípticos) a explicaciones en
// español, con la línea donde ocurrieron y una pista de cómo arreglarlos.

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Etiqueta corta en español para cada tipo de error.
const TYPE_LABELS = {
  SyntaxError: "Error de sintaxis",
  IndentationError: "Error de sangría",
  TabError: "Error de sangría",
  NameError: "Nombre no definido",
  UnboundLocalError: "Variable usada antes de tener valor",
  TypeError: "Tipos incompatibles",
  ValueError: "Valor inválido",
  IndexError: "Posición fuera de rango",
  KeyError: "Clave inexistente",
  AttributeError: "Atributo o método inexistente",
  ZeroDivisionError: "División entre cero",
  RecursionError: "Recursión sin fin",
  RuntimeError: "Ejecución detenida",
  EOFError: "Sin datos de entrada",
  ImportError: "Módulo no encontrado",
  ModuleNotFoundError: "Módulo no encontrado",
  OverflowError: "Número demasiado grande",
  AssertionError: "Comprobación fallida",
};

const PLACEHOLDER_TIP =
  "Todavía hay un `___` sin completar en el código inicial. Reemplaza cada `___` por el valor, operador o nombre que corresponda.";

/**
 * Separa un traceback de Python en { type, detail, line }. `line` es la
 * última línea del código del alumno que aparece en el traceback (la más
 * interna, donde de verdad ocurrió el error).
 */
export function parseRawError(raw) {
  const text = String(raw || "").trim();
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const last = lines[lines.length - 1] || text;
  const m = last.match(/^([A-Za-z_][\w.]*):\s*(.*)$/);
  const type = m ? m[1].split(".").pop() : /^[A-Za-z_]\w*$/.test(last.trim()) ? last.trim() : "Error";
  const detail = m ? m[2] : type === "Error" ? last : "";

  // El traceback también incluye el vigilante interno de bucles infinitos
  // (__pythonia_watchdog): esa línea no es del alumno, así que se ignora.
  let line = null;
  const fileRe = /File "<exec>", line (\d+)(?:, in ([^\n]+))?/g;
  let match;
  while ((match = fileRe.exec(text)) !== null) {
    if (match[2] !== "__pythonia_watchdog") line = Number(match[1]);
  }

  return { type, detail, line };
}

function quoteList(s) {
  return s ? "`" + s + "`" : "";
}

// Devuelve { explanation, tip, title? } en español para un error concreto.
// `title` solo se da cuando es más preciso que la etiqueta general del tipo.
function translate(type, detail, lineText) {
  const has = (re) => re.test(detail);
  const cap = (re) => (detail.match(re) || [])[1];

  // ---- Errores propios de Pythonia ----
  if (type === "RuntimeError" && /bucle infinito/.test(detail)) {
    return {
      explanation: "Tu programa se quedó repitiendo instrucciones sin terminar nunca, así que lo detuvimos.",
      tip: "Revisa la condición de tu `while`: algo dentro del ciclo tiene que ir acercándola a `False` (por ejemplo, restar 1 a un contador). Si usas `for`, revisa el rango.",
    };
  }

  // ---- Espacios sin completar (___) ----
  if (lineText && lineText.includes("___")) {
    return {
      explanation: "En esta línea todavía hay un espacio en blanco (`___`) sin completar.",
      tip: PLACEHOLDER_TIP,
    };
  }

  switch (type) {
    case "SyntaxError": {
      if (has(/was never closed/)) {
        const sym = cap(/'(.)' was never closed/);
        return {
          explanation: `Abriste un ${quoteList(sym)} pero nunca lo cerraste.`,
          tip: "Cuenta los paréntesis, corchetes y llaves: cada uno que se abre necesita su pareja que lo cierra. A veces el problema está en una línea anterior a la señalada.",
        };
      }
      if (has(/unmatched '(.)'/)) {
        return {
          explanation: `Hay un ${quoteList(cap(/unmatched '(.)'/))} de más: no tiene un símbolo de apertura que le corresponda.`,
          tip: "Revisa que cada paréntesis, corchete o llave que se cierra haya sido abierto antes.",
        };
      }
      if (has(/expected ':'/)) {
        return {
          explanation: "Falta el símbolo `:` (dos puntos) al final de esta línea.",
          tip: "`if`, `elif`, `else`, `for`, `while`, `def` y `class` siempre terminan con `:`.",
        };
      }
      if (has(/unterminated string literal/) || has(/unterminated triple-quoted/)) {
        return {
          explanation: "Un texto empezó con comillas pero nunca se cerró.",
          tip: 'Cada texto necesita comillas al principio y al final, del mismo tipo: "así" o \'así\'.',
        };
      }
      if (has(/Missing parentheses in call to 'print'/)) {
        return {
          explanation: "En Python 3, `print` es una función y necesita paréntesis.",
          tip: 'Escribe `print("hola")` en vez de `print "hola"`.',
        };
      }
      if (has(/invalid decimal literal/)) {
        return {
          explanation: "Un número quedó pegado a letras (por ejemplo `2x`), y Python no sabe qué significa.",
          tip: "Si querías multiplicar escribe `2 * x`. Si es un nombre de variable, no puede empezar con un número.",
        };
      }
      if (has(/Maybe you meant '==' or ':='/) || has(/cannot assign to/)) {
        return {
          explanation: "Usaste `=` (asignar un valor) en un lugar donde Python esperaba una comparación o algo distinto.",
          tip: "Para comparar dos valores usa `==`. El `=` solo sirve para guardar un valor en una variable.",
        };
      }
      if (has(/invalid syntax/)) {
        return {
          explanation: "Python no entiende cómo está escrita esta línea.",
          tip: "Busca un paréntesis, una comilla o unos dos puntos que falten o sobren, y un operador escrito de más o de menos. A veces el error real está en la línea anterior.",
        };
      }
      if (has(/EOF|unexpected EOF/)) {
        return {
          explanation: "El código terminó antes de que Python encontrara lo que esperaba.",
          tip: "Seguramente quedó algo sin cerrar: un paréntesis, unas comillas o un bloque sin contenido.",
        };
      }
      return {
        explanation: "Python no puede leer esta línea porque no respeta las reglas de escritura del lenguaje.",
        tip: "Revisa comillas, paréntesis, dos puntos y operadores en esta línea y en la anterior.",
      };
    }

    case "IndentationError":
    case "TabError": {
      if (has(/expected an indented block/)) {
        const after = cap(/after '([^']+)' statement/) || cap(/after (\w+) definition/);
        return {
          explanation: `Después de ${after ? quoteList(after) : "los dos puntos"} la siguiente línea tiene que ir con sangría (más metida hacia la derecha).`,
          tip: "Deja 4 espacios al inicio de las líneas que pertenecen al bloque. Si no sabes qué escribir todavía, puedes poner `pass`.",
        };
      }
      if (has(/unexpected indent/)) {
        return {
          explanation: "Esta línea tiene más sangría de la que le corresponde.",
          tip: "Solo se mete hacia la derecha una línea que va justo después de un `:`. Quita los espacios de sobra para alinearla con la de arriba.",
        };
      }
      if (has(/unindent does not match/)) {
        return {
          explanation: "La sangría de esta línea no coincide con la de ningún bloque anterior.",
          tip: "Todas las líneas de un mismo bloque deben empezar exactamente en la misma columna. Usa siempre 4 espacios, sin mezclar con tabulaciones.",
        };
      }
      return {
        explanation: "La sangría (los espacios al inicio de la línea) está mal.",
        tip: "En Python la sangría marca qué líneas pertenecen a cada bloque. Usa 4 espacios y sé consistente.",
      };
    }

    case "NameError": {
      const name = cap(/name '([^']+)' is not defined/);
      return {
        explanation: name
          ? `Usaste el nombre ${quoteList(name)}, pero Python no sabe qué es: todavía no lo definiste.`
          : "Usaste un nombre que Python no conoce.",
        tip: name
          ? `Revisa que ${quoteList(name)} esté escrito igual que cuando lo creaste (Python distingue mayúsculas de minúsculas) y que lo hayas definido antes de usarlo. Si es un texto, debe ir entre comillas.`
          : "Revisa la ortografía y que la variable exista antes de usarla.",
      };
    }

    case "UnboundLocalError": {
      const name = cap(/variable '([^']+)'/);
      return {
        explanation: `${name ? quoteList(name) : "Una variable"} se usó antes de que se le asignara un valor.`,
        tip: "Asígnale un valor antes de leerla. Dentro de una función, una variable que asignas es local: no ve la de afuera a menos que la recibas como parámetro.",
      };
    }

    case "TypeError": {
      let m;
      if ((m = detail.match(/unsupported operand type\(s\) for ([^:]+): '(\w+)' and '(\w+)'/))) {
        const [, op, a, b] = m;
        const isStrNum = [a, b].includes("str") && [a, b].some((t) => t === "int" || t === "float");
        return {
          explanation: `No se puede usar ${quoteList(op.trim())} entre un ${quoteList(a)} y un ${quoteList(b)}: son tipos que Python no sabe combinar así.`,
          tip: isStrNum
            ? "Uno es texto y el otro número. Convierte el texto con `int()` o `float()` (por ejemplo lo que devuelve `input()`), o arma el mensaje con un f-string."
            : "Revisa que los dos lados de la operación sean del mismo tipo.",
        };
      }
      if ((m = detail.match(/can only concatenate str \(not "(\w+)"\) to str/))) {
        return {
          explanation: `Intentaste unir un texto con un ${quoteList(m[1])} usando \`+\`, y Python solo une texto con texto.`,
          tip: "Convierte el número con `str(...)` o usa un f-string: f\"Tienes {edad} años\".",
        };
      }
      if ((m = detail.match(/'([<>]=?)' not supported between instances of '(\w+)' and '(\w+)'/))) {
        return {
          explanation: `No se puede comparar (${quoteList(m[1])}) un ${quoteList(m[2])} con un ${quoteList(m[3])}.`,
          tip: "Recuerda que `input()` siempre devuelve texto. Conviértelo con `int()` o `float()` antes de compararlo con un número.",
        };
      }
      if ((m = detail.match(/can't multiply sequence by non-int of type '(\w+)'/))) {
        return {
          explanation: `Un texto o una lista solo se puede multiplicar por un número entero, y aquí lo multiplicaste por un ${quoteList(m[1])}.`,
          tip: "Convierte con `int(...)` el valor por el que multiplicas.",
        };
      }
      if ((m = detail.match(/'(\w+)' object is not subscriptable/))) {
        return {
          explanation: `Usaste corchetes \`[ ]\` sobre un ${quoteList(m[1])}, pero ese tipo no tiene posiciones a las que se pueda acceder.`,
          tip: "Los corchetes sirven con listas, textos, tuplas y diccionarios. Revisa que la variable sea de alguno de esos tipos.",
        };
      }
      if ((m = detail.match(/'(\w+)' object is not callable/))) {
        return {
          explanation: `Pusiste paréntesis \`( )\` después de algo que es un ${quoteList(m[1])}, pero solo las funciones se pueden llamar así.`,
          tip: "Puede que una variable tenga el mismo nombre que una función y la haya tapado (por ejemplo `print = 5`), o que falte un operador como `*` antes del paréntesis.",
        };
      }
      if ((m = detail.match(/(\S+)\(\) missing (\d+) required positional argument[s]?: (.+)/))) {
        const callee = m[1].replace(/\.__init__$/, "");
        return {
          title: "Argumentos incorrectos",
          explanation: `Al llamar a ${quoteList(callee + "()")} faltan ${m[2]} dato(s) obligatorio(s): ${m[3].replace(/'/g, "`")}.`,
          tip: "Pásale todos los argumentos que pide su definición al llamarla. En un método, `self` no cuenta: Python lo pone solo.",
        };
      }
      if ((m = detail.match(/(\S+)\(\) takes (\d+) positional arguments? but (\d+) (?:was|were) given/))) {
        const callee = m[1].replace(/\.__init__$/, "");
        return {
          title: "Argumentos incorrectos",
          explanation: `${quoteList(callee + "()")} recibe ${m[2]} argumento(s) (contando \`self\` si es un método), pero la llamaste con ${m[3]}.`,
          tip: "Revisa cuántos parámetros tiene la definición. Ojo: en un método, `self` cuenta como parámetro aunque no lo escribas al llamarlo.",
        };
      }
      if (has(/takes no arguments/)) {
        return {
          title: "Argumentos incorrectos",
          explanation: "Le pasaste datos al crear el objeto, pero la clase no tiene un `__init__` que los reciba.",
          tip: "Agrega `def __init__(self, ...)` a la clase, con un parámetro por cada dato que quieras recibir.",
        };
      }
      if ((m = detail.match(/'(\w+)' object cannot be interpreted as an integer/))) {
        return {
          explanation: `Python esperaba un número entero, pero recibió un ${quoteList(m[1])}.`,
          tip: "Convierte el valor con `int(...)`. Suele pasar al usar `range()` con un texto (lo que devuelve `input()`) o con un número decimal.",
        };
      }
      if ((m = detail.match(/object of type '(\w+)' has no len\(\)/))) {
        return {
          explanation: `\`len()\` no funciona con un ${quoteList(m[1])}: solo mide textos, listas y otras colecciones.`,
          tip: "Si querías saber cuántos dígitos tiene un número, conviértelo primero con `str(...)`.",
        };
      }
      if ((m = detail.match(/'(\w+)' object is not iterable/))) {
        return {
          explanation: `Un ciclo \`for\` no puede recorrer un ${quoteList(m[1])}: no es una secuencia.`,
          tip: m[1] === "int"
            ? "Para repetir algo N veces usa `for i in range(N):`."
            : "Revisa que lo que recorres sea una lista, un texto o un `range()`.",
        };
      }
      if ((m = detail.match(/(?:list|string) indices must be integers or slices, not (\w+)/))) {
        return {
          explanation: `Las posiciones de una lista o texto deben ser números enteros, pero usaste un ${quoteList(m[1])}.`,
          tip: "Convierte el índice con `int(...)`, o revisa que no estés usando un texto como posición.",
        };
      }
      return {
        explanation: "Combinaste un valor con una operación o función que no admite ese tipo de dato.",
        tip: "Revisa qué tipo tiene cada valor en esta línea (texto, entero, decimal, lista…). `type(x)` te lo dice.",
      };
    }

    case "IndexError": {
      if (has(/assignment index out of range/)) {
        return {
          explanation: "Intentaste cambiar una posición de la lista que no existe.",
          tip: "No se puede crear un elemento nuevo asignando a una posición inexistente. Para agregar al final usa `lista.append(valor)`.",
        };
      }
      if (has(/string index out of range/)) {
        return {
          explanation: "Pediste una posición del texto que no existe: el texto es más corto.",
          tip: "Un texto de N caracteres tiene posiciones de 0 a N-1. Compara con `len(texto)`.",
        };
      }
      return {
        explanation: "Pediste una posición de la lista que no existe: la lista es más corta.",
        tip: "Una lista de N elementos tiene posiciones de 0 a N-1 (la primera es la 0). En una matriz revisa también el índice de la columna. `len(lista)` te dice cuántos hay.",
      };
    }

    case "KeyError":
      return {
        explanation: `El diccionario no tiene la clave ${detail || "que pediste"}.`,
        tip: "Revisa cómo está escrita la clave (mayúsculas y comillas incluidas) o comprueba antes con `if clave in diccionario`.",
      };

    case "ValueError": {
      let m;
      if ((m = detail.match(/invalid literal for int\(\) with base 10: (.+)/))) {
        return {
          explanation: `\`int()\` no pudo convertir ${m[1]} a un número entero.`,
          tip: "Para convertir con `int()`, el texto debe contener solo dígitos (sin letras, espacios ni punto decimal). Si es un decimal, usa `float()`.",
        };
      }
      if (has(/could not convert string to float/)) {
        return {
          explanation: "`float()` no pudo convertir ese texto a un número decimal.",
          tip: "El texto debe ser un número con formato válido, como `3.14`.",
        };
      }
      if (has(/not in list/)) {
        return {
          explanation: "Intentaste quitar de la lista un valor que no está en ella.",
          tip: "`remove(valor)` falla si el valor no existe. Comprueba antes con `if valor in lista`, o revisa cómo está escrito.",
        };
      }
      if (has(/not enough values to unpack|too many values to unpack/)) {
        return {
          explanation: "Intentaste repartir una colección en más (o menos) variables de las que tiene elementos.",
          tip: "La cantidad de variables a la izquierda del `=` debe ser igual a la cantidad de elementos.",
        };
      }
      return {
        explanation: "La función recibió un valor del tipo correcto, pero con un contenido que no puede usar.",
        tip: "Revisa qué valor le estás pasando en esta línea.",
      };
    }

    case "ZeroDivisionError":
      return {
        explanation: "Intentaste dividir entre cero, y eso no se puede hacer.",
        tip: "Revisa el divisor: quizá una variable llegó a 0. Puedes comprobarlo con un `if` antes de dividir.",
      };

    case "AttributeError": {
      const m = detail.match(/'(\w+)' object has no attribute '(\w+)'/);
      if (m) {
        const [, obj, attr] = m;
        const extra = {
          list: attr === "push" || attr === "add" ? " A las listas se les agrega con `append(...)`." : "",
          str: " Los textos tienen métodos como `upper()`, `lower()` o `split()`.",
        }[obj] || "";
        return {
          explanation: `Un ${quoteList(obj)} no tiene ningún atributo ni método llamado ${quoteList(attr)}.`,
          tip: `Revisa la ortografía. Si es un objeto de una clase tuya, comprueba que el atributo se cree en \`__init__\` con \`self.${attr} = ...\` o que el método esté definido en la clase (o en su clase padre).${extra}`,
        };
      }
      return {
        explanation: "Pediste un atributo o método que ese objeto no tiene.",
        tip: "Revisa la ortografía y qué tipo de objeto es.",
      };
    }

    case "RecursionError":
      return {
        explanation: "Una función se llamó a sí misma tantas veces que Python cortó la ejecución.",
        tip: "Una función recursiva necesita un caso base que la detenga. Revisa que la condición de parada pueda cumplirse.",
      };

    case "EOFError":
      return {
        explanation: "El programa pidió un dato con `input()` pero no había más datos que darle.",
        tip: "Revisa cuántas veces llamas a `input()`.",
      };

    case "ModuleNotFoundError":
    case "ImportError":
      return {
        explanation: "Intentaste importar un módulo que no está disponible.",
        tip: "Revisa cómo está escrito el nombre. Solo se pueden usar los módulos estándar de Python.",
      };

    default:
      return {
        explanation: "Python detuvo el programa por un error que no reconocemos todavía.",
        tip: "Lee el mensaje técnico de abajo y revisa la línea señalada.",
      };
  }
}

/**
 * Explica un error de Python en español.
 * `error` puede ser un traceback en texto, o un objeto { type, detail, line }.
 */
export function explainPythonError(error, code = "") {
  const parsed = typeof error === "string" ? parseRawError(error) : error;
  const { type, detail = "" } = parsed;
  const line = parsed.line ?? null;
  const codeLines = String(code).split("\n");
  const lineText = line && codeLines[line - 1] !== undefined ? codeLines[line - 1] : "";

  // `x = ___` no es un error de sintaxis, pero el alumno sí lo comete todo el rato.
  const placeholderName = type === "NameError" && detail.includes("'___'");
  const t = translate(type, detail, placeholderName ? "___" : lineText);

  return {
    type,
    detail,
    line,
    lineText: lineText.trimEnd(),
    title: t.title || TYPE_LABELS[type] || "Error de Python",
    explanation: t.explanation,
    tip: t.tip,
    technical: detail ? `${type}: ${detail}` : type,
  };
}

/** HTML del panel de error para mostrar debajo de la consola. */
export function errorPanelHtml(info) {
  const fmt = (s) => escapeHtml(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  return `
    <div class="error-panel">
      <div class="error-title">🐞 ${escapeHtml(info.title)}${info.line ? ` <span class="error-line-tag">línea ${info.line}</span>` : ""}</div>
      <p class="error-explanation">${fmt(info.explanation)}</p>
      ${
        info.lineText
          ? `<div class="error-code"><span class="ln">${info.line}</span><code>${escapeHtml(info.lineText.trim())}</code></div>`
          : ""
      }
      ${info.tip ? `<p class="error-tip">💡 ${fmt(info.tip)}</p>` : ""}
      <details class="error-technical"><summary>Mensaje original de Python</summary><code>${escapeHtml(info.technical)}</code></details>
    </div>
  `;
}
