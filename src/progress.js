// Cliente para la API de progreso (server/index.js), que es la única pieza
// que habla con MongoDB. El frontend nunca se conecta a la base de datos
// directamente.

export const API_BASE = "http://localhost:4000";

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchProgress(player) {
  const res = await fetch(`${API_BASE}/api/progress/${encodeURIComponent(player)}`);
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  return res.json();
}

export async function saveProgress(player, { xp, completed, quizAnswers, revealedHints }) {
  const res = await fetch(`${API_BASE}/api/progress/${encodeURIComponent(player)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ xp, completed, quizAnswers, revealedHints }),
  });
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
}
