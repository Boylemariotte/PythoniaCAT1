import "dotenv/config";
import express from "express";
import cors from "cors";
import { getDb } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

function slugify(player) {
  return String(player).trim().toLowerCase().replace(/\s+/g, "-");
}

function emptyProgress(player) {
  return {
    _id: slugify(player),
    player,
    xp: 0,
    completed: [],
    quizAnswers: {},
    revealedHints: {},
  };
}

app.get("/api/health", async (req, res) => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Progreso de un jugador. Como la app no tiene cuentas, el "id" es el
// nombre del jugador (Jugador 1 / Jugador 2) convertido a slug.
app.get("/api/progress/:player", async (req, res) => {
  try {
    const db = await getDb();
    const id = slugify(req.params.player);
    const doc = await db.collection("players").findOne({ _id: id });
    res.json(doc || emptyProgress(req.params.player));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/progress/:player", async (req, res) => {
  try {
    const db = await getDb();
    const id = slugify(req.params.player);
    const { xp, completed, quizAnswers, revealedHints } = req.body;
    await db.collection("players").updateOne(
      { _id: id },
      {
        $set: {
          player: req.params.player,
          xp: Number(xp) || 0,
          completed: Array.isArray(completed) ? completed : [],
          quizAnswers: quizAnswers && typeof quizAnswers === "object" ? quizAnswers : {},
          revealedHints: revealedHints && typeof revealedHints === "object" ? revealedHints : {},
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Pythonia API escuchando en http://localhost:${PORT}`);
});
