// Contenido del Mundo 3 · Las Cuevas de las Matrices (ver plan.html)
// Mismo formato que Mundo 1 y 2: código inicial, variables esperadas, pistas y validador.

import { showValue } from "./helpers.js";

// Comparación profunda de listas (y listas de listas, para las matrices).
function sameArray(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((v, i) => (Array.isArray(v) ? sameArray(v, b[i]) : v === b[i]));
}

export const world = {
  id: "mundo-3",
  title: "Mundo 3 · Las Cuevas de las Matrices",
  target: "objetivo: lectura y llenado de matrices",
  badge: {
    title: "Cartógrafo de Matrices",
    description: "Completar Mundo 3",
  },
};

export const lessons = [
  {
    id: "listas-basico",
    num: 1,
    title: "Listas: crear, acceder, modificar",
    tag: "Reto · Mundo 3, lección 1",
    xp: 10,
    teach: {
      intro:
        "Una lista guarda varios valores en un solo lugar, en un orden fijo. Se crea con corchetes `[]`, separando los valores con comas. Cada elemento tiene una posición (índice) que empieza en 0, no en 1 — el primer elemento es `lista[0]`.\n\nTambién puedes usar índices negativos para contar desde el final: `lista[-1]` es el último elemento, `lista[-2]` el anteúltimo. Para cambiar un elemento, se le asigna un valor nuevo directamente por su índice: `lista[i] = nuevo_valor`. `len(lista)` te dice cuántos elementos tiene.",
      exampleHtml: `inventario = [<span class="str">"poción"</span>, <span class="str">"espada"</span>, <span class="str">"escudo"</span>]

print(inventario[0])        <span class="com"># poción (primer elemento, índice 0)</span>
print(inventario[-1])       <span class="com"># escudo (último elemento)</span>

inventario[1] = <span class="str">"arco"</span>       <span class="com"># reemplaza "espada" por "arco"</span>
print(inventario)           <span class="com"># ['poción', 'arco', 'escudo']</span>
print(len(inventario))      <span class="com"># 3</span>`,
    },
    check: {
      question: "En una lista llamada lista, ¿qué es lista[-1]?",
      options: [
        { text: "El primer elemento", correct: false },
        { text: "El último elemento", correct: true },
        { text: "Un error, los índices negativos no existen", correct: false },
      ],
      feedbackCorrect: "Correcto: los índices negativos cuentan desde el final, y -1 es siempre el último elemento.",
      feedbackIncorrect: "No es esa. Los índices negativos sí existen en Python y cuentan desde el final de la lista.",
    },
    analyze: {
      codeHtml: `numeros = [10, 20, 30, 40]
numeros[0] = 99
print(numeros[0], numeros[-1])`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "10 40", correct: false },
        { text: "99 40", correct: true },
        { text: "99 99", correct: false },
      ],
      explanation:
        "numeros[0] = 99 cambia solo el primer elemento (10 pasa a ser 99). numeros[-1] sigue siendo el último elemento, que nunca se tocó: 40. Por eso se imprime 99 40.",
    },
    bonus:
      "Agrega un cuarto objeto a la lista con inventario.append(...) (aunque todavía no lo hayas visto formalmente) e imprime la lista completa. Si da error, no pasa nada: lo vemos en la próxima lección.",
    brief:
      "Un explorador guarda su inventario en una lista. Reemplaza un objeto por otro, y guarda por separado el primero y el último objeto de la lista.",
    starterCode: `inventario = ["poción", "espada", "escudo"]

inventario[1] = ___     # reemplaza "espada" por "arco"
primero = ___            # el primer objeto de la lista
ultimo = ___              # el último objeto (usa el índice -1)

print(inventario)
print("Primero:", primero)
print("Último:", ultimo)
`,
    expectedVars: ["inventario", "primero", "ultimo"],
    expected: { vars: { inventario: ["poción", "arco", "escudo"], primero: "poción", ultimo: "escudo" } },
    hints: [
      'Para cambiar un elemento se asigna por índice: inventario[1] = "arco".',
      "primero es inventario[0] (índice 0), y ultimo es inventario[-1] (el índice negativo cuenta desde el final).",
    ],
    validate: ({ vars, output }) => {
      const expectedInventario = ["poción", "arco", "escudo"];
      if (!Array.isArray(vars.inventario)) {
        return { ok: false, message: `inventario quedó como ${showValue(vars.inventario)}, pero debe seguir siendo una lista.` };
      }
      if (!sameArray(vars.inventario, expectedInventario)) {
        if (vars.inventario[1] === "espada") {
          return { ok: false, message: 'inventario no cambió — falta la línea inventario[1] = "arco".' };
        }
        return {
          ok: false,
          message: `inventario debería quedar como ["poción", "arco", "escudo"], pero quedó como [${vars.inventario.map(showValue).join(", ")}].`,
        };
      }
      if (vars.primero !== "poción") {
        return { ok: false, message: `primero debería ser "poción" (inventario[0]), pero quedó como ${showValue(vars.primero)}.` };
      }
      if (vars.ultimo !== "escudo") {
        if (vars.ultimo === "arco") {
          return { ok: false, message: "ultimo dio el elemento del medio — usa el índice -1, no un índice positivo, para tomar el último." };
        }
        return { ok: false, message: `ultimo debería ser "escudo" (inventario[-1]), pero quedó como ${showValue(vars.ultimo)}.` };
      }
      if (!/Primero/.test(output) || !/Último/.test(output)) {
        return { ok: false, message: "Las variables están bien, pero no borres los print() finales." };
      }
      return { ok: true, message: "¡Inventario actualizado correctamente!" };
    },
  },

  {
    id: "metodos-listas",
    num: 2,
    title: "Métodos de listas: append, insert, remove",
    tag: "Reto · Mundo 3, lección 2",
    xp: 15,
    teach: {
      intro:
        "Las listas tienen métodos propios para cambiar su contenido sin tener que reasignar toda la lista. `.append(valor)` agrega un elemento al final. `.insert(posición, valor)` lo agrega justo en el índice que indiques, corriendo el resto hacia la derecha. `.remove(valor)` busca la primera aparición de ese valor exacto y la elimina — a diferencia de `lista[i]`, aquí no se usa un índice, sino el valor mismo.",
      exampleHtml: `mochila = [<span class="str">"poción"</span>, <span class="str">"cuerda"</span>]

mochila.append(<span class="str">"antorcha"</span>)     <span class="com"># agrega al final</span>
mochila.insert(1, <span class="str">"mapa"</span>)       <span class="com"># inserta "mapa" en la posición 1</span>
mochila.remove(<span class="str">"cuerda"</span>)        <span class="com"># elimina el valor "cuerda"</span>

print(mochila)   <span class="com"># ['poción', 'mapa', 'antorcha']</span>`,
    },
    check: {
      question: "¿Cuál es la diferencia entre .append(valor) y .insert(posición, valor)?",
      options: [
        { text: "append agrega siempre al final; insert agrega en la posición que le indiques", correct: true },
        { text: "Son exactamente lo mismo, solo cambia el nombre", correct: false },
        { text: "insert siempre agrega al principio de la lista", correct: false },
      ],
      feedbackCorrect: "Exacto: append no elige dónde (siempre al final), insert sí, según la posición que le des.",
      feedbackIncorrect: "No es esa. Piensa en cuál de los dos métodos te deja elegir la posición exacta donde va el nuevo valor.",
    },
    analyze: {
      codeHtml: `letras = ["a", "b", "c"]
letras.remove("b")
letras.insert(1, "z")
print(letras)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "['a', 'z', 'c']", correct: true },
        { text: "['a', 'b', 'z', 'c']", correct: false },
        { text: "['a', 'c', 'z']", correct: false },
      ],
      explanation:
        'remove("b") elimina la letra "b", dejando ["a", "c"]. Luego insert(1, "z") mete "z" en la posición 1, empujando a "c" un lugar a la derecha: ["a", "z", "c"].',
    },
    bonus:
      'Encadena una operación más: después de las tres líneas de arriba, usa .append("mapa") y observa en qué posición queda dentro de la lista.',
    brief:
      "El mercader actualiza su lista de productos: agrega uno nuevo al final, inserta una oferta especial en la segunda posición, y quita un producto descontinuado.",
    starterCode: `productos = ["poción", "escudo", "espada"]

productos.___("armadura")             # agrega "armadura" al final
productos.___(1, "oferta: casco")     # inserta "oferta: casco" en la posición 1
productos.___("espada")                # ya no la vende: quítala de la lista

print(productos)
`,
    expectedVars: ["productos"],
    expected: { vars: { productos: ["poción", "oferta: casco", "escudo", "armadura"] } },
    hints: [
      "Para agregar al final se usa .append(valor).",
      "Para insertar en una posición concreta: .insert(posición, valor). Para quitar un valor específico (no por índice): .remove(valor).",
    ],
    validate: ({ vars }) => {
      const expected = ["poción", "oferta: casco", "escudo", "armadura"];
      if (!Array.isArray(vars.productos)) {
        return { ok: false, message: `productos quedó como ${showValue(vars.productos)}, pero debe seguir siendo una lista.` };
      }
      if (vars.productos.includes("espada")) {
        return { ok: false, message: 'Todavía veo "espada" en la lista — falta productos.remove("espada").' };
      }
      if (!vars.productos.includes("armadura")) {
        return { ok: false, message: 'Falta agregar "armadura" al final con productos.append("armadura").' };
      }
      if (!vars.productos.includes("oferta: casco")) {
        return { ok: false, message: 'Falta insertar "oferta: casco" con productos.insert(1, "oferta: casco").' };
      }
      if (!sameArray(vars.productos, expected)) {
        if (vars.productos[0] === "oferta: casco") {
          return { ok: false, message: 'insert(1, "oferta: casco") debe insertar en la posición 1 (segundo lugar), no en la 0 (primer lugar).' };
        }
        return {
          ok: false,
          message: `productos debería quedar como ["poción", "oferta: casco", "escudo", "armadura"], pero quedó como [${vars.productos.map(showValue).join(", ")}]. Revisa el orden de las tres operaciones.`,
        };
      }
      return { ok: true, message: "¡Lista de productos actualizada!" };
    },
  },

  {
    id: "matrices-listas-de-listas",
    num: 3,
    title: "Matrices como listas de listas",
    tag: "Reto · Mundo 3, lección 3",
    xp: 15,
    teach: {
      intro:
        "Python no tiene un tipo especial para matrices: una matriz (una grilla de filas y columnas) se representa como una lista de listas — una lista donde cada elemento es, a su vez, otra lista (una fila).\n\nPara acceder a un elemento se usan dos índices seguidos: `matriz[fila][columna]`. El primer índice elige la fila (que es una lista), y el segundo elige el elemento dentro de esa fila. Si usas un solo índice, `matriz[fila]`, obtienes la fila entera.",
      exampleHtml: `tablero = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]

print(tablero[0])        <span class="com"># [1, 2, 3]   -> toda la primera fila</span>
print(tablero[1][2])     <span class="com"># 6           -> fila 1, columna 2</span>

tablero[2][0] = 100        <span class="com"># modifica un solo elemento</span>
print(tablero[2])        <span class="com"># [100, 8, 9]</span>`,
    },
    check: {
      question: "¿Cómo accedes al elemento de la fila 1, columna 2, de una matriz llamada grilla?",
      options: [
        { text: "grilla[1, 2]", correct: false },
        { text: "grilla[1][2]", correct: true },
        { text: "grilla[2][1]", correct: false },
      ],
      feedbackCorrect: "Correcto: dos índices seguidos, primero la fila y después la columna: grilla[1][2].",
      feedbackIncorrect: "No es esa. En Python los dos índices van en corchetes separados, y en el orden fila primero, columna después.",
    },
    analyze: {
      codeHtml: `grilla = [
    [0, 1],
    [2, 3],
]
grilla[0][1] = 9
print(grilla[0][1], grilla[1][0])`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "1 2", correct: false },
        { text: "9 2", correct: true },
        { text: "9 9", correct: false },
      ],
      explanation:
        "grilla[0][1] = 9 cambia solo esa celda (fila 0, columna 1), que pasa de 1 a 9. grilla[1][0] nunca se tocó, así que sigue siendo 2.",
    },
    bonus:
      "Agrega una cuarta fila a tablero (por ejemplo [10, 11, 12]) e imprime tablero[3][1]. No hace falta comprobarlo aquí, solo experimenta.",
    brief:
      "El templo tiene un mapa de 3x3 representado como matriz. Lee celdas específicas y desactiva una trampa modificando su valor.",
    starterCode: `mapa = [
    [0, 0, 1],
    [0, 1, 0],
    [1, 0, 0],
]

fila_del_medio = ___        # la fila completa del medio (índice 1)
celda_peligrosa = ___        # el valor en fila 0, columna 2
mapa[2][0] = ___              # desactiva esa trampa: cámbiala por un 0

print(fila_del_medio)
print(celda_peligrosa)
print(mapa)
`,
    expectedVars: ["mapa", "fila_del_medio", "celda_peligrosa"],
    expected: {
      vars: {
        mapa: [
          [0, 0, 1],
          [0, 1, 0],
          [0, 0, 0],
        ],
        fila_del_medio: [0, 1, 0],
        celda_peligrosa: 1,
      },
    },
    hints: [
      "Para tomar una fila completa, usa un solo índice: mapa[1]. Para un valor específico, usa dos índices: mapa[fila][columna].",
      "mapa[2][0] = 0 cambia solo esa celda; el resto de la matriz queda exactamente igual.",
    ],
    validate: ({ vars }) => {
      if (!Array.isArray(vars.fila_del_medio) || !sameArray(vars.fila_del_medio, [0, 1, 0])) {
        return { ok: false, message: `fila_del_medio debería ser [0, 1, 0] (mapa[1]), pero quedó como ${showValue(vars.fila_del_medio)}.` };
      }
      if (vars.celda_peligrosa !== 1) {
        return { ok: false, message: `celda_peligrosa debería ser 1 (mapa[0][2]), pero quedó como ${showValue(vars.celda_peligrosa)}.` };
      }
      const expectedMapa = [
        [0, 0, 1],
        [0, 1, 0],
        [0, 0, 0],
      ];
      if (!Array.isArray(vars.mapa) || !sameArray(vars.mapa, expectedMapa)) {
        if (Array.isArray(vars.mapa) && vars.mapa[2] && vars.mapa[2][0] === 1) {
          return { ok: false, message: "La trampa sigue activa — falta la línea mapa[2][0] = 0." };
        }
        return { ok: false, message: "mapa terminó con una forma distinta a la esperada — revisa que solo hayas cambiado la celda [2][0]." };
      }
      return { ok: true, message: "¡Trampa desactivada, mapa leído correctamente!" };
    },
  },

  {
    id: "llenado-recorrido-anidado",
    num: 4,
    title: "Llenado y recorrido con ciclos anidados",
    tag: "Reto · Mundo 3, lección 4",
    xp: 20,
    teach: {
      intro:
        "Para construir una matriz desde cero (en vez de escribirla a mano), se usan dos ciclos `for` anidados: el externo recorre las filas, y por cada fila, el interno construye sus columnas una por una con `.append(...)`. Cada fila nueva empieza como una lista vacía `[]` que se va llenando antes de agregarla a la matriz con `matriz.append(fila_nueva)`.\n\nPara recorrer (leer) una matriz ya existente se usa el mismo patrón: un for externo para las filas, y un for interno para los valores dentro de cada fila.",
      exampleHtml: `filas = 2
columnas = 3
matriz = []

<span class="kw">for</span> i <span class="kw">in</span> range(filas):
    fila_nueva = []
    <span class="kw">for</span> j <span class="kw">in</span> range(columnas):
        fila_nueva.append(i * columnas + j)
    matriz.append(fila_nueva)

print(matriz)          <span class="com"># [[0, 1, 2], [3, 4, 5]]</span>

<span class="com"># recorrer una matriz ya construida:</span>
<span class="kw">for</span> fila <span class="kw">in</span> matriz:
    <span class="kw">for</span> valor <span class="kw">in</span> fila:
        print(valor, end=<span class="str">" "</span>)`,
    },
    check: {
      question: "Para recorrer todos los valores de una matriz (lista de listas), ¿qué necesitas?",
      options: [
        { text: "Un solo ciclo for", correct: false },
        { text: "Dos ciclos for anidados: uno para las filas, otro para las columnas", correct: true },
        { text: "Un ciclo while, nunca un for", correct: false },
      ],
      feedbackCorrect: "Correcto: el for externo recorre cada fila, y el interno recorre los valores dentro de esa fila.",
      feedbackIncorrect: "No es esa. Una matriz tiene dos niveles (filas y columnas), así que hacen falta dos ciclos anidados para recorrerla por completo.",
    },
    analyze: {
      codeHtml: `matriz = []
<span class="kw">for</span> i <span class="kw">in</span> range(2):
    fila = []
    <span class="kw">for</span> j <span class="kw">in</span> range(2):
        fila.append(j)
    matriz.append(fila)
print(matriz)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "[[0, 1], [0, 1]]", correct: true },
        { text: "[[0, 0], [1, 1]]", correct: false },
        { text: "[0, 1, 0, 1]", correct: false },
      ],
      explanation:
        "Por cada vuelta del for externo (i), el for interno (j) construye una fila nueva desde cero: [0, 1]. Como esa misma lógica se repite igual para i=0 e i=1, las dos filas quedan idénticas: [[0, 1], [0, 1]].",
    },
    bonus:
      "Cambia el tamaño del tablero a 4x4 y observa cómo cambia la diagonal. No hace falta comprobarlo aquí, solo experimenta.",
    brief:
      "El templo necesita un tablero de 3x3 donde las casillas sagradas (la diagonal principal) valgan 1, y el resto valga 0.",
    starterCode: `tamano = 3
tablero = []

for fila in range(tamano):
    fila_nueva = []
    for columna in range(tamano):
        if fila == columna:
            fila_nueva.append(___)      # casilla sagrada: 1
        else:
            fila_nueva.append(___)      # casilla vacía: 0
    tablero.append(fila_nueva)

print(tablero)
`,
    expectedVars: ["tablero"],
    expected: {
      vars: {
        tablero: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
      },
    },
    hints: [
      "En la diagonal (cuando fila == columna) va 1; en cualquier otro caso va 0.",
      "No cambies la estructura de los ciclos — solo completa los dos valores que se agregan con append().",
    ],
    validate: ({ vars }) => {
      const expected = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      if (!Array.isArray(vars.tablero)) {
        return { ok: false, message: `tablero quedó como ${showValue(vars.tablero)}, pero debe ser una lista de listas.` };
      }
      if (sameArray(vars.tablero, [[0, 0, 0], [0, 0, 0], [0, 0, 0]])) {
        return { ok: false, message: "El tablero quedó todo en 0 — falta poner 1 en el caso if fila == columna." };
      }
      if (!sameArray(vars.tablero, expected)) {
        return {
          ok: false,
          message: "El tablero no coincide con lo esperado: la diagonal (fila == columna) debe llevar 1, y el resto 0.",
        };
      }
      return { ok: true, message: "¡Tablero construido con la diagonal sagrada marcada!" };
    },
  },

  {
    id: "mision-final-tablero-templo",
    num: 5,
    final: true,
    title: 'Misión final: "El Tablero del Templo"',
    tag: "Misión final · Mundo 3",
    xp: 45,
    teach: {
      intro:
        "Esta misión junta todo el Mundo 3: manejar una lista con sus métodos (append, insert, remove), construir una matriz con ciclos anidados, modificar una celda por índice, y recorrer la matriz completa para contar cosas y encontrar algo específico.\n\nSi te trabas, repasa las lecciones 1 a 4: cada pieza ya la usaste por separado, aquí solo se encadenan una detrás de otra.",
      exampleHtml: `mochila = [<span class="str">"cuerda"</span>]
mochila.append(<span class="str">"llave"</span>)
mochila.remove(<span class="str">"cuerda"</span>)

matriz = []
<span class="kw">for</span> i <span class="kw">in</span> range(2):
    fila = []
    <span class="kw">for</span> j <span class="kw">in</span> range(2):
        fila.append(0)
    matriz.append(fila)
matriz[0][0] = 9

encontrados = 0
<span class="kw">for</span> fila <span class="kw">in</span> matriz:
    <span class="kw">for</span> valor <span class="kw">in</span> fila:
        <span class="kw">if</span> valor == 9:
            encontrados = encontrados + 1
print(encontrados)   <span class="com"># 1</span>`,
    },
    check: {
      question: "¿Cuál es el orden correcto para revisar todos los valores de una matriz mientras buscas uno en particular?",
      options: [
        { text: "Dos for anidados, y dentro del más interno, un if que compare el valor", correct: true },
        { text: "Un solo if fuera de cualquier ciclo", correct: false },
        { text: "No se puede buscar dentro de una matriz, solo modificar celdas conocidas", correct: false },
      ],
      feedbackCorrect: "Exacto: los ciclos anidados recorren cada celda, y el if adentro decide qué hacer con cada valor.",
      feedbackIncorrect: "No es esa. Para revisar todas las celdas de una matriz hacen falta dos for anidados, con la comparación dentro del más interno.",
    },
    analyze: {
      codeHtml: `matriz = [[1, 0], [0, 1]]
total = 0
<span class="kw">for</span> fila <span class="kw">in</span> matriz:
    <span class="kw">for</span> valor <span class="kw">in</span> fila:
        <span class="kw">if</span> valor == 1:
            total = total + 1
print(total)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "2", correct: true },
        { text: "1", correct: false },
        { text: "4", correct: false },
      ],
      explanation:
        "El recorrido pasa por las 4 celdas de la matriz: 1, 0, 0, 1. De esas, dos valen exactamente 1 (la primera y la última), así que total termina en 2.",
    },
    bonus:
      "Agrega una segunda trampa en otra posición de la matriz y ajusta el conteo — ¿cuántas trampas encuentra ahora el explorador?",
    brief:
      'Antes de entrar al templo, el explorador prepara su mochila. Luego se construye un tablero de 3x3 con trampas en la diagonal, se marca un tesoro en una celda concreta, y se recorre todo el tablero para contar las trampas y ubicar el tesoro.',
    starterCode: `# Misión final: El Tablero del Templo

# 1. Mochila: prepara el equipo antes de entrar
mochila = ["antorcha", "cuerda"]
mochila.___("llave")              # agrega "llave" al final
mochila.___(1, "mapa")             # inserta "mapa" en la posición 1
mochila.___("cuerda")               # ya no la necesita: quítala

# 2. Tablero 3x3: las trampas van en la diagonal (1), el resto en 0
tamano = 3
tablero = []
for fila in range(tamano):
    fila_nueva = []
    for columna in range(tamano):
        if fila == columna:
            fila_nueva.append(___)     # trampa
        else:
            fila_nueva.append(___)     # casilla vacía
    tablero.append(fila_nueva)

# El tesoro está escondido en la fila 0, columna 2
tablero[0][2] = ___    # marca el tesoro con un 9

# 3. Recorre el tablero contando trampas y anotando dónde está el tesoro
trampas = 0
fila_tesoro = -1
columna_tesoro = -1
for fila in range(tamano):
    for columna in range(tamano):
        valor = tablero[fila][columna]
        if valor == 1:
            trampas = trampas ___ 1
        elif valor == 9:
            fila_tesoro = fila
            columna_tesoro = columna

print("Mochila final:", mochila)
print("Tablero:", tablero)
print(f"Trampas encontradas: {trampas}")
print(f"Tesoro en fila {fila_tesoro}, columna {columna_tesoro}")
`,
    expectedVars: ["mochila", "tablero", "trampas", "fila_tesoro", "columna_tesoro"],
    expected: {
      vars: {
        mochila: ["antorcha", "mapa", "llave"],
        tablero: [
          [1, 0, 9],
          [0, 1, 0],
          [0, 0, 1],
        ],
        trampas: 3,
        fila_tesoro: 0,
        columna_tesoro: 2,
      },
    },
    hints: [
      'La mochila se arma igual que en la lección de métodos: append("llave") al final, insert(1, "mapa") en la posición 1, remove("cuerda") para quitarla.',
      "El tablero se llena igual que en la lección anterior (1 en la diagonal, 0 en el resto), y luego tablero[0][2] = 9 marca el tesoro. En el conteo, trampas = trampas + 1 sube de a uno cada vez que valor == 1.",
    ],
    validate: ({ vars, output }) => {
      const expectedMochila = ["antorcha", "mapa", "llave"];
      if (!Array.isArray(vars.mochila) || !sameArray(vars.mochila, expectedMochila)) {
        if (Array.isArray(vars.mochila) && vars.mochila.includes("cuerda")) {
          return { ok: false, message: 'Todavía veo "cuerda" en la mochila — falta mochila.remove("cuerda").' };
        }
        return {
          ok: false,
          message: `La mochila debería quedar como ["antorcha", "mapa", "llave"], pero quedó como ${Array.isArray(vars.mochila) ? "[" + vars.mochila.map(showValue).join(", ") + "]" : showValue(vars.mochila)}.`,
        };
      }

      const expectedTablero = [
        [1, 0, 9],
        [0, 1, 0],
        [0, 0, 1],
      ];
      if (!Array.isArray(vars.tablero) || !sameArray(vars.tablero, expectedTablero)) {
        return { ok: false, message: "El tablero no coincide con lo esperado — revisa la diagonal (1), la casilla vacía (0) y el tesoro en fila 0, columna 2 (9)." };
      }

      if (vars.trampas !== 3) {
        return { ok: false, message: `trampas debería ser 3 (hay tres 1 en la diagonal), pero quedó en ${showValue(vars.trampas)}. Revisa: trampas = trampas + 1.` };
      }
      if (vars.fila_tesoro !== 0 || vars.columna_tesoro !== 2) {
        return {
          ok: false,
          message: `El tesoro debería quedar ubicado en fila 0, columna 2, pero quedó en fila ${showValue(vars.fila_tesoro)}, columna ${showValue(vars.columna_tesoro)}.`,
        };
      }
      if (!/Trampas encontradas: 3/.test(output) || !/Tesoro en fila 0, columna 2/.test(output)) {
        return { ok: false, message: "Los valores están bien, pero no borres los print() finales del reporte." };
      }
      return { ok: true, message: '¡Misión cumplida! "El Tablero del Templo" cierra el Mundo 3.' };
    },
  },
];
