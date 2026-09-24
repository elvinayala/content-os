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
// enviar "<texto>" [agente]  — agente = "nico" (default) | "iris" | … cualquiera con su propio
// TELEGRAM_BOT_TOKEN_<AGENTE en mayúsculas>; sin ese token cae al genérico TELEGRAM_BOT_TOKEN.
if (process.argv[2] === "enviar") {
  const args = process.argv.slice(3);
  const agentes = new Set(["nico", "iris", "max", "lola", "sofi"]);
  const agente = args.length > 1 && agentes.has(args[args.length - 1].toLowerCase()) ? args.pop().toLowerCase() : "nico";
  const texto = args.join(" ").trim();
  if (!texto) { console.error("Falta el texto."); process.exit(1); }
  const token = env(`TELEGRAM_BOT_TOKEN_${agente.toUpperCase()}`) || env("TELEGRAM_BOT_TOKEN");
  const chat = env("TELEGRAM_CEO_CHAT_ID");
  let tg = false;
  if (token && chat) {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }) }).then((r) => r.json()).catch(() => ({}));
    tg = Boolean(r.ok);
  }
  let slack = false;
  const st = env("SLACK_BOT_TOKEN");
  if (st) {
    const r = await fetch("https://slack.com/api/chat.postMessage", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${st}` }, body: JSON.stringify({ channel: env("CEO_SLACK_ID") || "U08U9777PUY", text: `[${agente[0].toUpperCase()}${agente.slice(1)}] ${texto}` }) }).then((r) => r.json()).catch(() => ({}));
    slack = Boolean(r.ok);
  }
  console.log(JSON.stringify({ telegram: tg, slack, agente }));
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

// Estado de los WhatsApp de Evolution según la revisión de las 7 AM ("A) RevisionInstanciaEvoAPI").
// Esa revisión avisa en Slack, pero el 13/sep se cayó Setters (403 = WhatsApp restringió el número) y
// pasaron 9 días sin que nadie lo viera: por eso también va en la ronda.
async function whatsappN8n() {
  const K = env("N8N_API_KEY");
  const B = (env("N8N_URL") || "https://n8nv2.levelupmediapr.net").replace(/\/$/, "") + "/api/v1";
  const h = { headers: { "X-N8N-API-KEY": K }, signal: AbortSignal.timeout(20000) };
  try {
    const lista = await fetch(`${B}/executions?workflowId=MLp39LO5jJmzk9Vp&limit=1`, h).then((r) => r.json());
    const id = lista.data?.[0]?.id;
    if (!id) return { nota: "sin corrida de RevisionInstanciaEvoAPI" };
    const e = await fetch(`${B}/executions/${id}?includeData=true`, h).then((r) => r.json());
    const rd = e.data?.resultData?.runData || {};
    const out = [];
    for (const [k, v] of Object.entries(rd)) {
      if (!k.startsWith("Buscar instancia")) continue;
      const it = v[0]?.data?.main?.[0]?.[0]?.json;
      const x = Array.isArray(it?.data) ? it.data[0] : it;
      if (x?.name) out.push({ instancia: x.name, estado: x.connectionStatus, numero: String(x.ownerJid || "").split("@")[0], motivo: x.connectionStatus === "open" ? null : `${x.disconnectionReasonCode ?? "?"} desde ${String(x.disconnectionAt || "").slice(0, 10)}` });
    }
    return { revisadoEl: e.startedAt, caidas: out.filter((x) => x.estado !== "open"), instancias: out };
  } catch (err) { return { error: String(err).slice(0, 120) }; }
}

async function saludN8n(p) {
  if (p.id !== "n8n") return null;
  if (!env("N8N_API_KEY")) return { nota: "sin N8N_API_KEY en .env.local: n8n → Settings → n8n API → Create API key" };
  // Reusa scripts/n8n.mjs (últimas 24 h): workflows con error, nodo y mensaje de la última falla.
  const out = await sh("node", ["scripts/n8n.mjs", "ejecuciones", "1"], ROOT, 90000);
  if (out.startsWith("__ERR__")) return { error: out.slice(8, 300) };
  try {
    const s = JSON.parse(fs.readFileSync(path.join(ROOT, "data/n8n/salud.json"), "utf8"));
    const con = s.workflows.filter((w) => w.ok + w.error + w.otras > 0);
    const rotos = con.filter((w) => w.error > 0);
    return {
      activos: s.workflows.filter((w) => w.activo).length,
      conActividad24h: con.length,
      conErrores: rotos.length,
      muestra: rotos.slice(0, 6).map((w) => `${w.nombre}: ${w.error} error / ${w.ok} ok${w.ultimoError?.nodo ? ` — "${w.ultimoError.nodo}": ${String(w.ultimoError.mensaje || "").slice(0, 140)}` : ""}`),
      activosSinEjecuciones: s.workflows.filter((w) => w.activo && w.ok + w.error + w.otras === 0).map((w) => w.nombre).slice(0, 10),
      whatsapp: await whatsappN8n(),
    };
  } catch (e) { return { error: e.message.slice(0, 120) }; }
}

const bitacora = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "data/nico-bitacora.json"), "utf8")); } catch { return { entradas: [] }; } })();
const ajustes24h = (bitacora.entradas || []).filter((e) => new Date(e.fecha) > desde);
const pendientesElvin = (bitacora.pendientesElvin || []).filter((p) => p.estado !== "hecho");

// Solicitudes de Carilin/Aure que esperan el OK de Elvin (buzón compartido, /api/agentes).
const solicitudesEquipo = await (async () => {
  const secreto = env("CRON_SECRET"); if (!secreto) return { error: "sin CRON_SECRET" };
  try {
    const url = new URL("/api/agentes", env("CONTENT_OS_URL") || "https://content-os-chi-seven.vercel.app");
    url.searchParams.set("estado", "esperando-ok"); url.searchParams.set("para", "nico");
    const j = await fetch(url, { headers: { "x-cron-secret": secreto }, signal: AbortSignal.timeout(15000) }).then((r) => r.json());
    return (j.mensajes || []).map((m) => ({ id: m.id, de: m.de, pedido: m.texto.replace(/^\[[^\]]*\]\n?/, "").slice(0, 200), desde: m.creado_el }));
  } catch (e) { return { error: e.message.slice(0, 120) }; }
})();

const resultado = { generadoEl: new Date().toISOString(), desde: desde.toISOString(), plataformas: [], ajustes24h, pendientesElvin, solicitudesEquipo };
for (const p of INV.plataformas) {
  // p.agente.salud: el agente de WhatsApp de la plataforma (Resuelto: /salud/whatsapp da 503 si Meta restringió la cuenta).
  const [s, g, l, f, sp, n8, sa] = await Promise.all([salud(p), gitUltimas24h(p), logsRailway(p), fallosBori(p), soportePlagas(p), saludN8n(p), p.agente?.salud ? salud(p.agente) : null]);
  resultado.plataformas.push({ id: p.id, nombre: p.nombre, critico: p.critico, salud: s, ...(sa ? { saludAgente: sa } : {}), git: g, logs: l, fallos: f, soporte: sp, n8n: n8 });
}
const json = JSON.stringify(resultado, null, 2);
if (process.argv.includes("--guardar")) fs.writeFileSync(path.join(ROOT, "data/nico-ronda-crudo.json"), json + "\n");
console.log(json);
