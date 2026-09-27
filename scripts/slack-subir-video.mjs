#!/usr/bin/env node
// Sube un archivo (p. ej. un video de Remi) a un canal de Slack con el bot Command Center, con texto.
//   node --env-file=.env.local scripts/slack-subir-video.mjs <archivo> --canal <id> --texto "…" [--titulo "…"] [--dry]
// --dry: solo verifica token, canal (el bot tiene que ser miembro) y archivo; no publica nada.
import fs from "node:fs";
import path from "node:path";

const [, , archivo, ...resto] = process.argv;
const arg = (n, d) => { const i = resto.indexOf(`--${n}`); return i >= 0 ? resto[i + 1] : d; };
const dry = resto.includes("--dry");
const canal = arg("canal");
const texto = arg("texto", "");
const titulo = arg("titulo", path.basename(archivo ?? ""));
const TOKEN = process.env.SLACK_BOT_TOKEN;

if (!archivo || !fs.existsSync(archivo) || !canal || !TOKEN) {
  console.error("Uso: slack-subir-video.mjs <archivo> --canal <id> --texto \"…\" [--titulo \"…\"] [--dry]  (necesita SLACK_BOT_TOKEN)");
  process.exit(1);
}
const h = { Authorization: `Bearer ${TOKEN}` };
const api = async (metodo, datos) => {
  const r = await fetch(`https://slack.com/api/${metodo}`, { method: "POST", headers: { ...h, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(datos) });
  return r.json();
};

const info = await api("conversations.info", { channel: canal });
if (!info.ok || !info.channel?.is_member) { console.error(`✗ El bot no está en el canal ${canal}: ${info.error ?? "no es miembro"}`); process.exit(1); }
const datos = fs.readFileSync(archivo);
console.log(`✓ Canal #${info.channel.name} · archivo ${(datos.length / 1e6).toFixed(1)} MB`);
if (dry) { console.log("(dry) no se publicó nada"); process.exit(0); }

const u = await api("files.getUploadURLExternal", { filename: path.basename(archivo), length: String(datos.length) });
if (!u.ok) { console.error("✗ getUploadURLExternal:", u.error); process.exit(1); }
const put = await fetch(u.upload_url, { method: "POST", body: datos });
if (!put.ok) { console.error("✗ subida:", put.status); process.exit(1); }
const c = await api("files.completeUploadExternal", { files: JSON.stringify([{ id: u.file_id, title: titulo }]), channel_id: canal, initial_comment: texto });
if (!c.ok) { console.error("✗ completeUploadExternal:", c.error); process.exit(1); }
console.log(`✓ Publicado en #${info.channel.name}`);
