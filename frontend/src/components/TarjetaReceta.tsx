import { Link } from "react-router-dom";
import type { Receta } from "../types/receta";

interface PropsTarjeta extends Receta {
  onBorrar: (id: number) => void;
  onSolicitarEliminacion: (id: number, motivo: string) => void;
  onEditar: (receta: Receta) => void;
  token: string | null;
  idUsuarioActual: number | null;
  puedeAdministrar: boolean;
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
  categoria_id,
  pasos,
  onBorrar,
  onSolicitarEliminacion,
  onEditar,
  token,
  idUsuarioActual,
  puedeAdministrar,
}: PropsTarjeta) {
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
              <li key={ingrediente.id ?? `${ingrediente.nombre}-${ingredientes.indexOf(ingrediente)}`}>
                {ingrediente.nombre}
              </li>
            ))}
          </ul>
          {restantes > 0 && <p className="ingredientes-restantes">+{restantes} más</p>}
        </div>
      </Link>

      {token && (
        <div className="tarjeta-acciones">
          {usuario_id === idUsuarioActual || puedeAdministrar ? (
            <>
              <button className="boton-guardar" onClick={() => onEditar({ id, nombre, porciones, tiempoMinutos, ingredientes, esVegetariano, imagen, usuario_id, categoria_id, pasos })}>
                Editar receta
              </button>
              <button className="boton-borrar" onClick={() => onBorrar(id)}>
                Borrar
              </button>
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
