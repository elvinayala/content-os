#!/usr/bin/env node
// Sube videos a la biblioteca de una cuenta de anuncios (no publica ni activa nada) y devuelve sus IDs.
//   node scripts/meta-ads/subir-videos.mjs <marca> <entregaId> [<entregaId>…]
// Cada entregaId es una fila de data/entregas.json con videoUrl (p. ej. motion-remi-lu-07-autoflow-llego-16x9).
// Guarda el mapa id → videoId en data/meta-ads/videos-subidos.json para que Max lo use en los planes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crearCliente, subirVideo } from "./core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const env = (n) => process.env[n] || (fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}=(.*)$`, "m"))?.[1] || "").trim().replace(/^["']|["']$/g, "");
const [, , marca, ...ids] = process.argv;
const portafolio = JSON.parse(fs.readFileSync(path.join(ROOT, "data/meta-ads/portafolio.json"), "utf8"));
const cfg = portafolio.marcas[marca];
if (!cfg || !ids.length) { console.error("Uso: subir-videos.mjs <marca> <entregaId>…"); process.exit(1); }
const c = crearCliente(env(cfg.tokenEnv || "META_ADS_TOKEN"));
const entregas = JSON.parse(fs.readFileSync(path.join(ROOT, "data/entregas.json"), "utf8")).entregas;
const regPath = path.join(ROOT, "data/meta-ads/videos-subidos.json");
const reg = fs.existsSync(regPath) ? JSON.parse(fs.readFileSync(regPath, "utf8")) : {};
reg[marca] ??= {};

for (const id of ids) {
  const e = entregas.find((x) => x.id === id);
  if (!e?.videoUrl) { console.log(`✗ ${id}: sin videoUrl en la bandeja`); continue; }
  if (reg[marca][id]) { console.log(`= ${id} → ${reg[marca][id].videoId} (ya subido)`); continue; }
  try {
    const r = await subirVideo(c, cfg.cuentaId, e.videoUrl, `Motion · ${e.titulo}`.slice(0, 100));
    const videoId = r?.id || r?.videoId || r;
    reg[marca][id] = { videoId: String(videoId), titulo: e.titulo, subido: new Date().toISOString() };
    fs.writeFileSync(regPath, JSON.stringify(reg, null, 2) + "\n");
    console.log(`✓ ${id} → ${videoId}`);
  } catch (err) {
    console.log(`✗ ${id}: ${err.message}`);
  }
}
