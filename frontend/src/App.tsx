import { useEffect, useState, type FormEvent } from "react";
import { jwtDecode } from "jwt-decode";
import { Link, Route, Routes } from "react-router-dom";
import { DetalleReceta } from "./components/DetalleReceta";
import { TarjetaReceta } from "./components/TarjetaReceta";
import { recetasApi } from "./services/recetasApi";
import type { DatosRecetaActualizar, Receta } from "./types/receta";

function App() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTiempo, setNuevoTiempo] = useState("");
  const [nuevasPorciones, setNuevasPorciones] = useState("");
  const [nuevosIngredientes, setNuevosIngredientes] = useState("");
  const [nuevosPasos, setNuevosPasos] = useState("");
  const [nuevaImagen, setNuevaImagen] = useState("");
  const [nuevoVegetariano, setNuevoVegetariano] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [emailLogin, setEmailLogin] = useState("");
  const [contrasenaLogin, setContrasenaLogin] = useState("");
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<"todas" | "vegetariano" | "rapido">("todas");

  const usuarioActual = token ? jwtDecode<{ id: number; email: string }>(token) : null;

  useEffect(() => {
    let activo = true;

    recetasApi
      .listarRecetas()
      .then((datos) => {
        if (activo) {
          setRecetas(datos);
          setCargando(false);
        }
      })
      .catch((error) => {
        console.error(error);
        if (activo) {
          setCargando(false);
        }
      });

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

  const agregarReceta = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    const recetaNueva = {
      nombre: nuevoNombre,
      tiempoMinutos: Number(nuevoTiempo),
      porciones: Number(nuevasPorciones),
      ingredientes: nuevosIngredientes.split(",").map((ing) => ing.trim()),
      pasos: nuevosPasos
        .split("\n")
        .map((descripcion, indice) => ({
          orden: indice + 1,
          titulo: null,
          descripcion: descripcion.trim(),
          imagen: null,
        }))
        .filter((paso) => paso.descripcion),
      esVegetariano: nuevoVegetariano,
      imagen: nuevaImagen || null,
    };

    try {
      const recetaCreada = await recetasApi.crearReceta(recetaNueva, token);
      setRecetas((actual) => [...actual, recetaCreada]);
      setNuevoNombre("");
      setNuevoTiempo("");
      setNuevasPorciones("");
      setNuevosIngredientes("");
      setNuevosPasos("");
      setNuevaImagen("");
      setNuevoVegetariano(false);
    } catch (error) {
      console.error(error);
      alert("No se pudo crear la receta.");
    }
  };

  const recetasFiltradas = recetas
    .filter((receta) => {
      const textoBusqueda = busqueda.toLowerCase().trim();
      const coincideNombre = receta.nombre.toLowerCase().includes(textoBusqueda);
      const coincideIngrediente = receta.ingredientes.some((ingrediente) =>
        ingrediente.toLowerCase().includes(textoBusqueda),
      );

      return !textoBusqueda || coincideNombre || coincideIngrediente;
    })
    .filter((receta) => {
      if (filtroActivo === "vegetariano") return receta.esVegetariano;
      if (filtroActivo === "rapido") return receta.tiempoMinutos <= 30;
      return true;
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
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar la receta.");
    }
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
                  <textarea
                    placeholder="Pasos de preparación, uno por línea"
                    value={nuevosPasos}
                    onChange={(evento) => setNuevosPasos(evento.target.value)}
                    rows={4}
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
