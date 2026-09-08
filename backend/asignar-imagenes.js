require("dotenv").config();
const db = require("./basedatos");

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const buscarImagen = async (query) => {
  const respuesta = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
    {
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`,
      },
    }
  );

  const datos = await respuesta.json();

  if (datos.results && datos.results.length > 0) {
    return datos.results[0].urls.regular;
  }
  return null;
};

const asignarImagenes = async () => {
  const recetas = db.prepare("SELECT id, nombre FROM recetas WHERE imagen IS NULL OR imagen = ''").all();

  console.log(`Buscando imágenes para ${recetas.length} recetas...`);

  for (const receta of recetas) {
    const url = await buscarImagen(receta.nombre + " comida plato");

    if (url) {
      db.prepare("UPDATE recetas SET imagen = ? WHERE id = ?").run(url, receta.id);
      console.log(`✓ ${receta.nombre}`);
    } else {
      console.log(`✗ No se encontró imagen para: ${receta.nombre}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  console.log("¡Listo!");
};

asignarImagenes();