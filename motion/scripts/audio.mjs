#!/usr/bin/env node
// Audio para los videos de motion, por prompt, vía fal.ai (misma llave que scripts/fal.mjs).
//   node motion/scripts/audio.mjs musica "<prompt>" --seg 15 --guardar motion/public/audio/x.mp3
//   node motion/scripts/audio.mjs sfx "<prompt>" --seg 1.5 --guardar motion/public/audio/whoosh.mp3
// Modelos (cambiables por env): música FAL_MUSIC_MODEL, efectos FAL_SFX_MODEL.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  } catch { return ""; }
}
const KEY = env("FAL_API_KEY") || env("FAL_KEY");
const MODELO_MUSICA = env("FAL_MUSIC_MODEL") || "fal-ai/stable-audio-25/text-to-audio";
const MODELO_SFX = env("FAL_SFX_MODEL") || "fal-ai/elevenlabs/sound-effects/v2";

const [, , modo, prompt, ...resto] = process.argv;
const arg = (n, d) => { const i = resto.indexOf(`--${n}`); return i >= 0 ? resto[i + 1] : d; };
if (!KEY) { console.error("Falta FAL_API_KEY en .env.local"); process.exit(1); }
if (!["musica", "sfx"].includes(modo) || !prompt) {
  console.error('Uso: audio.mjs musica|sfx "<prompt>" --seg N --guardar ruta.mp3');
  process.exit(1);
}

const seg = Math.max(modo === "sfx" ? 0.5 : 1, Number(arg("seg", modo === "musica" ? 15 : 1.5))); // ElevenLabs pide ≥ 0.5 s
const destino = path.resolve(arg("guardar", `motion/public/audio/${modo}-${Date.now()}.mp3`));
const modelo = modo === "musica" ? MODELO_MUSICA : MODELO_SFX;
const cuerpo = modo === "musica"
  ? { prompt, seconds_total: Math.ceil(seg), num_inference_steps: 8 }
  : { text: prompt, duration_seconds: seg, prompt_influence: 0.6 };

const h = { Authorization: `Key ${KEY}`, "Content-Type": "application/json" };
const cola = await (await fetch(`https://queue.fal.run/${modelo}`, { method: "POST", headers: h, body: JSON.stringify(cuerpo) })).json();
if (!cola.status_url) { console.error("fal rechazó el pedido:", JSON.stringify(cola).slice(0, 400)); process.exit(1); }

const limite = Date.now() + 5 * 60_000;
let res = null;
while (Date.now() < limite) {
  await new Promise((r) => setTimeout(r, 2500));
  const s = await (await fetch(cola.status_url, { headers: h })).json();
  if (s.status === "COMPLETED") { res = await (await fetch(cola.response_url, { headers: h })).json(); break; }
  if (s.status === "FAILED" || s.error) { console.error("Falló:", JSON.stringify(s).slice(0, 400)); process.exit(1); }
}
const url = res?.audio?.url || res?.audio_file?.url || res?.audio_url || res?.url;
if (!url) { console.error("Respuesta sin audio:", JSON.stringify(res).slice(0, 400)); process.exit(1); }

fs.mkdirSync(path.dirname(destino), { recursive: true });
const ext = path.extname(new URL(url).pathname) || ".mp3";
const final = destino.replace(/\.[a-z0-9]+$/i, "") + ext;
fs.writeFileSync(final, Buffer.from(await (await fetch(url)).arrayBuffer()));
console.log(final);
