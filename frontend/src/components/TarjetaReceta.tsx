import { useState } from "react";
import { Link } from "react-router-dom";
import type { Categoria, DatosRecetaActualizar, Receta } from "../types/receta";

interface PropsTarjeta extends Receta {
  onBorrar: (id: number) => void;
  onActualizar: (id: number, datos: DatosRecetaActualizar) => void;
  onSolicitarEliminacion: (id: number, motivo: string) => void;
  token: string | null;
  idUsuarioActual: number | null;
  categorias: Categoria[];
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
  pasos = [],
  onBorrar,
  onActualizar,
  onSolicitarEliminacion,
  token,
  idUsuarioActual,
  categorias,
}: PropsTarjeta) {
  const [minutosEditados, setMinutosEditados] = useState(String(tiempoMinutos));
  const [nombreEditado, setNombreEditado] = useState(nombre);
  const [porcionesEditadas, setPorcionesEditadas] = useState(String(porciones));
  const [ingredientesEditados, setIngredientesEditados] = useState(ingredientes.join(", "));
  const [pasosEditados, setPasosEditados] = useState(
    pasos.map((paso) => paso.descripcion).join("\n"),
  );
  const [categoriaEditada, setCategoriaEditada] = useState(String(categoria_id || ""));

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
              <textarea
                value={pasosEditados}
                onChange={(evento) => setPasosEditados(evento.target.value)}
                placeholder="Pasos de preparación, uno por línea"
                rows={4}
              />
              <select
                value={categoriaEditada}
                onChange={(evento) => setCategoriaEditada(evento.target.value)}
                aria-label={`Categoría de ${nombre}`}
              >
                <option value="">Sin categoría</option>
                {categorias
                  .filter((categoria) => categoria.slug !== "sin-categoria")
                  .map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
              </select>
              <div>
                <button
                  className="boton-guardar"
                  onClick={() =>
                    onActualizar(id, {
                      nombre: nombreEditado,
                      porciones: Number(porcionesEditadas),
                      tiempoMinutos: Number(minutosEditados),
                      ingredientes: ingredientesEditados.split(",").map((i) => i.trim()),
                      pasos: pasosEditados
                        .split("\n")
                        .map((descripcion, indice) => ({
                          orden: indice + 1,
                          titulo: pasos[indice]?.titulo || null,
                          descripcion: descripcion.trim(),
                          imagen: pasos[indice]?.imagen || null,
                        }))
                        .filter((paso) => paso.descripcion),
                      categoria_id: categoriaEditada ? Number(categoriaEditada) : null,
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
