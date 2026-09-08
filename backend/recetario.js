const receta1 = {
  // object (objeto, clave-valor)
  nombre: "Pollo al azafrán",
  porciones: 2,
  tiempoMinutos: 60,
  ingredientes: ["pollo", "crema", "azafran"],
  esVegetariano: false,
};

const receta2 = {
  // object (objeto, clave-valor)
  nombre: "Ramen",
  porciones: 2,
  tiempoMinutos: 45,
  ingredientes: ["caldo", "fideos", "cerdo", "huevo"],
  esVegetariano: false,
};

const receta3 = {
  // object (objeto, clave-valor)
  nombre: "Papas a la huancaina",
  porciones: 2,
  tiempoMinutos: 90,
  ingredientes: [
    "papas",
    "aji amarillo",
    "galletitas de agua",
    "queso fresco",
    "leche",
  ],
  esVegetariano: false,
};

const mostrarReceta = (receta) => {
  console.log(`${receta.nombre} - ${receta.tiempoMinutos} minutos`);
};

const esRapida = (receta) => {
  return receta.tiempoMinutos <= 30;
};

const recetas = [receta1, receta2, receta3];
for (const receta of recetas) {
  mostrarReceta(receta);
}

const rapidas = recetas.filter(esRapida);
console.log(rapidas);

const lentas = recetas.filter((receta) => receta.tiempoMinutos > 30);
console.log(lentas);

const nombresRecetas = recetas.map((receta) => receta.nombre);
console.log(nombresRecetas);

const ingredientesTotales = recetas.map((receta) => receta.ingredientes.length);
console.log(ingredientesTotales);

const totalMinutos = recetas.reduce((acumulador, receta) => {
  return acumulador + receta.tiempoMinutos;
}, 0);
console.log(totalMinutos);

const totalIngredientes = recetas.reduce((acumulador, receta) => {
  return acumulador + receta.ingredientes.length;
}, 0);
console.log(totalIngredientes);

const { nombre, ingredientes } = receta2;
console.log(nombre);
console.log(ingredientes);

const receta4 = {
  // object (objeto, clave-valor)
  nombre: "Curry japones",
  porciones: 2,
  tiempoMinutos: 20,
  ingredientes: ["papas", "zanahoria", "curry", "carne"],
  esVegetariano: false,
};

const recetasActualizadas = [...recetas, receta4];
console.log(recetasActualizadas.length);

const recetaConMasPorciones = { ...receta3, porciones: 6 };
console.log(recetaConMasPorciones);
