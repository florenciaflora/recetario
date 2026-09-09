import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Receta } from "../types/receta";

export function DetalleReceta() {
  const { id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const [receta, setReceta] = useState<Receta | null>(null);
  const [error, setError] = useState<{ id: string | undefined; mensaje: string } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/recetas/${id}`)
      .then(async (respuesta) => {
        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(datos.mensaje || "No se pudo cargar la receta.");
        return datos;
      })
      .then((datos) => setReceta(datos))
      .catch((errorDetalle) => setError({
        id,
        mensaje: errorDetalle instanceof Error ? errorDetalle.message : "No se pudo cargar la receta.",
      }));
  }, [id, API_URL]);

  const recetaActual = receta && String(receta.id) === id ? receta : null;
  const errorActual = error && error.id === id ? error.mensaje : "";

  if (!recetaActual && !errorActual) {
    return (
      <div className="detalle-pagina">
        <Link to="/" className="detalle-volver">← Volver a todas las recetas</Link>
        <p className="detalle-cargando">Cargando...</p>
      </div>
    );
  }

  if (errorActual || !recetaActual) {
    return (
      <div className="detalle-pagina">
        <Link to="/" className="detalle-volver">← Volver a todas las recetas</Link>
        <p className="estado-error" role="alert">{errorActual || "Receta no encontrada."}</p>
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
        {recetaActual.imagen && <img src={recetaActual.imagen} alt={recetaActual.nombre} className="detalle-imagen" />}
        <h1>{recetaActual.nombre}</h1>
        <p className="meta">
          {recetaActual.porciones} porciones · {recetaActual.tiempoMinutos} min
          {recetaActual.esVegetariano ? " · 🌱 Vegetariano" : ""}
        </p>
        <h3>Ingredientes</h3>
        <ul>
          {recetaActual.ingredientes.map((ingrediente, indice) => (
            <li key={ingrediente.id ?? `${ingrediente.nombre}-${indice}`}>
              {ingrediente.cantidad !== null && `${ingrediente.cantidad} `}
              {ingrediente.unidad && `${ingrediente.unidad} `}
              {ingrediente.nombre}
              {ingrediente.notas && ` (${ingrediente.notas})`}
            </li>
          ))}
        </ul>
        {recetaActual.pasos && recetaActual.pasos.length > 0 && (
          <>
            <h3>Preparación</h3>
            <ol className="pasos-preparacion">
              {recetaActual.pasos.map((paso) => (
                <li key={paso.id ?? paso.orden}>
                  {paso.titulo && <strong>{paso.titulo}</strong>}
                  <p>{paso.descripcion}</p>
                  {paso.imagen && (
                    <img src={paso.imagen} alt={paso.titulo || `Paso ${paso.orden}`} loading="lazy" />
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
        {recetaActual.acompanamiento && (
          <>
            <h3>Acompañamiento</h3>
            <p>{recetaActual.acompanamiento}</p>
          </>
        )}

        {recetaActual.notas && (
          <>
            <h3>Notas / Receta</h3>
            <p>
              {recetaActual.notas.startsWith("http") ? (
                <a href={recetaActual.notas} target="_blank" rel="noopener noreferrer">
                  Ver receta completa
                </a>
              ) : (
                recetaActual.notas
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
