import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Receta } from "../types/receta";

export function DetalleReceta() {
  const { id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
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
          {receta.porciones} porciones · {receta.tiempoMinutos} min
          {receta.esVegetariano ? " · 🌱 Vegetariano" : ""}
        </p>
        <h3>Ingredientes</h3>
        <ul>
          {receta.ingredientes.map((ingrediente) => (
            <li key={ingrediente}>{ingrediente}</li>
          ))}
        </ul>
        {receta.pasos && receta.pasos.length > 0 && (
          <>
            <h3>Preparación</h3>
            <ol className="pasos-preparacion">
              {receta.pasos.map((paso) => (
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
