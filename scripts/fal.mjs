#!/usr/bin/env node
// fal.ai — el taller creativo de Lola y Max (Elvin, 25/sep/2026: "para Lola y Max, utiliza fal.ai").
// Mismos modelos que Bori usa en producción: Nano Banana Pro (imagen y edición con referencias) y Kling 2.1
// Pro (imagen → video). Llave: FAL_API_KEY (o FAL_KEY) en .env.local / Railway.
//
//   node scripts/fal.mjs imagen "<prompt>" [--ar 1:1|4:5|9:16|16:9] [--n 1-3] [--res 1K|2K] [--ref url1,url2] [--guardar ruta.png]
//        con --ref usa la edición (mismo personaje/producto/marca de la referencia: logo, foto del cliente, Max v2…)
//   node scripts/fal.mjs video "<prompt de movimiento>" --img <url de imagen> [--dur 5|10] [--guardar ruta.mp4]
//        imagen → video con Kling (5 o 10 s). Va por la cola de fal con tope de 6 min: nunca se queda colgado.
//
// Devuelve las URLs finales (fal.media). Reglas de gasto: Lola máx. 3 imágenes / 2 videos por pedido; Max nunca
// genera sin el ok de Elvin (o de su tope). Para dejarlo en la carpeta del cliente: max.mjs drive-archivo.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const CON_VALOR = new Set(["ar", "n", "res", "ref", "img", "dur", "guardar"]);
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
const [cmd, ...resto] = pos;
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

try {
  if (!KEY) salir("Falta FAL_API_KEY (en .env.local o en Railway)");
  if (cmd === "imagen") {
    if (!prompt) salir('Uso: imagen "<prompt>" [--ar 9:16] [--n 1-3] [--res 2K] [--ref url1,url2] [--guardar ruta.png]');
    const n = Math.min(Math.max(Number(val.n) || 1, 1), 3);
    const refs = String(val.ref || "").split(",").map((x) => x.trim()).filter((x) => /^https:\/\//.test(x));
    const cuerpo = { prompt, aspect_ratio: val.ar || "1:1", num_images: n, output_format: "png", resolution: val.res || "2K", ...(refs.length ? { image_urls: refs } : {}) };
    const modelo = refs.length ? MODELO_EDICION : MODELO_IMAGEN;
    const j = await llamar(`https://fal.run/${modelo}`, cuerpo, 180_000);
    const urls = (j.images || []).map((i) => i.url).filter(Boolean);
    if (!urls.length) salir("fal no devolvió imágenes");
    console.log(`✔ ${urls.length} imagen(es) · ${modelo}${refs.length ? ` · ${refs.length} referencia(s)` : ""}`);
    for (const [i, u] of urls.entries()) {
      console.log(u);
      await guardar(u, val.guardar && urls.length > 1 ? val.guardar.replace(/(\.[a-z0-9]+)?$/i, `-${i + 1}$1`) : val.guardar);
    }
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
