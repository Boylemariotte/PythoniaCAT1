// Contenido del Mundo 1 · Los Cimientos (ver plan.html)
// Cada lección define: código inicial, variables esperadas, pistas y un validador.

import { closeEnough, showValue, typeMistakeMessage } from "./helpers.js";

export const world = {
  id: "mundo-1",
  title: "Mundo 1 · Los Cimientos",
  target: "objetivo: variables, tipos, operadores, cadenas y entrada/salida",
  badge: {
    title: "Primeras Líneas",
    description: "Completar Mundo 1",
  },
};

export const lessons = [
  {
    id: "variables-y-tipos",
    num: 1,
    title: "Variables y tipos de datos",
    tag: "Reto · Mundo 1, lección 1",
    xp: 10,
    teach: {
      intro:
        "Un programa es una secuencia de instrucciones que la computadora sigue, una tras otra. Una variable es como una cajita con nombre donde guardas un dato para usarlo más adelante en esa secuencia. En Python, cada dato tiene un `tipo`: `str` es texto (siempre va entre comillas), `int` es un número entero, `float` es un número con decimales, y `bool` es un valor de verdad: `True` o `False`.\n\nPara crear una variable simplemente le pones un nombre, un signo `=`, y el valor. Puedes averiguar el tipo de cualquier variable con `type(variable)`.\n\nTambién vas a ver líneas que empiezan con `#`, como en el ejemplo de abajo: son comentarios. Python los ignora por completo al ejecutar el programa; están ahí solo para que una persona (tú, en unos meses) entienda qué hace el código.",
      exampleHtml: `<span class="com"># cuatro variables, cada una con un tipo distinto</span>
ciudad = <span class="str">"Bogotá"</span>            <span class="com"># str -&gt; texto</span>
anio = 2026                       <span class="com"># int -&gt; número entero</span>
temperatura = 21.5                <span class="com"># float -&gt; número con decimales</span>
esta_lloviendo = <span class="kw">False</span>              <span class="com"># bool -&gt; True o False</span>

print(type(ciudad))               <span class="com"># &lt;class 'str'&gt;</span>`,
    },
    check: {
      question: "¿Cuál de estas opciones es una variable de tipo bool?",
      options: [
        { text: 'nombre = "16"', correct: false },
        { text: "activo = True", correct: true },
        { text: "edad = 16.0", correct: false },
      ],
      feedbackCorrect: "Exacto: True y False son los únicos valores bool que existen.",
      feedbackIncorrect: "Esa no es. Fíjate en el valor: ¿es texto entre comillas, un número, o True/False?",
    },
    analyze: {
      codeHtml: `x = <span class="str">"5"</span>
y = 5
print(x == y)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "True", correct: false },
        { text: "False", correct: true },
        { text: "Error", correct: false },
      ],
      explanation:
        '"5" (texto) y 5 (número) son de tipos distintos. Aunque se "vean" iguales, Python los considera diferentes, así que la comparación da False — no un error.',
    },
    bonus:
      "Agrega una quinta variable a tu ficha (por ejemplo `pais` o `juego_favorito`) e imprime también su tipo con type(). No hace falta comprobarlo aquí: solo experimenta en el editor.",
    brief:
      "Crea tu ficha de explorador: declara cuatro variables (nombre, edad, altura y es_programador) con el tipo correcto, y muéstralas junto con su tipo usando type().",
    starterCode: `# Completa cada variable con un valor del tipo indicado
nombre = ___            # texto (str)
edad = ___              # número entero (int)
altura = ___            # número decimal, en metros (float)
es_programador = ___    # True o False (bool)

print(nombre, type(nombre))
print(edad, type(edad))
print(altura, type(altura))
print(es_programador, type(es_programador))
`,
    expectedVars: ["nombre", "edad", "altura", "es_programador"],
    hints: [
      "Los textos van entre comillas: \"Ada\". Los números enteros no llevan comillas ni punto decimal.",
      "altura debe llevar un punto decimal (ej. 1.65) para ser float, y es_programador debe ser exactamente True o False, sin comillas.",
    ],
    validate: ({ vars, output }) => {
      const mistake =
        typeMistakeMessage("nombre", vars.nombre, "str", '"Ada"') ||
        typeMistakeMessage("edad", vars.edad, "int", "16") ||
        typeMistakeMessage("altura", vars.altura, "float", "1.65") ||
        typeMistakeMessage("es_programador", vars.es_programador, "bool", "True");
      if (mistake) return { ok: false, message: mistake };

      if (vars.nombre.trim() === "") {
        return { ok: false, message: "nombre es un str vacío (\"\") — escribe algo dentro de las comillas, como \"Ada\"." };
      }

      const missingPrints = [];
      if (!/class 'str'/.test(output)) missingPrints.push("nombre");
      if (!/class 'int'/.test(output)) missingPrints.push("edad");
      if (!/class 'float'/.test(output)) missingPrints.push("altura");
      if (!/class 'bool'/.test(output)) missingPrints.push("es_programador");
      if (missingPrints.length > 0) {
        return {
          ok: false,
          message: `Las variables están bien, pero no veo en la consola el type() de: ${missingPrints.join(", ")}. Revisa que los print(...) de esas variables sigan ahí.`,
        };
      }
      return { ok: true, message: "¡Ficha de explorador completa! Cada variable tiene su tipo correcto." };
    },
  },

  {
    id: "operadores",
    num: 2,
    title: "Operadores aritméticos y de comparación",
    tag: "Reto · Mundo 1, lección 2",
    xp: 10,
    teach: {
      intro:
        "Los operadores aritméticos hacen cuentas con números: `+` suma, `-` resta, `*` multiplica. Con la división hay que fijarse bien: `/` siempre da como resultado un `float` (con decimales), mientras que `//` es la *división entera*: divide y luego redondea hacia abajo, descartando los decimales. `%` (el operador módulo) te da el residuo (lo que sobra) de una división.\n\nLos operadores de comparación (`==`, `!=`, `<`, `>`, `<=`, `>=`) comparan dos valores. El resultado de una comparación siempre es un `bool`: `True` o `False`.",
      exampleHtml: `a = 10
b = 3

print(a / b)    <span class="com"># 3.3333...  (división normal: float)</span>
print(a // b)   <span class="com"># 3           (división entera: redondea hacia abajo)</span>
print(a % b)    <span class="com"># 1           (residuo de 10 / 3)</span>
print(a &gt; b)    <span class="com"># True        (10 es mayor que 3)</span>
print(a == b)   <span class="com"># False</span>`,
    },
    check: {
      question: "¿Qué operador te da el residuo de una división?",
      options: [
        { text: "/", correct: false },
        { text: "%", correct: true },
        { text: "//", correct: false },
      ],
      feedbackCorrect: "Sí: % (módulo) da lo que sobra. / da la división con decimales.",
      feedbackIncorrect: "No es ese. Piensa cuál de estos tres símbolos se usa específicamente para 'lo que sobra' de una división.",
    },
    analyze: {
      codeHtml: `a = 7
b = 2
print(a // b, a % b)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "3 1", correct: true },
        { text: "3.5 0", correct: false },
        { text: "Error", correct: false },
      ],
      explanation:
        "// es la división entera (el resultado se redondea hacia abajo, sin decimales): 7 // 2 = 3. Y el residuo de dividir 7 entre 2 es 1.",
    },
    bonus:
      "Agrega una variable envio con un costo fijo (por ejemplo 20) y súmala a total antes de comparar con oro_disponible. ¿Sigue alcanzando el oro?",
    brief:
      "El mercader necesita el total de una compra con descuento, y saber si el oro del explorador alcanza para pagarla.",
    starterCode: `precio = 120
cantidad = 3
descuento = 15  # porcentaje
oro_disponible = 300

total = ___     # precio * cantidad, aplicando el % de descuento
alcanza = ___   # True si oro_disponible es suficiente para pagar total

print("Total a pagar:", total)
print("¿Alcanza el oro?", alcanza)
`,
    expectedVars: ["total", "alcanza"],
    expected: { vars: { total: 306, alcanza: false } },
    hints: [
      "El subtotal es precio * cantidad. Para restar el 15%, multiplica ese subtotal por (1 - 0.15).",
      "alcanza se compara con >=: oro_disponible >= total.",
    ],
    validate: ({ vars, output }) => {
      const subtotal = 120 * 3;
      const expectedTotal = subtotal * (1 - 15 / 100);

      if (vars.total === undefined) {
        return { ok: false, message: "No encontré la variable `total` — asegúrate de definirla (total = ...)." };
      }
      if (typeof vars.total !== "number") {
        return { ok: false, message: `total quedó como ${showValue(vars.total)}, pero debe ser un número (el resultado de una cuenta).` };
      }
      if (!closeEnough(vars.total, expectedTotal, 0.5)) {
        if (closeEnough(vars.total, subtotal, 0.5)) {
          return { ok: false, message: `total dio ${vars.total} — eso es precio * cantidad sin aplicar el descuento. Multiplícalo también por (1 - 0.15).` };
        }
        if (closeEnough(vars.total, subtotal - 15, 0.5)) {
          return { ok: false, message: `total dio ${vars.total} — parece que restaste 15 directo. descuento es un porcentaje (15%), no un monto fijo: multiplica por (1 - 0.15).` };
        }
        return { ok: false, message: `total dio ${vars.total}, pero debería ser ${expectedTotal}. Revisa la fórmula: precio * cantidad * (1 - descuento/100).` };
      }

      if (vars.alcanza === undefined) {
        return { ok: false, message: "No encontré la variable `alcanza` — asegúrate de definirla (alcanza = ...)." };
      }
      if (typeof vars.alcanza !== "boolean") {
        return { ok: false, message: `alcanza quedó como ${showValue(vars.alcanza)}, pero debe ser el resultado de una comparación (True o False).` };
      }
      const expectedAlcanza = 300 >= expectedTotal;
      if (vars.alcanza !== expectedAlcanza) {
        if (vars.alcanza === (expectedTotal >= 300)) {
          return { ok: false, message: `alcanza dio ${vars.alcanza}, pero la comparación está al revés. Debe ser oro_disponible >= total, no total >= oro_disponible.` };
        }
        return { ok: false, message: `alcanza debería ser ${expectedAlcanza} (compara oro_disponible >= total).` };
      }

      if (!/Total a pagar/.test(output) || !/alcanza el oro/i.test(output)) {
        return { ok: false, message: "total y alcanza están bien, pero no borres los print() del final: deben mostrar ambos valores." };
      }
      return { ok: true, message: "¡Cuentas del mercader resueltas correctamente!" };
    },
  },

  {
    id: "fstrings",
    num: 3,
    title: "Concatenación de cadenas y f-strings",
    tag: "Reto · Mundo 1, lección 3",
    xp: 15,
    teach: {
      intro:
        "Concatenar es unir textos. Se puede hacer con `+`, pero hay que convertir a mano cualquier número a texto antes, y se vuelve incómodo rápido.\n\nLa forma más práctica es un `f-string`: escribe una `f` justo antes de las comillas, y mete cualquier variable directamente entre llaves `{}` — Python la convierte a texto por ti.",
      exampleHtml: `nombre = <span class="str">"Luna"</span>
edad = 12

<span class="com"># concatenación con +: hay que convertir edad a texto a mano</span>
print(<span class="str">"Hola "</span> + nombre + <span class="str">", tienes "</span> + str(edad) + <span class="str">" años"</span>)

<span class="com"># con f-string: mucho más simple</span>
print(<span class="str">f"Hola {nombre}, tienes {edad} años"</span>)`,
    },
    check: {
      question: "¿Cuál es la forma correcta de escribir un f-string?",
      options: [
        { text: '"Hola {nombre}"', correct: false },
        { text: 'f"Hola {nombre}"', correct: true },
        { text: 'f(Hola {nombre})', correct: false },
      ],
      feedbackCorrect: "Correcto: la f va justo antes de las comillas, sin espacio ni paréntesis.",
      feedbackIncorrect: "No es esa. Recuerda: la f va pegada a las comillas, no reemplaza las comillas ni usa paréntesis.",
    },
    analyze: {
      codeHtml: `n = 3
print(f"Tienes {n + 2} vidas")`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "Tienes 5 vidas", correct: true },
        { text: "Tienes n + 2 vidas", correct: false },
        { text: "Error", correct: false },
      ],
      explanation:
        "Dentro de las llaves de un f-string puedes poner cualquier expresión de Python, no solo el nombre de una variable — Python la calcula (n + 2 = 5) antes de armar el texto final.",
    },
    bonus:
      "Arma otra presentación con f-strings, pero para un personaje inventado: sus propios nombre, mundo y nivel.",
    brief:
      "Escribe la presentación de tu personaje combinando texto y variables con un f-string.",
    starterCode: `nombre = "Ada"
mundo = "Pythonia"
nivel = 1

# Arma una sola cadena usando un f-string, por ejemplo:
# f"Soy {nombre}..."
presentacion = ___

print(presentacion)
`,
    expectedVars: ["presentacion"],
    hints: [
      'Un f-string se escribe f"..." y las variables van entre llaves: f"Soy {nombre}".',
      'Prueba algo como: f"Soy {nombre}, exploro {mundo} y estoy en el nivel {nivel}."',
    ],
    validate: ({ vars, code }) => {
      const mistake = typeMistakeMessage("presentacion", vars.presentacion, "str", 'f"Soy {nombre}..."');
      if (mistake) return { ok: false, message: mistake };

      const hasFString = /f["'][^"']*\{/.test(code);
      if (!hasFString) {
        if (/presentacion\s*=.*\+/.test(code)) {
          return {
            ok: false,
            message: "presentacion tiene contenido, pero la armaste con + en vez de un f-string. Reescríbela como f\"...{variable}...\", como en el ejemplo.",
          };
        }
        return { ok: false, message: 'Usa la sintaxis de f-string (f"...{variable}...") para armar presentacion.' };
      }

      const text = vars.presentacion;
      const missing = [];
      if (!text.includes("Ada")) missing.push("el nombre (Ada)");
      if (!text.includes("Pythonia")) missing.push("el mundo (Pythonia)");
      if (!text.includes("1")) missing.push("el nivel (1)");
      if (missing.length > 0) {
        return { ok: false, message: `presentacion ya usa f-string, pero le falta mencionar: ${missing.join(", ")}.` };
      }
      return { ok: true, message: "¡Presentación armada con f-strings!" };
    },
  },

  {
    id: "input-output",
    num: 4,
    title: "Entrada y salida: input() y print()",
    tag: "Reto · Mundo 1, lección 4",
    xp: 10,
    teach: {
      intro:
        "`print()` muestra algo en pantalla. `input()` hace lo contrario: pausa el programa y espera a que la persona escriba algo y presione Enter.\n\nOjo: `input()` siempre devuelve texto (`str`), aunque la persona escriba solo números. Si necesitas usar ese dato para hacer cuentas, tienes que convertirlo con `int(...)` o `float(...)`.",
      exampleHtml: `color = input(<span class="str">"¿Cuál es tu color favorito? "</span>)
edad_texto = input(<span class="str">"¿Cuántos años tienes? "</span>)

print(<span class="str">"Tu color favorito es"</span>, color)   <span class="com"># edad_texto es texto (str)</span>

edad = <span class="kw">int</span>(edad_texto)   <span class="com"># ahora sí es un número (int)</span>
print(edad + 1)          <span class="com"># esto solo funciona si edad es int</span>`,
    },
    check: {
      question: "input() siempre devuelve...",
      options: [
        { text: "un número entero (int)", correct: false },
        { text: "un texto (str)", correct: true },
        { text: "depende de lo que escriba la persona", correct: false },
      ],
      feedbackCorrect: "Sí: sin importar qué escriba la persona, input() siempre te da un str.",
      feedbackIncorrect: "No es esa. input() se comporta siempre igual, sin importar qué escriba la persona.",
    },
    analyze: {
      codeHtml: `edad = input(<span class="str">"Edad: "</span>)   <span class="com"># la persona escribe: 10</span>
print(edad + 5)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "15", correct: false },
        { text: "Error: no se puede sumar str + int", correct: true },
        { text: "105", correct: false },
      ],
      explanation:
        'edad guarda el texto "10" (str), no el número 10. Python no permite sumar directamente un str con un int — por eso hay que convertirlo con int(edad) antes de usarlo en una cuenta.',
    },
    bonus:
      "Pide también la ciudad del explorador con input() y agrégala al mensaje final de bienvenida.",
    brief:
      "Pide el nombre y la edad del explorador con input(), y salúdalo por pantalla. Para comprobar tu código usamos datos de prueba automáticos (nombre: Ada, edad: 16) en vez de pedírtelos por una ventana emergente, así puedes reintentar rápido.",
    starterCode: `nombre = input("¿Cómo te llamas, explorador? ")
edad = ___   # pide la edad con input() y conviértela a entero con int()

print(f"¡Bienvenido, {nombre}! A tus {edad} años, tu aventura en Pythonia comienza.")
`,
    expectedVars: ["nombre", "edad"],
    simulatedInputs: ["Ada", "16"],
    expected: { vars: { nombre: "Ada", edad: 16 } },
    hints: [
      "input() siempre devuelve texto. Para convertirlo a número entero, envuélvelo con int(...).",
      'Prueba: edad = int(input("¿Cuántos años tienes? "))',
    ],
    validate: ({ vars, output, code }) => {
      if (vars.nombre !== "Ada") {
        if (!/nombre\s*=\s*input\(/.test(code)) {
          return { ok: false, message: "nombre debe venir directo de input(), no de un valor escrito a mano en el código." };
        }
        return { ok: false, message: `nombre quedó como ${showValue(vars.nombre)} — revisa que no le hiciste ningún cambio extra al resultado de input().` };
      }
      if (vars.edad !== 16) {
        if (typeof vars.edad === "string") {
          return {
            ok: false,
            message: `edad quedó como el texto ${showValue(vars.edad)} — te faltó convertirlo con int(). Prueba: edad = int(input("¿Cuántos años tienes? "))`,
          };
        }
        return { ok: false, message: `edad debería ser el entero 16, pero quedó como ${showValue(vars.edad)}.` };
      }
      if (!/Ada/.test(output) || !/16/.test(output) || !/Bienvenido/i.test(output)) {
        return { ok: false, message: "nombre y edad están bien, pero no borres el print() final: debe saludar usando ambos." };
      }
      return { ok: true, message: "¡El explorador quedó registrado!" };
    },
  },

  {
    id: "mision-final-presentacion",
    num: 5,
    final: true,
    title: 'Misión final: "La Presentación"',
    tag: "Misión final · Mundo 1",
    xp: 40,
    teach: {
      intro:
        "Esta misión junta todo lo del Mundo 1: pedir datos con `input()`, convertir texto a número con `int()`, hacer una cuenta con un operador aritmético, y armar el mensaje final con un `f-string`.\n\nSi te trabas en algún paso, no pasa nada: repasa el ejemplo de la lección correspondiente (1 a 4) — el truco está en encadenar esas mismas piezas, una detrás de otra.",
      exampleHtml: `<span class="com"># mismo patrón, con otros datos</span>
mascota = input(<span class="str">"¿Nombre de tu mascota? "</span>)
edad_texto = input(<span class="str">"¿Edad de tu mascota? "</span>)
edad = <span class="kw">int</span>(edad_texto)
mensaje = <span class="str">f"{mascota} tiene {edad} años"</span>
print(mensaje)`,
    },
    check: {
      question: "¿Cuál es el orden correcto para usar un dato de input() en una cuenta?",
      options: [
        { text: "Usarlo directo en la cuenta", correct: false },
        { text: "Convertirlo con int() o float() primero", correct: true },
        { text: "Convertirlo con str() primero", correct: false },
      ],
      feedbackCorrect: "Exacto: primero se convierte a número, y ya después se puede usar en una cuenta.",
      feedbackIncorrect: "No es esa. input() devuelve texto, así que hace falta convertirlo a número antes de sumar o restar.",
    },
    analyze: {
      codeHtml: `anio_actual = 2026
edad = <span class="kw">int</span>(input(<span class="str">"Edad: "</span>))  <span class="com"># la persona escribe: 20</span>
print(anio_actual - edad)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "2006", correct: true },
        { text: "2026 - edad", correct: false },
        { text: "Error", correct: false },
      ],
      explanation:
        "edad ya es un int (20) gracias a la conversión, así que anio_actual - edad es una resta normal: 2026 - 20 = 2006.",
    },
    bonus:
      "Cierra el Mundo 1 a tu manera: añade una variable más a tu presentación (por ejemplo, cuántos años faltan para que el explorador cumpla 18) y agrégala al f-string final.",
    brief:
      "Combina todo lo del mundo: pide nombre y edad con input(), calcula el año de nacimiento con aritmética, y arma un f-string de presentación. (Se usa 2026 como año actual, y los mismos datos de prueba: Ada, 16 años).",
    starterCode: `# Misión final: La Presentación
anio_actual = 2026

nombre = ___              # pide el nombre con input()
edad = ___                # pide la edad con input() y conviértela a int
anio_nacimiento = ___     # anio_actual menos edad
titulo = ___              # f-string que combine nombre, edad y anio_nacimiento

print(titulo)
`,
    expectedVars: ["nombre", "edad", "anio_nacimiento", "titulo"],
    simulatedInputs: ["Ada", "16"],
    expected: { vars: { nombre: "Ada", edad: 16, anio_nacimiento: 2010 } },
    hints: [
      "Los dos primeros datos se piden igual que en la lección anterior: input() para el nombre, int(input()) para la edad.",
      "anio_nacimiento = anio_actual - edad. Luego arma titulo con un f-string que use nombre, edad y anio_nacimiento.",
    ],
    validate: ({ vars, code, output }) => {
      if (vars.nombre !== "Ada") {
        if (!/nombre\s*=\s*input\(/.test(code)) {
          return { ok: false, message: "nombre debe pedirse con input(), igual que en la lección anterior." };
        }
        return { ok: false, message: `nombre quedó como ${showValue(vars.nombre)} — revisa que no le hiciste ningún cambio extra al resultado de input().` };
      }
      if (vars.edad !== 16) {
        if (typeof vars.edad === "string") {
          return { ok: false, message: `edad quedó como texto (${showValue(vars.edad)}) — conviértela con int(): edad = int(input(...))` };
        }
        return { ok: false, message: `edad debería ser 16, pero quedó como ${showValue(vars.edad)}.` };
      }
      if (vars.anio_nacimiento !== 2010) {
        if (typeof vars.anio_nacimiento !== "number") {
          return { ok: false, message: `anio_nacimiento quedó como ${showValue(vars.anio_nacimiento)}, pero debe ser un número (anio_actual - edad).` };
        }
        if (closeEnough(vars.anio_nacimiento, -2010, 0.5)) {
          return { ok: false, message: "anio_nacimiento dio un número negativo — revisa el orden de la resta: es anio_actual - edad, no edad - anio_actual." };
        }
        return { ok: false, message: `anio_nacimiento debería salir de anio_actual - edad (esperado: 2010), pero quedó como ${vars.anio_nacimiento}.` };
      }

      const mistake = typeMistakeMessage("titulo", vars.titulo, "str", 'f"{nombre} tiene {edad} años..."');
      if (mistake) return { ok: false, message: mistake };
      if (!/f["'][^"']*\{/.test(code)) {
        return { ok: false, message: 'titulo debe armarse con un f-string (f"...{variable}...").' };
      }
      const missing = [];
      if (!vars.titulo.includes("Ada")) missing.push("el nombre");
      if (!vars.titulo.includes("16")) missing.push("la edad");
      if (!vars.titulo.includes("2010")) missing.push("el año de nacimiento");
      if (missing.length > 0) {
        return { ok: false, message: `titulo ya usa f-string, pero le falta mencionar: ${missing.join(", ")}.` };
      }
      if (!/Ada/.test(output) || !/2010/.test(output)) {
        return { ok: false, message: "titulo está bien armado, pero no olvides el print(titulo) al final." };
      }
      return { ok: true, message: "¡Misión cumplida! La Presentación cierra el Mundo 1." };
    },
  },
];
