const db = require("./basedatos");

const recetas = db.prepare("SELECT id, imagen FROM recetas WHERE imagen LIKE '%unsplash%'").all();

const actualizar = db.prepare("UPDATE recetas SET imagen = ? WHERE id = ?");

for (const receta of recetas) {
  const urlChica = receta.imagen.includes("?")
    ? receta.imagen + "&w=400&q=80"
    : receta.imagen + "?w=400&q=80";

  actualizar.run(urlChica, receta.id);
}

console.log(`Se actualizaron ${recetas.length} imágenes a versión liviana.`);