type NivelDificultad = "fácil" | "medio" | "difícil";

interface Receta {
  nombre: string;
  porciones: number;
  tiempoMinutos: number;
  ingredientes: string[];
  esVegetariano: boolean;
  dificultad: NivelDificultad;
  notas?: string;
}

const receta1: Receta = {
  nombre: "Pollo al azafrán",
  porciones: 2,
  tiempoMinutos: 60,
  ingredientes: ["pollo", "crema", "azafran"],
  esVegetariano: false,
  dificultad: "fácil",
  notas: "Usar 1 capsula para 2 porciones",
};

const receta2: Receta = {
  nombre: "Ramen",
  porciones: 2,
  tiempoMinutos: 45,
  ingredientes: ["caldo", "fideos"],
  esVegetariano: false,
  dificultad: "difícil",
};

const receta3: Receta = {
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
  dificultad: "fácil",
};

const mostrarReceta = (receta: Receta): void => {
  console.log(`${receta.nombre} - ${receta.tiempoMinutos} minutos`);
};

const esRapida = (receta: Receta): boolean => {
  return receta.tiempoMinutos <= 30;
};

const recetas: Receta[] = [receta1, receta2, receta3];

const rapidas = recetas.filter(esRapida);
console.log(rapidas);

const primerElemento = <T>(lista: T[]): T | undefined => {
  return lista[0];
};

const primeraReceta = primerElemento(recetas);
if (primeraReceta) {
  console.log(primeraReceta.nombre);
}

const nombres = ["Ramen", "Curry", "Pasta"];

const primerNombre = primerElemento(nombres);
if (primerNombre) {
  console.log(primerNombre.toUpperCase());
}

const buscarPorNombre = <T extends { nombre: string }>(
  lista: T[],
  nombre: string,
): T | undefined => {
  const encontrado = lista.find(
    (item: T) => item.nombre.toLowerCase() === nombre.toLowerCase(),
  );
  return encontrado;
};
console.log(buscarPorNombre(recetas, "ramen"));
