#!/usr/bin/env node
// Remi en la nube (27/sep/2026): servicio de RENDER de la fábrica de motion en Railway, para que Max (y cualquiera)
// produzca videos sin depender de la Mac de Elvin. Max escribe el guion en motion/src/fabrica/anuncios.ts, hace
// commit + push, y llama a este servicio (scripts/remi.mjs render <id>). El servicio:
//   1. baja lo último de GitHub (git pull en el clon de content-os),
//   2. empaqueta la fábrica (Remotion bundler) y renderiza cada composición pedida (Chrome headless),
//   3. sube el MP4 a Supabase Storage (bucket privado `pulse`, carpeta motion/<fecha>/) y firma un link de 1 año.
// API (cabecera x-remi-secreto = REMI_SECRETO):
//   GET  /salud                              → { ok, repo, cola }
//   POST /render { ids: ["lu-07-…-16x9"] }   → { trabajo }
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
  const antes = fs.existsSync(path.join(MOTION, "package-lock.json")) ? fs.readFileSync(path.join(MOTION, "package-lock.json"), "utf8") : "";
  execFileSync("git", ["-C", REPO, "pull", "--rebase", "--autostash", "-q"], { stdio: "pipe" });
  const despues = fs.readFileSync(path.join(MOTION, "package-lock.json"), "utf8");
  if (antes !== despues || !fs.existsSync(path.join(MOTION, "node_modules"))) {
    log("dependencias de motion cambiaron → npm ci");
    execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: MOTION, stdio: "inherit" });
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

async function procesar(t) {
  t.estado = "trabajando";
  try {
    t.commit = actualizarRepo();
    // El servidor corre DESDE el clon (motion/servicio/), así que resuelve el node_modules de la fábrica.
    const { bundle } = await import("@remotion/bundler");
    const { selectComposition, renderMedia } = await import("@remotion/renderer");
    log(`trabajo ${t.id}: empaquetando (${t.commit})`);
    const serveUrl = await bundle({ entryPoint: path.join(MOTION, "src/index.ts"), publicDir: path.join(MOTION, "public") });
    for (const id of t.ids) {
      const t0 = Date.now();
      log(`trabajo ${t.id}: render ${id}`);
      const comp = await selectComposition({ serveUrl, id });
      const salida = path.join("/tmp", `${id}.mp4`);
      await renderMedia({ composition: comp, serveUrl, codec: "h264", outputLocation: salida, chromiumOptions: { gl: "swangle" }, logLevel: "error" });
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
    let ids = [];
    try { ids = JSON.parse(cuerpo || "{}").ids || []; } catch { return responder(res, 400, { ok: false, error: "JSON inválido" }); }
    ids = ids.filter((x) => /^[A-Za-z0-9._-]{1,120}$/.test(x)).slice(0, 12);
    if (!ids.length) return responder(res, 400, { ok: false, error: "Pasa { ids: [...] } (máx. 12)" });
    const t = { id: crypto.randomUUID().slice(0, 8), ids, estado: "en-cola", resultados: [], creado: new Date().toISOString() };
    trabajos.set(t.id, t);
    cola.push(t);
    bombear();
    return responder(res, 202, { ok: true, trabajo: t.id, enCola: cola.length });
  }
  const m = u.pathname.match(/^\/trabajo\/([a-f0-9-]+)$/);
  if (m) { const t = trabajos.get(m[1]); return t ? responder(res, 200, { ok: true, ...t }) : responder(res, 404, { ok: false, error: "no existe" }); }
  responder(res, 404, { ok: false, error: "ruta desconocida" });
}).listen(PORT, () => log(`Remi escuchando en :${PORT} · repo ${REPO}`));
