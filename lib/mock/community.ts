import type { PublicacionMulti, Plataforma } from "@/lib/types";

// MOCK — Community Manager.
// Para producción: APIs de publicación por plataforma (Instagram/TikTok/YouTube/
// LinkedIn/X) + IA para auto-descripciones. Ver CLAUDE.md → "Conectar datos reales".

// El CM publica reels verticales: Instagram, TikTok y YouTube Shorts.
export const plataformas: Plataforma[] = ["Instagram", "TikTok", "YouTube"];

// Etiqueta visible por plataforma en el composer.
export const etiquetaPlataforma: Partial<Record<Plataforma, string>> = {
  YouTube: "YT Shorts",
};

export const publicaciones: PublicacionMulti[] = [
  {
    id: "p1",
    titulo: "El error de $10.000",
    estado: "programado",
    fecha: "2026-06-18",
    plataformas: [
      { plataforma: "Instagram", descripcion: "El error que me costó $10.000 💸 Guardá esto.", activa: true },
      { plataforma: "TikTok", descripcion: "Perdí 10 lucas por esto 👀 #finanzas #creator", activa: true },
      { plataforma: "YouTube", descripcion: "El error de $10.000 | lo que aprendí", activa: false },
    ],
  },
  {
    id: "p2",
    titulo: "Probé esta IA por 30 días",
    estado: "borrador",
    fecha: "2026-06-20",
    plataformas: [
      { plataforma: "Instagram", descripcion: "", activa: true },
      { plataforma: "LinkedIn", descripcion: "", activa: true },
    ],
  },
];

export interface PartesDescripcion {
  gancho: string;
  angulo: string;
  cta: string;
}

// STUB de auto-descripción. La descripción se arma sola con el gancho, el ángulo
// y el llamado a la acción, adaptada al tono de cada plataforma.
// Reemplazá por una llamada a la API de Claude. La publicación real va por Zernio MCP.
export function generarDescripcion(
  partes: PartesDescripcion,
  plataforma: Plataforma,
): string {
  const gancho = partes.gancho.trim() || "Nuevo contenido";
  const angulo = partes.angulo.trim();
  const cta = partes.cta.trim() || "Seguime para más";
  const cuerpo = angulo ? `${gancho}\n\n${angulo}` : gancho;

  const porPlataforma: Record<Plataforma, string> = {
    Instagram: `${cuerpo}\n\n${cta} ✨\n#contenido #creator #reels`,
    TikTok: `${gancho} 👀 ${angulo}\n${cta} #fyp #creator`,
    YouTube: `${gancho} | ${angulo}\n\n${cta}. Suscribite para no perderte el próximo Short.`,
    X: `${cuerpo}\n\n${cta} 🧵`,
    LinkedIn: `${cuerpo}\n\n${cta} 👇`,
  };
  return porPlataforma[plataforma];
}
