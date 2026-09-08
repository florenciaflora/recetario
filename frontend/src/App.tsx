import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useParams, Link } from "react-router-dom";
import { Routes, Route } from "react-router-dom";

interface Receta {
  id: number;
  nombre: string;
  porciones: number;
  tiempoMinutos: number;
  ingredientes: string[];
  esVegetariano: boolean;
  imagen: string;
  usuario_id: number | null;
  acompanamiento: string | null;
  notas: string | null;
}

interface PropsTarjeta extends Receta {
  onBorrar: (id: number) => void;
  onActualizar: (
    id: number,
    datos: { nombre: string; porciones: number; tiempoMinutos: number; ingredientes: string[] }
  ) => void;
  onSolicitarEliminacion: (id: number, motivo: string) => void;
  token: string | null;
  idUsuarioActual: number | null;
}

const MAX_INGREDIENTES_VISIBLES = 4;

function TarjetaReceta({
  id,
  nombre,
  porciones,
  tiempoMinutos,
  ingredientes,
  esVegetariano,
  imagen,
  usuario_id,
  onBorrar,
  onActualizar,
  onSolicitarEliminacion,
  token,
  idUsuarioActual,
}: PropsTarjeta) {
  const [minutosEditados, setMinutosEditados] = useState(String(tiempoMinutos));
  const [nombreEditado, setNombreEditado] = useState(nombre);
  const [porcionesEditadas, setPorcionesEditadas] = useState(String(porciones));
  const [ingredientesEditados, setIngredientesEditados] = useState(ingredientes.join(", "));

  const listaIngredientes = ingredientes ?? [];
  const ingredientesVisibles = listaIngredientes.slice(0, MAX_INGREDIENTES_VISIBLES);
  const restantes = listaIngredientes.length - ingredientesVisibles.length;

  return (
    <div className="tarjeta">
      <Link to={`/recetas/${id}`} style={{ textDecoration: "none", color: "inherit" }}>
        {imagen ? (
          <img src={imagen} alt={nombre} className="imagen-receta" loading="lazy" />
        ) : (
          <div className="imagen-receta imagen-placeholder">🍽️</div>
        )}
        <div className="tarjeta-contenido">
          <h2>{nombre}</h2>
          <p className="meta">
            {porciones} porciones · {tiempoMinutos} min{" "}
            {esVegetariano ? "· 🌱" : ""}
          </p>

          <ul>
            {ingredientesVisibles.map((ingrediente) => (
              <li key={ingrediente}>{ingrediente}</li>
            ))}
          </ul>
          {restantes > 0 && <p className="ingredientes-restantes">+{restantes} más</p>}
        </div>
      </Link>

      {token && (
        <div className="tarjeta-acciones">
          {usuario_id === idUsuarioActual ? (
            <>
              <input
                type="text"
                value={nombreEditado}
                onChange={(evento) => setNombreEditado(evento.target.value)}
                placeholder="Nombre"
              />
              <input
                type="number"
                value={porcionesEditadas}
                onChange={(evento) => setPorcionesEditadas(evento.target.value)}
                placeholder="Porciones"
              />
              <input
                type="number"
                value={minutosEditados}
                onChange={(evento) => setMinutosEditados(evento.target.value)}
                placeholder="Minutos"
              />
              <input
                type="text"
                value={ingredientesEditados}
                onChange={(evento) => setIngredientesEditados(evento.target.value)}
                placeholder="Ingredientes (separados por coma)"
              />
              <div>
                <button
                  className="boton-guardar"
                  onClick={() =>
                    onActualizar(id, {
                      nombre: nombreEditado,
                      porciones: Number(porcionesEditadas),
                      tiempoMinutos: Number(minutosEditados),
                      ingredientes: ingredientesEditados.split(",").map((i) => i.trim()),
                    })
                  }
                >
                  Guardar
                </button>
                <button className="boton-borrar" onClick={() => onBorrar(id)}>
                  Borrar
                </button>
              </div>
            </>
          ) : (
            <button
              className="boton-borrar"
              onClick={() => {
                const motivo = prompt("¿Por qué querés que se elimine esta receta?");
                if (motivo) {
                  onSolicitarEliminacion(id, motivo);
                }
              }}
            >
              Solicitar eliminación
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DetalleReceta() {
  const { id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;
  const [receta, setReceta] = useState<Receta | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/recetas/${id}`)
      .then((respuesta) => respuesta.json())
      .then((datos) => setReceta(datos));
  }, [id, API_URL]);

  if (!receta) {
    return (
      <div className="detalle-pagina">
        <Link to="/" className="detalle-volver">← Volver a todas las recetas</Link>
        <p className="detalle-cargando">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="detalle-pagina">
      <div className="detalle-barra">
        <Link to="/" className="detalle-volver">← Volver a todas las recetas</Link>
        <button
          className="boton-compartir"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("¡Link copiado! Ya lo podés compartir.");
          }}
        >
          🔗 Compartir
        </button>
      </div>

      <div className="detalle-tarjeta">
        {receta.imagen && <img src={receta.imagen} alt={receta.nombre} className="detalle-imagen" />}
        <h1>{receta.nombre}</h1>
        <p className="meta">
          {receta.porciones} porciones · {receta.tiempoMinutos} min{" "}
          {receta.esVegetariano ? "· 🌱 Vegetariano" : ""}
        </p>
        <h3>Ingredientes</h3>
        <ul>
          {receta.ingredientes.map((ingrediente) => (
            <li key={ingrediente}>{ingrediente}</li>
          ))}
        </ul>
        {receta.acompanamiento && (
          <>
            <h3>Acompañamiento</h3>
            <p>{receta.acompanamiento}</p>
          </>
        )}

        {receta.notas && (
          <>
            <h3>Notas / Receta</h3>
            <p>
              {receta.notas.startsWith("http") ? (
                <a href={receta.notas} target="_blank" rel="noopener noreferrer">
                  Ver receta completa
                </a>
              ) : (
                receta.notas
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTiempo, setNuevoTiempo] = useState("");
  const [nuevasPorciones, setNuevasPorciones] = useState("");
  const [nuevosIngredientes, setNuevosIngredientes] = useState("");
  const [nuevaImagen, setNuevaImagen] = useState("");
  const [nuevoVegetariano, setNuevoVegetariano] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [emailLogin, setEmailLogin] = useState("");
  const [contrasenaLogin, setContrasenaLogin] = useState("");
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const usuarioActual = token ? jwtDecode<{ id: number; email: string }>(token) : null;
  const [filtroActivo, setFiltroActivo] = useState<"todas" | "vegetariano" | "rapido">("todas");

  useEffect(() => {
    fetch(`${API_URL}/recetas`)
      .then((respuesta) => respuesta.json())
      .then((datos) => {
        setRecetas(datos);
        setCargando(false);
      });
  }, [API_URL]);

  const iniciarSesion = async (evento: React.FormEvent) => {
    evento.preventDefault();

    const respuesta = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailLogin, contrasena: contrasenaLogin }),
    });

    if (respuesta.ok) {
      const datos = await respuesta.json();
      setToken(datos.token);
      localStorage.setItem("token", datos.token);
      setEmailLogin("");
      setContrasenaLogin("");
      setMostrarLogin(false);
    } else {
      alert("Email o contraseña incorrectos");
    }
  };

  const cerrarSesion = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  const agregarReceta = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const recetaNueva = {
      nombre: nuevoNombre,
      tiempoMinutos: Number(nuevoTiempo),
      porciones: Number(nuevasPorciones),
      ingredientes: nuevosIngredientes.split(",").map((ing) => ing.trim()),
      esVegetariano: nuevoVegetariano,
      imagen: nuevaImagen,
    };

    const respuesta = await fetch(`${API_URL}/recetas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(recetaNueva),
    });

    const recetaCreada = await respuesta.json();
    setRecetas([...recetas, recetaCreada]);

    setNuevoNombre("");
    setNuevoTiempo("");
    setNuevasPorciones("");
    setNuevosIngredientes("");
    setNuevaImagen("");
    setNuevoVegetariano(false);
  };

  const recetasFiltradas = recetas
    .filter((receta) => receta.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .filter((receta) => {
      if (filtroActivo === "vegetariano") return receta.esVegetariano;
      if (filtroActivo === "rapido") return receta.tiempoMinutos <= 30;
      return true;
    });

  const borrarReceta = async (id: number) => {
    await fetch(`${API_URL}/recetas/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setRecetas(recetas.filter((receta) => receta.id !== id));
  };

  const solicitarEliminacion = async (recetaId: number, motivo: string) => {
    const respuesta = await fetch(`${API_URL}/solicitudes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receta_id: recetaId, motivo }),
    });

    if (respuesta.ok) {
      alert("Solicitud enviada. El dueño de la receta la va a revisar.");
    } else {
      alert("No se pudo enviar la solicitud.");
    }
  };

  const actualizarReceta = async (
    id: number,
    datos: { nombre: string; porciones: number; tiempoMinutos: number; ingredientes: string[] }
  ) => {
    const respuesta = await fetch(`${API_URL}/recetas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });

    if (respuesta.ok) {
      const recetaActualizada = await respuesta.json();
      setRecetas(
        recetas.map((receta) =>
          receta.id === id ? recetaActualizada : receta,
        ),
      );
    }
  };

  return (
    <>
      <header className="encabezado">
        <div className="encabezado-interior">
          <Link to="/" className="logo">Mi Recetario Digital</Link>
          <div className="sesion-estado">
            {token ? (
              <>
                ✅ Sesión iniciada
                <button className="boton-texto" onClick={cerrarSesion}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button className="boton-texto" onClick={() => setMostrarLogin(!mostrarLogin)}>
                🔒 Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <main className="contenedor-pagina">
              {!token && mostrarLogin && (
                <div className="zona-login">
                  <form className="formulario formulario-compacto" onSubmit={iniciarSesion}>
                    <input
                      type="email"
                      placeholder="Email"
                      value={emailLogin}
                      onChange={(evento) => setEmailLogin(evento.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={contrasenaLogin}
                      onChange={(evento) => setContrasenaLogin(evento.target.value)}
                    />
                    <button type="submit">Iniciar sesión</button>
                  </form>
                </div>
              )}

              <input
                className="buscador"
                type="text"
                placeholder="Buscar receta..."
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
              />

              <div className="chips-fila">
                <button
                  className={`chip ${filtroActivo === "todas" ? "chip-activo" : ""}`}
                  onClick={() => setFiltroActivo("todas")}
                >
                  Todas
                </button>
                <button
                  className={`chip ${filtroActivo === "vegetariano" ? "chip-activo" : ""}`}
                  onClick={() => setFiltroActivo("vegetariano")}
                >
                  🌱 Vegetariano
                </button>
                <button
                  className={`chip ${filtroActivo === "rapido" ? "chip-activo" : ""}`}
                  onClick={() => setFiltroActivo("rapido")}
                >
                  ⚡ Rápido
                </button>
              </div>

              {token && (
                <form className="formulario" onSubmit={agregarReceta}>
                  <input
                    type="text"
                    placeholder="Nombre de la receta"
                    value={nuevoNombre}
                    onChange={(evento) => setNuevoNombre(evento.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Minutos"
                    value={nuevoTiempo}
                    onChange={(evento) => setNuevoTiempo(evento.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Porciones"
                    value={nuevasPorciones}
                    onChange={(evento) => setNuevasPorciones(evento.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Ej: papas, sal, aceite"
                    value={nuevosIngredientes}
                    onChange={(evento) => setNuevosIngredientes(evento.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="URL de la imagen"
                    value={nuevaImagen}
                    onChange={(evento) => setNuevaImagen(evento.target.value)}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="checkbox"
                      checked={nuevoVegetariano}
                      onChange={(evento) => setNuevoVegetariano(evento.target.checked)}
                    />
                    Vegetariano
                  </label>

                  <button type="submit">Agregar receta</button>
                </form>
              )}

              {cargando ? (
                <>
                  <p className="texto-cargando">
                    Cargando recetas... (puede tardar hasta un minuto si el servidor
                    estaba dormido)
                  </p>
                  <div className="contenedor-tarjetas">
                    {Array.from({ length: 6 }).map((_, indice) => (
                      <div className="tarjeta-esqueleto" key={indice}>
                        <div className="esqueleto-imagen" />
                        <div className="tarjeta-contenido">
                          <div className="esqueleto-linea esqueleto-titulo" />
                          <div className="esqueleto-linea esqueleto-meta" />
                          <div className="esqueleto-linea" />
                          <div className="esqueleto-linea" style={{ width: "80%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="contenedor-tarjetas">
                  {recetasFiltradas.map((receta) => (
                    <TarjetaReceta
                      key={receta.id}
                      id={receta.id}
                      nombre={receta.nombre}
                      porciones={receta.porciones}
                      tiempoMinutos={receta.tiempoMinutos}
                      ingredientes={receta.ingredientes}
                      esVegetariano={receta.esVegetariano}
                      imagen={receta.imagen}
                      usuario_id={receta.usuario_id}
                      acompanamiento={receta.acompanamiento}
                      notas={receta.notas}
                      onBorrar={borrarReceta}
                      onActualizar={actualizarReceta}
                      onSolicitarEliminacion={solicitarEliminacion}
                      token={token}
                      idUsuarioActual={usuarioActual ? usuarioActual.id : null}
                    />
                  ))}
                </div>
              )}
            </main>
          }
        />
        <Route path="/recetas/:id" element={<DetalleReceta />} />
      </Routes>
    </>
  );
}

export default App;
