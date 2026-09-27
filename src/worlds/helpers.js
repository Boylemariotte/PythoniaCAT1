// Utilidades compartidas por los validadores de todos los mundos.

export function closeEnough(a, b, eps = 0.001) {
  return Math.abs(a - b) < eps;
}

// Nombre del tipo de Python que corresponde a un valor ya convertido a JS
// (así lo entrega Pyodide): str->string, bool->boolean, int/float->number.
export function pyTypeName(value) {
  if (typeof value === "string") return "str";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
  return "undefined";
}

export function showValue(value) {
  return typeof value === "string" ? `"${value}"` : String(value);
}

// Diagnóstico específico de por qué una variable no tiene el tipo esperado,
// en vez de un genérico "no es del tipo correcto". Devuelve null si el tipo
// ya es el correcto (puede seguir teniendo otros problemas, como estar vacía).
export function typeMistakeMessage(varName, value, expectedType, example) {
  if (value === undefined) {
    return `No encontré la variable \`${varName}\` — asegúrate de definirla, por ejemplo: ${varName} = ${example}`;
  }
  const actual = pyTypeName(value);
  if (actual === expectedType) return null;
  const howToFix = {
    str: `debe ir entre comillas, como ${example}`,
    int: `debe ser un número entero, sin comillas ni punto decimal, como ${example}`,
    float: `debe ser un número con punto decimal, como ${example}`,
    bool: `debe ser exactamente True o False (sin comillas), como ${example}`,
  }[expectedType];
  return `\`${varName}\` quedó como ${showValue(value)} (tipo ${actual}), pero debe ser ${expectedType}: ${howToFix}.`;
}
