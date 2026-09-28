#!/usr/bin/env node
// Remi en la nube: pide renders de la fábrica de motion al servicio de Railway (motion/servicio/servidor.mjs).
// Lo usa Max (o cualquiera) SIN la Mac: escribe el guion en motion/src/fabrica/anuncios.ts, hace commit + push y:
//   node scripts/remi.mjs render <id> [<id>…] [--entregar --marca <m> [--titulo "…"] [--formato "…"]]
//   node scripts/remi.mjs render --guion <archivo.json | 'JSON'> [--entregar --marca <m> …]
//     (guion en JSON: { id, marca | cliente: { nombre, logoUrl, fondo, acento, fuente }, formato, escenas: […] };
//      se guarda copia en data/motion/guiones/<id>.json. Así Max produce motion SIN editar código.)
//   node scripts/remi.mjs render --guion <json> --cliente <slug> [--proponer --titulo "…" --texto "…"]
//     --cliente: toma la MARCA del cliente de su expediente de Max (ficha.marca = { nombre, logoUrl, fondo, acento,
//       fuente }); se fija con: node scripts/max.mjs ficha <slug> '{"marca":{…}}'  (paso 2: tema automático).
//     --proponer: sube los videos terminados a #max-aprobaciones como "creativos" del cliente; al aprobarse, el servidor
//       los guarda en su carpeta de Drive (videos/) y los manda a su canal (paso 3). Todos son MOTION GRAPHICS.
//   node scripts/remi.mjs salud
// --entregar deja cada video en la bandeja de Entregas (data/entregas.json, agente "Remi").
// Env: REMI_URL + REMI_SECRETO (.env.local / Railway).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = (n) => process.env[n] || (fs.existsSync(path.join(ROOT, ".env.local")) ? (fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}=(.*)$`, "m"))?.[1] || "").trim().replace(/^["']|["']$/g, "") : "");
const URL_REMI = env("REMI_URL") || "https://remi-production-6765.up.railway.app";
const SECRETO = env("REMI_SECRETO");
const [, , cmd, ...resto] = process.argv;
const arg = (n) => { const i = resto.indexOf(`--${n}`); return i >= 0 ? resto[i + 1] : undefined; };
const ids = resto.filter((x, i) => !x.startsWith("--") && !(i > 0 && resto[i - 1].startsWith("--") && resto[i - 1] !== "--entregar"));
let guiones = [];
if (arg("guion")) {
  const g = arg("guion");
  const txt = g.trim().startsWith("{") || g.trim().startsWith("[") ? g : fs.readFileSync(path.resolve(g), "utf8");
  guiones = [].concat(JSON.parse(txt));
  fs.mkdirSync(path.join(ROOT, "data/motion/guiones"), { recursive: true });
  for (const x of guiones) fs.writeFileSync(path.join(ROOT, "data/motion/guiones", `${x.id}.json`), JSON.stringify(x, null, 2) + "\n");
}
const h = { "x-remi-secreto": SECRETO, "Content-Type": "application/json" };

// API de Max (expediente de clientes y #max-aprobaciones).
const BASE = (env("CONTENT_OS_URL") || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
async function apiMax(metodo, q, cuerpo) {
  const r = await fetch(`${BASE}/api/max${q ? "?" + new URLSearchParams(q) : ""}`, { method: metodo, headers: { "x-cron-secret": env("CRON_SECRET"), "Content-Type": "application/json" }, body: cuerpo ? JSON.stringify(cuerpo) : undefined, signal: AbortSignal.timeout(30000) });
  const j = await r.json().catch(() => ({ ok: false, error: "HTTP " + r.status }));
  if (!r.ok || j.ok === false) throw new Error("api/max: " + (j.error || j.texto || r.status));
  return j;
}
const slugCliente = arg("cliente");
if (slugCliente && guiones.length) {
  const { cliente: exp } = await apiMax("GET", { cliente: slugCliente });
  if (!exp) { console.error(`✖ No existe el cliente ${slugCliente} (node scripts/max.mjs clientes)`); process.exit(1); }
  const m = exp.ficha?.marca || {};
  const faltan = ["fondo", "acento"].filter((k) => !m[k]);
  if (faltan.length) {
    console.error(`✖ ${slugCliente} no tiene su marca completa (falta ${faltan.join(", ")}). Fíjala con SU logo real:\n  node scripts/max.mjs ficha ${slugCliente} '{"marca":{"nombre":"…","logoUrl":"https://…","fondo":"#…","acento":"#…","fuente":"Inter"}}'`);
    process.exit(1);
  }
  if (!m.logoUrl && !m.logoCapas) console.warn(`⚠ ${slugCliente} sin logo real en su ficha: la firma sale solo con su nombre. Pídelo (Jessica / carpeta del cliente) antes de entregarle los videos.`);
  // Todo lo de ficha.marca pasa al tema (logo por capas, motivo, paleta, música…); lo que el tema no usa se ignora.
  for (const g of guiones) g.cliente ??= { ...m, nombre: m.nombre || exp.nombre };
  console.log(`🎨 Marca de ${exp.nombre}: fondo ${m.fondo} · acento ${m.acento} · ${m.fuente || "Inter"}`);
}

if (cmd === "salud") {
  console.log(await (await fetch(`${URL_REMI}/salud`)).text());
  process.exit(0);
}
if (cmd !== "render" || (!ids.length && !guiones.length)) {
  console.error('Uso: remi.mjs render <id>… [--entregar --marca <m> --titulo "…" --formato "…"] | remi.mjs salud');
  process.exit(1);
}
if (!SECRETO) { console.error("Falta REMI_SECRETO"); process.exit(1); }

const r = await fetch(`${URL_REMI}/render`, { method: "POST", headers: h, body: JSON.stringify({ ids: guiones.length ? ids.filter((x) => !guiones.some((g) => g.id === x)) : ids, guiones }) });
const j = await r.json();
if (!j.ok) { console.error("✖", j.error || r.status); process.exit(1); }
const n = ids.length + guiones.length;
console.log(`⏳ trabajo ${j.trabajo} (${n} video${n > 1 ? "s" : ""}) — Remi baja lo último de GitHub y renderiza…`);
let t;
for (let i = 0; i < 360; i++) {
  await new Promise((s) => setTimeout(s, 5000));
  t = await (await fetch(`${URL_REMI}/trabajo/${j.trabajo}`, { headers: h })).json();
  if (t.estado === "listo" || t.estado === "error") break;
}
if (t?.estado !== "listo") { console.error("✖", t?.error || t?.estado || "sin respuesta"); process.exit(1); }
for (const x of t.resultados) console.log(`✓ ${x.id} (${x.segundos} s, render ${x.renderSeg} s)\n  ${x.url}`);

if (resto.includes("--proponer")) {
  const slug = slugCliente || arg("proponer-a");
  if (!slug) { console.error("--proponer necesita --cliente <slug>"); process.exit(1); }
  const texto = arg("texto") || `Motion graphics para ${slug} (${t.resultados.length} video${t.resultados.length > 1 ? "s" : ""}):\n` + t.resultados.map((x, i) => `${i + 1}. ${guiones.find((g) => g.id === x.id)?.titulo || x.id} · ${x.segundos} s`).join("\n");
  const r2 = await apiMax("POST", null, { accion: "proponer", cliente: slug, tipo: "creativos", titulo: arg("titulo") || "Videos de motion graphics", contenido: texto, datos: { imagenes: [], videos: t.resultados.map((x) => x.url) } });
  console.log(`✔ #${r2.id} en #max-aprobaciones (creativos · ${slug}). Al aprobarse: Drive (videos/) + canal del cliente.${r2.aviso ? " ⚠ " + r2.aviso : ""}`);
}

if (resto.includes("--entregar")) {
  const marca = arg("marca");
  if (!marca) { console.error("--entregar necesita --marca"); process.exit(1); }
  const ruta = path.join(ROOT, "data/entregas.json");
  const datos = JSON.parse(fs.readFileSync(ruta, "utf8"));
  for (const x of t.resultados) {
    const id = `motion-remi-${x.id}`;
    datos.entregas = datos.entregas.filter((e) => e.id !== id);
    datos.entregas.push({
      id, tipo: "anuncio", marca, titulo: arg("titulo") || x.id, agente: "Remi", creadoEl: new Date().toISOString(), estado: "nuevo",
      formato: arg("formato") || `motion · ${x.segundos} s`, videoUrl: x.url, modelo: "remotion",
      contenido: `Video de motion renderizado en la nube (servicio remi, commit ${t.commit}). Guion: motion/src/fabrica/anuncios.ts (${x.id}).`,
    });
  }
  datos.actualizadoEl = new Date().toISOString();
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 2) + "\n");
  console.log(`✓ ${t.resultados.length} en la bandeja de Entregas`);
}
