# Pythonia

Academia de Python gamificada para dos personas (estilo RPG), pensada como repaso de conceptos de programación: concatenación, ciclos, lectura/llenado de matrices y herencia.

## Estado actual

- **Fase: Plan y estructura** ✅ (ver `plan.html`)
- **Fase 1: Prototipo jugable del Mundo 1 (Los Cimientos)** ✅ — 5 lecciones jugables con editor de Python real (Pyodide) y XP básico
- **Fase 2: Progreso persistente (MongoDB)** ✅ — XP, lecciones completadas y respuestas de quiz se guardan por jugador en MongoDB Atlas, a través de un backend propio
- Fase 3: Mundos 2 a 4 completos — pendiente
- Fase 4: Insignias, racha y pulido temático RPG — pendiente

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

**Si el backend no está corriendo o Atlas no responde**, el juego lo indica con un aviso "⚠ sin conexión al servidor" arriba a la derecha, pero sigue siendo jugable — el progreso simplemente no se guarda hasta que la conexión vuelva.

## Contenido

- `plan.html` — documento completo del plan original: los 4 mundos, sistema de XP/niveles/insignias, anatomía de una lección de ejemplo, y la arquitectura técnica.
- `src/lessons.js` — contenido y validadores de las 5 lecciones del Mundo 1.
- `src/pyRunner.js` — envoltorio de Pyodide: ejecuta el código del alumno, simula `input()` con datos de prueba y captura la salida.
- `src/progress.js` — cliente HTTP hacia la API de progreso (`server/`).
- `src/main.js` — la aplicación: selector de jugador, mapa de mundos, vista de lección con editor (CodeMirror), pistas progresivas y quizzes.
- `src/style.css` — estilos, reutilizando la paleta visual de `plan.html`.
- `server/` — backend Express: única pieza que habla con MongoDB. Expone `GET/PUT /api/progress/:player` y `GET /api/health`.

## Enfoque técnico

Motor de código: Pyodide (Python compilado a WebAssembly) corriendo en el navegador de cada quien. Editor con CodeMirror 6.

El navegador nunca se conecta a MongoDB directamente (no es seguro ni posible con el driver estándar) — habla por HTTP con el backend en `server/`, que es el único que tiene el connection string de Atlas. El progreso de cada jugador (XP, lecciones completadas, respuestas de quiz, pistas reveladas) se guarda en una colección `players`, usando el nombre del jugador como identificador — no hay sistema de cuentas ni contraseñas, sigue siendo "Jugador 1" / "Jugador 2" al entrar.

## Próximo paso

Fase 3: construir los Mundos 2, 3 y 4 (ciclos, matrices, herencia) con el mismo formato de lección (Comprender → Recordar → Analizar → Aplicar → Crear) y sus misiones finales.
