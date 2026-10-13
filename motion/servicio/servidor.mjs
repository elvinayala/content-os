#!/usr/bin/env node
// Remi en la nube (27/sep/2026): servicio de RENDER de la fábrica de motion en Railway, para que Max (y cualquiera)
// produzca videos sin depender de la Mac de Elvin. Max escribe el guion en motion/src/fabrica/anuncios.ts, hace
// commit + push, y llama a este servicio (scripts/remi.mjs render <id>). El servicio:
//   1. baja lo último de GitHub (git pull en el clon de content-os),
//   2. empaqueta la fábrica (Remotion bundler) y renderiza cada composición pedida (Chrome headless),
//   3. sube el MP4 a Supabase Storage (bucket privado `pulse`, carpeta motion/<fecha>/) y firma un link de 1 año.
// API (cabecera x-remi-secreto = REMI_SECRETO):
//   GET  /salud                              → { ok, repo, cola }
//   POST /render { ids: ["lu-07-…-16x9"] }   → { trabajo }   (composiciones ya escritas en anuncios.ts)
//   POST /render { guiones: [{ id, marca|cliente, formato, escenas… }] } → { trabajo }   (guion en JSON, sin tocar código)
//   POST /html { id, html, assets: [{ nombre, url }] } → { trabajo }   (12/oct: composición de Hyperframes en HTML; la
//        renderiza estudio-html/ con su Chrome + ffmpeg. Sin telemetría y nunca "publish")
//   GET  /trabajo/<id>                       → { estado: en-cola|trabajando|listo|error, resultados: [{ id, url, segundos }], error }
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const PORT = Number(process.env.PORT || 8080);
const SECRETO = process.env.REMI_SECRETO || "";
const REPO = process.env.REMI_REPO || "/estado/repos/content-os";
const MOTION = path.join(REPO, "motion");
// Licencia Automators de Remotion (Elvin la compró el 28/sep): con la llave, cada render se reporta y se cobra $0.01.
const LICENCIA = process.env.REMOTION_LICENSE_KEY || null;
const trabajos = new Map();
const cola = [];
let ocupado = false;

const log = (...a) => console.log(new Date().toISOString(), ...a);
const responder = (res, code, cuerpo) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(cuerpo)); };
const autorizado = (req) => {
  const s = String(req.headers["x-remi-secreto"] || "");
  return SECRETO && s.length === SECRETO.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(SECRETO));
};

function actualizarRepo() {
  const lockHf = path.join(REPO, "estudio-html", "package-lock.json");
  const antesHf = fs.existsSync(lockHf) ? fs.readFileSync(lockHf, "utf8") : "";
  const antes = fs.existsSync(path.join(MOTION, "package-lock.json")) ? fs.readFileSync(path.join(MOTION, "package-lock.json"), "utf8") : "";
  execFileSync("git", ["-C", REPO, "pull", "--rebase", "--autostash", "-q"], { stdio: "pipe" });
  const despues = fs.readFileSync(path.join(MOTION, "package-lock.json"), "utf8");
  if (antes !== despues || !fs.existsSync(path.join(MOTION, "node_modules"))) {
    log("dependencias de motion cambiaron → npm ci");
    execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: MOTION, stdio: "inherit" });
  }
  const estudio = path.join(REPO, "estudio-html");
  if (fs.existsSync(path.join(estudio, "package-lock.json")) && (antesHf !== fs.readFileSync(path.join(estudio, "package-lock.json"), "utf8") || !fs.existsSync(path.join(estudio, "node_modules")))) {
    log("dependencias de estudio-html cambiaron → npm ci");
    execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: estudio, stdio: "inherit" });
  }
  return execFileSync("git", ["-C", REPO, "rev-parse", "--short", "HEAD"]).toString().trim();
}

async function subir(archivo, nombre) {
  const url = process.env.SUPABASE_URL, llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  const destino = `motion/${new Date().toISOString().slice(0, 10)}/${nombre}`;
  const h = { Authorization: `Bearer ${llave}` };
  const r = await fetch(`${url}/storage/v1/object/pulse/${encodeURI(destino)}`, { method: "POST", headers: { ...h, "Content-Type": "video/mp4", "x-upsert": "true" }, body: fs.readFileSync(archivo) });
  if (!r.ok) throw new Error(`Storage ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const f = await (await fetch(`${url}/storage/v1/object/sign/pulse/${encodeURI(destino)}`, { method: "POST", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 365 }) })).json();
  if (!f.signedURL) throw new Error("No se pudo firmar el link");
  return `${url}/storage/v1${f.signedURL}`;
}

// Hyperframes (12/oct): escribe la composición en /tmp, baja sus archivos y la renderiza con el CLI fijado en estudio-html/.
const ENV_HF = { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1", DO_NOT_TRACK: "1", HYPERFRAMES_SKIP_SKILLS: "1" };
async function renderHtml(t) {
  const t0 = Date.now();
  const dir = path.join("/tmp", `hf-${t.html.id}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), t.html.html);
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ id: t.html.id, name: t.html.id }));
  for (const a of t.html.assets) {
    if (a.url.startsWith("repo:")) { // archivo del repo (logos de public/marcas, capturas de motion/public…)
      const origen = path.resolve(REPO, a.url.slice(5));
      if (!origen.startsWith(REPO + path.sep) || !fs.existsSync(origen)) throw new Error(`No existe en el repo: ${a.url}`);
      fs.copyFileSync(origen, path.join(dir, "assets", a.nombre));
      continue;
    }
    const r = await fetch(a.url, { signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw new Error(`No pude bajar ${a.nombre} (${r.status})`);
    fs.writeFileSync(path.join(dir, "assets", a.nombre), Buffer.from(await r.arrayBuffer()));
  }
  const estudio = path.join(REPO, "estudio-html");
  const salida = path.join(dir, `${t.html.id}.mp4`);
  log(`trabajo ${t.id}: hyperframes ${t.html.id}`);
  execFileSync(path.join(estudio, "node_modules/.bin/hyperframes"), ["render", dir, "-o", salida, "--workers", "2"], { cwd: estudio, env: ENV_HF, stdio: "inherit", timeout: 20 * 60 * 1000 });
  const segundos = Math.round(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", salida]).toString().trim()) || 0);
  const url = await subir(salida, `${t.html.id}.mp4`);
  fs.rmSync(dir, { recursive: true, force: true });
  t.resultados.push({ id: t.html.id, url, segundos, renderSeg: Math.round((Date.now() - t0) / 1000) });
  log(`trabajo ${t.id}: ✓ ${t.html.id}`);
}

async function procesar(t) {
  t.estado = "trabajando";
  try {
    t.commit = actualizarRepo();
    if (t.html) { await renderHtml(t); t.estado = "listo"; t.terminado = new Date().toISOString(); return; }
    // El servidor corre DESDE el clon (motion/servicio/), así que resuelve el node_modules de la fábrica.
    const { bundle } = await import("@remotion/bundler");
    const { selectComposition, renderMedia } = await import("@remotion/renderer");
    log(`trabajo ${t.id}: empaquetando (${t.commit})`);
    const serveUrl = await bundle({ entryPoint: path.join(MOTION, "src/index.ts"), publicDir: path.join(MOTION, "public") });
    const piezas = [...t.ids.map((id) => ({ id, compId: id, inputProps: undefined })), ...t.guiones.map((g) => ({ id: g.id, compId: "Motion", inputProps: { anuncio: g } }))];
    for (const { id, compId, inputProps } of piezas) {
      const t0 = Date.now();
      log(`trabajo ${t.id}: render ${id}`);
      const comp = await selectComposition({ serveUrl, id: compId, inputProps });
      const salida = path.join("/tmp", `${id}.mp4`);
      await renderMedia({ composition: comp, serveUrl, codec: "h264", outputLocation: salida, inputProps, chromiumOptions: { gl: "swangle" }, logLevel: "error", licenseKey: LICENCIA });
      const url = await subir(salida, `${id}.mp4`);
      fs.rmSync(salida, { force: true });
      t.resultados.push({ id, url, segundos: Math.round(comp.durationInFrames / comp.fps), renderSeg: Math.round((Date.now() - t0) / 1000) });
      log(`trabajo ${t.id}: ✓ ${id}`);
    }
    t.estado = "listo";
  } catch (e) {
    t.estado = "error";
    t.error = String(e?.message || e).slice(0, 800);
    log(`trabajo ${t.id}: ✗ ${t.error}`);
  }
  t.terminado = new Date().toISOString();
}

async function bombear() {
  if (ocupado) return;
  ocupado = true;
  while (cola.length) await procesar(cola.shift());
  ocupado = false;
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/salud") return responder(res, 200, { ok: true, repo: fs.existsSync(MOTION), cola: cola.length, ocupado });
  if (!autorizado(req)) return responder(res, 401, { ok: false, error: "no autorizado" });
  if (req.method === "POST" && u.pathname === "/render") {
    let cuerpo = "";
    for await (const c of req) cuerpo += c;
    if (cuerpo.length > 400_000) return responder(res, 413, { ok: false, error: "guion demasiado grande" });
    let ids = [], guiones = [];
    try { const b = JSON.parse(cuerpo || "{}"); ids = b.ids || []; guiones = b.guiones || []; } catch { return responder(res, 400, { ok: false, error: "JSON inválido" }); }
    const idValido = (x) => typeof x === "string" && /^[A-Za-z0-9._-]{1,120}$/.test(x);
    ids = ids.filter(idValido);
    guiones = guiones.filter((g) => g && idValido(g.id) && Array.isArray(g.escenas) && g.escenas.length && ["9:16", "16:9", "1:1"].includes(g.formato));
    if (!ids.length && !guiones.length) return responder(res, 400, { ok: false, error: "Pasa { ids: [...] } o { guiones: [...] } válidos (id, formato 9:16|16:9|1:1, escenas)" });
    if (ids.length + guiones.length > 12) return responder(res, 400, { ok: false, error: "Máximo 12 videos por trabajo" });
    const t = { id: crypto.randomUUID().slice(0, 8), ids, guiones, estado: "en-cola", resultados: [], creado: new Date().toISOString() };
    trabajos.set(t.id, t);
    cola.push(t);
    bombear();
    return responder(res, 202, { ok: true, trabajo: t.id, enCola: cola.length });
  }
  if (req.method === "POST" && u.pathname === "/html") {
    let cuerpo = "";
    for await (const c of req) cuerpo += c;
    if (cuerpo.length > 600_000) return responder(res, 413, { ok: false, error: "composición demasiado grande" });
    let b;
    try { b = JSON.parse(cuerpo || "{}"); } catch { return responder(res, 400, { ok: false, error: "JSON inválido" }); }
    const assets = Array.isArray(b.assets) ? b.assets : [];
    if (typeof b.id !== "string" || !/^[A-Za-z0-9._-]{1,120}$/.test(b.id)) return responder(res, 400, { ok: false, error: "id inválido" });
    if (typeof b.html !== "string" || !b.html.includes("data-composition-id")) return responder(res, 400, { ok: false, error: "html no es una composición de Hyperframes (falta data-composition-id)" });
    if (assets.length > 25 || assets.some((a) => !a || !/^[A-Za-z0-9._-]{1,80}$/.test(a.nombre || "") || !/^(https:\/\/|repo:[A-Za-z0-9._\/ -]+$)/.test(a.url || "") || /\.\./.test(a.url))) return responder(res, 400, { ok: false, error: "assets: máx. 25, cada uno { nombre: a-z0-9._-, url: https://… o repo:<ruta> }" });
    const t = { id: crypto.randomUUID().slice(0, 8), ids: [], guiones: [], html: { id: b.id, html: b.html, assets }, estado: "en-cola", resultados: [], creado: new Date().toISOString() };
    trabajos.set(t.id, t);
    cola.push(t);
    bombear();
    return responder(res, 202, { ok: true, trabajo: t.id, enCola: cola.length });
  }
  const m = u.pathname.match(/^\/trabajo\/([a-f0-9-]+)$/);
  if (m) { const t = trabajos.get(m[1]); if (!t) return responder(res, 404, { ok: false, error: "no existe" }); const { guiones, html, ...resto } = t; return responder(res, 200, { ok: true, ...resto, guiones: guiones.map((g) => g.id), html: html?.id }); }
  responder(res, 404, { ok: false, error: "ruta desconocida" });
}).listen(PORT, () => log(`Remi escuchando en :${PORT} · repo ${REPO}`));
