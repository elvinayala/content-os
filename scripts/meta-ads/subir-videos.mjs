#!/usr/bin/env node
// Sube videos a la biblioteca de una cuenta de anuncios (no publica ni activa nada) y devuelve sus IDs.
//   node scripts/meta-ads/subir-videos.mjs <marca | cliente:<slug>> <entregaId | https://…mp4> […]
// (cliente:<slug> usa la cuenta de Meta del expediente de Max; se puede pasar la URL del video directo, p. ej. la de Remi.)
// Cada entregaId es una fila de data/entregas.json con videoUrl (p. ej. motion-remi-lu-07-autoflow-llego-16x9).
// Guarda el mapa id → videoId en data/meta-ads/videos-subidos.json para que Max lo use en los planes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crearCliente, subirVideo } from "./core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const env = (n) => process.env[n] || (fs.existsSync(path.join(ROOT, ".env.local")) ? (fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}=(.*)$`, "m"))?.[1] || "") : "").trim().replace(/^["']|["']$/g, "");
const [, , marca, ...ids] = process.argv;
const portafolio = JSON.parse(fs.readFileSync(path.join(ROOT, "data/meta-ads/portafolio.json"), "utf8"));
let cfg = portafolio.marcas[marca];
if (marca?.startsWith("cliente:")) {
  const base = (env("CONTENT_OS_URL") || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
  const r = await fetch(`${base}/api/max?cliente=${encodeURIComponent(marca.slice(8))}`, { headers: { "x-cron-secret": env("CRON_SECRET") } });
  const exp = (await r.json()).cliente;
  if (!exp?.meta?.cuentaId) { console.error(`✖ ${marca} sin cuenta de Meta (node scripts/max.mjs meta <slug> --cuenta …)`); process.exit(1); }
  cfg = { cuentaId: exp.meta.cuentaId, tokenEnv: exp.meta.tokenEnv || "META_ADS_TOKEN" };
}
if (!cfg || !ids.length) { console.error("Uso: subir-videos.mjs <marca|cliente:slug> <entregaId|url>…"); process.exit(1); }
const c = crearCliente(env(cfg.tokenEnv || "META_ADS_TOKEN"));
const entregas = JSON.parse(fs.readFileSync(path.join(ROOT, "data/entregas.json"), "utf8")).entregas;
const regPath = path.join(ROOT, "data/meta-ads/videos-subidos.json");
const reg = fs.existsSync(regPath) ? JSON.parse(fs.readFileSync(regPath, "utf8")) : {};
reg[marca] ??= {};

for (const id of ids) {
  const e = /^https:\/\//.test(id) ? { videoUrl: id, titulo: decodeURIComponent(id.split("?")[0].split("/").pop()) } : entregas.find((x) => x.id === id);
  if (!e?.videoUrl) { console.log(`✗ ${id}: sin videoUrl en la bandeja`); continue; }
  const clave = /^https:/.test(id) ? e.titulo : id;
  if (reg[marca][clave]) { console.log(`= ${clave} → ${reg[marca][clave].videoId} (ya subido)`); continue; }
  try {
    const r = await subirVideo(c, cfg.cuentaId, e.videoUrl, `Motion · ${e.titulo}`.slice(0, 100));
    const videoId = r?.id || r?.videoId || r;
    reg[marca][clave] = { videoId: String(videoId), titulo: e.titulo, subido: new Date().toISOString() };
    fs.writeFileSync(regPath, JSON.stringify(reg, null, 2) + "\n");
    console.log(`✓ ${clave} → ${videoId}`);
  } catch (err) {
    console.log(`✗ ${id}: ${err.message}`);
  }
}
