export interface Receta {
  id: number;
  nombre: string;
  descripcion?: string | null;
  porciones: number;
  tiempoMinutos: number;
  ingredientes: Ingrediente[];
  esVegetariano: boolean;
  imagen: string | null;
  imagen_principal?: string | null;
  usuario_id: number | null;
  acompanamiento?: string | null;
  notas?: string | null;
  pasos?: PasoPreparacion[];
  categoria_id?: number | null;
  categoria?: Categoria | null;
  dificultad?: "facil" | "media" | "dificil" | null;
  tiempo_preparacion?: number | null;
  tiempo_coccion?: number | null;
}

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
}

export interface Ingrediente {
  id?: number;
  nombre: string;
  cantidad: number | null;
  unidad: string | null;
  notas: string | null;
}

export interface PasoPreparacion {
  id?: number;
  orden: number;
  titulo: string | null;
  descripcion: string;
  imagen: string | null;
}

export interface DatosRecetaActualizar {
  nombre: string;
  porciones: number;
  tiempoMinutos: number;
  ingredientes: Ingrediente[];
  pasos?: PasoPreparacion[];
  categoria_id?: number | null;
  descripcion?: string | null;
  imagen?: string | null;
  esVegetariano?: boolean;
  dificultad?: "facil" | "media" | "dificil";
  tiempo_preparacion?: number | null;
  tiempo_coccion?: number | null;
}
