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
}

export interface DatosRecetaActualizar {
  nombre: string;
  porciones: number;
  tiempoMinutos: number;
  ingredientes: string[];
}
