#!/usr/bin/env node
// Revisión de clientes de Level Up para Elvin — la hace Max (15/oct/2026). Reglas: scripts/meta-ads/revision.mjs
// (skill .claude/skills/revision-clientes). Cadencia: acuerdo de $3,000+ o pagó $1,500+ de una → cada 15 días; paquetes
// pequeños → cada 30. Orden: costos en máximo → último mes → 7 días → hoy; lo que funcionó; costos altos (se cambia el
// creativo, no la campaña); qué escalar; flyers y videos con CTR único < 2 % (reemplazar y rotar); frecuencia > 1.8.
//
//   node scripts/revision-clientes.mjs lista                                    quién, cada cuánto y cuándo le toca
//   node scripts/revision-clientes.mjs cliente "<nombre|empresa|cuenta>" [--enviar] [--json]   un cliente ya (antes de una reunión)
//   node scripts/revision-clientes.mjs hoy [--enviar] [--max 8] [--forzar]      los que tocan hoy; --enviar → Telegram de Elvin (bot de Max) y quedan revisados (una tanda por día)
//
// Datos: clientes de Pulse por GET /api/max?revision=1 (CRON_SECRET; o --clientes <archivo.json> para probar) y anuncios
// por la Marketing API (META_ADS_TOKEN). SOLO LECTURA: no pausa, no cambia presupuestos, no le escribe a nadie más que a Elvin.
// Estado: data/meta-ads/revisiones/estado.json; lo enviado en el día: data/meta-ads/revisiones/<fecha>.md.

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as M from "./meta-ads/core.mjs";
import { PERIODOS, analizar, cadencia, diasEntre, pendientesHoy, sumarDias, textoReporte } from "./meta-ads/revision.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIR = resolve(ROOT, "data/meta-ads/revisiones");
const ESTADO = resolve(DIR, "estado.json");

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const valor = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const [cmd, ...resto] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--max", "--clientes"].includes(args[i - 1])));

function leerEnv(nombre) {
  if (process.env[nombre]) return process.env[nombre].trim();
  const f = resolve(ROOT, ".env.local");
  if (!existsSync(f)) return null;
  const m = readFileSync(f, "utf8").match(new RegExp(`^${nombre}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}
const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
const fechaLarga = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("es-PR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

async function clientes() {
  if (valor("--clientes")) return JSON.parse(readFileSync(resolve(ROOT, valor("--clientes")), "utf8"));
  const base = (leerEnv("CONTENT_OS_URL") || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
  const r = await fetch(`${base}/api/max?revision=1`, { headers: { "x-cron-secret": leerEnv("CRON_SECRET") || "" }, signal: AbortSignal.timeout(60000) });
  const j = await r.json().catch(() => ({ ok: false, error: "HTTP " + r.status }));
  if (!r.ok || !j.ok) throw new Error("api/max?revision: " + (j.error || r.status));
  return j.clientes;
}

const leerEstado = () => (existsSync(ESTADO) ? JSON.parse(readFileSync(ESTADO, "utf8")) : { clientes: {} });
function guardarEstado(e) {
  mkdirSync(DIR, { recursive: true });
  e.actualizadoEl = new Date().toISOString();
  writeFileSync(ESTADO, JSON.stringify(e, null, 2) + "\n");
}

// Meta: 4 periodos (cuenta + por anuncio) y los anuncios con su creativo. Solo GET.
const CAMPOS_AD = "ad_id,ad_name,adset_id,adset_name,spend,impressions,reach,frequency,unique_clicks,unique_ctr,results";
async function leerCuenta(c, cuentaId) {
  const a = M.acct(cuentaId);
  const periodo = async (preset) => {
    const [cuenta, filas] = await Promise.all([
      c.graph("GET", a + "/insights", { date_preset: preset, fields: "spend,impressions,reach,frequency,unique_ctr,date_start" }).then((j) => j.data?.[0] || null),
      c.todos(a + "/insights", { level: "ad", date_preset: preset, fields: CAMPOS_AD }, 3000),
    ]);
    return { cuenta, filas };
  };
  const periodos = {};
  let nota = null;
  for (const p of PERIODOS) {
    try {
      periodos[p.clave] = await periodo(p.preset);
    } catch (e) {
      // Cuentas con años de historia: si Meta dice "demasiados datos" en máximo, se baja a 12 meses y se avisa.
      if (p.clave !== "maximo" || e.code === 190 || /#200|permission/i.test(e.message)) throw e;
      periodos[p.clave] = await periodo("last_year");
      nota = "Máximo = últimos 12 meses (Meta no dio la historia completa).";
    }
  }
  const anuncios = await c.todos(a + "/ads", { fields: "id,name,effective_status,created_time,adset_id,creative{id,object_type,video_id,image_hash,image_url,effective_instagram_media_id,effective_object_story_id}" }, 3000);
  return { periodos, anuncios, nota };
}

function explicarError(e) {
  if (e.code === 190) return { fatal: true, texto: "el token de Meta (META_ADS_TOKEN) venció: hay que renovarlo desde Bori" };
  if (/#200|permission|ads_read/i.test(e.message)) return { texto: "Meta no me deja leer los anuncios (falta el permiso de lectura). Que el estratega confirme que la cuenta está compartida con el portafolio Level Up (836808821982174) con acceso a anuncios." };
  if (e.code === 100 && /does not exist|Unsupported get request/i.test(e.message)) return { texto: "esa cuenta no existe o el ID en Pulse está mal." };
  return { texto: e.message.slice(0, 160) };
}

async function revisar(c, cliente) {
  if (!cliente.cuentaId) return { texto: textoReporte(cliente, null), sinDatos: true };
  try {
    const { periodos, anuncios, nota } = await leerCuenta(c, cliente.cuentaId);
    const a = analizar({ periodos, anuncios, hoy: hoyPR() });
    let texto = textoReporte(cliente, a);
    if (nota) texto = texto.replace("\n— Max", `\n(${nota})\n— Max`);
    return { texto, analisis: a };
  } catch (e) {
    const x = explicarError(e);
    if (x.fatal) throw new Error(x.texto);
    return { texto: textoReporte(cliente, null, { error: x.texto }), sinDatos: true };
  }
}

// Telegram (bot de Max) → Elvin, con el mismo formato que scripts/telegram-bot.mjs; y una línea de espejo en su DM de Slack.
const html = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*([^*\n]+)\*/g, "<b>$1</b>").trim();
async function aElvin(texto) {
  const token = leerEnv("TELEGRAM_BOT_TOKEN_MAX") || leerEnv("TELEGRAM_BOT_TOKEN"), chat = leerEnv("TELEGRAM_CEO_CHAT_ID");
  if (!token || !chat) throw new Error("falta TELEGRAM_BOT_TOKEN_MAX o TELEGRAM_CEO_CHAT_ID");
  for (const parte of texto.match(/[\s\S]{1,3900}(?=\n\n|$)/g) || [texto]) {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: html(parte), parse_mode: "HTML", disable_web_page_preview: true }), signal: AbortSignal.timeout(20000) });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) throw new Error("Telegram: " + (j.description || r.status));
  }
}
async function espejoSlack(texto) {
  const tok = leerEnv("SLACK_BOT_TOKEN");
  if (!tok) return;
  await fetch("https://slack.com/api/chat.postMessage", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${tok}` }, body: JSON.stringify({ channel: leerEnv("CEO_SLACK_ID") || "U08U9777PUY", text: texto.slice(0, 3900) }), signal: AbortSignal.timeout(8000) }).catch(() => {});
}

function guardarDelDia(dia, texto) {
  mkdirSync(DIR, { recursive: true });
  const f = resolve(DIR, `${dia}.md`);
  appendFileSync(f, (existsSync(f) ? "\n\n---\n\n" : `# Revisión de clientes · ${dia}\n\n`) + texto + "\n");
}

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

try {
  const token = leerEnv("META_ADS_TOKEN");
  const lista = await clientes();
  const estado = leerEstado();
  const hoy = hoyPR();

  if (cmd === "lista") {
    const filas = lista.map((x) => {
      const cad = cadencia(x), ultima = estado.clientes[x.itemId]?.ultima || null, vence = ultima ? sumarDias(ultima, cad.dias) : null;
      return { cliente: (x.empresa || x.nombre).slice(0, 30), cada: cad.dias, motivo: cad.motivo.slice(0, 40), cuenta: x.cuentaId || "— falta", ultima: ultima || "nunca", toca: vence ? (vence <= hoy ? `hoy (+${diasEntre(vence, hoy)})` : vence) : "pendiente" };
    }).sort((a, b) => a.cada - b.cada || a.cliente.localeCompare(b.cliente));
    console.table(filas);
    console.log(`${lista.length} clientes activos · cada 15 días: ${filas.filter((f) => f.cada === 15).length} · cada 30: ${filas.filter((f) => f.cada === 30).length} · sin cuenta: ${lista.filter((x) => !x.cuentaId).length}`);
  } else if (cmd === "cliente") {
    const q = norm(resto.join(" "));
    if (!q) throw new Error('Uso: cliente "<nombre | empresa | cuenta>"');
    const hallados = lista.filter((x) => norm(x.nombre).includes(q) || norm(x.empresa).includes(q) || x.cuentaId === q.replace(/\D/g, ""));
    if (!hallados.length) throw new Error(`No encontré "${resto.join(" ")}" en CLIENTE ACTIVO de Pulse.`);
    if (hallados.length > 1) throw new Error(`Hay ${hallados.length}: ${hallados.map((x) => x.empresa || x.nombre).join(" · ")}. Sé más específico.`);
    if (!token) throw new Error("Falta META_ADS_TOKEN");
    const c = M.crearCliente(token);
    const x = { ...hallados[0], cadencia: cadencia(hallados[0]) };
    const r = await revisar(c, x);
    if (flag("--json")) console.log(JSON.stringify({ cliente: x, analisis: r.analisis ? { ...r.analisis } : null }, null, 2));
    console.log(r.texto);
    if (flag("--enviar")) {
      await aElvin(r.texto);
      await espejoSlack(`[Max] Revisión de ${x.empresa || x.nombre} enviada por Telegram.`);
      estado.clientes[x.itemId] = { nombre: x.empresa || x.nombre, ultima: hoy, dias: x.cadencia.dias };
      guardarEstado(estado);
      guardarDelDia(hoy, r.texto);
      console.log("✔ enviado a Elvin");
    }
  } else if (cmd === "hoy") {
    if (!token) throw new Error("Falta META_ADS_TOKEN");
    if (flag("--enviar") && estado.pausa && !flag("--forzar")) { console.log(`Revisión en pausa: ${estado.pausa}`); process.exit(0); }
    if (flag("--enviar") && estado.ultimaTanda === hoy && !flag("--forzar")) { console.log(`La tanda de hoy ya salió (${hoy}). --forzar para mandar otra.`); process.exit(0); }
    const c = M.crearCliente(token);
    const { hoy: tocan, enFila } = pendientesHoy(lista, estado.clientes, hoy, { porDia: Number(valor("--max")) || Number(leerEnv("REVISION_POR_DIA")) || 8 });
    if (!tocan.length) { console.log("Hoy no le toca revisión a nadie."); process.exit(0); }
    const informes = [];
    for (const x of tocan) informes.push({ x, r: await revisar(c, x) });
    const nombres = informes.map(({ x }) => x.empresa || x.nombre);
    const cab = [
      `*📋 Revisión de clientes · ${fechaLarga(hoy)}*`,
      `Hoy ${informes.length}: ${nombres.join(", ")}.`,
      enFila ? `Quedan ${enFila} en fila (los mando en los próximos días).` : "",
      "Cada 15 días: acuerdo de $3,000+ o pagó $1,500+ de una · cada 30: paquetes pequeños. Te sigue uno por cliente.",
    ].filter(Boolean).join("\n");
    if (!flag("--enviar")) { console.log(cab + "\n\n" + informes.map((i) => i.r.texto).join("\n\n---\n\n")); process.exit(0); }
    await aElvin(cab);
    estado.ultimaTanda = hoy;
    for (const { x, r } of informes) {
      await aElvin(r.texto);
      estado.clientes[x.itemId] = { nombre: x.empresa || x.nombre, ultima: hoy, dias: x.cadencia.dias, ...(r.sinDatos ? { sinDatos: true } : {}) };
      guardarEstado(estado); // uno por uno: si algo se cae a mitad, lo enviado ya queda marcado
      guardarDelDia(hoy, r.texto);
    }
    await espejoSlack(`[Max] Revisión de clientes de hoy enviada por Telegram (${informes.length}): ${nombres.join(", ")}.`);
    console.log(`✔ ${informes.length} revisiones enviadas a Elvin${enFila ? ` · ${enFila} en fila` : ""}`);
  } else {
    console.log("Uso: node scripts/revision-clientes.mjs lista | cliente \"<nombre>\" [--enviar] [--json] | hoy [--enviar] [--max 8]");
    process.exit(1);
  }
} catch (e) {
  console.error("✖", e.message);
  process.exit(1);
}
