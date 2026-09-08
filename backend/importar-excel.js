const XLSX = require("xlsx");
const db = require("./basedatos");

const libro = XLSX.readFile("Recetas.xlsx");
const hoja = libro.Sheets[libro.SheetNames[0]];
const filas = XLSX.utils.sheet_to_json(hoja, { header: 1 });

const TU_USUARIO_ID = 1; // vamos a confirmar este número en el siguiente paso

const insertar = db.prepare(`
  INSERT INTO recetas (nombre, porciones, tiempoMinutos, ingredientes, esVegetariano, imagen, usuario_id, acompanamiento, notas)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let contador = 0;

for (const fila of filas) {
  const [nombre, acompanamiento, notas] = fila;

  if (!nombre || nombre === "-") continue;

  insertar.run(
    nombre,
    2,
    30,
    "",
    0,
    null,
    TU_USUARIO_ID,
    acompanamiento === "-" ? null : acompanamiento,
    notas === "-" ? null : notas
  );

  contador++;
}

console.log(`Se importaron ${contador} recetas desde el Excel.`);