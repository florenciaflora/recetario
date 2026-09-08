require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./basedatos");
const jwt = require("jsonwebtoken");

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const convertirFila = (fila) => ({
  ...fila,
  ingredientes: fila.ingredientes.split(","),
  esVegetariano: Boolean(fila.esVegetariano),
});

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ mensaje: "No se envió token de autenticación" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datos;
    next();
  } catch (error) {
    res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
};

app.get("/recetas", (req, res) => {
  const filas = db.prepare("SELECT * FROM recetas").all();
  res.json(filas.map(convertirFila));
});

app.get("/recetas/:id", (req, res) => {
  const fila = db
    .prepare("SELECT * FROM recetas WHERE id = ?")
    .get(req.params.id);

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
  } = req.body;

  const insertar = db.prepare(`
    INSERT INTO recetas (nombre, porciones, tiempoMinutos, ingredientes, esVegetariano, imagen, usuario_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const resultado = insertar.run(
    nombre,
    porciones,
    tiempoMinutos,
    ingredientes.join(","),
    esVegetariano ? 1 : 0,
    imagen || null,
    req.usuario.id,
  );

  const nuevaReceta = db
    .prepare("SELECT * FROM recetas WHERE id = ?")
    .get(resultado.lastInsertRowid);
  res.status(201).json(convertirFila(nuevaReceta));
});

app.put("/recetas/:id", verificarToken, (req, res) => {
  const { nombre, porciones, tiempoMinutos, ingredientes } = req.body;

  const receta = db.prepare("SELECT * FROM recetas WHERE id = ?").get(req.params.id);

  if (!receta) {
    return res.status(404).json({ mensaje: "Receta no encontrada" });
  }

  if (receta.usuario_id !== req.usuario.id) {
    return res.status(403).json({ mensaje: "No podés editar una receta que no creaste" });
  }

  db.prepare(
    "UPDATE recetas SET nombre = ?, porciones = ?, tiempoMinutos = ?, ingredientes = ? WHERE id = ?"
  ).run(nombre, porciones, tiempoMinutos, ingredientes.join(","), req.params.id);

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
    res
      .status(400)
      .json({ mensaje: "No se pudo crear el usuario. ¿Ya existe ese email?" });
  }
});

app.post("/login", async (req, res) => {
  const { email, contrasena } = req.body;

  const usuario = db
    .prepare("SELECT * FROM usuarios WHERE email = ?")
    .get(email);

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

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
