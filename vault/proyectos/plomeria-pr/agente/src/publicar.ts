/**
 * Publicador de Resuelto: Instagram (feed, story, carrusel, reel) y Facebook Page,
 * vía Meta Graph API con la MISMA app del agente de DMs.
 *
 *   npm run publicar -- --listar          ve la cola y qué toca hoy
 *   npm run publicar -- --previsualizar   muestra exactamente qué se publicaría (no publica)
 *   npm run publicar -- --hoy             publica lo programado para hoy
 *   npm run publicar -- --id p01          publica una pieza concreta
 *   npm run publicar -- --hoy --seco      simula (no llama a Meta)
 *
 * Meta descarga la imagen por URL: las piezas tienen que estar en un sitio público
 * (las copiamos a landing/flyers/, así se despliegan con la web).
 * Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { RAIZ } from "./almacen.js";

const GRAPH = "https://graph.facebook.com/v21.0";
const COLA = path.join(RAIZ, "data", "calendario-publicaciones.json");

export type Destino = "ig-feed" | "ig-story" | "fb-page";
export interface Pieza {
  id: string;
  fecha: string;            // YYYY-MM-DD
  destinos: Destino[];
  imagen: string;           // URL pública
  texto: string;            // caption (IG) / mensaje (FB)
  nota?: string;            // para ti, no se publica
  publicado?: { destino: Destino; id: string; cuando: string }[];
}
interface Cola { base_url: string; piezas: Pieza[] }

const leerCola = (): Cola => JSON.parse(fs.readFileSync(COLA, "utf8"));
const guardarCola = (c: Cola) => fs.writeFileSync(COLA, JSON.stringify(c, null, 2));
const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: config.zonaHoraria }); // YYYY-MM-DD

async function graph(ruta: string, cuerpo: Record<string, string>) {
  const r = await fetch(`${GRAPH}/${ruta}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(cuerpo) });
  const j = (await r.json()) as any;
  if (!r.ok) throw new Error(`Meta ${r.status}: ${j?.error?.message ?? JSON.stringify(j)}`);
  return j;
}

/** Instagram: contenedor → publicar. Story usa el mismo flujo con media_type=STORIES. */
async function publicarIG(imagen: string, texto: string, story: boolean): Promise<string> {
  const igId = config.meta.igAccountId;
  if (!igId || !config.meta.pageToken) throw new Error("Falta IG_ACCOUNT_ID o PAGE_ACCESS_TOKEN");
  const contenedor = await graph(`${igId}/media`, { image_url: imagen, access_token: config.meta.pageToken, ...(story ? { media_type: "STORIES" } : { caption: texto }) });
  // Meta necesita unos segundos para bajar la imagen antes de publicar.
  for (let i = 0; i < 10; i++) {
    const est = await fetch(`${GRAPH}/${contenedor.id}?fields=status_code&access_token=${config.meta.pageToken}`).then((r) => r.json() as any);
    if (est.status_code === "FINISHED") break;
    if (est.status_code === "ERROR") throw new Error("Meta no pudo procesar la imagen (¿la URL es pública?)");
    await new Promise((r) => setTimeout(r, 2000));
  }
  const pub = await graph(`${igId}/media_publish`, { creation_id: contenedor.id, access_token: config.meta.pageToken });
  return pub.id;
}

async function publicarFB(imagen: string, texto: string): Promise<string> {
  const pageId = process.env.FB_PAGE_ID;
  if (!pageId || !config.meta.pageToken) throw new Error("Falta FB_PAGE_ID o PAGE_ACCESS_TOKEN");
  const pub = await graph(`${pageId}/photos`, { url: imagen, caption: texto, published: "true", access_token: config.meta.pageToken });
  return pub.post_id ?? pub.id;
}

export async function publicarPieza(p: Pieza, base: string, seco: boolean): Promise<string[]> {
  const imagen = p.imagen.startsWith("http") ? p.imagen : base.replace(/\/$/, "") + p.imagen;
  const hechos: string[] = [];
  for (const destino of p.destinos) {
    const yaEsta = p.publicado?.some((x) => x.destino === destino);
    if (yaEsta) { hechos.push(`${destino}: ya estaba publicado, salto`); continue; }
    if (seco) { hechos.push(`${destino}: [seco] ${imagen}`); continue; }
    try {
      const id = destino === "fb-page" ? await publicarFB(imagen, p.texto) : await publicarIG(imagen, p.texto, destino === "ig-story");
      p.publicado = [...(p.publicado ?? []), { destino, id, cuando: new Date().toISOString() }];
      hechos.push(`${destino}: publicado (${id})`);
    } catch (e) { hechos.push(`${destino}: ERROR — ${(e as Error).message}`); }
  }
  return hechos;
}

async function main() {
  const args = process.argv.slice(2);
  const tiene = (f: string) => args.includes(f);
  const valor = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const cola = leerCola();
  const base = process.env.BASE_PIEZAS ?? cola.base_url;
  const hoy = hoyPR();

  if (tiene("--listar") || args.length === 0) {
    console.log(`Cola de publicaciones · hoy es ${hoy} · piezas en ${base}\n`);
    for (const p of cola.piezas) {
      const estado = p.publicado?.length ? `✅ ${p.publicado.map((x) => x.destino).join(", ")}` : p.fecha === hoy ? "⏰ toca hoy" : p.fecha < hoy ? "⚠️ atrasada" : "· programada";
      console.log(`${p.id}  ${p.fecha}  ${estado}\n     ${p.destinos.join(" + ")} · ${p.imagen}\n     ${p.texto.split("\n")[0].slice(0, 90)}…\n`);
    }
    return;
  }

  const seco = tiene("--seco") || tiene("--previsualizar");
  const id = valor("--id");
  const objetivo = id ? cola.piezas.filter((p) => p.id === id) : cola.piezas.filter((p) => p.fecha <= hoy && !p.publicado?.length);
  if (!objetivo.length) { console.log("Nada que publicar."); return; }

  for (const p of objetivo) {
    console.log(`\n── ${p.id} · ${p.destinos.join(" + ")} ──\n${p.texto}\n`);
    if (tiene("--previsualizar")) continue;
    for (const linea of await publicarPieza(p, base, seco)) console.log("   " + linea);
  }
  if (!tiene("--previsualizar")) guardarCola(cola);
}

// Comparamos rutas resueltas, no URLs: la ruta del proyecto tiene espacios y file:// las escapa.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main().catch((e) => { console.error(e); process.exit(1); });
