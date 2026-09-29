#!/usr/bin/env node
// Remi entrega un video de motion: sube el MP4 a Supabase Storage (bucket privado `pulse`,
// carpeta motion/<fecha>/, link firmado por 1 año) y lo deja en la bandeja de Entregas.
//   node motion/scripts/entregar.mjs <video.mp4> --marca ai-borinquen --titulo "…" \
//     [--formato "motion 16:9 · 15 s"] [--angulo "…"] [--contenido "storyboard en markdown"] [--id x]
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

const [, , archivo, ...resto] = process.argv;
const arg = (n, d) => { const i = resto.indexOf(`--${n}`); return i >= 0 ? resto[i + 1] : d; };
const marca = arg("marca");
const titulo = arg("titulo");
if (!archivo || !fs.existsSync(archivo) || !marca || !titulo) {
  console.error('Uso: entregar.mjs <video.mp4> --marca <ai-borinquen|level-up|shadow-operator|…> --titulo "…"');
  process.exit(1);
}

const URL_SB = env("SUPABASE_URL");
const LLAVE = env("SUPABASE_SERVICE_ROLE_KEY");
let videoUrl = "";
if (URL_SB && LLAVE) {
  const fecha = new Date().toISOString().slice(0, 10);
  const destino = `motion/${fecha}/${path.basename(archivo)}`;
  const h = { Authorization: `Bearer ${LLAVE}` };
  // fetch de Node a veces corta subidas grandes desde la Mac (EPIPE, 28/sep): si falla, se sube con curl.
  const urlSube = `${URL_SB}/storage/v1/object/pulse/${encodeURI(destino)}`;
  let subio = false;
  try {
    const sube = await fetch(urlSube, { method: "POST", headers: { ...h, "Content-Type": "video/mp4", "x-upsert": "true" }, body: fs.readFileSync(archivo) });
    if (!sube.ok) { console.error(`✗ Storage ${sube.status}: ${(await sube.text()).slice(0, 200)}`); process.exit(1); }
    subio = true;
  } catch (e) {
    console.warn(`… fetch falló (${e.cause?.code || e.message}); subiendo con curl`);
  }
  if (!subio) {
    const { execFileSync } = await import("node:child_process");
    const code = execFileSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "-X", "POST", "-H", `Authorization: Bearer ${LLAVE}`, "-H", "Content-Type: video/mp4", "-H", "x-upsert: true", "--data-binary", `@${archivo}`, urlSube]).toString();
    if (code !== "200") { console.error(`✗ Storage (curl) ${code}`); process.exit(1); }
  }
  const firma = await fetch(`${URL_SB}/storage/v1/object/sign/pulse/${encodeURI(destino)}`, {
    method: "POST", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 365 }),
  });
  const j = await firma.json();
  if (!j.signedURL) { console.error("✗ No se pudo firmar el link:", JSON.stringify(j).slice(0, 200)); process.exit(1); }
  videoUrl = `${URL_SB}/storage/v1${j.signedURL}`;
  console.log(`✓ Subido: pulse/${destino}`);
} else {
  console.warn("⚠ Sin SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY: la entrega queda sin link (solo el archivo local).");
}

const ruta = path.join(ROOT, "data/entregas.json");
const datos = JSON.parse(fs.readFileSync(ruta, "utf8"));
const id = arg("id", `motion-remi-${Date.now().toString(36)}`);
const entrega = {
  id,
  tipo: "anuncio",
  marca,
  titulo,
  contenido: arg("contenido", `Video de motion graphics (Remotion). Archivo local: \`${path.relative(ROOT, path.resolve(archivo))}\`.`),
  angulo: arg("angulo"),
  agente: "Remi",
  creadoEl: new Date().toISOString(),
  estado: "nuevo",
  formato: arg("formato", "motion 16:9"),
  videoUrl: videoUrl || undefined,
  modelo: "remotion",
};
datos.entregas = datos.entregas.filter((e) => e.id !== id);
datos.entregas.push(entrega);
datos.actualizadoEl = new Date().toISOString();
fs.writeFileSync(ruta, JSON.stringify(datos, null, 2) + "\n");
console.log(`✓ En la bandeja: ${id}${videoUrl ? `\n${videoUrl}` : ""}`);
// Equipo digital: lo que Remi entrega desde la Mac cuenta en su reporte del día (dentro de un bot no hace nada).
const { reportarDesdeMac } = await import("../../scripts/reportar-mac.mjs");
await reportarDesdeMac("remi", { resumen: `Motion entregado: ${titulo} (${marca})`, entregables: [`${titulo}${videoUrl ? ` · ${videoUrl}` : ""}`] });
