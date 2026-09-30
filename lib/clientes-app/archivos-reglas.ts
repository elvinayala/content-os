// Archivos del cliente (puro; tests en tests/clientes-app.test.mjs). La carpeta de Drive sale de la columna
// "Contenido" de su ficha (o del expediente de Max); el Apps Script solo entrega lo que está DENTRO de esa carpeta.

export interface ArchivoDrive {
  id: string;
  nombre: string;
  mime: string;
  bytes: number;
  fecha: string; // ISO
  carpeta: string; // subcarpeta ("" = suelto en la raíz)
}

/** Id de una carpeta de Drive a partir de su link (drive.google.com/drive/folders/<id>). */
export function carpetaDeUrl(url: string | null | undefined): string | null {
  const m = url?.match(/drive\.google\.com\/(?:drive\/(?:u\/\d+\/)?folders\/|open\?id=)([\w-]{10,})/);
  return m ? m[1] : null;
}

export type TipoArchivo = "imagen" | "video" | "pdf" | "documento" | "otro";
export function tipoDe(mime: string): TipoArchivo {
  if (mime.startsWith("image/")) return "imagen";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("application/vnd.google-apps") || /word|document|sheet|presentation|text/.test(mime)) return "documento";
  return "otro";
}

/** "03 Creativos (flyers e imágenes)" → "Creativos (flyers e imágenes)"; la raíz se llama "Tu carpeta". */
export const nombreCarpeta = (c: string) => c.replace(/^\d+\s+/, "").trim() || "Tu carpeta";

/** Agrupa por subcarpeta (en el orden de sus números) y dentro, lo más nuevo primero. Sin atajos ni carpetas de Google. */
export function agrupar(archivos: ArchivoDrive[]): { carpeta: string; archivos: ArchivoDrive[] }[] {
  const utiles = archivos.filter((a) => a.mime !== "application/vnd.google-apps.folder" && a.mime !== "application/vnd.google-apps.shortcut");
  const grupos = new Map<string, ArchivoDrive[]>();
  for (const a of utiles) grupos.set(a.carpeta, [...(grupos.get(a.carpeta) ?? []), a]);
  return [...grupos.entries()]
    .sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "es", { numeric: true })))
    .map(([carpeta, lista]) => ({ carpeta: nombreCarpeta(carpeta), archivos: lista.sort((x, y) => y.fecha.localeCompare(x.fecha)) }));
}

/** Tamaño legible. */
export const tamano = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : b >= 1024 ? `${Math.round(b / 1024)} KB` : `${b} B`);

export const TOPE_SUBIDA = 100 * 1024 * 1024; // lo que el cliente puede subir de una vez (fotos y videos cortos)
export const tipoSubidaPermitido = (mime: string, nombre: string) => /^(image|video)\//.test(mime) || /\.(pdf|jpe?g|png|heic|webp|mp4|mov|m4v)$/i.test(nombre);
