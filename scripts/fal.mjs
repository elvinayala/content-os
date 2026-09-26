#!/usr/bin/env node
// fal.ai — el taller creativo de Lola y Max (Elvin, 25/sep/2026: "para Lola y Max, utiliza fal.ai").
// Mismos modelos que Bori usa en producción: Nano Banana Pro (imagen y edición con referencias) y Kling 2.1
// Pro (imagen → video). Llave: FAL_API_KEY (o FAL_KEY) en .env.local / Railway.
//
//   node scripts/fal.mjs imagen "<prompt>" [--ar 1:1|4:5|9:16|16:9] [--n 1-3] [--res 1K|2K] [--ref url1,url2] [--guardar ruta.png]
//        con --ref usa la edición (mismo personaje/producto/marca de la referencia: logo, foto del cliente, Max v2…)
//   node scripts/fal.mjs flyer --marca <level-up|ai-borinquen|bori|resuelto|isla-run> --titulo "…" --bullets "beneficio 1|beneficio 2|beneficio 3" --cta "…" --producto "<qué se ve: el producto o el servicio>" [--foto url1,url2] [--logo <url del logo real de un cliente>] [--fondo oscuro|claro] [--tipo servicio|producto] [--ar 4:5] [--n 1-3] [--extra "…"] [--sin-logo] [--ver]
//        EL FLYER DE ELVIN (26/sep): minimalista, elegante, pocas palabras (1 título ≤ 8, ≤ 3 bullets de beneficio ≤ 6,
//        CTA ≤ 4), el producto de héroe, logo REAL de la marca como referencia (nunca uno inventado). Valida el copy
//        antes de gastar (sin "gratis", sin voseo, sin promesas de ingreso). --ver muestra el prompt sin generar.
//   node scripts/fal.mjs marcas      kits disponibles (logo público + paleta) — guía completa en vault/ceo/cerebro-lola.md §4
//   node scripts/fal.mjs video "<prompt de movimiento>" --img <url de imagen> [--dur 5|10] [--guardar ruta.mp4]
//        imagen → video con Kling (5 o 10 s). Va por la cola de fal con tope de 6 min: nunca se queda colgado.
//
// Devuelve las URLs finales (fal.media). Reglas de gasto: Lola hasta 8 imágenes / 3 videos por pedido; Max produce
// con el plan aprobado (cerebro §21). Para dejarlo en la carpeta del cliente: max.mjs drive-archivo.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MARCAS, armarFlyer, logoPara } from "./fal/flyer.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}
const KEY = env("FAL_API_KEY") || env("FAL_KEY");
const MODELO_IMAGEN = env("FAL_IMAGE_MODEL") || "fal-ai/nano-banana-pro";
const MODELO_EDICION = env("FAL_EDIT_MODEL") || "fal-ai/nano-banana-pro/edit";
const MODELO_VIDEO = env("FAL_VIDEO_MODEL") || "fal-ai/kling-video/v2.1/pro/image-to-video";

const CON_VALOR = new Set(["ar", "n", "res", "ref", "img", "dur", "guardar", "marca", "titulo", "bullets", "cta", "producto", "foto", "fondo", "tipo", "extra", "logo"]);
const pos = [];
const val = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--") && CON_VALOR.has(a.slice(2).split("=")[0])) {
    const [k, inline] = a.slice(2).split("=");
    val[k] = inline ?? argv[++i];
  } else pos.push(a);
}
const BANDERAS = new Set(pos.filter((a) => a.startsWith("--")).map((a) => a.slice(2)));
const [cmd, ...resto] = pos.filter((a) => !a.startsWith("--"));
const prompt = resto.join(" ").trim();
const salir = (m) => { console.error("✖", m); process.exit(1); };

async function llamar(url, cuerpo, ms) {
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(ms) });
  const t = await r.text();
  if (!r.ok) throw new Error(`fal ${r.status}: ${t.slice(0, 300)}`);
  return JSON.parse(t);
}

// Cola con fecha límite (patrón de Bori, fal-cola.js): pide, consulta cada 4 s y SIEMPRE termina.
async function enCola(modelo, cuerpo, limiteMs = 360_000) {
  const j = await llamar(`https://queue.fal.run/${modelo}`, cuerpo, 45_000);
  if (!j.status_url || !j.response_url) throw new Error("la cola de fal no devolvió seguimiento");
  const hasta = Date.now() + limiteMs;
  while (Date.now() < hasta) {
    await new Promise((r) => setTimeout(r, 4000));
    const s = await fetch(j.status_url, { headers: { Authorization: `Key ${KEY}` }, signal: AbortSignal.timeout(30_000) }).catch(() => null);
    if (!s || s.status >= 500) continue;
    const st = await s.json().catch(() => ({}));
    const estado = String(st.status || "").toUpperCase();
    if (estado === "COMPLETED") {
      const r = await fetch(j.response_url, { headers: { Authorization: `Key ${KEY}` }, signal: AbortSignal.timeout(60_000) });
      return r.json();
    }
    if (["FAILED", "ERROR", "CANCELLED"].includes(estado)) throw new Error(`fal falló: ${JSON.stringify(st.error || st).slice(0, 200)}`);
    process.stderr.write(".");
  }
  throw new Error(`tardó más de ${Math.round(limiteMs / 60000)} min y se cortó`);
}

async function guardar(url, destino) {
  if (!destino) return;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const ruta = path.resolve(ROOT, destino);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, buf);
  console.log(`  guardado en ${path.relative(ROOT, ruta)}`);
}

async function generarImagenes(p, refs, ar) {
  const n = Math.min(Math.max(Number(val.n) || 1, 1), 3);
  const cuerpo = { prompt: p, aspect_ratio: ar, num_images: n, output_format: "png", resolution: val.res || "2K", ...(refs.length ? { image_urls: refs } : {}) };
  const modelo = refs.length ? MODELO_EDICION : MODELO_IMAGEN;
  const j = await llamar(`https://fal.run/${modelo}`, cuerpo, 180_000);
  const urls = (j.images || []).map((i) => i.url).filter(Boolean);
  if (!urls.length) salir("fal no devolvió imágenes");
  console.log(`✔ ${urls.length} imagen(es) · ${modelo}${refs.length ? ` · ${refs.length} referencia(s)` : ""}`);
  for (const [i, u] of urls.entries()) {
    console.log(u);
    await guardar(u, val.guardar && urls.length > 1 ? val.guardar.replace(/(\.[a-z0-9]+)?$/i, `-${i + 1}$1`) : val.guardar);
  }
}

try {
  if (!KEY && !["marcas"].includes(cmd) && !BANDERAS.has("ver")) salir("Falta FAL_API_KEY (en .env.local o en Railway)");
  if (cmd === "imagen") {
    if (!prompt) salir('Uso: imagen "<prompt>" [--ar 9:16] [--n 1-3] [--res 2K] [--ref url1,url2] [--guardar ruta.png]');
    const refs = String(val.ref || "").split(",").map((x) => x.trim()).filter((x) => /^https:\/\//.test(x));
    await generarImagenes(prompt, refs, val.ar || "1:1");
  } else if (cmd === "flyer") {
    const f = armarFlyer({ marca: val.marca, titulo: val.titulo, bullets: val.bullets, cta: val.cta, producto: val.producto, tipo: val.tipo, fondo: val.fondo, fotos: String(val.foto || "").split(",").map((x) => x.trim()).filter(Boolean), logo: val.logo, sinLogo: BANDERAS.has("sin-logo"), extra: val.extra });
    console.log(`Flyer ${f.marca ? f.marca.nombre : "(sin marca)"} · título "${val.titulo || ""}" · ${f.bullets.length} bullet(s) · CTA "${val.cta || ""}" · logo: ${f.logo ? "sí (real)" : "no"} · ${f.refs.length} referencia(s)`);
    for (const a of f.avisos) console.log(`  ⚠ ${a}`);
    if (!f.ok) salir(`Copy fuera de la guía de Elvin — corrígelo antes de gastar:\n  - ${f.errores.join("\n  - ")}`);
    if (BANDERAS.has("ver")) { console.log(`\nPROMPT:\n${f.prompt}\n\nREFERENCIAS:\n${f.refs.join("\n") || "(ninguna)"}`); process.exit(0); }
    await generarImagenes(f.prompt, f.refs, val.ar || "4:5");
  } else if (cmd === "marcas") {
    for (const [slug, m] of Object.entries(MARCAS)) console.log(`${slug.padEnd(14)} ${m.nombre.padEnd(18)} fondo ${m.fondo.padEnd(7)} logo: ${logoPara(m, m.fondo) || "— (sin logo aprobado: el arte va sin logo)"}`);
    console.log("\nMarca que no está aquí = sin kit: el arte sale sin logo y se le pide el logo a Elvin. Nunca se inventa.");
  } else if (cmd === "video") {
    if (!prompt || !/^https:\/\//.test(val.img || "")) salir('Uso: video "<movimiento>" --img https://… [--dur 5|10] [--guardar ruta.mp4]');
    const dur = Number(val.dur) >= 8 ? "10" : "5"; // Kling solo acepta 5 o 10 s
    process.stderr.write(`Kling ${dur}s en cola`);
    const j = await enCola(MODELO_VIDEO, { image_url: val.img, prompt: prompt.slice(0, 2000), duration: dur });
    const url = j?.video?.url;
    if (!url) salir("fal no devolvió video");
    console.log(`\n✔ video ${dur}s · ${MODELO_VIDEO}\n${url}`);
    await guardar(url, val.guardar);
  } else {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//   ")).map((l) => l.slice(5)).join("\n"));
  }
} catch (e) {
  salir(e.message);
}
