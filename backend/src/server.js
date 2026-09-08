require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./database");
const jwt = require("jsonwebtoken");
const { verificarToken } = require("./auth");

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function normalizarIngrediente(nombre) {
  return String(nombre || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*[,;] \s*/g, ", ");
}

function obtenerIngredientesDeReceta(recetaId) {
  const filas = db
    .prepare(`
      SELECT i.nombre
      FROM receta_ingredientes ri
      INNER JOIN ingredientes i ON i.id = ri.ingrediente_id
      WHERE ri.receta_id = ?
      ORDER BY ri.orden ASC, i.nombre ASC
    `)
    .all(recetaId);

  if (filas.length > 0) {
    return filas.map((fila) => fila.nombre);
  }

  const receta = db
    .prepare("SELECT ingredientes FROM recetas WHERE id = ?")
    .get(recetaId);

  if (!receta || !receta.ingredientes) {
    return [];
  }

  return String(receta.ingredientes)
    .split(",")
    .map((item) => normalizarIngrediente(item))
    .filter(Boolean);
}

function guardarIngredientesReceta(recetaId, ingredientes) {
  db.prepare("DELETE FROM receta_ingredientes WHERE receta_id = ?").run(recetaId);

  const lista = Array.isArray(ingredientes) ? ingredientes : [];

  for (let indice = 0; indice < lista.length; indice++) {
    const nombre = normalizarIngrediente(lista[indice]);

    if (!nombre) continue;

    const slug = String(nombre)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) continue;

    const ingredienteExistente = db
      .prepare("SELECT id FROM ingredientes WHERE slug = ?")
      .get(slug);

    let ingredienteId;

    if (ingredienteExistente) {
      ingredienteId = ingredienteExistente.id;
    } else {
      const creado = db
        .prepare("INSERT INTO ingredientes (nombre, slug) VALUES (?, ?)")
        .run(nombre, slug);

      ingredienteId = creado.lastInsertRowid;
    }

    db.prepare(`
      INSERT INTO receta_ingredientes (receta_id, ingrediente_id, orden)
      VALUES (?, ?, ?)
    `).run(recetaId, ingredienteId, indice + 1);
  }

  const receta = db.prepare("SELECT ingredientes FROM recetas WHERE id = ?").get(recetaId);

  if (receta) {
    db.prepare("UPDATE recetas SET ingredientes = ? WHERE id = ?").run(
      lista.map((item) => normalizarIngrediente(item)).filter(Boolean).join(","),
      recetaId,
    );
  }
}

function obtenerPasosDeReceta(recetaId) {
  return db
    .prepare(`
      SELECT id, orden, titulo, descripcion, imagen
      FROM pasos_preparacion
      WHERE receta_id = ?
      ORDER BY orden ASC
    `)
    .all(recetaId);
}

function guardarPasosReceta(recetaId, pasos) {
  if (!Array.isArray(pasos)) return;

  db.prepare("DELETE FROM pasos_preparacion WHERE receta_id = ?").run(recetaId);

  const insertarPaso = db.prepare(`
    INSERT INTO pasos_preparacion (receta_id, orden, titulo, descripcion, imagen)
    VALUES (?, ?, ?, ?, ?)
  `);

  pasos.forEach((paso, indice) => {
    const descripcion = String(paso?.descripcion || "").trim();

    if (!descripcion) return;

    insertarPaso.run(
      recetaId,
      indice + 1,
      String(paso.titulo || "").trim() || null,
      descripcion,
      String(paso.imagen || "").trim() || null,
    );
  });
}

const convertirFila = (fila) => ({
  ...fila,
  ingredientes: obtenerIngredientesDeReceta(fila.id),
  pasos: obtenerPasosDeReceta(fila.id),
  esVegetariano: Boolean(fila.esVegetariano),
});

app.get("/recetas", (req, res) => {
  const filas = db.prepare("SELECT * FROM recetas").all();
  res.json(filas.map(convertirFila));
});

app.get("/recetas/:id", (req, res) => {
  const fila = db.prepare("SELECT * FROM recetas WHERE id = ?").get(req.params.id);

  if (fila) {
    res.json(convertirFila(fila));
  } else {
    res.status(404).json({ mensaje: "Receta no encontrada" });
  }
});

app.get("/recetas/:id/solicitudes", verificarToken, (req, res) => {
  const receta = db.prepare("SELECT * FROM recetas WHERE id = ?").get(req.params.id);

  if (!receta) {
    return res.status(404).json({ mensaje: "Receta no encontrada" });
  }

  if (receta.usuario_id !== req.usuario.id) {
    return res.status(403).json({ mensaje: "Solo el dueño puede ver las solicitudes" });
  }

  const solicitudes = db.prepare("SELECT * FROM solicitudes WHERE receta_id = ?").all(req.params.id);
  res.json(solicitudes);
});

app.post("/recetas", verificarToken, (req, res) => {
  const {
    nombre,
    porciones,
    tiempoMinutos,
    ingredientes,
    esVegetariano,
    imagen,
    pasos,
  } = req.body;

  const insertar = db.prepare(`
    INSERT INTO recetas (nombre, porciones, tiempoMinutos, ingredientes, esVegetariano, imagen, usuario_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const resultado = insertar.run(
    nombre,
    porciones,
    tiempoMinutos,
    (Array.isArray(ingredientes) ? ingredientes : []).join(","),
    esVegetariano ? 1 : 0,
    imagen || null,
    req.usuario.id,
  );

  guardarIngredientesReceta(resultado.lastInsertRowid, ingredientes);
  guardarPasosReceta(resultado.lastInsertRowid, pasos);

  const nuevaReceta = db
    .prepare("SELECT * FROM recetas WHERE id = ?")
    .get(resultado.lastInsertRowid);

  res.status(201).json(convertirFila(nuevaReceta));
});

app.put("/recetas/:id", verificarToken, (req, res) => {
  const { nombre, porciones, tiempoMinutos, ingredientes, pasos } = req.body;

  const receta = db.prepare("SELECT * FROM recetas WHERE id = ?").get(req.params.id);

  if (!receta) {
    return res.status(404).json({ mensaje: "Receta no encontrada" });
  }

  if (receta.usuario_id !== req.usuario.id) {
    return res.status(403).json({ mensaje: "No podés editar una receta que no creaste" });
  }

  guardarIngredientesReceta(req.params.id, ingredientes);
  guardarPasosReceta(req.params.id, pasos);

  db.prepare(
    "UPDATE recetas SET nombre = ?, porciones = ?, tiempoMinutos = ?, ingredientes = ? WHERE id = ?",
  ).run(
    nombre,
    porciones,
    tiempoMinutos,
    Array.isArray(ingredientes) ? ingredientes.map((item) => normalizarIngrediente(item)).filter(Boolean).join(",") : "",
    req.params.id,
  );

  const recetaActualizada = db.prepare("SELECT * FROM recetas WHERE id = ?").get(req.params.id);
  res.json(convertirFila(recetaActualizada));
});

app.delete("/recetas/:id", verificarToken, (req, res) => {
  const receta = db.prepare("SELECT * FROM recetas WHERE id = ?").get(req.params.id);

  if (!receta) {
    return res.status(404).json({ mensaje: "Receta no encontrada" });
  }

  if (receta.usuario_id !== req.usuario.id) {
    return res.status(403).json({ mensaje: "No podés borrar una receta que no creaste" });
  }

  db.prepare("DELETE FROM recetas WHERE id = ?").run(req.params.id);
  res.status(200).json({ mensaje: "Receta eliminada" });
});

app.post("/solicitudes", verificarToken, (req, res) => {
  const { receta_id, motivo } = req.body;

  const receta = db.prepare("SELECT * FROM recetas WHERE id = ?").get(receta_id);

  if (!receta) {
    return res.status(404).json({ mensaje: "Receta no encontrada" });
  }

  const insertar = db.prepare(`
    INSERT INTO solicitudes (receta_id, usuario_id, motivo, estado, fecha)
    VALUES (?, ?, ?, 'pendiente', ?)
  `);

  const fecha = new Date().toISOString();
  const resultado = insertar.run(receta_id, req.usuario.id, motivo, fecha);
  const nuevaSolicitud = db.prepare("SELECT * FROM solicitudes WHERE id = ?").get(resultado.lastInsertRowid);

  res.status(201).json(nuevaSolicitud);
});

app.post("/registro", async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const hash = await bcrypt.hash(contrasena, 10);

    const insertar = db.prepare(
      "INSERT INTO usuarios (email, contrasena) VALUES (?, ?)",
    );

    insertar.run(email, hash);
    res.status(201).json({ mensaje: "Usuario creado correctamente" });
  } catch (error) {
    res.status(400).json({ mensaje: "No se pudo crear el usuario. ¿Ya existe ese email?" });
  }
});

app.post("/login", async (req, res) => {
  const { email, contrasena } = req.body;

  const usuario = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email);

  if (!usuario) {
    return res.status(401).json({ mensaje: "Email o contraseña incorrectos" });
  }

  const coincide = await bcrypt.compare(contrasena, usuario.contrasena);

  if (!coincide) {
    return res.status(401).json({ mensaje: "Email o contraseña incorrectos" });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  res.json({ mensaje: "Login exitoso", token });
});

if (require.main === module) {
  app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
  });
}

module.exports = app;
