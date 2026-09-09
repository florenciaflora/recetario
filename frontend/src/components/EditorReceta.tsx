import { useState, type FormEvent } from "react";
import type {
  Categoria,
  DatosRecetaActualizar,
  Ingrediente,
  PasoPreparacion,
  Receta,
} from "../types/receta";

interface PropsEditorReceta {
  receta?: Receta | null;
  categorias: Categoria[];
  onGuardar: (datos: DatosRecetaActualizar) => Promise<void>;
  onCancelar?: () => void;
}

const ingredienteVacio = (): Ingrediente => ({
  nombre: "",
  cantidad: null,
  unidad: null,
  notas: null,
});

const pasoVacio = (): PasoPreparacion => ({
  orden: 1,
  titulo: null,
  descripcion: "",
  imagen: null,
});

function prepararIngredientes(receta?: Receta | null) {
  return receta?.ingredientes.length ? receta.ingredientes : [ingredienteVacio()];
}

function prepararPasos(receta?: Receta | null) {
  return receta?.pasos?.length ? receta.pasos : [pasoVacio()];
}

export function EditorReceta({ receta, categorias, onGuardar, onCancelar }: PropsEditorReceta) {
  const [nombre, setNombre] = useState(receta?.nombre || "");
  const [descripcion, setDescripcion] = useState(receta?.descripcion || "");
  const [categoriaId, setCategoriaId] = useState(String(receta?.categoria_id || ""));
  const [dificultad, setDificultad] = useState<"facil" | "media" | "dificil">(receta?.dificultad || "media");
  const [tiempoPreparacion, setTiempoPreparacion] = useState(String(receta?.tiempo_preparacion ?? ""));
  const [tiempoCoccion, setTiempoCoccion] = useState(String(receta?.tiempo_coccion ?? ""));
  const [tiempoTotal, setTiempoTotal] = useState(String(receta?.tiempoMinutos ?? ""));
  const [porciones, setPorciones] = useState(String(receta?.porciones ?? ""));
  const [imagen, setImagen] = useState(receta?.imagen_principal || receta?.imagen || "");
  const [esVegetariano, setEsVegetariano] = useState(Boolean(receta?.esVegetariano));
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(prepararIngredientes(receta));
  const [pasos, setPasos] = useState<PasoPreparacion[]>(prepararPasos(receta));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const actualizarIngrediente = (indice: number, cambios: Partial<Ingrediente>) => {
    setIngredientes((actuales) => actuales.map((item, posicion) => posicion === indice ? { ...item, ...cambios } : item));
  };

  const moverIngrediente = (indice: number, desplazamiento: number) => {
    const destino = indice + desplazamiento;
    if (destino < 0 || destino >= ingredientes.length) return;
    setIngredientes((actuales) => {
      const siguientes = [...actuales];
      [siguientes[indice], siguientes[destino]] = [siguientes[destino], siguientes[indice]];
      return siguientes;
    });
  };

  const actualizarPaso = (indice: number, cambios: Partial<PasoPreparacion>) => {
    setPasos((actuales) => actuales.map((item, posicion) => posicion === indice ? { ...item, ...cambios } : item));
  };

  const moverPaso = (indice: number, desplazamiento: number) => {
    const destino = indice + desplazamiento;
    if (destino < 0 || destino >= pasos.length) return;
    setPasos((actuales) => {
      const siguientes = [...actuales];
      [siguientes[indice], siguientes[destino]] = [siguientes[destino], siguientes[indice]];
      return siguientes.map((paso, posicion) => ({ ...paso, orden: posicion + 1 }));
    });
  };

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");

    if (!nombre.trim() || !porciones || !tiempoTotal) {
      setError("Nombre, porciones y tiempo total son obligatorios.");
      return;
    }

    const ingredientesValidos = ingredientes
      .map((ingrediente) => ({
        ...ingrediente,
        nombre: ingrediente.nombre.trim(),
        unidad: ingrediente.unidad?.trim() || null,
        notas: ingrediente.notas?.trim() || null,
      }))
      .filter((ingrediente) => ingrediente.nombre);

    const pasosValidos = pasos
      .map((paso, indice) => ({
        ...paso,
        orden: indice + 1,
        titulo: paso.titulo?.trim() || null,
        descripcion: paso.descripcion.trim(),
        imagen: paso.imagen?.trim() || null,
      }))
      .filter((paso) => paso.descripcion);

    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        categoria_id: categoriaId ? Number(categoriaId) : null,
        dificultad,
        tiempo_preparacion: tiempoPreparacion ? Number(tiempoPreparacion) : null,
        tiempo_coccion: tiempoCoccion ? Number(tiempoCoccion) : null,
        tiempoMinutos: Number(tiempoTotal),
        porciones: Number(porciones),
        imagen: imagen.trim() || null,
        esVegetariano,
        ingredientes: ingredientesValidos,
        pasos: pasosValidos,
      });
    } catch (guardarError) {
      setError(guardarError instanceof Error ? guardarError.message : "No se pudo guardar la receta.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="editor-receta" onSubmit={guardar}>
      <div className="editor-cabecera">
        <div>
          <p className="editor-kicker">{receta ? "Editar receta" : "Nueva receta"}</p>
          <h2>{receta ? receta.nombre : "Cargar receta"}</h2>
        </div>
        {onCancelar && <button type="button" className="boton-texto" onClick={onCancelar}>Cancelar</button>}
      </div>

      {error && <p className="editor-error" role="alert">{error}</p>}

      <div className="editor-grid">
        <label>Nombre<input value={nombre} onChange={(evento) => setNombre(evento.target.value)} required /></label>
        <label>Categoría<select value={categoriaId} onChange={(evento) => setCategoriaId(evento.target.value)}><option value="">Sin categoría</option>{categorias.filter((categoria) => categoria.slug !== "sin-categoria").map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}</select></label>
        <label>Dificultad<select value={dificultad} onChange={(evento) => setDificultad(evento.target.value as "facil" | "media" | "dificil")}><option value="facil">Fácil</option><option value="media">Media</option><option value="dificil">Difícil</option></select></label>
        <label>Porciones<input type="number" min="1" value={porciones} onChange={(evento) => setPorciones(evento.target.value)} required /></label>
        <label>Tiempo preparación (min)<input type="number" min="0" value={tiempoPreparacion} onChange={(evento) => setTiempoPreparacion(evento.target.value)} /></label>
        <label>Tiempo cocción (min)<input type="number" min="0" value={tiempoCoccion} onChange={(evento) => setTiempoCoccion(evento.target.value)} /></label>
        <label>Tiempo total (min)<input type="number" min="0" value={tiempoTotal} onChange={(evento) => setTiempoTotal(evento.target.value)} required /></label>
        <label>Imagen principal (URL)<input value={imagen} onChange={(evento) => setImagen(evento.target.value)} /></label>
      </div>

      <label className="editor-ancho">Descripción<textarea value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} rows={3} /></label>
      <label className="editor-checkbox"><input type="checkbox" checked={esVegetariano} onChange={(evento) => setEsVegetariano(evento.target.checked)} /> Vegetariana</label>

      <section className="editor-seccion">
        <div className="editor-seccion-cabecera"><h3>Ingredientes</h3><button type="button" onClick={() => setIngredientes((actuales) => [...actuales, ingredienteVacio()])}>Agregar ingrediente</button></div>
        {ingredientes.map((ingrediente, indice) => <div className="fila-editor" key={ingrediente.id ?? `ingrediente-${indice}`}>
          <input aria-label={`Nombre del ingrediente ${indice + 1}`} placeholder="Nombre" value={ingrediente.nombre} onChange={(evento) => actualizarIngrediente(indice, { nombre: evento.target.value })} />
          <input aria-label={`Cantidad del ingrediente ${indice + 1}`} type="number" min="0" step="any" placeholder="Cantidad" value={ingrediente.cantidad ?? ""} onChange={(evento) => actualizarIngrediente(indice, { cantidad: evento.target.value ? Number(evento.target.value) : null })} />
          <input aria-label={`Unidad del ingrediente ${indice + 1}`} placeholder="Unidad" value={ingrediente.unidad || ""} onChange={(evento) => actualizarIngrediente(indice, { unidad: evento.target.value })} />
          <input aria-label={`Notas del ingrediente ${indice + 1}`} placeholder="Notas" value={ingrediente.notas || ""} onChange={(evento) => actualizarIngrediente(indice, { notas: evento.target.value })} />
          <button type="button" title="Subir" onClick={() => moverIngrediente(indice, -1)}>↑</button><button type="button" title="Bajar" onClick={() => moverIngrediente(indice, 1)}>↓</button><button type="button" title="Quitar" onClick={() => setIngredientes((actuales) => actuales.filter((_, posicion) => posicion !== indice))}>×</button>
        </div>)}
      </section>

      <section className="editor-seccion">
        <div className="editor-seccion-cabecera"><h3>Pasos de preparación</h3><button type="button" onClick={() => setPasos((actuales) => [...actuales, { ...pasoVacio(), orden: actuales.length + 1 }])}>Agregar paso</button></div>
        {pasos.map((paso, indice) => <div className="fila-editor fila-paso" key={paso.id ?? `paso-${indice}`}>
          <span className="paso-numero">{indice + 1}</span>
          <input placeholder="Título" value={paso.titulo || ""} onChange={(evento) => actualizarPaso(indice, { titulo: evento.target.value })} />
          <textarea placeholder="Descripción del paso" value={paso.descripcion} onChange={(evento) => actualizarPaso(indice, { descripcion: evento.target.value })} rows={2} />
          <input placeholder="Imagen del paso (URL opcional)" value={paso.imagen || ""} onChange={(evento) => actualizarPaso(indice, { imagen: evento.target.value })} />
          <button type="button" title="Subir" onClick={() => moverPaso(indice, -1)}>↑</button><button type="button" title="Bajar" onClick={() => moverPaso(indice, 1)}>↓</button><button type="button" title="Quitar" onClick={() => setPasos((actuales) => actuales.filter((_, posicion) => posicion !== indice).map((item, posicion) => ({ ...item, orden: posicion + 1 })))}>×</button>
        </div>)}
      </section>

      <div className="editor-acciones"><button type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar receta"}</button>{onCancelar && <button type="button" className="boton-texto" onClick={onCancelar}>Cancelar</button>}</div>
    </form>
  );
}
