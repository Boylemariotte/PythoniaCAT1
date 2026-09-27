# Pythonia

Academia de Python gamificada (estilo RPG), pensada como repaso de conceptos de programación: concatenación, ciclos, lectura/llenado de matrices y herencia.

## Estado actual

- **Fase: Plan y estructura** ✅ (ver `plan.html`)
- **Fase 1: Prototipo jugable del Mundo 1 (Los Cimientos)** ✅ — editor de Python real (Pyodide) y XP
- **Fase 2: Progreso persistente (MongoDB)** ✅ — XP, lecciones completadas, respuestas de quiz y pistas reveladas se guardan en MongoDB Atlas, a través de un backend propio
- **Fase 3: Mundos 2, 3 y 4 completos** ✅ — 20 lecciones jugables en total, 5 por mundo (4 lecciones + misión final), con el formato Comprender → Recordar → Analizar → Aplicar → Crear
- **Fase 3.5: Ayudas para aprender del error** ✅ — comparación de salida esperada vs. la tuya, errores de Python traducidos al español y visualizador de ejecución paso a paso (ver [Ayudas de aprendizaje](#ayudas-de-aprendizaje))
- Fase 4: Insignias por logros, racha diaria y pulido temático RPG — pendiente

### Mundos

| Mundo | Tema | Lecciones |
| --- | --- | --- |
| 1 · Los Cimientos | Variables, operadores, concatenación y f-strings, `input()`/`print()` | 5 |
| 2 · El Bosque de los Ciclos | `if`/`elif`/`else`, `while`, `for` y `range()`, `break`/`continue` y ciclos anidados | 5 |
| 3 · Las Cuevas de las Matrices | Listas, métodos de listas, matrices, llenado y recorrido con ciclos anidados | 5 |
| 4 · La Torre de las Clases | Clases y objetos, `__init__`, herencia, sobrescritura de métodos | 5 |

Cada mundo termina con una misión final y una insignia. Hay 8 niveles según el XP acumulado (de *Aprendiz Errante* a *Maestro de Pythonia*).

> **Nota:** por ahora todos los mundos están desbloqueados para poder probarlos. Para volver al orden secuencial, revierte `isWorldUnlocked` en `src/main.js` (hay un comentario `TEMPORAL` que indica cómo).

## Cómo correrlo

Son dos piezas: el frontend (Vite, siempre necesario) y el backend (Node/Express + MongoDB, necesario solo si quieres que el progreso se guarde).

### 1. Backend (guarda el progreso en MongoDB)

```
cd server
npm install
cp .env.example .env
```

Abre `server/.env` y pon tu connection string real de MongoDB Atlas en `MONGODB_URI` (Atlas → Database → Connect → Drivers, copia la URI y reemplaza `<password>` por tu contraseña).

```
npm run dev
```

Debe imprimir `Pythonia API escuchando en http://localhost:4000`.

### 2. Frontend

En otra terminal, desde la raíz del proyecto:

```
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto `http://localhost:5173`).

Por defecto el frontend habla con `http://localhost:4000`. Para apuntar a otro backend (por ejemplo el desplegado), copia `.env.example` a `.env` y ajusta `VITE_API_BASE`.

**Si el backend no está corriendo o Atlas no responde**, el juego lo indica con un aviso "⚠ sin conexión al servidor" arriba a la derecha, pero sigue siendo jugable — el progreso simplemente no se guarda hasta que la conexión vuelva.

## Ayudas de aprendizaje

Tres herramientas pensadas para que equivocarse enseñe algo, en vez de solo decir "incorrecto".

### Salida esperada vs. la tuya

Cuando el código corre sin errores pero no pasa la comprobación, debajo de la consola aparece una tabla lado a lado:

- **Lecciones que imprimen algo:** la salida esperada frente a la tuya, línea por línea, marcando en rojo las que difieren y contando cuántas líneas faltan o sobran.
- **Lecciones que dejan valores en variables:** cada variable con el valor esperado y el que quedó, con ✓ o ✗ (las listas y matrices se muestran como las imprimiría Python).

Cada lección lo activa declarando un campo `expected` (ver [Agregar contenido](#agregar-contenido)). Está definido en las lecciones con salida o valores deterministas; el resto sigue mostrando solo el mensaje del validador.

### Errores de Python en español

Si el código lanza una excepción, en lugar del traceback en inglés se muestra un panel con:

- el tipo de error con nombre en español (por ejemplo «Posición fuera de rango» para `IndexError`),
- **la línea exacta** donde ocurrió, con su texto,
- una explicación en lenguaje simple y una pista para arreglarlo,
- el mensaje original de Python, plegado, por si se quiere ver.

Cubre `SyntaxError`, `IndentationError`, `NameError`, `TypeError` (sumar texto con número, comparar tipos distintos, argumentos de más o de menos, etc.), `IndexError`, `KeyError`, `ValueError`, `AttributeError`, `ZeroDivisionError`, recursión infinita y el corte propio de bucles infinitos. También detecta cuando queda un `___` sin completar del código inicial, que es el error más común en las lecciones.

### Visualizador de ejecución paso a paso

El botón **🔍 Ver paso a paso** (en cada lección y en el editor libre) abre una ventana estilo Python Tutor que ejecuta el código y permite recorrerlo línea por línea:

- el código con la **línea actual resaltada**,
- las **variables** de las variables globales y de cada función en curso; las que cambian en un paso se resaltan,
- **listas** como casillas con su índice, **matrices** como una cuadrícula con índices de fila y columna,
- **objetos** como una caja con sus atributos y su relación de **herencia** (por ejemplo «Dragon hereda de Criatura»), y las clases definidas con su clase padre,
- la **salida impresa** hasta ese punto, con lo nuevo resaltado,
- si el programa termina con un error, el último paso muestra la línea que falló junto con la explicación en español.

Controles: anterior/siguiente, reproducir con tres velocidades, un deslizador para saltar a cualquier paso, y atajos de teclado (← → para moverse, Espacio para reproducir/pausar, Esc para cerrar). Para no bloquear el navegador guarda como máximo 2500 pasos y corta cualquier programa que ejecute más de 200 000 líneas.

En las lecciones que usan `input()`, el visualizador usa los mismos datos de prueba que la comprobación; en el editor libre pide los datos con una ventana emergente.

## Estructura del proyecto

- `plan.html` — documento completo del plan original: los 4 mundos, sistema de XP/niveles/insignias, anatomía de una lección de ejemplo, y la arquitectura técnica.
- `src/main.js` — la aplicación: mapa de mundos, vista de lección con editor (CodeMirror), pistas progresivas, quizzes, editor libre y niveles.
- `src/worlds/` — el contenido: `mundo1.js` a `mundo4.js` (lecciones, código inicial, pistas y validadores), `helpers.js` (utilidades compartidas por los validadores) e `index.js` (orden de los mundos).
- `src/pyRunner.js` — envoltorio de Pyodide: ejecuta el código del alumno, simula `input()` con datos de prueba, captura la salida y corta bucles infinitos.
- `src/pyErrors.js` — traducción de errores de Python al español y panel de error.
- `src/compare.js` — tablas de «esperado vs. tuyo».
- `src/tracer.js` — motor del visualizador: ejecuta el código con `sys.settrace` y registra el estado en cada paso.
- `src/stepper.js` — interfaz del visualizador paso a paso.
- `src/progress.js` — cliente HTTP hacia la API de progreso (`server/`).
- `src/style.css` — estilos, reutilizando la paleta visual de `plan.html`.
- `server/` — backend Express: única pieza que habla con MongoDB. Expone `GET/PUT /api/progress/:player` y `GET /api/health`.
- `libros/` — material de referencia (PDF) usado como base del contenido.

## Agregar contenido

Cada lección es un objeto en `src/worlds/mundoN.js`. Además de `teach`, `check`, `analyze`, `brief`, `starterCode`, `expectedVars`, `hints` y `validate`, puede declarar opcionalmente:

```js
expected: {
  output: "línea 1\nlínea 2",          // salida impresa esperada, línea por línea
  vars: { total: 306, alcanza: false }, // valor final esperado de cada variable
},
```

- Las variables de `expected.vars` deben estar también en `expectedVars`, que es la lista que el ejecutor lee del intérprete al terminar.
- Una lección puede declarar `output`, `vars`, ambos o ninguno.
- Si la lección usa `input()`, define `simulatedInputs`: los mismos datos se usan en la comprobación y en el visualizador.

## Enfoque técnico

Motor de código: Pyodide (Python compilado a WebAssembly) corriendo en el navegador de cada quien. Editor con CodeMirror 6.

El navegador nunca se conecta a MongoDB directamente (no es seguro ni posible con el driver estándar) — habla por HTTP con el backend en `server/`, que es el único que tiene el connection string de Atlas. El progreso del jugador (XP, lecciones completadas, respuestas de quiz, pistas reveladas) se guarda en una colección `players`, usando el nombre del jugador como identificador — no hay sistema de cuentas ni contraseñas.

## Próximo paso

Fase 4: racha diaria, insignias por logros (no solo por mundo), barra de progreso hacia el siguiente nivel y animaciones al subir de nivel.
