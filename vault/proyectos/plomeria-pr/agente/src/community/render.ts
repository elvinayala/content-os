/**
 * Genera imágenes de marca (1080×1350) con SVG → PNG vía sharp. Sirve para posts de texto (problema, mentalidad,
 * feriados) y carruseles. Fuentes Sora + DM Sans se instalan en el Dockerfile.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { RAIZ } from "../almacen.js";

export const DIR_MEDIA = path.join(RAIZ, "data", "estado", "community-media");
fs.mkdirSync(DIR_MEDIA, { recursive: true });

const C = { navy: "#08243A", surf: "#0C2A42", cream: "#FBF7F0", orange: "#F2621F", ink2: "#9FB8CA", green: "#3DD598", line: "#E6E1D8", ink: "#08243A" };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Parte un texto en líneas de máx. `max` caracteres (aprox.). */
function lineas(texto: string, max: number): string[] {
  const out: string[] = []; let l = "";
  for (const w of texto.split(/\s+/)) { if ((l + " " + w).trim().length > max && l) { out.push(l); l = w; } else l = (l + " " + w).trim(); }
  if (l) out.push(l); return out;
}

export interface Tarjeta {
  /** Texto pequeño arriba, mayúsculas (p. ej. "PLOMERÍA EN PUERTO RICO" o "DÍA DE LOS PADRES"). */
  eyebrow: string;
  /** Titular grande (máx. ~70 caracteres). Puede tener *palabras* entre asteriscos para pintarlas naranja. */
  titular: string;
  /** Texto de apoyo (opcional, máx ~140). */
  apoyo?: string;
  /** Píldora naranja abajo (opcional): "resueltopr.com" / "WhatsApp 939-247-9234" / "Guarda este post". */
  pill?: string;
  tema?: "navy" | "cream";
  /** Para carruseles: "1/5". */
  indice?: string;
}

function svgTarjeta(t: Tarjeta): string {
  const W = 1080, H = 1350, P = 84;
  const navy = (t.tema ?? "navy") === "navy";
  const bg = navy ? C.navy : C.cream, fg = navy ? "#FFFFFF" : C.ink, sub = navy ? C.ink2 : "#5C6670";
  const titLines = lineas(t.titular.replace(/\*/g, ""), t.titular.length > 48 ? 18 : 14);
  const size = titLines.length >= 5 ? 78 : titLines.length === 4 ? 88 : 100;
  const lh = size * 1.02;
  // palabras marcadas con *…* en naranja
  const marcadas = new Set((t.titular.match(/\*([^*]+)\*/g) ?? []).flatMap((m) => m.replace(/\*/g, "").split(/\s+/)).map((w) => w.toLowerCase()));
  const tspan = (line: string) => line.split(/\s+/).map((w) => `<tspan fill="${marcadas.has(w.toLowerCase().replace(/[.,;:!?]/g, "")) ? C.orange : fg}">${esc(w)}</tspan>`).join(" ");
  const yTit = 400;
  const tit = titLines.map((l, i) => `<text x="${P}" y="${yTit + i * lh}" font-family="Sora, 'DM Sans', sans-serif" font-weight="800" font-size="${size}" letter-spacing="-3">${tspan(l)}</text>`).join("");
  const apoyoL = t.apoyo ? lineas(t.apoyo, 40) : [];
  const yAp = yTit + titLines.length * lh + 40;
  const apoyo = apoyoL.map((l, i) => `<text x="${P}" y="${yAp + i * 50}" font-family="'DM Sans', sans-serif" font-weight="500" font-size="38" fill="${sub}">${esc(l)}</text>`).join("");
  const pill = t.pill ? `<g><rect x="${P}" y="${H - 200}" rx="18" ry="18" width="${Math.min(900, 60 + t.pill.length * 20)}" height="84" fill="${C.orange}"/><text x="${P + 30}" y="${H - 145}" font-family="'DM Sans', sans-serif" font-weight="700" font-size="34" fill="#fff">${esc(t.pill)}</text></g>` : "";
  const blob = navy ? `<circle cx="${W + 120}" cy="-80" r="420" fill="${C.surf}"/>` : `<circle cx="${W + 120}" cy="-80" r="420" fill="#F4E3D4" opacity=".6"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>${blob}
  <g><rect x="${P}" y="${P}" width="56" height="56" rx="14" fill="${C.orange}"/><path d="M${P + 14} ${P + 30} l12 12 l22 -26" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="${P + 74}" y="${P + 44}" font-family="Sora, sans-serif" font-weight="800" font-size="40" letter-spacing="-1.5" fill="${fg}">resuelto</text></g>
  ${t.indice ? `<text x="${W - P}" y="${P + 44}" text-anchor="end" font-family="'DM Sans', sans-serif" font-weight="700" font-size="30" fill="${sub}">${esc(t.indice)}</text>` : ""}
  <text x="${P}" y="${yTit - 110}" font-family="'DM Sans', sans-serif" font-weight="700" font-size="22" letter-spacing="4" fill="${C.orange}">${esc(t.eyebrow.toUpperCase())}</text>
  ${tit}${apoyo}${pill}
  <text x="${P}" y="${H - 60}" font-family="'DM Sans', sans-serif" font-weight="500" font-size="24" fill="${sub}">resueltopr.com · WhatsApp 939-247-9234</text>
</svg>`;
}

/** Renderiza una tarjeta a PNG y devuelve el nombre de archivo (servido en /community/media/:archivo). */
export async function renderTarjeta(t: Tarjeta, nombre: string): Promise<string> {
  const archivo = `${nombre}.png`;
  await sharp(Buffer.from(svgTarjeta(t))).png({ compressionLevel: 8 }).toFile(path.join(DIR_MEDIA, archivo));
  return archivo;
}
