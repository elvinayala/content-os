// El material de un cliente para sus creativos (logo, fotos, guía de marca) — reglas puras.
// Elvin, 9/oct/2026: María del Carmen y Carilin subieron logo, fotos y b-roll al hilo (y un Drive) para dos
// videos de motion, y Max les pidió "URLs públicas", "colores hex" y "tipografía" durante dos días: no tenía cómo
// abrir los adjuntos. Ahora el servidor los baja (lib/max/material.ts) y Max solo los mira y los usa.
// Lo usan lib/max/material.ts y scripts/max.mjs; tests en tests/max-material.test.mjs.

export type TipoMaterial = "logo" | "foto" | "pdf" | "video" | "otro";

export type EntradaDrive = { id: string; titulo: string; carpeta: boolean };

// Carpetas y archivos de Drive mencionados en un texto (links de Slack: <https://…|…>).
export function linksDrive(texto: string): { carpetas: string[]; archivos: string[] } {
  const t = String(texto || "");
  const unicos = (re: RegExp) => [...new Set([...t.matchAll(re)].map((m) => m[1]))];
  return {
    carpetas: unicos(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]{10,})/g),
    archivos: unicos(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^ ]*&)?id=)([A-Za-z0-9_-]{10,})/g),
  };
}

// La vista pública de una carpeta compartida ("cualquiera con el enlace"):
// https://drive.google.com/embeddedfolderview?id=<carpeta> — no necesita clave ni cuenta.
export function leerCarpetaDrive(html: string): EntradaDrive[] {
  const out: EntradaDrive[] = [];
  for (const bloque of String(html || "").split('<div class="flip-entry"').slice(1)) {
    const href = bloque.match(/href="https:\/\/drive\.google\.com\/(drive\/folders|file\/d)\/([A-Za-z0-9_-]+)/);
    const titulo = bloque.match(/<div class="flip-entry-title">([^<]*)<\/div>/);
    if (!href || !titulo) continue;
    out.push({ id: href[2], titulo: desescapar(titulo[1]).trim(), carpeta: href[1] === "drive/folders" });
  }
  return out;
}

function desescapar(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

const EXT_MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", heic: "image/heic",
  svg: "image/svg+xml", pdf: "application/pdf", mp4: "video/mp4", mov: "video/quicktime", m4v: "video/mp4",
};

export function mimeDe(nombre: string, mime?: string | null): string {
  if (mime && mime !== "application/octet-stream" && !mime.startsWith("text/html")) return mime;
  const ext = String(nombre).toLowerCase().split(".").pop() || "";
  return EXT_MIME[ext] || "application/octet-stream";
}

// Qué es cada archivo. La carpeta manda ("Logo", "Fotos DR"); si no, el nombre y el tipo.
export function clasificar(nombre: string, mime: string, carpeta = ""): TipoMaterial {
  const n = `${carpeta} ${nombre}`.toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return /logo|isotipo|imagotipo|marca\b|brand/.test(n) ? "logo" : "foto";
  return "otro";
}

// Lo que se baja y se guarda: imágenes y PDFs (guía de marca). Los videos (b-roll) se listan pero no se bajan:
// los motion se arman con logo, fotos y gráficos (Elvin, 9/oct: "no son necesarios los b-rolls por ahora").
export function seBaja(tipo: TipoMaterial, bytes?: number): boolean {
  if (tipo === "video" || tipo === "otro") return false;
  return !bytes || bytes <= 25 * 1024 * 1024;
}

export function nombreSeguro(nombre: string): string {
  const limpio = String(nombre || "archivo").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return (limpio || "archivo").slice(-80);
}

export type Material = {
  clave: string; // origen-id: no se baja dos veces
  nombre: string;
  tipo: TipoMaterial;
  origen: "slack" | "drive";
  carpeta?: string;
  url?: string; // firmada (1 año) — la usan Remi (render) y Max
  ver?: string; // link original (Drive/Slack) cuando no se bajó (videos)
  bytes?: number;
};

// Junta lo nuevo con lo que ya había en la ficha (por clave) y lo ordena: logos, fotos, PDFs, videos.
export function unirMaterial(viejo: Material[], nuevo: Material[]): Material[] {
  const m = new Map<string, Material>();
  for (const x of [...(viejo || []), ...(nuevo || [])]) m.set(x.clave, { ...m.get(x.clave), ...x });
  const orden: Record<TipoMaterial, number> = { logo: 0, foto: 1, pdf: 2, video: 3, otro: 4 };
  return [...m.values()].sort((a, b) => orden[a.tipo] - orden[b.tipo] || a.nombre.localeCompare(b.nombre));
}
