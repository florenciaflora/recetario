require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./database");
const jwt = require("jsonwebtoken");
const { verificarToken } = require("./auth");

const app = express();
const PUERTO = process.env.PORT || 3000;

const DIFICULTADES_VALIDAS = new Set(["facil", "media", "dificil"]);

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

function normalizarSlug(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizarDificultad(valor) {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }

  const texto = String(valor).trim().toLowerCase();
  return DIFICULTADES_VALIDAS.has(texto) ? texto : null;
}

function normalizarBooleano(valor) {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }

  if (typeof valor === "boolean") return valor;

  if (typeof valor === "number") {
    if (valor === 0 || valor === 1) return Boolean(valor);
    return null;
  }

  if (typeof valor === "string") {
    const texto = valor.trim().toLowerCase();
    if (["true", "1", "yes", "si"].includes(texto)) return true;
    if (["false", "0", "no"].includes(texto)) return false;
  }

  return null;
}

function normalizarIngredientesEntrada(ingredientes) {
  if (!Array.isArray(ingredientes)) {
    return { error: "Los ingredientes deben ser una lista" };
  }

  const normalizados = [];

  for (const ingrediente of ingredientes) {
    const datos = typeof ingrediente === "string"
      ? { nombre: ingrediente }
      : ingrediente || {};
    const nombre = normalizarIngrediente(datos.nombre);

    if (!nombre) {
      return { error: "Cada ingrediente debe tener un nombre" };
    }

    const cantidad = datos.cantidad === undefined || datos.cantidad === null || datos.cantidad === ""
      ? null
      : Number(datos.cantidad);

    if (cantidad !== null && (!Number.isFinite(cantidad) || cantidad < 0)) {
      return { error: `Cantidad inválida para ${nombre}` };
    }

    normalizados.push({
      nombre,
      cantidad,
      unidad: String(datos.unidad || "").trim() || null,
      notas: String(datos.notas || "").trim() || null,
    });
  }

  return { ingredientes: normalizados };
}

function validarDatosReceta(datos, { parcial = false } = {}) {
  const errores = [];

  if (!parcial || datos.nombre !== undefined) {
    if (typeof datos.nombre !== "string" || !datos.nombre.trim()) {
      errores.push("El nombre es obligatorio");
    }
  }

  for (const campo of ["porciones", "tiempoMinutos", "tiempo_preparacion", "tiempo_coccion"]) {
    if (datos[campo] !== undefined && datos[campo] !== null) {
      const valor = Number(datos[campo]);
      if (!Number.isInteger(valor) || valor < 0) {
        errores.push(`${campo} debe ser un entero mayor o igual a cero`);
      }
    }
  }

  if (!parcial || datos.ingredientes !== undefined) {
    const resultado = normalizarIngredientesEntrada(datos.ingredientes);
    if (resultado.error) errores.push(resultado.error);
  }

  if (datos.categoria_id !== undefined && datos.categoria_id !== null && datos.categoria_id !== "") {
    const categoriaId = Number(datos.categoria_id);
    if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
      errores.push("La categoría indicada no es válida");
    }
  }

  if (datos.esVegetariano !== undefined) {
    const valor = normalizarBooleano(datos.esVegetariano);
    if (valor === null) {
      errores.push("esVegetariano debe ser un valor booleano");
    }
  }

  if (datos.pasos !== undefined) {
    if (!Array.isArray(datos.pasos)) {
      errores.push("Los pasos deben ser una lista");
    } else if (datos.pasos.some((paso) => !paso || typeof paso.descripcion !== "string" || !paso.descripcion.trim())) {
      errores.push("Cada paso debe tener una descripción");
    }
  }

  if (datos.dificultad !== undefined) {
    const dificultad = normalizarDificultad(datos.dificultad);
    if (dificultad === null) {
      errores.push("La dificultad debe ser facil, media o dificil");
    }
  }

  return errores;
}

function obtenerIngredientesDeReceta(recetaId) {
  const filas = db
    .prepare(`
      SELECT i.id, i.nombre, ri.cantidad, ri.unidad, ri.notas
      FROM receta_ingredientes ri
      INNER JOIN ingredientes i ON i.id = ri.ingrediente_id
      WHERE ri.receta_id = ?
      ORDER BY ri.orden ASC, i.nombre ASC
    `)
    .all(recetaId);

  if (filas.length > 0) {
    return filas.map((fila) => ({
      id: fila.id,
      nombre: fila.nombre,
      cantidad: fila.cantidad,
      unidad: fila.unidad,
      notas: fila.notas,
    }));
  }

  const receta = db
    .prepare("SELECT ingredientes FROM recetas WHERE id = ?")
    .get(recetaId);

  if (!receta || !receta.ingredientes) {
    return [];
  }

  return String(receta.ingredientes)
    .split(",")
    .map((item) => ({
      nombre: normalizarIngrediente(item),
      cantidad: null,
      unidad: null,
      notas: null,
    }))
    .filter(Boolean);
}

function guardarIngredientesReceta(recetaId, ingredientes) {
  db.prepare("DELETE FROM receta_ingredientes WHERE receta_id = ?").run(recetaId);

  const resultado = normalizarIngredientesEntrada(ingredientes);
  if (resultado.error) throw new Error(resultado.error);
  const lista = resultado.ingredientes;

  for (let indice = 0; indice < lista.length; indice++) {
    const ingrediente = lista[indice];
    const slug = normalizarSlug(ingrediente.nombre);

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
        .run(ingrediente.nombre, slug);

      ingredienteId = creado.lastInsertRowid;
    }

    db.prepare(`
      INSERT INTO receta_ingredientes (receta_id, ingrediente_id, orden)
      VALUES (?, ?, ?)
    `).run(recetaId, ingredienteId, indice + 1);

    db.prepare(`
      UPDATE receta_ingredientes
      SET cantidad = ?, unidad = ?, notas = ?
      WHERE receta_id = ? AND ingrediente_id = ? AND orden = ?
    `).run(
      ingrediente.cantidad,
      ingrediente.unidad,
      ingrediente.notas,
      recetaId,
      ingredienteId,
      indice + 1,
    );
  }

  const receta = db.prepare("SELECT ingredientes FROM recetas WHERE id = ?").get(recetaId);

  if (receta) {
    db.prepare("UPDATE recetas SET ingredientes = ? WHERE id = ?").run(
      lista.map((item) => item.nombre).join(","),
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
  categoria: fila.categoria_id
    ? db.prepare("SELECT id, nombre, slug FROM categorias WHERE id = ?").get(fila.categoria_id)
    : null,
  ingredientes: obtenerIngredientesDeReceta(fila.id),
  pasos: obtenerPasosDeReceta(fila.id),
  esVegetariano: Boolean(fila.esVegetariano),
});

app.get("/recetas", (req, res) => {
  const filas = db.prepare("SELECT * FROM recetas").all();
  res.json(filas.map(convertirFila));
});

app.get("/categorias", (req, res) => {
  const categorias = db.prepare("SELECT id, nombre, slug FROM categorias ORDER BY nombre").all();
  res.json(categorias);
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

  if (receta.usuario_id !== req.usuario.id && req.usuario.rol !== "admin") {
    return res.status(403).json({ mensaje: "Solo el dueño puede ver las solicitudes" });
  }

  const solicitudes = db.prepare("SELECT * FROM solicitudes WHERE receta_id = ?").all(req.params.id);
  res.json(solicitudes);
});

app.post("/recetas", verificarToken, (req, res) => {
  const {
    nombre,
    descripcion,
    porciones,
    tiempoMinutos,
    ingredientes,
    esVegetariano,
    imagen,
    pasos,
    categoria_id: categoriaId,
    dificultad = "media",
    tiempo_preparacion: tiempoPreparacion,
    tiempo_coccion: tiempoCoccion,
  } = req.body;

  const esVegetarianoNormalizado = normalizarBooleano(esVegetariano);
  const dificultadNormalizada = normalizarDificultad(dificultad);

  const errores = validarDatosReceta({
    nombre,
    porciones,
    tiempoMinutos,
    ingredientes,
    pasos,
    dificultad: dificultad === undefined ? "media" : dificultad,
    esVegetariano,
    categoria_id: categoriaId,
    tiempo_preparacion: tiempoPreparacion,
    tiempo_coccion: tiempoCoccion,
  });

  if (errores.length > 0) {
    return res.status(400).json({ mensaje: "Datos de receta inválidos", errores });
  }

  if (categoriaId !== undefined && categoriaId !== null && categoriaId !== "") {
    const categoria = db.prepare("SELECT id FROM categorias WHERE id = ?").get(categoriaId);
    if (!categoria) {
      return res.status(400).json({ mensaje: "La categoría indicada no existe" });
    }
  }

  const esVegetarianoFinal = esVegetarianoNormalizado === null ? false : esVegetarianoNormalizado;

  const insertar = db.prepare(`
    INSERT INTO recetas (nombre, descripcion, porciones, tiempoMinutos, ingredientes, esVegetariano, imagen, imagen_principal, usuario_id, categoria_id, dificultad, tiempo_preparacion, tiempo_coccion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const resultado = insertar.run(
    nombre,
    descripcion || null,
    porciones,
    tiempoMinutos,
    (Array.isArray(ingredientes) ? ingredientes : []).join(","),
    esVegetarianoFinal ? 1 : 0,
    imagen || null,
    imagen || null,
    req.usuario.id,
    categoriaId || null,
    dificultadNormalizada || "media",
    tiempoPreparacion ?? null,
    tiempoCoccion ?? null,
  );

  db.transaction(() => {
    guardarIngredientesReceta(resultado.lastInsertRowid, ingredientes);
    guardarPasosReceta(resultado.lastInsertRowid, pasos);
  })();

  const nuevaReceta = db
    .prepare("SELECT * FROM recetas WHERE id = ?")
    .get(resultado.lastInsertRowid);

  res.status(201).json(convertirFila(nuevaReceta));
});

app.put("/recetas/:id", verificarToken, (req, res) => {
  const {
    nombre,
    descripcion,
    porciones,
    tiempoMinutos,
    ingredientes,
    pasos,
    categoria_id: categoriaId,
    dificultad,
    esVegetariano,
    tiempo_preparacion: tiempoPreparacion,
    tiempo_coccion: tiempoCoccion,
  } = req.body;

  const receta = db.prepare("SELECT * FROM recetas WHERE id = ?").get(req.params.id);

  if (!receta) {
    return res.status(404).json({ mensaje: "Receta no encontrada" });
  }

  if (receta.usuario_id !== req.usuario.id && req.usuario.rol !== "admin") {
    return res.status(403).json({ mensaje: "No podés editar una receta que no creaste" });
  }

  const errores = validarDatosReceta({
    ...req.body,
    categoria_id: categoriaId,
    dificultad: dificultad !== undefined ? normalizarDificultad(dificultad) ?? dificultad : dificultad,
    esVegetariano: esVegetariano !== undefined ? normalizarBooleano(esVegetariano) : esVegetariano,
  }, { parcial: true });

  if (errores.length > 0) {
    return res.status(400).json({ mensaje: "Datos de receta inválidos", errores });
  }

  if (categoriaId !== undefined && categoriaId !== null && categoriaId !== "") {
    const categoria = db.prepare("SELECT id FROM categorias WHERE id = ?").get(categoriaId);
    if (!categoria) {
      return res.status(400).json({ mensaje: "La categoría indicada no existe" });
    }
  }

  const esVegetarianoNormalizado = esVegetariano === undefined ? undefined : normalizarBooleano(esVegetariano);
  if (esVegetariano !== undefined && esVegetarianoNormalizado === null) {
    return res.status(400).json({ mensaje: "esVegetariano debe ser un valor booleano" });
  }

  const ingredientesActualizados = ingredientes === undefined ? undefined : ingredientes;
  const pasosActualizados = pasos === undefined ? undefined : pasos;
  const datosActualizacion = [
    nombre === undefined ? receta.nombre : nombre,
    porciones === undefined ? receta.porciones : porciones,
    tiempoMinutos === undefined ? receta.tiempoMinutos : tiempoMinutos,
    ingredientesActualizados === undefined
      ? receta.ingredientes
      : ingredientesActualizados.map((item) =>
        typeof item === "string" ? normalizarIngrediente(item) : normalizarIngrediente(item.nombre),
      ).filter(Boolean).join(","),
  ];

  if (ingredientesActualizados === undefined && Array.isArray(receta.ingredientes)) {
    datosActualizacion[3] = receta.ingredientes
      .map((item) => typeof item === "string" ? item : item.nombre)
      .filter(Boolean)
      .join(",");
  }

  const campos = [
    "nombre = ?",
    "descripcion = ?",
    "porciones = ?",
    "tiempoMinutos = ?",
    "imagen = ?",
    "imagen_principal = ?",
    "ingredientes = ?",
  ];
  const valores = [
    datosActualizacion[0],
    descripcion === undefined ? receta.descripcion : descripcion || null,
    datosActualizacion[1],
    datosActualizacion[2],
    req.body.imagen === undefined ? receta.imagen : req.body.imagen || null,
    req.body.imagen === undefined ? receta.imagen_principal : req.body.imagen || null,
    datosActualizacion[3],
  ];

  for (const [campo, valor] of [
    ["categoria_id", categoriaId],
    ["dificultad", dificultad !== undefined ? normalizarDificultad(dificultad) ?? dificultad : undefined],
    ["tiempo_preparacion", tiempoPreparacion],
    ["tiempo_coccion", tiempoCoccion],
    ["esVegetariano", esVegetarianoNormalizado],
  ]) {
    if (valor !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(valor === "" ? null : valor);
    }
  }

  valores.push(req.params.id);
  db.transaction(() => {
    if (ingredientesActualizados !== undefined) {
      guardarIngredientesReceta(req.params.id, ingredientesActualizados);
    }

    if (pasosActualizados !== undefined) {
      guardarPasosReceta(req.params.id, pasosActualizados);
    }

    db.prepare(`UPDATE recetas SET ${campos.join(", ")} WHERE id = ?`).run(...valores);
  })();

  const recetaActualizada = db.prepare("SELECT * FROM recetas WHERE id = ?").get(req.params.id);
  res.json(convertirFila(recetaActualizada));
});

app.delete("/recetas/:id", verificarToken, (req, res) => {
  const receta = db.prepare("SELECT * FROM recetas WHERE id = ?").get(req.params.id);

  if (!receta) {
    return res.status(404).json({ mensaje: "Receta no encontrada" });
  }

  if (receta.usuario_id !== req.usuario.id && req.usuario.rol !== "admin") {
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
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
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
