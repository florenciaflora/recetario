import { useState } from "react";
import { Link } from "react-router-dom";
import type { DatosRecetaActualizar, Receta } from "../types/receta";

interface PropsTarjeta extends Receta {
  onBorrar: (id: number) => void;
  onActualizar: (id: number, datos: DatosRecetaActualizar) => void;
  onSolicitarEliminacion: (id: number, motivo: string) => void;
  token: string | null;
  idUsuarioActual: number | null;
}

const MAX_INGREDIENTES_VISIBLES = 4;

export function TarjetaReceta({
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

  const ingredientesVisibles = ingredientes.slice(0, MAX_INGREDIENTES_VISIBLES);
  const restantes = ingredientes.length - ingredientesVisibles.length;

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
            {porciones} porciones · {tiempoMinutos} min {esVegetariano ? "· 🌱" : ""}
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
