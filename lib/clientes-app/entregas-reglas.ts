// Lo que el cliente ve en Trabajo (Elvin, 30/sep): SOLO tres cosas, nada de la carpeta completa.
//  - Plan de marketing (el inicial)
//  - Creativos (los flyers aprobados que se le mandaron)
//  - Videos (si hay)
// Las sube el equipo (el estratega) desde "Ver como el cliente" → Trabajo, o entran solas cuando Max envía algo
// aprobado al canal del cliente. Puro; tests en tests/clientes-app.test.mjs.

export type TipoEntrega = "plan" | "creativo" | "video";

export const TIPOS_ENTREGA: { id: TipoEntrega; nombre: string; subir: string; acepta: string }[] = [
  { id: "plan", nombre: "Plan de marketing", subir: "Subir el plan", acepta: "application/pdf,image/*" },
  { id: "creativo", nombre: "Creativos", subir: "Subir creativos", acepta: "image/*" },
  { id: "video", nombre: "Videos", subir: "Subir videos", acepta: "video/*" },
];

export const TOPE_ENTREGA = 50 * 1024 * 1024; // el tope por archivo del bucket de Supabase

const EXT: Record<TipoEntrega, RegExp> = {
  plan: /\.(pdf|png|jpe?g|webp)$/i,
  creativo: /\.(png|jpe?g|webp|heic|gif)$/i,
  video: /\.(mp4|mov|m4v|webm)$/i,
};
const MIME: Record<TipoEntrega, RegExp> = {
  plan: /^(application\/pdf|image\/(png|jpe?g|webp))$/,
  creativo: /^image\/(png|jpe?g|webp|heic|heif|gif)$/,
  video: /^video\/(mp4|quicktime|x-m4v|webm)$/,
};

export const esTipoEntrega = (t: unknown): t is TipoEntrega => t === "plan" || t === "creativo" || t === "video";

/** ¿Ese archivo vale para ese tipo? (por tipo MIME o, si el navegador no lo dice, por la extensión) */
export function archivoValido(tipo: TipoEntrega, mime: string, nombre: string): boolean {
  return MIME[tipo].test(mime) || (!mime && EXT[tipo].test(nombre)) || (mime === "application/octet-stream" && EXT[tipo].test(nombre));
}

/** Nombre que ve el cliente: sin extensión ni guiones bajos ("plan_marketing_v2.pdf" → "plan marketing v2"). */
export function nombreVisible(nombre: string): string {
  return nombre.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "Archivo";
}

/** Aviso al teléfono cuando el equipo sube algo (sale solo con CLIENTES_APP_AVISOS=real). */
export function avisoEntrega(tipo: TipoEntrega, n: number): { titulo: string; texto: string } {
  if (tipo === "plan") return { titulo: "📄 Tu plan de marketing está listo", texto: "Ya lo puedes ver en la app, en Trabajo." };
  if (tipo === "video") return { titulo: n > 1 ? `🎬 Tienes ${n} videos nuevos` : "🎬 Tienes un video nuevo", texto: "Míralos en la app, en Trabajo." };
  return { titulo: n > 1 ? `🎨 Tienes ${n} creativos nuevos` : "🎨 Tienes un creativo nuevo", texto: "Míralos en la app, en Trabajo." };
}
