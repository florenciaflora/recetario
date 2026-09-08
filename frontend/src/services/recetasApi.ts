import type { DatosRecetaActualizar, Receta } from "../types/receta";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const respuesta = await fetch(`${API_URL}${url}`, options);

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({}));
    throw new Error(error.mensaje || "Error en la solicitud");
  }

  return respuesta.json() as Promise<T>;
}

export const recetasApi = {
  listarRecetas: () => fetchJson<Receta[]>("/recetas"),
  obtenerReceta: (id: number | string) => fetchJson<Receta>(`/recetas/${id}`),
  crearReceta: (receta: Omit<Receta, "id" | "usuario_id" | "acompanamiento" | "notas">, token: string | null) =>
    fetchJson<Receta>("/recetas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(receta),
    }),
  actualizarReceta: (id: number, datos: DatosRecetaActualizar, token: string | null) =>
    fetchJson<Receta>(`/recetas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    }),
  borrarReceta: (id: number, token: string | null) =>
    fetchJson<{ mensaje: string }>(`/recetas/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  enviarSolicitud: (recetaId: number, motivo: string, token: string | null) =>
    fetchJson<{ id: number }>("/solicitudes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receta_id: recetaId, motivo }),
    }),
  login: (email: string, contrasena: string) =>
    fetchJson<{ mensaje: string; token: string }>("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, contrasena }),
    }),
};
