// Contenido del Mundo 2 · El Bosque de los Ciclos (ver plan.html)
// Mismo formato que Mundo 1: código inicial, variables esperadas, pistas y validador.

import { showValue } from "./helpers.js";

export const world = {
  id: "mundo-2",
  title: "Mundo 2 · El Bosque de los Ciclos",
  target: "objetivo: ciclos y lógica",
  badge: {
    title: "Guardián del Bucle",
    description: "Completar Mundo 2",
  },
};

export const lessons = [
  {
    id: "condicionales",
    num: 1,
    title: "Condicionales: if / elif / else",
    tag: "Reto · Mundo 2, lección 1",
    xp: 10,
    teach: {
      intro:
        "Un condicional deja que tu programa tome caminos distintos según una condición. `if` revisa una condición y ejecuta su bloque solo si es `True`. `elif` (\"else if\") se revisa únicamente si el `if` anterior fue `False`, y prueba una condición nueva. `else` es el camino por defecto: se ejecuta si ninguna de las condiciones anteriores se cumplió.\n\nPara combinar condiciones se usan `and` (True solo si ambas son True), `or` (True si al menos una es True) y `not` (invierte un valor: not True es False). La indentación (los espacios al inicio de línea) es lo que le dice a Python qué código pertenece a cada bloque — no es opcional, como en otros lenguajes.",
      exampleHtml: `edad = 15

<span class="kw">if</span> edad &lt; 13:
    print(<span class="str">"Eres un niño"</span>)
<span class="kw">elif</span> edad &lt; 18:
    print(<span class="str">"Eres un adolescente"</span>)
<span class="kw">else</span>:
    print(<span class="str">"Eres un adulto"</span>)

<span class="com"># and / or / not combinan condiciones</span>
tiene_boleto = <span class="kw">True</span>
es_vip = <span class="kw">False</span>
print(tiene_boleto <span class="kw">and</span> es_vip)   <span class="com"># False: no se cumplen las dos</span>
print(tiene_boleto <span class="kw">or</span> es_vip)    <span class="com"># True: se cumple al menos una</span>`,
    },
    check: {
      question: "¿Qué hace exactamente un elif?",
      options: [
        { text: "Se ejecuta siempre, sin importar el if anterior", correct: false },
        { text: "Se revisa solo si el if anterior fue False, y prueba una condición nueva", correct: true },
        { text: "Reemplaza al else y nunca necesita una condición", correct: false },
      ],
      feedbackCorrect: "Exacto: elif solo entra en juego cuando las condiciones anteriores fallaron.",
      feedbackIncorrect: "No es esa. Piensa en elif como un 'si no, pero revisa esto otro' — depende de que el if anterior haya sido falso.",
    },
    analyze: {
      codeHtml: `puntos = 12
<span class="kw">if</span> puntos &gt; 20:
    print(<span class="str">"Oro"</span>)
<span class="kw">elif</span> puntos &gt; 10:
    print(<span class="str">"Plata"</span>)
<span class="kw">else</span>:
    print(<span class="str">"Bronce"</span>)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "Oro", correct: false },
        { text: "Plata", correct: true },
        { text: "Bronce", correct: false },
      ],
      explanation:
        "puntos > 20 es False (12 no es mayor que 20), así que Python revisa el elif: puntos > 10 sí es True (12 > 10), así que imprime 'Plata' y ni siquiera llega a revisar el else.",
    },
    bonus:
      'Agrega un cuarto camino: un elif que deje pasar también a cualquier explorador con clase "guerrero" y nivel >= 8.',
    brief:
      "El guardián del bosque decide quién puede cruzar según el nivel y la clase del explorador. Completa los tres caminos: if, elif y else.",
    starterCode: `nivel = int(input("¿Cuál es tu nivel? "))
clase = input("¿Cuál es tu clase? ")

if nivel >= ___:
    acceso = "Puedes pasar, viajero experimentado."
elif nivel >= ___ and clase == ___:
    acceso = "Puedes pasar, tu magia te protege."
else:
    acceso = "Debes entrenar más antes de cruzar."

print(acceso)
`,
    expectedVars: ["nivel", "clase", "acceso"],
    simulatedInputs: ["7", "mago"],
    hints: [
      "El primer if compara nivel contra el umbral más alto: nivel >= 10.",
      'El elif combina dos condiciones con and: nivel >= 5 and clase == "mago".',
    ],
    validate: ({ vars, output }) => {
      if (vars.nivel !== 7) {
        if (typeof vars.nivel === "string") {
          return { ok: false, message: `nivel quedó como texto (${showValue(vars.nivel)}) — conviértelo con int(): nivel = int(input(...))` };
        }
        return { ok: false, message: `nivel debería ser 7 (dato de prueba), pero quedó como ${showValue(vars.nivel)}.` };
      }
      if (vars.clase !== "mago") {
        return { ok: false, message: `clase debería ser "mago" (dato de prueba), pero quedó como ${showValue(vars.clase)}.` };
      }
      const expected = "Puedes pasar, tu magia te protege.";
      if (vars.acceso !== expected) {
        if (vars.acceso === "Puedes pasar, viajero experimentado.") {
          return { ok: false, message: "acceso dio el mensaje de nivel alto, pero 7 no alcanza ese umbral. Revisa el primer if: debe ser nivel >= 10." };
        }
        if (vars.acceso === "Debes entrenar más antes de cruzar.") {
          return { ok: false, message: 'acceso cayó en el else — revisa el elif: nivel >= 5 and clase == "mago" debería cumplirse con nivel=7 y clase="mago".' };
        }
        return { ok: false, message: `acceso debería ser "${expected}", pero quedó como ${showValue(vars.acceso)}.` };
      }
      if (!/magia te protege/.test(output)) {
        return { ok: false, message: "acceso está bien, pero no borres el print(acceso) final." };
      }
      return { ok: true, message: "¡El guardián del bosque te deja pasar!" };
    },
  },

  {
    id: "ciclo-while",
    num: 2,
    title: "El ciclo while",
    tag: "Reto · Mundo 2, lección 2",
    xp: 15,
    teach: {
      intro:
        "Un ciclo `while` repite su bloque de código una y otra vez mientras su condición siga siendo `True`. A diferencia de un if (que se revisa una sola vez), while vuelve a revisar la condición después de cada vuelta.\n\nPara que el ciclo termine algún día, algo dentro de él tiene que ir acercando la condición a False — normalmente una variable que cambia en cada vuelta. Si te olvidas de actualizarla, el ciclo nunca termina: eso se llama un bucle infinito, y es el error más común al empezar con while.",
      exampleHtml: `contador = 3

<span class="kw">while</span> contador &gt; 0:
    print(contador)
    contador = contador - 1   <span class="com"># sin esto, el ciclo nunca terminaría</span>

print(<span class="str">"¡Despegue!"</span>)`,
    },
    check: {
      question: "¿Qué pasa si dentro de un while te olvidas de actualizar la variable de la condición?",
      options: [
        { text: "El ciclo se ejecuta una vez y termina solo", correct: false },
        { text: "El ciclo nunca termina (bucle infinito)", correct: true },
        { text: "Python lanza un error automáticamente y detiene el programa", correct: false },
      ],
      feedbackCorrect: "Correcto: si la condición nunca cambia a False, el while se repite para siempre.",
      feedbackIncorrect: "No es esa. Python no detecta bucles infinitos por sí solo — simplemente sigue repitiendo mientras la condición sea True.",
    },
    analyze: {
      codeHtml: `n = 1
<span class="kw">while</span> n &lt; 4:
    print(n * n)
    n = n + 1`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "1 4 9", correct: true },
        { text: "1 2 3", correct: false },
        { text: "1 4 9 16", correct: false },
      ],
      explanation:
        "n empieza en 1 y el ciclo se repite mientras n < 4. Se imprime n*n en cada vuelta: 1*1=1, luego n=2 → 4, luego n=3 → 9. Cuando n llega a 4, la condición n < 4 es False y el ciclo se detiene, así que 16 nunca se imprime.",
    },
    bonus:
      "Cambia el punto de partida a 8 y observa cuántas líneas se imprimen ahora (no hace falta comprobarlo aquí, solo experimenta).",
    brief:
      "El guardián necesita una cuenta regresiva de energía antes de abrir el portal del bosque. Completa la condición del while y el decremento.",
    starterCode: `energia = 5

while ___:
    print(f"Energía restante: {energia}")
    energia = energia ___ 1

print("¡Portal abierto!")
`,
    expectedVars: ["energia"],
    hints: [
      "La condición del while debe seguir siendo cierta mientras haya energía: energia > 0.",
      "Dentro del ciclo, energia debe reducirse en cada vuelta: energia = energia - 1. Si olvidas esta línea, el ciclo nunca termina.",
    ],
    validate: ({ vars, output }) => {
      if (typeof vars.energia !== "number") {
        return { ok: false, message: `energia terminó como ${showValue(vars.energia)}, pero debería ser un número (revisa: energia = energia - 1).` };
      }
      if (vars.energia !== 0) {
        if (vars.energia === 5) {
          return { ok: false, message: "energia nunca cambió — revisa la línea energia = energia ___ 1: falta restar 1 en cada vuelta." };
        }
        if (vars.energia < 0) {
          return { ok: false, message: `energia terminó en ${vars.energia}, un número negativo — probablemente la condición del while está mal (revisa: energia > 0).` };
        }
        return { ok: false, message: `energia debería terminar en 0, pero quedó en ${vars.energia}. Revisa la condición del while y el decremento.` };
      }
      const expectedLines = [5, 4, 3, 2, 1].map((n) => `Energía restante: ${n}`);
      const missing = expectedLines.filter((line) => !output.includes(line));
      if (missing.length > 0) {
        return { ok: false, message: `Falta imprimir: ${missing.join(", ")}. Revisa que el print esté dentro del while (con la indentación correcta).` };
      }
      if (output.includes("Energía restante: 0")) {
        return { ok: false, message: "El ciclo imprimió de más cuando energia ya era 0 — revisa que la condición sea energia > 0, no energia >= 0." };
      }
      if (!/Portal abierto/.test(output)) {
        return { ok: false, message: 'energia está bien, pero no borres el print("¡Portal abierto!") final.' };
      }
      return { ok: true, message: "¡Cuenta regresiva completa! El portal se abrió." };
    },
  },

  {
    id: "ciclo-for-range",
    num: 3,
    title: "El ciclo for y range()",
    tag: "Reto · Mundo 2, lección 3",
    xp: 15,
    teach: {
      intro:
        "Un ciclo `for` recorre los elementos de una secuencia, uno por uno, sin que tengas que llevar tú mismo la cuenta (a diferencia de while). `range(inicio, fin)` genera la secuencia de números desde inicio hasta fin, sin incluir fin — ese detalle se presta a errores, así que ojo con él.\n\nSi solo le das un número, range(n), empieza en 0. También acepta un tercer argumento opcional, el paso: range(inicio, fin, paso).",
      exampleHtml: `<span class="kw">for</span> numero <span class="kw">in</span> range(1, 6):
    print(numero)
<span class="com"># imprime 1 2 3 4 5  (el 6 no se incluye)</span>

<span class="kw">for</span> par <span class="kw">in</span> range(0, 10, 2):
    print(par)
<span class="com"># imprime 0 2 4 6 8  (de 2 en 2)</span>`,
    },
    check: {
      question: "¿Qué imprime range(1, 6)?",
      options: [
        { text: "1, 2, 3, 4, 5, 6", correct: false },
        { text: "1, 2, 3, 4, 5", correct: true },
        { text: "0, 1, 2, 3, 4, 5", correct: false },
      ],
      feedbackCorrect: "Correcto: range(1, 6) va de 1 a 5 — el número final nunca se incluye.",
      feedbackIncorrect: "No es esa. Recuerda: el segundo número de range() marca dónde parar, pero no se incluye en el resultado.",
    },
    analyze: {
      codeHtml: `<span class="kw">for</span> n <span class="kw">in</span> range(0, 10, 3):
    print(n)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "0 3 6 9", correct: true },
        { text: "0 3 6 9 10", correct: false },
        { text: "0 2 4 6 8", correct: false },
      ],
      explanation:
        "range(0, 10, 3) empieza en 0 y avanza de 3 en 3 sin pasarse de 10 (sin incluirlo): 0, 3, 6, 9. El siguiente sería 12, que ya se pasa de 10, así que el ciclo se detiene ahí.",
    },
    bonus:
      "Cambia el múltiplo mágico de 3 a 5, y el grito de '¡Pum!' a '¡Bum!'. ¿Cambia mucho la salida?",
    brief:
      'Un mercader cuenta sus monedas del 1 al 20 en voz alta, pero cada vez que llega a un múltiplo de 3, grita "¡Pum!" en lugar del número. Completa el ciclo para que el programa haga lo mismo.',
    starterCode: `for moneda in range(1, ___):
    if moneda % ___ == 0:
        print(___)
    else:
        print(moneda)
`,
    expectedVars: [],
    hints: [
      "range(1, ___) no incluye el número final — para llegar hasta 20 inclusive, el segundo argumento debe ser 21.",
      'Un número es múltiplo de 3 si moneda % 3 == 0. En ese caso, imprime "¡Pum!" en vez del número.',
    ],
    validate: ({ output }) => {
      const expectedLines = [];
      for (let moneda = 1; moneda <= 20; moneda++) {
        expectedLines.push(moneda % 3 === 0 ? "¡Pum!" : String(moneda));
      }
      const expected = expectedLines.join("\n");
      const actual = output.trim();
      if (actual === expected) {
        return { ok: true, message: "¡El mercader cuenta sus monedas a la perfección!" };
      }
      if (!output.includes("¡Pum!")) {
        return { ok: false, message: 'No veo ningún "¡Pum!" en la salida — revisa el if: moneda % 3 == 0, y que imprimas "¡Pum!" en ese caso.' };
      }
      if (!/(^|\D)20(\D|$)/.test(output) && /(^|\D)21(\D|$)/.test(output)) {
        return { ok: false, message: "range(1, ___) llegó hasta 21 — recuerda que el límite superior de range() no se incluye: para contar hasta 20, usa range(1, 21)." };
      }
      const lines = actual.split("\n");
      for (let i = 0; i < expectedLines.length; i++) {
        if (lines[i] !== expectedLines[i]) {
          return {
            ok: false,
            message: `La línea ${i + 1} debería ser "${expectedLines[i]}", pero salió "${lines[i] ?? "(nada)"}" — revisa el rango (1 a 20) y la condición del múltiplo de 3.`,
          };
        }
      }
      return { ok: false, message: "La salida no coincide exactamente con lo esperado. Revisa el rango (1 a 20) y la condición del múltiplo de 3." };
    },
  },

  {
    id: "break-continue",
    num: 4,
    title: "break, continue y ciclos anidados",
    tag: "Reto · Mundo 2, lección 4",
    xp: 20,
    teach: {
      intro:
        "`break` corta el ciclo por completo, de inmediato — ni siquiera termina esa vuelta. `continue` es más suave: salta el resto del cuerpo para esa vuelta puntual, pero el ciclo sigue con la siguiente.\n\nUn ciclo anidado es un ciclo dentro de otro: por cada vuelta del ciclo externo, el interno se ejecuta completo desde el principio. Ojo con un detalle importante: un break dentro del ciclo interno solo corta el ciclo interno, no el externo.",
      exampleHtml: `<span class="kw">for</span> numero <span class="kw">in</span> range(1, 6):
    <span class="kw">if</span> numero == 4:
        <span class="kw">break</span>          <span class="com"># corta el ciclo por completo</span>
    <span class="kw">if</span> numero == 2:
        <span class="kw">continue</span>       <span class="com"># salta esta vuelta, sigue con la siguiente</span>
    print(numero)
<span class="com"># imprime: 1  3   (el 2 se salta, y en 4 el ciclo se corta)</span>

<span class="com"># ciclo anidado: el interno corre completo por cada vuelta del externo</span>
<span class="kw">for</span> fila <span class="kw">in</span> range(1, 3):
    <span class="kw">for</span> columna <span class="kw">in</span> range(1, 3):
        print(fila, columna)`,
    },
    check: {
      question: "¿Cuál es la diferencia entre break y continue?",
      options: [
        { text: "break corta el ciclo por completo; continue salta solo la vuelta actual", correct: true },
        { text: "Son lo mismo, solo cambia el nombre", correct: false },
        { text: "continue corta el ciclo por completo; break salta solo la vuelta actual", correct: false },
      ],
      feedbackCorrect: "Exacto: break termina el ciclo entero; continue solo se salta el resto de esa vuelta.",
      feedbackIncorrect: "No es esa. Piensa en break como 'salir ya' y en continue como 'saltar esta vuelta, pero seguir'.",
    },
    analyze: {
      codeHtml: `<span class="kw">for</span> i <span class="kw">in</span> range(1, 3):
    <span class="kw">for</span> j <span class="kw">in</span> range(1, 4):
        <span class="kw">if</span> j == 2:
            <span class="kw">break</span>
        print(i, j)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "1 1  2 1", correct: true },
        { text: "1 1  1 2  1 3  2 1  2 2  2 3", correct: false },
        { text: "Nada, porque el break corta todo de inmediato", correct: false },
      ],
      explanation:
        "El break está dentro del ciclo interno (j), así que solo corta ese ciclo interno, no el externo (i). Para i=1: j=1 imprime '1 1', y en j=2 se corta el ciclo interno. Luego i pasa a 2: j=1 imprime '2 1', y de nuevo se corta en j=2. El ciclo externo sigue funcionando con normalidad.",
    },
    bonus:
      "Agrega una tabla anidada: para cada puerta que sí revisas (impar), imprime también un mini-inventario recorriendo una segunda lista con un for interno.",
    brief:
      "Un explorador revisa 10 puertas numeradas buscando una llave. Las puertas pares están cerradas (sáltalas con continue) y, apenas encuentra la llave en la puerta 7, deja de buscar (con break).",
    starterCode: `puertas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

for puerta in puertas:
    if puerta % 2 == 0:
        ___            # las puertas pares están cerradas: salta a la siguiente
    if puerta == 7:
        print(f"¡Encontré la llave en la puerta {puerta}!")
        ___            # ya no hace falta seguir buscando
    print(f"Puerta {puerta}: vacía")
`,
    expectedVars: [],
    hints: [
      "continue salta directo a la siguiente vuelta del ciclo, sin ejecutar el resto del cuerpo para esa puerta.",
      "break corta el ciclo por completo — úsalo justo después de imprimir el mensaje de la puerta 7, antes del print final.",
    ],
    validate: ({ output }) => {
      const expected = ["Puerta 1: vacía", "Puerta 3: vacía", "Puerta 5: vacía", "¡Encontré la llave en la puerta 7!"];
      const actual = output
        .trim()
        .split("\n")
        .filter((l) => l.length > 0);
      const expectedJoined = expected.join("\n");
      const actualJoined = actual.join("\n");
      if (actualJoined === expectedJoined) {
        return { ok: true, message: "¡Encontraste la llave sin abrir ni una puerta de más!" };
      }
      if (actual.some((l) => /Puerta (2|4|6|8|10): vacía/.test(l))) {
        return { ok: false, message: "Se imprimió una puerta par como vacía — falta el continue para saltarte las puertas pares (puerta % 2 == 0)." };
      }
      if (actual.some((l) => /Puerta 7: vacía/.test(l))) {
        return { ok: false, message: "Se imprimió 'Puerta 7: vacía' además del mensaje de la llave — falta el break justo después de encontrarla, para no seguir con esa vuelta." };
      }
      if (!actualJoined.includes("Encontré la llave")) {
        return { ok: false, message: "No veo el mensaje de la llave encontrada — revisa el if puerta == 7 y que imprimas el mensaje antes del break." };
      }
      if (actual.some((l) => /Puerta (8|9|10)/.test(l))) {
        return { ok: false, message: "El ciclo siguió después de la puerta 7 — falta el break para cortarlo apenas se encuentra la llave." };
      }
      return { ok: false, message: `La salida no coincide con lo esperado:\n${expectedJoined}` };
    },
  },

  {
    id: "mision-final-tabla-mercader",
    num: 5,
    final: true,
    title: 'Misión final: "La Tabla del Mercader"',
    tag: "Misión final · Mundo 2",
    xp: 45,
    teach: {
      intro:
        "Esta misión junta todo el Bosque de los Ciclos: una cuenta regresiva con `while`, una tabla construida con dos `for` anidados, y un `if` para marcar los casos especiales — todo impreso con `f-strings`.\n\nSi te trabas, repasa las lecciones 2 a 4: el truco está en que cada pieza ya la usaste por separado, aquí solo se encadenan una detrás de otra.",
      exampleHtml: `dias_entrenamiento = 2
<span class="kw">while</span> dias_entrenamiento &gt; 0:
    print(<span class="str">f"Entrenando... quedan {dias_entrenamiento} días"</span>)
    dias_entrenamiento = dias_entrenamiento - 1

niveles = [<span class="str">"Bosque"</span>, <span class="str">"Cueva"</span>]
<span class="kw">for</span> nivel <span class="kw">in</span> niveles:
    <span class="kw">for</span> intento <span class="kw">in</span> range(1, 3):
        print(<span class="str">f"{nivel} - intento {intento}"</span>)`,
    },
    check: {
      question: "¿Qué pasa si un ciclo for está dentro de otro ciclo for (anidado)?",
      options: [
        { text: "El interno se repite completo por cada vuelta del externo", correct: true },
        { text: "El interno solo se ejecuta una vez, sin importar el externo", correct: false },
        { text: "Python da un error: no se pueden anidar ciclos for", correct: false },
      ],
      feedbackCorrect: "Correcto: por cada vuelta del ciclo externo, el interno vuelve a correr desde el principio.",
      feedbackIncorrect: "No es esa. Un ciclo anidado es completamente válido, y el interno se repite entero por cada vuelta del externo.",
    },
    analyze: {
      codeHtml: `n = 2
<span class="kw">while</span> n &gt; 0:
    <span class="kw">for</span> letra <span class="kw">in</span> <span class="str">"ab"</span>:
        print(n, letra)
    n = n - 1`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "2 a  2 b  1 a  1 b", correct: true },
        { text: "2 a  1 a  2 b  1 b", correct: false },
        { text: "2 a  2 b", correct: false },
      ],
      explanation:
        'Con n=2, el for interno recorre "ab" completo: imprime "2 a" y "2 b". Luego n baja a 1, la condición n > 0 sigue siendo True, y el for vuelve a correr completo: "1 a" y "1 b". Recién ahí n baja a 0 y el while se detiene.',
    },
    bonus:
      "Agrega un cuarto producto a la lista y observa cuántas líneas nuevas aparecen en la tabla — ¿cuántas más esperarías, sabiendo que hay 3 cantidades por producto?",
    brief:
      "Antes de abrir su puesto, el mercader hace una cuenta regresiva de preparación. Luego arma su tabla de precios para 3 productos y 3 cantidades cada uno, marcando con una oferta especial cualquier total que pase de 40 monedas de oro.",
    starterCode: `# Misión final: La Tabla del Mercader
preparacion = 3

while ___:                      # sigue mientras quede preparación
    print(f"Preparando puesto... {preparacion}")
    preparacion = preparacion ___ 1

productos = ["Poción", "Escudo", "Espada"]
precio_base = 15

for producto in productos:
    for cantidad in range(1, ___):     # 1, 2 y 3 unidades
        total = precio_base ___ cantidad
        if total ___ 40:
            print(f"{cantidad} x {producto}: {total} de oro — ¡Oferta especial!")
        else:
            print(f"{cantidad} x {producto}: {total} de oro")
`,
    expectedVars: ["preparacion", "total"],
    hints: [
      "La cuenta regresiva es igual que en la lección del while: preparacion > 0 como condición, y preparacion = preparacion - 1 para que avance.",
      "range(1, ___) no incluye el límite superior: para las cantidades 1, 2 y 3 necesitas range(1, 4). El total sale de precio_base * cantidad, y la oferta especial aparece cuando total > 40.",
    ],
    validate: ({ vars, output }) => {
      if (typeof vars.preparacion !== "number" || vars.preparacion !== 0) {
        if (vars.preparacion === 3) {
          return { ok: false, message: "preparacion nunca cambió — falta restar 1 dentro del while (preparacion = preparacion - 1)." };
        }
        return { ok: false, message: `preparacion debería terminar en 0, pero quedó en ${showValue(vars.preparacion)}. Revisa la condición y el decremento del while.` };
      }

      const prepLines = ["Preparando puesto... 3", "Preparando puesto... 2", "Preparando puesto... 1"];
      const missingPrep = prepLines.filter((l) => !output.includes(l));
      if (missingPrep.length > 0) {
        return { ok: false, message: `Falta la cuenta regresiva completa: ${missingPrep.join(", ")}. Revisa el while.` };
      }

      const productos = ["Poción", "Escudo", "Espada"];
      const precioBase = 15;
      const expectedTableLines = [];
      for (const producto of productos) {
        for (let cantidad = 1; cantidad <= 3; cantidad++) {
          const total = precioBase * cantidad;
          expectedTableLines.push(
            total > 40
              ? `${cantidad} x ${producto}: ${total} de oro — ¡Oferta especial!`
              : `${cantidad} x ${producto}: ${total} de oro`
          );
        }
      }
      const missingTable = expectedTableLines.filter((l) => !output.includes(l));
      if (missingTable.length > 0) {
        if (!output.includes("Oferta especial")) {
          return { ok: false, message: "No veo ninguna '¡Oferta especial!' en la salida — revisa la condición: if total > 40." };
        }
        if (missingTable.some((l) => l.includes("x Espada") || l.includes("x Escudo"))) {
          return { ok: false, message: "range(1, ___) en el ciclo de cantidad no llega hasta 3 — recuerda que el límite superior no se incluye: usa range(1, 4)." };
        }
        return { ok: false, message: `Faltan líneas en la tabla, por ejemplo: "${missingTable[0]}". Revisa la fórmula total = precio_base * cantidad.` };
      }

      if (vars.total !== 45) {
        return { ok: false, message: `Después de recorrer toda la tabla, total debería quedar en 45 (Espada x 3), pero quedó en ${showValue(vars.total)}.` };
      }

      return { ok: true, message: '¡Misión cumplida! "La Tabla del Mercader" cierra el Mundo 2.' };
    },
  },
];
