import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Falta MONGODB_URI en server/.env — copia server/.env.example a server/.env y pon tu connection string de Atlas."
  );
}

// Timeouts cortos a propósito: si Atlas no responde, prefiero que el
// frontend se entere en unos segundos (y siga funcionando en memoria)
// en vez de quedarse "conectando…" hasta 30s, que es el default del driver.
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
});
let dbPromise = null;

// Conecta una sola vez y reutiliza la misma conexión en todas las rutas.
// Si la conexión falla (ej. Atlas caído, URI mala), se limpia para que el
// siguiente request pueda reintentar en vez de quedar atascado.
export function getDb() {
  if (!dbPromise) {
    dbPromise = client.connect().then(
      (c) => c.db("pythonia"),
      (err) => {
        dbPromise = null;
        throw err;
      }
    );
  }
  return dbPromise;
}
