const fs = require("fs");
const db = require("./basedatos");

const contenido = fs.readFileSync("recetas.json", "utf-8");
const recetas = JSON.parse(contenido);

const insertar = db.prepare(`
  INSERT INTO recetas (nombre, porciones, tiempoMinutos, ingredientes, esVegetariano, imagen)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const receta of recetas) {
  insertar.run(
    receta.nombre,
    receta.porciones,
    receta.tiempoMinutos,
    receta.ingredientes.join(","),
    receta.esVegetariano ? 1 : 0,
    receta.imagen || null,
  );
}

console.log(`Se migraron ${recetas.length} recetas a la base de datos.`);
