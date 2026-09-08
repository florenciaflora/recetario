export interface Receta {
  id: number;
  nombre: string;
  porciones: number;
  tiempoMinutos: number;
  ingredientes: string[];
  esVegetariano: boolean;
  imagen: string | null;
  usuario_id: number | null;
  acompanamiento?: string | null;
  notas?: string | null;
  pasos?: PasoPreparacion[];
  categoria_id?: number | null;
  categoria?: Categoria | null;
}

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
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
  ingredientes: string[];
  pasos?: PasoPreparacion[];
}
