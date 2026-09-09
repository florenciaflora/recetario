const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

const app = require("../src/server.js");
const db = require("../src/database.js");

async function iniciarServidor() {
  const servidor = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => servidor.once("listening", resolve));
  const { port } = servidor.address();
  return { servidor, baseUrl: `http://127.0.0.1:${port}` };
}

async function crearUsuarioYToken(baseUrl, email) {
  const registro = await fetch(`${baseUrl}/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contrasena: "ClaveSegura123" }),
  });

  assert.equal(registro.status, 201, "El usuario debería registrarse correctamente");

  const login = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contrasena: "ClaveSegura123" }),
  });

  assert.equal(login.status, 200, "El usuario debería iniciar sesión correctamente");
  const loginJson = await login.json();
  return loginJson.token;
}

test("POST /recetas rechaza payload inválido con 400 y errores claros", async () => {
  const { servidor, baseUrl } = await iniciarServidor();
  const email = `qa-invalid-${Date.now()}@example.com`;
  const token = await crearUsuarioYToken(baseUrl, email);

  try {
    const respuesta = await fetch(`${baseUrl}/recetas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        porciones: 2,
        tiempoMinutos: 30,
        ingredientes: [{}],
      }),
    });

    assert.equal(respuesta.status, 400, "Debe devolver 400 para payload inválido");
    const payload = await respuesta.json();
    assert.ok(Array.isArray(payload.errores), "Debe devolver una lista de errores");
    assert.ok(payload.errores.some((error) => String(error).includes("nombre")), "Debe incluir el error del nombre");
  } finally {
    const usuario = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(email);
    if (usuario) db.prepare("DELETE FROM usuarios WHERE id = ?").run(usuario.id);
    await new Promise((resolve) => servidor.close(resolve));
  }
});

test("POST /recetas crea receta con ingredientes y pasos estructurados", async () => {
  const { servidor, baseUrl } = await iniciarServidor();
  const email = `qa-valid-${Date.now()}@example.com`;
  const token = await crearUsuarioYToken(baseUrl, email);

  try {
    const respuesta = await fetch(`${baseUrl}/recetas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre: "Tortilla de papa",
        porciones: 2,
        tiempoMinutos: 25,
        dificultad: "facil",
        ingredientes: [
          { nombre: "Papa", cantidad: 2, unidad: "unidad", notas: "grandes" },
          { nombre: "Huevo", cantidad: 3, unidad: "unidad" },
        ],
        pasos: [
          { descripcion: "Pelar y cortar las papas." },
          { descripcion: "Batir los huevos y mezclar." },
        ],
        categoria_id: 1,
        tiempo_preparacion: 10,
        tiempo_coccion: 15,
      }),
    });

    assert.equal(respuesta.status, 201, "Debe crear la receta correctamente");
    const payload = await respuesta.json();
    assert.equal(payload.nombre, "Tortilla de papa");
    assert.equal(payload.ingredientes.length, 2, "Debe guardar 2 ingredientes");
    assert.equal(payload.pasos.length, 2, "Debe guardar 2 pasos");
    assert.equal(payload.dificultad, "facil", "Debe guardar la dificultad");
    assert.equal(payload.tiempo_preparacion, 10, "Debe guardar el tiempo de preparación");
    assert.equal(payload.tiempo_coccion, 15, "Debe guardar el tiempo de cocción");
  } finally {
    const usuario = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(email);
    if (usuario) {
      db.prepare("DELETE FROM recetas WHERE usuario_id = ?").run(usuario.id);
      db.prepare("DELETE FROM usuarios WHERE id = ?").run(usuario.id);
    }
    await new Promise((resolve) => servidor.close(resolve));
  }
});