const db = require("../src/database");

function normalizarSlug(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asegurarCategoriaBase() {
  const existente = db
    .prepare("SELECT id FROM categorias WHERE slug = ?")
    .get("sin-categoria");

  if (!existente) {
    db.prepare(`
      INSERT INTO categorias (nombre, slug)
      VALUES ('Sin categoría', 'sin-categoria')
    `).run();
  }
}

function migrarIngredientes() {
  const recetas = db.prepare("SELECT id, ingredientes FROM recetas").all();

  for (const receta of recetas) {
    const lista = String(receta.ingredientes || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    for (let index = 0; index < lista.length; index++) {
      const nombre = lista[index];
      const slug = normalizarSlug(nombre);

      if (!slug) continue;

      const ingredienteExistente = db
        .prepare("SELECT id FROM ingredientes WHERE slug = ?")
        .get(slug);

      let ingredienteId;

      if (ingredienteExistente) {
        ingredienteId = ingredienteExistente.id;
      } else {
        const insert = db
          .prepare("INSERT INTO ingredientes (nombre, slug) VALUES (?, ?)")
          .run(nombre, slug);

        ingredienteId = insert.lastInsertRowid;
      }

      db.prepare(`
        INSERT OR IGNORE INTO receta_ingredientes (receta_id, ingrediente_id, orden)
        VALUES (?, ?, ?)
      `).run(receta.id, ingredienteId, index + 1);
    }
  }
}

function verificarMigracion() {
  const countRecetas = db.prepare("SELECT COUNT(*) AS total FROM recetas").get();
  const countIngredientes = db.prepare("SELECT COUNT(*) AS total FROM ingredientes").get();
  const countRelaciones = db.prepare("SELECT COUNT(*) AS total FROM receta_ingredientes").get();

  console.log("Recetas:", countRecetas.total);
  console.log("Ingredientes:", countIngredientes.total);
  console.log("Relaciones receta_ingredientes:", countRelaciones.total);

  const recetasSinRelaciones = db.prepare(`
    SELECT r.id, r.nombre
    FROM recetas r
    LEFT JOIN receta_ingredientes ri ON ri.receta_id = r.id
    WHERE ri.id IS NULL
  `).all();

  console.log("Recetas sin ingredientes relacionados:", recetasSinRelaciones.length);
  if (recetasSinRelaciones.length > 0) {
    console.table(recetasSinRelaciones.slice(0, 10));
  }
}

asegurarCategoriaBase();
migrarIngredientes();
verificarMigracion();

console.log("Migración completada.");
