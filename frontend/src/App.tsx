import { useEffect, useState, type FormEvent } from "react";
import { jwtDecode } from "jwt-decode";
import { Link, Route, Routes } from "react-router-dom";
import { DetalleReceta } from "./components/DetalleReceta";
import { EditorReceta } from "./components/EditorReceta";
import { TarjetaReceta } from "./components/TarjetaReceta";
import { recetasApi } from "./services/recetasApi";
import type { Categoria, DatosRecetaActualizar, Receta } from "./types/receta";

function App() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorListado, setErrorListado] = useState("");
  const [emailLogin, setEmailLogin] = useState("");
  const [contrasenaLogin, setContrasenaLogin] = useState("");
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<"todas" | "vegetariano" | "rapido">("todas");
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [orden, setOrden] = useState<"recientes" | "nombre" | "tiempoAsc" | "tiempoDesc">("recientes");
  const [editorAbierto, setEditorAbierto] = useState(false);
  const [recetaEditada, setRecetaEditada] = useState<Receta | null>(null);

  const usuarioActual = token ? jwtDecode<{ id: number; email: string; rol?: string }>(token) : null;

  useEffect(() => {
    let activo = true;

    recetasApi
      .listarRecetas()
      .then((datos) => {
        if (activo) {
          setRecetas(datos);
          setErrorListado("");
          setCargando(false);
        }
      })
      .catch((error) => {
        console.error(error);
        if (activo) {
          setErrorListado(error instanceof Error ? error.message : "No se pudieron cargar las recetas.");
          setCargando(false);
        }
      });

    recetasApi
      .listarCategorias()
      .then((datos) => {
        if (activo) setCategorias(datos);
      })
      .catch((error) => console.error(error));

    return () => {
      activo = false;
    };
  }, []);

  const iniciarSesion = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    try {
      const datos = await recetasApi.login(emailLogin, contrasenaLogin);
      setToken(datos.token);
      localStorage.setItem("token", datos.token);
      setEmailLogin("");
      setContrasenaLogin("");
      setMostrarLogin(false);
    } catch (error) {
      console.error(error);
      alert("Email o contraseña incorrectos");
    }
  };

  const cerrarSesion = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  const recetasFiltradas = recetas
    .filter((receta) => {
      const textoBusqueda = busqueda.toLowerCase().trim();
      const coincideNombre = receta.nombre.toLowerCase().includes(textoBusqueda);
      const coincideIngrediente = receta.ingredientes.some((ingrediente) =>
        ingrediente.nombre.toLowerCase().includes(textoBusqueda),
      );

      return !textoBusqueda || coincideNombre || coincideIngrediente;
    })
    .filter((receta) => !categoriaActiva || String(receta.categoria_id || "") === categoriaActiva)
    .filter((receta) => {
      if (filtroActivo === "vegetariano") return receta.esVegetariano;
      if (filtroActivo === "rapido") return receta.tiempoMinutos <= 30;
      return true;
    })
    .sort((a, b) => {
      if (orden === "nombre") return a.nombre.localeCompare(b.nombre, "es");
      if (orden === "tiempoAsc") return a.tiempoMinutos - b.tiempoMinutos;
      if (orden === "tiempoDesc") return b.tiempoMinutos - a.tiempoMinutos;
      return b.id - a.id;
    });

  const borrarReceta = async (id: number) => {
    try {
      await recetasApi.borrarReceta(id, token);
      setRecetas((actual) => actual.filter((receta) => receta.id !== id));
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la receta.");
    }
  };

  const solicitarEliminacion = async (recetaId: number, motivo: string) => {
    try {
      await recetasApi.enviarSolicitud(recetaId, motivo, token);
      alert("Solicitud enviada. El dueño de la receta la va a revisar.");
    } catch (error) {
      console.error(error);
      alert("No se pudo enviar la solicitud.");
    }
  };

  const actualizarReceta = async (id: number, datos: DatosRecetaActualizar) => {
    try {
      const recetaActualizada = await recetasApi.actualizarReceta(id, datos, token);
      setRecetas((actual) => actual.map((receta) => (receta.id === id ? recetaActualizada : receta)));
      setEditorAbierto(false);
      setRecetaEditada(null);
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar la receta.");
    }
  };

  const guardarDesdeEditor = async (datos: DatosRecetaActualizar) => {
    if (recetaEditada) {
      await actualizarReceta(recetaEditada.id, datos);
      return;
    }

    const recetaCreada = await recetasApi.crearReceta(datos, token);
    setRecetas((actual) => [...actual, recetaCreada]);
    setEditorAbierto(false);
  };

  return (
    <>
      <header className="encabezado">
        <div className="encabezado-interior">
          <Link to="/" className="logo">
            Mi Recetario Digital
          </Link>
          <div className="sesion-estado">
            {token ? (
              <>
                ✅ Sesión iniciada
                <button className="boton-texto" onClick={cerrarSesion}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button className="boton-texto" onClick={() => setMostrarLogin((actual) => !actual)}>
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

              <select
                className="selector-categoria"
                value={categoriaActiva}
                onChange={(evento) => setCategoriaActiva(evento.target.value)}
                aria-label="Filtrar por categoría"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>

              <select
                className="selector-categoria"
                value={orden}
                onChange={(evento) => setOrden(evento.target.value as typeof orden)}
                aria-label="Ordenar recetas"
              >
                <option value="recientes">Más recientes</option>
                <option value="nombre">Por nombre</option>
                <option value="tiempoAsc">Menor tiempo</option>
                <option value="tiempoDesc">Mayor tiempo</option>
              </select>

              {token && (
                <>
                  {!editorAbierto && <button className="boton-nueva-receta" onClick={() => { setRecetaEditada(null); setEditorAbierto(true); }}>Nueva receta</button>}
                  {editorAbierto && <EditorReceta key={recetaEditada?.id ?? "nuevo"} receta={recetaEditada} categorias={categorias} onGuardar={guardarDesdeEditor} onCancelar={() => { setEditorAbierto(false); setRecetaEditada(null); }} />}
                </>
              )}

              {cargando ? (
                <>
                  <p className="texto-cargando">
                    Cargando recetas... (puede tardar hasta un minuto si el servidor estaba dormido)
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
              ) : errorListado ? (
                <div className="estado-error" role="alert">{errorListado}</div>
              ) : recetasFiltradas.length === 0 ? (
                <p className="estado-vacio">No encontramos recetas con esos criterios.</p>
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
                      pasos={receta.pasos}
                      acompanamiento={receta.acompanamiento}
                      notas={receta.notas}
                      onBorrar={borrarReceta}
                      onEditar={(recetaSeleccionada) => { setRecetaEditada(recetaSeleccionada); setEditorAbierto(true); }}
                      onSolicitarEliminacion={solicitarEliminacion}
                      token={token}
                      idUsuarioActual={usuarioActual ? usuarioActual.id : null}
                      puedeAdministrar={usuarioActual?.rol === "admin"}
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
