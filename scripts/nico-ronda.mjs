#!/usr/bin/env node
// La parte determinista de la ronda diaria de Nico (el vibecoder). Junta los hechos crudos
// para que /ronda-nico los convierta en el reporte de ~10 líneas que Elvin lee en Telegram.
//
//   node scripts/nico-ronda.mjs            → imprime el JSON con salud, logs, git, bitácora
//   node scripts/nico-ronda.mjs --guardar  → además lo escribe en data/nico-ronda-crudo.json
//   node scripts/nico-ronda.mjs enviar "<texto>"   → manda el reporte final a Elvin (Telegram
//                                                    con el bot de Nico si existe, si no el de
//                                                    Sofi; siempre espejo al DM de Slack)
//
// Lee data/plataformas.json. No toca nada: solo lee. Todo lo que falla se reporta, nunca tumba
// la ronda (una plataforma sin respuesta es justamente un hallazgo).
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = process.cwd();
const INV = JSON.parse(fs.readFileSync(path.join(ROOT, "data/plataformas.json"), "utf8"));

function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}

// ---- envío del reporte final ----
if (process.argv[2] === "enviar") {
  const texto = process.argv.slice(3).join(" ").trim();
  if (!texto) { console.error("Falta el texto."); process.exit(1); }
  const token = env("TELEGRAM_BOT_TOKEN_NICO") || env("TELEGRAM_BOT_TOKEN");
  const chat = env("TELEGRAM_CEO_CHAT_ID");
  let tg = false;
  if (token && chat) {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }) }).then((r) => r.json()).catch(() => ({}));
    tg = Boolean(r.ok);
  }
  let slack = false;
  const st = env("SLACK_BOT_TOKEN");
  if (st) {
    const r = await fetch("https://slack.com/api/chat.postMessage", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${st}` }, body: JSON.stringify({ channel: env("CEO_SLACK_ID") || "U08U9777PUY", text: `[Nico] ${texto}` }) }).then((r) => r.json()).catch(() => ({}));
    slack = Boolean(r.ok);
  }
  console.log(JSON.stringify({ telegram: tg, slack }));
  process.exit(tg || slack ? 0 : 1);
}

// ---- chequeos ----
const desde = new Date(Date.now() - 24 * 3600 * 1000);
const sh = async (cmd, args, cwd, ms = 40000) => {
  try { const { stdout } = await run(cmd, args, { cwd, timeout: ms, maxBuffer: 4e6, env: { ...process.env, PATH: `${process.env.HOME}/.npm-global/bin:/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}` } }); return stdout; }
  catch (e) { return `__ERR__ ${(e.stdout || "") + (e.stderr || e.message)}`.slice(0, 1500); }
};

async function salud(p) {
  if (!p.salud) return { estado: "n/a" };
  const headers = {};
  if (p.saludAuth) { const k = env(p.saludAuth); if (!k) return { estado: "sin llave", detalle: p.saludAuth }; headers.Authorization = `Bearer ${k}`; }
  const t0 = Date.now();
  try {
    const r = await fetch(p.salud, { headers, redirect: "manual", signal: AbortSignal.timeout(15000) });
    // 405 = el endpoint existe pero solo acepta POST (ej. /api/auditoria): está vivo.
    const ok = r.status < 400 || r.status === 405;
    return { estado: ok ? "ok" : "caida", http: r.status, ms: Date.now() - t0 };
  } catch (e) { return { estado: "caida", error: e.message.slice(0, 120), ms: Date.now() - t0 }; }
}

async function gitUltimas24h(p) {
  if (!p.repo || !fs.existsSync(path.join(p.repo, ".git")) && !fs.existsSync(path.join(p.repo, "..", ".git"))) {
    // subcarpetas dentro de AGENTE CONTENIDO: usar el repo raíz filtrando por ruta
    if (p.repo && p.repo.startsWith(path.join(process.env.HOME, "AGENTE CONTENIDO"))) {
      const out = await sh("git", ["log", `--since=${desde.toISOString()}`, "--pretty=%h %ad %s", "--date=short", "--", p.repo], path.join(process.env.HOME, "AGENTE CONTENIDO"));
      return out.startsWith("__ERR__") ? [] : out.trim().split("\n").filter(Boolean);
    }
    return [];
  }
  const out = await sh("git", ["log", `--since=${desde.toISOString()}`, "--pretty=%h %ad %s", "--date=short"], p.repo);
  if (out.startsWith("__ERR__")) return [];
  const lineas = out.trim().split("\n").filter(Boolean);
  const sucio = await sh("git", ["status", "--porcelain"], p.repo);
  return { commits: lineas, sinCommitear: sucio.startsWith("__ERR__") ? 0 : sucio.trim().split("\n").filter(Boolean).length };
}

async function logsRailway(p) {
  if (p.hosting !== "railway" || !p.railway?.servicio || !p.repo) return null;
  const out = await sh("npx", ["--yes", "@railway/cli", "logs", "--service", p.railway.servicio, "--lines", "400"], p.repo, 60000);
  if (out.startsWith("__ERR__")) return { error: out.slice(8, 300) };
  const lineas = out.split("\n");
  const malas = lineas.filter((l) => /error|exception|fatal|OOM|out of memory|ECONNREFUSED|unhandled|502|503|crash|restart/i.test(l) && !/no error|0 errors/i.test(l));
  return { lineas: lineas.length, sospechosas: malas.length, muestra: malas.slice(-8).map((l) => l.slice(0, 220)) };
}

async function fallosBori(p) {
  if (p.id !== "bori") return null;
  // GET /api/fallos-abiertos (19/sep): mismo panel Equipo → Fallos pero por token de
  // SOLO LECTURA, sin emails de clientes. Antes se pedía /api/fallos, que no existe en GET.
  const tok = env("BORI_METRICS_TOKEN") || env("BORI_OPERADOR_TOKEN");
  if (!tok) return { nota: "sin BORI_METRICS_TOKEN en .env.local: revisar el panel Equipo → Fallos a mano" };
  try {
    const r = await fetch(`${p.prod}/api/fallos-abiertos?dias=7`, { headers: { Authorization: `Bearer ${tok}` }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { http: r.status };
    const j = await r.json();
    const lista = j.abiertos || [];
    return {
      abiertos: lista.length,
      pagando: lista.filter((f) => f.pagando).length,
      muestra: lista.slice(0, 5).map((f) => `${f.tipo}: ${String(f.mensaje || f.huella).slice(0, 140)} (${f.veces}x${f.pagando ? ", paga" : ""})`),
    };
  } catch (e) { return { error: e.message.slice(0, 120) }; }
}

async function soportePlagas(p) {
  if (p.id !== "plagas") return null;
  const tok = env("PLAGAS_OPERADOR_TOKEN") || env("OPERADOR_TOKEN");
  if (!tok) return { nota: "sin PLAGAS_OPERADOR_TOKEN en .env.local" };
  try {
    const r = await fetch(`${p.prod}/api/operador/conversaciones`, { headers: { "x-operador-token": tok }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return { http: r.status };
    const j = await r.json();
    const convs = j.conversaciones || j.items || (Array.isArray(j) ? j : []);
    const recientes = [];
    for (const c of convs) for (const m of c.mensajes || []) {
      const ts = new Date(m.creadoEl || m.createdAt || m.ts || 0);
      if (ts > desde && (m.rol === "user" || m.role === "user")) recientes.push({ de: c.titulo || c.telefono || c.id, texto: String(m.texto || m.contenido || m.content || "").slice(0, 160) });
    }
    const quejas = recientes.filter((m) => /no (funciona|sirve|responde|me llega|genera|puede)|error|fall|problema|lento|mal|otra vez|todav[ií]a/i.test(m.texto));
    const jobsErr = (j.jobs || []).filter((x) => /error|fall/i.test(x.estado || x.status || "")).length;
    return { mensajesUsuario24h: recientes.length, posiblesQuejas: quejas.slice(0, 6), jobsConError: jobsErr };
  } catch (e) { return { error: e.message.slice(0, 120) }; }
}

const bitacora = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "data/nico-bitacora.json"), "utf8")); } catch { return { entradas: [] }; } })();
const ajustes24h = (bitacora.entradas || []).filter((e) => new Date(e.fecha) > desde);
const pendientesElvin = (bitacora.pendientesElvin || []).filter((p) => p.estado !== "hecho");

const resultado = { generadoEl: new Date().toISOString(), desde: desde.toISOString(), plataformas: [], ajustes24h, pendientesElvin };
for (const p of INV.plataformas) {
  const [s, g, l, f, sp] = await Promise.all([salud(p), gitUltimas24h(p), logsRailway(p), fallosBori(p), soportePlagas(p)]);
  resultado.plataformas.push({ id: p.id, nombre: p.nombre, critico: p.critico, salud: s, git: g, logs: l, fallos: f, soporte: sp });
}
const json = JSON.stringify(resultado, null, 2);
if (process.argv.includes("--guardar")) fs.writeFileSync(path.join(ROOT, "data/nico-ronda-crudo.json"), json + "\n");
console.log(json);
