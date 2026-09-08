const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "recetario.db"));

function columnExists(tableName, columnName) {
  const columnas = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columnas.some((columna) => columna.name === columnName);
}

function createTableIfMissing(sql) {
  db.exec(sql);
}

createTableIfMissing(`
  CREATE TABLE IF NOT EXISTS recetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER,
    dificultad TEXT CHECK (dificultad IN ('facil', 'media', 'dificil')) DEFAULT 'media',
    tiempo_preparacion INTEGER,
    tiempo_coccion INTEGER,
    porciones INTEGER NOT NULL,
    tiempoMinutos INTEGER,
    ingredientes TEXT,
    esVegetariano INTEGER DEFAULT 0,
    imagen TEXT,
    imagen_principal TEXT,
    slug TEXT,
    consejos TEXT,
    variaciones TEXT,
    etiquetas TEXT,
    usuario_id INTEGER,
    acompanamiento TEXT,
    notas TEXT
  )
`);

if (!columnExists("recetas", "usuario_id")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN usuario_id INTEGER`);
}

if (!columnExists("recetas", "acompanamiento")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN acompanamiento TEXT`);
}

if (!columnExists("recetas", "notas")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN notas TEXT`);
}

if (!columnExists("recetas", "descripcion")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN descripcion TEXT`);
}

if (!columnExists("recetas", "categoria_id")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN categoria_id INTEGER`);
}

if (!columnExists("recetas", "dificultad")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN dificultad TEXT CHECK (dificultad IN ('facil', 'media', 'dificil')) DEFAULT 'media'`);
}

if (!columnExists("recetas", "tiempo_preparacion")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN tiempo_preparacion INTEGER`);
}

if (!columnExists("recetas", "tiempo_coccion")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN tiempo_coccion INTEGER`);
}

if (!columnExists("recetas", "slug")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN slug TEXT`);
}

if (!columnExists("recetas", "imagen_principal")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN imagen_principal TEXT`);
}

if (!columnExists("recetas", "consejos")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN consejos TEXT`);
}

if (!columnExists("recetas", "variaciones")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN variaciones TEXT`);
}

if (!columnExists("recetas", "etiquetas")) {
  db.exec(`ALTER TABLE recetas ADD COLUMN etiquetas TEXT`);
}

createTableIfMissing(`
  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

createTableIfMissing(`
  CREATE TABLE IF NOT EXISTS ingredientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

createTableIfMissing(`
  CREATE TABLE IF NOT EXISTS receta_ingredientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receta_id INTEGER NOT NULL,
    ingrediente_id INTEGER NOT NULL,
    cantidad REAL,
    unidad TEXT,
    orden INTEGER NOT NULL DEFAULT 0,
    notas TEXT,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE RESTRICT,
    UNIQUE (receta_id, ingrediente_id, orden)
  )
`);

createTableIfMissing(`
  CREATE TABLE IF NOT EXISTS pasos_preparacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receta_id INTEGER NOT NULL,
    orden INTEGER NOT NULL,
    titulo TEXT,
    descripcion TEXT NOT NULL,
    imagen TEXT,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    UNIQUE (receta_id, orden)
  )
`);

createTableIfMissing(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    contrasena TEXT NOT NULL
  )
`);

createTableIfMissing(`
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
