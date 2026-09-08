const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "recetario.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS recetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    porciones INTEGER NOT NULL,
    tiempoMinutos INTEGER NOT NULL,
    ingredientes TEXT NOT NULL,
    esVegetariano INTEGER NOT NULL,
    imagen TEXT
  )
`);

try {
  db.exec(`ALTER TABLE recetas ADD COLUMN usuario_id INTEGER`);
} catch (error) {
  // La columna ya existe, no hacemos nada
}

try {
  db.exec(`ALTER TABLE recetas ADD COLUMN acompanamiento TEXT`);
} catch (error) {}

try {
  db.exec(`ALTER TABLE recetas ADD COLUMN notas TEXT`);
} catch (error) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    contrasena TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS solicitudes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receta_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    fecha TEXT NOT NULL
  )
`);

module.exports = db;
