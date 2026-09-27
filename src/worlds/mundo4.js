// Contenido del Mundo 4 · La Torre de las Clases (ver plan.html)
// Mismo formato que los mundos anteriores: código inicial, pistas y validador.
// Los objetos de clases propias no se convierten de forma confiable a valores
// de JS al cruzar Pyodide, así que aquí los validadores se apoyan sobre todo
// en la salida impresa (output) y en revisar el código fuente, en vez de leer
// atributos de instancias directamente.

import { showValue } from "./helpers.js";

export const world = {
  id: "mundo-4",
  title: "Mundo 4 · La Torre de las Clases",
  target: "objetivo: herencia y POO",
  badge: {
    title: "Arquitecto de Clases",
    description: "Completar Mundo 4",
  },
};

export const lessons = [
  {
    id: "clases-y-objetos",
    num: 1,
    title: "Clases y objetos",
    tag: "Reto · Mundo 4, lección 1",
    xp: 15,
    teach: {
      intro:
        "Una clase es un molde para crear objetos: define qué métodos (funciones propias) va a tener cada objeto que se cree a partir de ella. Se declara con `class Nombre:`, y cada método dentro de la clase recibe automáticamente un primer parámetro llamado `self`, que representa al objeto concreto sobre el que se llamó ese método.\n\nCrear un objeto (una instancia) a partir de una clase se hace igual que llamar a una función: `objeto = Nombre()`. Puedes crear tantos objetos como quieras a partir de la misma clase, y cada uno es independiente de los demás.",
      exampleHtml: `<span class="kw">class</span> Explorador:
    <span class="kw">def</span> saludar(self):
        print(<span class="str">"¡Hola, soy un explorador!"</span>)

ada = Explorador()     <span class="com"># ada es un objeto (instancia) de Explorador</span>
ada.saludar()

luna = Explorador()    <span class="com"># otro objeto distinto, de la misma clase</span>
luna.saludar()`,
    },
    check: {
      question: "¿Qué es un objeto en relación a una clase?",
      options: [
        { text: "Una instancia concreta creada a partir del molde de esa clase", correct: true },
        { text: "Otro nombre para una función normal", correct: false },
        { text: "Una copia del código fuente de la clase", correct: false },
      ],
      feedbackCorrect: "Correcto: la clase es el molde, y cada objeto es una instancia concreta hecha con ese molde.",
      feedbackIncorrect: "No es esa. Piensa en la clase como un molde de galletas, y en cada objeto como una galleta concreta hecha con ese molde.",
    },
    analyze: {
      codeHtml: `<span class="kw">class</span> Gato:
    <span class="kw">def</span> maullar(self):
        print(<span class="str">"Miau"</span>)

michi = Gato()
michi.maullar()
michi.maullar()`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "Miau", correct: false },
        { text: "Miau\nMiau", correct: true },
        { text: "Error: la clase necesita un __init__", correct: false },
      ],
      explanation:
        "michi es un objeto de la clase Gato, y se llama a su método maullar() dos veces seguidas — cada llamada imprime \"Miau\" por separado, así que el mensaje aparece dos veces.",
    },
    bonus:
      "Agrega un segundo método a Mascota, por ejemplo dormir(), e imprime algo distinto cuando lo llames sobre perro y sobre gato.",
    brief:
      "Crea la clase Mascota con un método hacer_sonido(), y crea dos objetos distintos de esa clase, llamando al método sobre cada uno.",
    starterCode: `class Mascota:
    def hacer_sonido(self):
        print("¡Soy una mascota genérica!")

perro = ___          # crea un objeto de la clase Mascota
gato = ___             # crea otro objeto de la clase Mascota

perro.___()            # llama a hacer_sonido() sobre perro
gato.___()              # llama a hacer_sonido() sobre gato
`,
    expectedVars: [],
    hints: [
      "Crear un objeto se hace como llamar a una función: perro = Mascota().",
      "Llamar a un método sobre un objeto se hace con un punto: perro.hacer_sonido().",
    ],
    validate: ({ code, output }) => {
      if (!/perro\s*=\s*Mascota\(\)/.test(code)) {
        return { ok: false, message: "perro debe crearse como un objeto de la clase Mascota: perro = Mascota()." };
      }
      if (!/gato\s*=\s*Mascota\(\)/.test(code)) {
        return { ok: false, message: "gato debe crearse como un objeto de la clase Mascota: gato = Mascota()." };
      }
      const occurrences = (output.match(/¡Soy una mascota genérica!/g) || []).length;
      if (occurrences < 2) {
        return {
          ok: false,
          message: `Solo veo el mensaje ${occurrences} vez(es) en la salida — llama a .hacer_sonido() tanto en perro como en gato.`,
        };
      }
      return { ok: true, message: "¡Dos mascotas, cada una como su propio objeto!" };
    },
  },

  {
    id: "atributos-init",
    num: 2,
    title: "Atributos, métodos y __init__",
    tag: "Reto · Mundo 4, lección 2",
    xp: 15,
    teach: {
      intro:
        "`__init__` es un método especial que Python llama automáticamente cada vez que se crea un objeto nuevo — es el lugar donde se prepara ese objeto con sus datos iniciales. Dentro de `__init__` (y de cualquier otro método), `self.nombre_de_atributo = valor` guarda un dato que pertenece específicamente a ese objeto: es un atributo.\n\nCada objeto tiene su propia copia de los atributos: si creas dos objetos con datos distintos, cada uno recuerda los suyos por separado, sin mezclarse con los del otro.",
      exampleHtml: `<span class="kw">class</span> Personaje:
    <span class="kw">def</span> __init__(self, nombre, vida):
        self.nombre = nombre
        self.vida = vida

    <span class="kw">def</span> presentarse(self):
        print(<span class="str">f"Soy {self.nombre}, con {self.vida} de vida"</span>)

ada = Personaje(<span class="str">"Ada"</span>, 100)
ada.presentarse()             <span class="com"># Soy Ada, con 100 de vida</span>

luna = Personaje(<span class="str">"Luna"</span>, 80)
luna.presentarse()            <span class="com"># Soy Luna, con 80 de vida</span>`,
    },
    check: {
      question: "¿Cuándo se ejecuta el método __init__ de una clase?",
      options: [
        { text: "Automáticamente, cada vez que se crea un objeto de esa clase", correct: true },
        { text: "Solo si lo llamas explícitamente, como a cualquier otro método", correct: false },
        { text: "Cada vez que se llama a cualquier método del objeto", correct: false },
      ],
      feedbackCorrect: "Correcto: __init__ se dispara solo, en el momento exacto en que el objeto se crea con Clase(...).",
      feedbackIncorrect: "No es esa. __init__ es especial: se ejecuta una sola vez, justo cuando el objeto nace.",
    },
    analyze: {
      codeHtml: `<span class="kw">class</span> Cofre:
    <span class="kw">def</span> __init__(self, monedas):
        self.monedas = monedas

c1 = Cofre(50)
c2 = Cofre(120)
print(c1.monedas + c2.monedas)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "170", correct: true },
        { text: "50120", correct: false },
        { text: "Error: monedas no existe todavía", correct: false },
      ],
      explanation:
        "c1 y c2 son dos objetos distintos, cada uno con su propio atributo monedas guardado por su propio __init__: c1.monedas es 50 y c2.monedas es 120. La suma es 170.",
    },
    bonus:
      "Agrega un tercer parámetro a Guerrero, por ejemplo defensa, guárdalo como atributo, y úsalo para reducir el daño en atacar(). No hace falta comprobarlo aquí.",
    brief:
      "Crea la clase Guerrero con __init__ que reciba nombre y fuerza, los guarde como atributos, y un método atacar() que calcule e imprima el daño (el doble de la fuerza).",
    starterCode: `class Guerrero:
    def __init__(self, nombre, fuerza):
        self.nombre = ___          # guarda el nombre recibido
        self.fuerza = ___           # guarda la fuerza recibida

    def atacar(self):
        dano = self.fuerza ___ 2    # el daño es el doble de la fuerza
        print(f"{self.nombre} ataca causando {dano} de daño")

conan = Guerrero("Conan", 15)
conan.atacar()
`,
    expectedVars: [],
    hints: [
      "Dentro de __init__, cada parámetro se guarda como atributo con self: self.nombre = nombre y self.fuerza = fuerza.",
      "El daño es el doble de la fuerza: dano = self.fuerza * 2.",
    ],
    validate: ({ code, output }) => {
      if (!/self\.nombre\s*=\s*nombre/.test(code)) {
        return { ok: false, message: "Dentro de __init__, guarda el nombre recibido: self.nombre = nombre." };
      }
      if (!/self\.fuerza\s*=\s*fuerza/.test(code)) {
        return { ok: false, message: "Dentro de __init__, guarda la fuerza recibida: self.fuerza = fuerza." };
      }
      if (!output.includes("Conan ataca causando 30 de daño")) {
        if (output.includes("Conan ataca causando 15 de daño")) {
          return { ok: false, message: "El ataque salió igual a la fuerza — falta multiplicar por 2: dano = self.fuerza * 2." };
        }
        return { ok: false, message: 'No veo el mensaje esperado — debería imprimir: "Conan ataca causando 30 de daño".' };
      }
      return { ok: true, message: "¡Guerrero listo para atacar!" };
    },
  },

  {
    id: "herencia",
    num: 3,
    title: "Herencia: clases padre e hijas",
    tag: "Reto · Mundo 4, lección 3",
    xp: 20,
    teach: {
      intro:
        "La herencia deja que una clase (la hija) reciba automáticamente todos los atributos y métodos de otra clase (la padre), sin tener que volver a escribirlos. Se declara poniendo el nombre de la clase padre entre paréntesis: `class Hija(Padre):`.\n\nLa clase hija puede quedarse tal cual (heredando todo sin cambios) o agregar sus propios métodos nuevos, además de los que ya trae heredados. Si la hija no define su propio `__init__`, usa automáticamente el `__init__` de la clase padre.",
      exampleHtml: `<span class="kw">class</span> Animal:
    <span class="kw">def</span> __init__(self, nombre):
        self.nombre = nombre

    <span class="kw">def</span> hacer_sonido(self):
        print(<span class="str">f"{self.nombre} hace un sonido"</span>)

<span class="kw">class</span> Perro(Animal):        <span class="com"># Perro hereda de Animal</span>
    <span class="kw">def</span> jugar(self):
        print(<span class="str">f"{self.nombre} juega con la pelota"</span>)

rex = Perro(<span class="str">"Rex"</span>)
rex.hacer_sonido()      <span class="com"># heredado de Animal</span>
rex.jugar()               <span class="com"># propio de Perro</span>`,
    },
    check: {
      question: "¿Qué gana una clase hija al heredar de una clase padre?",
      options: [
        { text: "Todos los atributos y métodos del padre, más los que agregue ella misma", correct: true },
        { text: "Solo el nombre de la clase padre, nada más", correct: false },
        { text: "Nada automático: hay que reescribir todo de nuevo en la hija", correct: false },
      ],
      feedbackCorrect: "Exacto: la herencia le da a la hija todo lo del padre gratis, y encima puede sumar lo suyo.",
      feedbackIncorrect: "No es esa. El punto central de la herencia es justamente no tener que reescribir lo que ya existe en el padre.",
    },
    analyze: {
      codeHtml: `<span class="kw">class</span> Vehiculo:
    <span class="kw">def</span> __init__(self, ruedas):
        self.ruedas = ruedas

<span class="kw">class</span> Auto(Vehiculo):
    pass

mi_auto = Auto(4)
print(mi_auto.ruedas)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "4", correct: true },
        { text: "Error: Auto no tiene su propio __init__", correct: false },
        { text: "None", correct: false },
      ],
      explanation:
        "Auto no define su propio __init__, así que hereda tal cual el de Vehiculo. Al crear Auto(4), ese 4 se guarda en self.ruedas igual que si fuera un Vehiculo, así que mi_auto.ruedas es 4.",
    },
    bonus:
      "Agrega una segunda clase hija, Pajaro(Animal), con su propio método volar(). Crea un objeto y llama tanto a hacer_sonido() (heredado) como a volar() (propio).",
    brief:
      "Crea la clase padre Animal con __init__(nombre) y un método hacer_sonido(). Luego crea la clase hija Gato, que herede de Animal y agregue su propio método ronronear().",
    starterCode: `class Animal:
    def __init__(self, nombre):
        self.nombre = nombre

    def hacer_sonido(self):
        print(f"{self.nombre} hace un sonido")

class Gato(___):               # Gato hereda de Animal
    def ronronear(self):
        print(f"{self.nombre} ronronea felizmente")

michi = Gato("Michi")
michi.hacer_sonido()            # heredado de Animal
michi.___()                      # propio de Gato
`,
    expectedVars: [],
    hints: [
      "Para heredar, el nombre de la clase padre va entre paréntesis: class Gato(Animal):",
      "El método propio de Gato se llama igual que se definió: michi.ronronear().",
    ],
    validate: ({ code, output }) => {
      if (!/class\s+Gato\s*\(\s*Animal\s*\)\s*:/.test(code)) {
        return { ok: false, message: "Gato debe heredar de Animal: class Gato(Animal):" };
      }
      if (!output.includes("Michi hace un sonido")) {
        return { ok: false, message: "No veo \"Michi hace un sonido\" — revisa que se llame a michi.hacer_sonido() (heredado de Animal)." };
      }
      if (!output.includes("Michi ronronea felizmente")) {
        return { ok: false, message: "Falta llamar a michi.ronronear(), el método propio de Gato." };
      }
      return { ok: true, message: "¡Gato hereda de Animal y suma su propio método!" };
    },
  },

  {
    id: "sobrescritura-metodos",
    num: 4,
    title: "Sobrescritura de métodos",
    tag: "Reto · Mundo 4, lección 4",
    xp: 20,
    teach: {
      intro:
        "Una clase hija puede sobrescribir un método heredado: si define un método con el mismo nombre que uno del padre, la versión de la hija es la que se usa para sus objetos, reemplazando por completo el comportamiento original.\n\nEsto permite que distintas clases hijas respondan de forma distinta al mismo nombre de método — cada objeto ejecuta la versión que le corresponde según su propia clase, aunque todas se llamen igual desde afuera.",
      exampleHtml: `<span class="kw">class</span> Animal:
    <span class="kw">def</span> hacer_sonido(self):
        print(<span class="str">"El animal hace un sonido genérico"</span>)

<span class="kw">class</span> Perro(Animal):
    <span class="kw">def</span> hacer_sonido(self):              <span class="com"># sobrescribe al del padre</span>
        print(<span class="str">"El perro ladra: ¡Guau!"</span>)

<span class="kw">class</span> Gato(Animal):
    <span class="kw">def</span> hacer_sonido(self):
        print(<span class="str">"El gato maúlla: ¡Miau!"</span>)

animales = [Animal(), Perro(), Gato()]
<span class="kw">for</span> animal <span class="kw">in</span> animales:
    animal.hacer_sonido()
<span class="com"># El animal hace un sonido genérico
# El perro ladra: ¡Guau!
# El gato maúlla: ¡Miau!</span>`,
    },
    check: {
      question: "¿Qué significa que una clase hija 'sobrescriba' un método del padre?",
      options: [
        { text: "Que define un método con el mismo nombre, reemplazando el comportamiento heredado", correct: true },
        { text: "Que borra ese método del padre para todas las clases que existan", correct: false },
        { text: "Que ya no puede usar ningún otro método heredado del padre", correct: false },
      ],
      feedbackCorrect: "Correcto: sobrescribir es dar una nueva versión del método, solo para los objetos de esa clase hija.",
      feedbackIncorrect: "No es esa. Sobrescribir no afecta al padre ni a otras clases — solo cambia el comportamiento para los objetos de esa hija en particular.",
    },
    analyze: {
      codeHtml: `<span class="kw">class</span> Figura:
    <span class="kw">def</span> area(self):
        return 0

<span class="kw">class</span> Cuadrado(Figura):
    <span class="kw">def</span> __init__(self, lado):
        self.lado = lado
    <span class="kw">def</span> area(self):
        return self.lado * self.lado

f = Cuadrado(4)
print(f.area())`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "16", correct: true },
        { text: "0", correct: false },
        { text: "Error: area() está duplicado", correct: false },
      ],
      explanation:
        "Cuadrado sobrescribe area(), así que f.area() usa esa versión (self.lado * self.lado = 4 * 4 = 16), no la del padre Figura (que siempre devolvía 0).",
    },
    bonus:
      "Agrega una tercera clase hija, Esqueleto(Enemigo), con su propio atacar(), y agrégala a la lista enemigos para que también participe del ciclo.",
    brief:
      "Crea la clase padre Enemigo con un método atacar() genérico. Luego crea Mago, que herede de Enemigo y sobrescriba atacar() con su propio ataque mágico.",
    starterCode: `class Enemigo:
    def atacar(self):
        print("El enemigo ataca de forma genérica")

class Mago(___):                    # Mago hereda de Enemigo
    def atacar(self):                # sobrescribe el método del padre
        print(___)                    # imprime: "El mago lanza una bola de fuego"

enemigos = [Enemigo(), Mago()]
for enemigo in enemigos:
    enemigo.___()
`,
    expectedVars: [],
    hints: [
      "Mago hereda igual que en la lección anterior: class Mago(Enemigo):",
      'Dentro del atacar() de Mago, imprime exactamente: "El mago lanza una bola de fuego". Y dentro del for, llama a enemigo.atacar().',
    ],
    validate: ({ code, output }) => {
      if (!/class\s+Mago\s*\(\s*Enemigo\s*\)\s*:/.test(code)) {
        return { ok: false, message: "Mago debe heredar de Enemigo: class Mago(Enemigo):" };
      }
      const expectedLines = ["El enemigo ataca de forma genérica", "El mago lanza una bola de fuego"];
      const actualLines = output
        .trim()
        .split("\n")
        .filter((l) => l.length > 0);
      if (actualLines.join("\n") === expectedLines.join("\n")) {
        return { ok: true, message: "¡Cada enemigo ataca a su manera, gracias a la sobrescritura!" };
      }
      if (!output.includes(expectedLines[0])) {
        return { ok: false, message: "Falta llamar a enemigo.atacar() dentro del for para el primer enemigo de la lista." };
      }
      if (!output.includes(expectedLines[1])) {
        return { ok: false, message: 'El atacar() de Mago debe imprimir exactamente: "El mago lanza una bola de fuego".' };
      }
      return { ok: false, message: `La salida no coincide con lo esperado:\n${expectedLines.join("\n")}` };
    },
  },

  {
    id: "mision-final-bestiario",
    num: 5,
    final: true,
    title: 'Misión final: "El Bestiario"',
    tag: "Misión final · Mundo 4",
    xp: 50,
    teach: {
      intro:
        "Esta misión junta todo el Mundo 4: una clase padre con __init__ y atributos, dos clases hijas que heredan de ella y sobrescriben un método, una lista de objetos de distintas clases, y un ciclo que llama al mismo método sobre cada uno — cada objeto responde a su manera, según su propia clase.\n\nSi te trabas, repasa las lecciones 2 a 4: el truco está en encadenar las mismas piezas que ya usaste por separado.",
      exampleHtml: `<span class="kw">class</span> Criatura:
    <span class="kw">def</span> __init__(self, nombre):
        self.nombre = nombre
    <span class="kw">def</span> atacar(self):
        print(<span class="str">f"{self.nombre} ataca de forma genérica"</span>)

<span class="kw">class</span> Fantasma(Criatura):
    <span class="kw">def</span> atacar(self):
        print(<span class="str">f"{self.nombre} atraviesa paredes y asusta"</span>)

criaturas = [Criatura(<span class="str">"Sombra"</span>), Fantasma(<span class="str">"Wisp"</span>)]
<span class="kw">for</span> criatura <span class="kw">in</span> criaturas:
    criatura.atacar()`,
    },
    check: {
      question: "En una lista con objetos de distintas clases hijas, ¿qué pasa al llamar al mismo método sobre cada uno en un for?",
      options: [
        { text: "Cada objeto ejecuta su propia versión del método, según su clase", correct: true },
        { text: "Todos ejecutan exactamente la misma versión del método, la del padre", correct: false },
        { text: "Da error, porque los objetos son de clases distintas", correct: false },
      ],
      feedbackCorrect: "Correcto: cada objeto usa la versión del método que le corresponde a su propia clase (sobrescrita o heredada).",
      feedbackIncorrect: "No es esa. Justamente la ventaja de sobrescribir métodos es que cada clase hija responde a su manera al mismo nombre de método.",
    },
    analyze: {
      codeHtml: `<span class="kw">class</span> Personaje:
    <span class="kw">def</span> __init__(self, vida):
        self.vida = vida

<span class="kw">class</span> Elfo(Personaje):
    pass

grupo = [Personaje(30), Elfo(50)]
total = 0
<span class="kw">for</span> p <span class="kw">in</span> grupo:
    total = total + p.vida
print(total)`,
      question: "¿Qué imprime este código?",
      options: [
        { text: "80", correct: true },
        { text: "30", correct: false },
        { text: "Error: Elfo no tiene __init__ propio", correct: false },
      ],
      explanation:
        "Elfo no define su propio __init__, así que hereda el de Personaje sin cambios. Ambos objetos tienen un atributo vida válido (30 y 50), y la suma da 80.",
    },
    bonus:
      "Agrega una tercera criatura a bestiario, con su propia clase hija y su propio atacar(), y ajusta a mano cuánto debería dar vida_total con ese cambio.",
    brief:
      "Crea la clase padre Criatura con __init__(nombre, vida). Luego Dragon y Golem, que hereden de Criatura y sobrescriban atacar() cada uno a su manera. Recorre una lista con instancias de las tres clases, sumando la vida total del bestiario.",
    starterCode: `# Misión final: El Bestiario

class Criatura:
    def __init__(self, nombre, vida):
        self.nombre = ___          # guarda el nombre
        self.vida = ___             # guarda la vida

    def atacar(self):
        print(f"{self.nombre} ataca de forma genérica")

class Dragon(___):                  # Dragon hereda de Criatura
    def atacar(self):                # sobrescribe el ataque
        print(f"{self.nombre} escupe fuego causando 30 de daño")

class Golem(___):                    # Golem también hereda de Criatura
    def atacar(self):
        print(f"{self.nombre} lanza un puñetazo de piedra causando 20 de daño")

bestiario = [
    Dragon("Fafnir", 150),
    Golem("Roca Viviente", 200),
    Criatura("Sombra", 50),
]

vida_total = 0
for criatura in bestiario:
    criatura.___()                   # cada criatura ataca a su manera
    vida_total = vida_total ___ criatura.vida

print(f"Vida total del bestiario: {vida_total}")
`,
    expectedVars: ["vida_total"],
    hints: [
      "Dentro de __init__ de Criatura: self.nombre = nombre y self.vida = vida. Dragon y Golem heredan escribiendo Criatura entre paréntesis.",
      "Dentro del for: criatura.atacar() llama al ataque de cada una (genérico o sobrescrito, según su clase), y vida_total = vida_total + criatura.vida acumula la suma.",
    ],
    validate: ({ vars, code, output }) => {
      if (!/self\.nombre\s*=\s*nombre/.test(code)) {
        return { ok: false, message: "Dentro de __init__ de Criatura, guarda el nombre: self.nombre = nombre." };
      }
      if (!/self\.vida\s*=\s*vida/.test(code)) {
        return { ok: false, message: "Dentro de __init__ de Criatura, guarda la vida: self.vida = vida." };
      }
      if (!/class\s+Dragon\s*\(\s*Criatura\s*\)\s*:/.test(code)) {
        return { ok: false, message: "Dragon debe heredar de Criatura: class Dragon(Criatura):" };
      }
      if (!/class\s+Golem\s*\(\s*Criatura\s*\)\s*:/.test(code)) {
        return { ok: false, message: "Golem debe heredar de Criatura: class Golem(Criatura):" };
      }

      const expectedLines = [
        "Fafnir escupe fuego causando 30 de daño",
        "Roca Viviente lanza un puñetazo de piedra causando 20 de daño",
        "Sombra ataca de forma genérica",
      ];
      const missing = expectedLines.filter((l) => !output.includes(l));
      if (missing.length > 0) {
        if (!/criatura\.\w+\(\)/.test(code)) {
          return { ok: false, message: "Dentro del for, llama al ataque de cada criatura: criatura.atacar()." };
        }
        return { ok: false, message: `Falta en la salida: ${missing.join(", ")}.` };
      }

      if (vars.vida_total !== 400) {
        if (typeof vars.vida_total !== "number") {
          return { ok: false, message: `vida_total quedó como ${showValue(vars.vida_total)} — revisa: vida_total = vida_total + criatura.vida.` };
        }
        if (vars.vida_total === 0) {
          return { ok: false, message: "vida_total nunca cambió — falta la línea vida_total = vida_total + criatura.vida dentro del for." };
        }
        return { ok: false, message: `vida_total debería ser 400 (150 + 200 + 50), pero quedó en ${vars.vida_total}.` };
      }
      if (!/Vida total del bestiario: 400/.test(output)) {
        return { ok: false, message: "vida_total está bien, pero no borres el print() final del reporte." };
      }
      return { ok: true, message: '¡Misión cumplida! "El Bestiario" cierra el Mundo 4 — y Pythonia completa (por ahora).' };
    },
  },
];
