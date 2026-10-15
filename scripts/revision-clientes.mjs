#!/usr/bin/env node
// Revisión de cuentas de clientes de Level Up — la hace Max (v2, 15/oct/2026). Reglas: scripts/meta-ads/revision.mjs
// (skill .claude/skills/revision-clientes). Cadencia: acuerdo de $3,000+ y pago inicial de $1,500+ → dos veces al mes; lo
// demás → una vez al mes. El resumen va al ESTRATEGA (Slack, desde Ritmo) y cada punto queda como un caso en Ritmo
// (/ritmo/cuentas) que él marca: ejecutado, o por qué no. La dirección de tráfico da seguimiento. Elvin recibe el resumen
// del día por el Telegram de Max (en vista previa, los resúmenes completos).
//
//   node scripts/revision-clientes.mjs lista                                    quién, cada cuánto y cuándo le toca
//   node scripts/revision-clientes.mjs cliente "<nombre|empresa|cuenta>" [--enviar] [--caso] [--json]   un cliente ya (antes de una reunión)
//   node scripts/revision-clientes.mjs hoy [--enviar] [--max 8] [--forzar]      los que tocan hoy (una tanda por día)
//
// Datos: clientes de Pulse por GET /api/max?revision=1 (CRON_SECRET; o --clientes <archivo.json> para probar) y anuncios
// por la Marketing API (META_ADS_TOKEN). SOLO LECTURA de Meta: no pausa, no cambia presupuestos.
// Estado: data/meta-ads/revisiones/estado.json (`pausa` la detiene); lo enviado en el día: data/meta-ads/revisiones/<fecha>.md.

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as M from "./meta-ads/core.mjs";
import { PERIODOS, acciones, analizar, cadencia, diasEntre, pendientesHoy, sumarDias, textoReporte } from "./meta-ads/revision.mjs";

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
const BASE = () => (leerEnv("CONTENT_OS_URL") || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
const RITMO = () => (leerEnv("RITMO_URL") || "https://ritmo.levelupmediapr.net").replace(/\/$/, "");

async function apiMax(metodo, q, cuerpo) {
  const r = await fetch(`${BASE()}/api/max${q ? "?" + new URLSearchParams(q) : ""}`, { method: metodo, headers: { "x-cron-secret": leerEnv("CRON_SECRET") || "", "Content-Type": "application/json" }, body: cuerpo ? JSON.stringify(cuerpo) : undefined, signal: AbortSignal.timeout(90000) });
  const j = await r.json().catch(() => ({ ok: false, error: "HTTP " + r.status }));
  if (!r.ok || j.ok === false) throw new Error("api/max: " + (j.error || r.status));
  return j;
}
async function clientes() {
  if (valor("--clientes")) return JSON.parse(readFileSync(resolve(ROOT, valor("--clientes")), "utf8"));
  return (await apiMax("GET", { revision: "1" })).clientes;
}

const leerEstado = () => (existsSync(ESTADO) ? JSON.parse(readFileSync(ESTADO, "utf8")) : { clientes: {} });
function guardarEstado(e) {
  mkdirSync(DIR, { recursive: true });
  e.actualizadoEl = new Date().toISOString();
  writeFileSync(ESTADO, JSON.stringify(e, null, 2) + "\n");
}

// Meta: 4 periodos (cuenta + por anuncio), los anuncios con su creativo y las campañas/conjuntos activos (las 5 fases). Solo GET.
const CAMPOS_AD = "ad_id,ad_name,adset_id,adset_name,spend,impressions,reach,frequency,unique_clicks,unique_ctr,results";
const CAMPOS_ANUNCIO = "id,name,effective_status,created_time,campaign_id,adset_id,creative{id,object_type,video_id,image_hash,image_url,effective_instagram_media_id,effective_object_story_id,object_story_spec{link_data{child_attachments{link}}},asset_feed_spec{ad_formats}}";
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
      nota = "Máx = últimos 12 meses";
    }
  }
  const [anuncios, campanas, conjuntos] = await Promise.all([
    c.todos(a + "/ads", { fields: CAMPOS_ANUNCIO }, 3000),
    c.todos(a + "/campaigns", { fields: "id,name,objective", effective_status: ["ACTIVE"] }, 500),
    c.todos(a + "/adsets", { fields: "campaign_id,optimization_goal,destination_type,targeting{custom_audiences{name}}", effective_status: ["ACTIVE"] }, 1000),
  ]);
  return { periodos, anuncios, campanas, conjuntos, nota };
}

function explicarError(e) {
  if (e.code === 190) return { fatal: true, texto: "el token de Meta (META_ADS_TOKEN) venció: hay que renovarlo desde Bori" };
  if (/#200|permission|ads_read/i.test(e.message)) return { permiso: true, texto: "Meta no deja leer los anuncios. Hay que compartir la cuenta con el portafolio Level Up (836808821982174) con acceso a anuncios." };
  if (e.code === 100 && /does not exist|Unsupported get request/i.test(e.message)) return { texto: "esa cuenta no existe o el ID en Pulse está mal." };
  return { texto: e.message.slice(0, 160) };
}

// Una revisión: el análisis, el resumen y los puntos que el estratega tiene que marcar en Ritmo.
async function revisar(c, cliente) {
  if (!cliente.cuentaId) return { texto: textoReporte(cliente, null), acciones: [{ id: "sin-id", tipo: "entrega", prioridad: 1, texto: "Poner el ID de la cuenta publicitaria en la ficha de Pulse" }], estado: "no-optimizada" };
  try {
    const { periodos, anuncios, campanas, conjuntos, nota } = await leerCuenta(c, cliente.cuentaId);
    const a = analizar({ periodos, anuncios, campanas, conjuntos, hoy: hoyPR() });
    let texto = textoReporte(cliente, a);
    if (nota) texto += `\n_(${nota})_`;
    return { texto, analisis: a, acciones: acciones(a), estado: a.estado };
  } catch (e) {
    const x = explicarError(e);
    if (x.fatal) throw new Error(x.texto);
    return { texto: textoReporte(cliente, null, { error: x.texto }), acciones: x.permiso ? [{ id: "permiso", tipo: "entrega", prioridad: 1, texto: "Compartir la cuenta con el portafolio Level Up (836808821982174) con acceso a anuncios" }] : [], estado: "no-optimizada" };
  }
}

// El caso en Ritmo (el servidor resuelve el estratega desde Pulse y, si está encendido, le escribe por Slack).
async function abrirCaso(cliente, r) {
  return apiMax("POST", null, { accion: "revision-caso", itemId: cliente.itemId, estadoCuenta: r.estado, resumen: r.texto, acciones: r.acciones });
}

// Telegram (bot de Max) → Elvin, con el mismo formato que scripts/telegram-bot.mjs; y una línea de espejo en su DM de Slack.
const html = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, "$1<i>$2</i>").trim();
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
  appendFileSync(f, (existsSync(f) ? "\n\n---\n\n" : `# Revisión de cuentas · ${dia}\n\n`) + texto + "\n");
}

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

try {
  const token = leerEnv("META_ADS_TOKEN");
  const lista = await clientes();
  const estado = leerEstado();
  const hoy = hoyPR();

  if (cmd === "lista") {
    const filas = lista.map((x) => {
      const cad = cadencia(x), ultima = estado.clientes[x.itemId]?.ultima || null, vence = ultima ? sumarDias(ultima, cad.dias) : null;
      return { cliente: (x.empresa || x.nombre).slice(0, 30), cada: cad.dias, motivo: cad.motivo.slice(0, 48), estratega: (x.estratega || "—").slice(0, 18), ultima: ultima || "nunca", toca: vence ? (vence <= hoy ? `hoy (+${diasEntre(vence, hoy)})` : vence) : "pendiente" };
    }).sort((a, b) => a.cada - b.cada || a.cliente.localeCompare(b.cliente));
    console.table(filas);
    console.log(`${lista.length} clientes activos · dos veces al mes: ${filas.filter((f) => f.cada === 15).length} · mensual: ${filas.filter((f) => f.cada === 30).length} · sin cuenta: ${lista.filter((x) => !x.cuentaId).length}${estado.pausa ? ` · EN PAUSA: ${estado.pausa}` : ""}`);
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
    if (flag("--json")) console.log(JSON.stringify({ cliente: x, acciones: r.acciones, estado: r.estado }, null, 2));
    console.log(r.texto);
    // --caso: también lo abre en Ritmo (con aviso al estratega si está encendido). Sin --caso es solo para Elvin.
    const caso = flag("--caso") ? await abrirCaso(x, r) : null;
    if (caso?.link) console.log(`Caso en Ritmo: ${caso.link}${caso.simulacion ? " (vista previa)" : caso.avisado ? " · estratega avisado" : ""}`);
    if (flag("--enviar")) {
      await aElvin(r.texto + (caso?.link ? `\n\nEn Ritmo: ${caso.link}` : ""));
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
    if (!flag("--enviar")) { console.log(informes.map((i) => i.r.texto).join("\n\n---\n\n")); process.exit(0); }

    estado.ultimaTanda = hoy;
    let vistaPrevia = true;
    const cuenta = { "no-optimizada": 0, escalar: 0, optimizada: 0, "sin-gasto": 0 }, sinEstratega = [];
    for (const i of informes) {
      const caso = i.r.acciones.length ? await abrirCaso(i.x, i.r).catch((e) => ({ error: e.message })) : null;
      i.caso = caso;
      if (caso && !caso.error) vistaPrevia = caso.simulacion;
      cuenta[i.r.estado] = (cuenta[i.r.estado] || 0) + 1;
      if (!i.x.estratega) sinEstratega.push(i.x.empresa || i.x.nombre);
      estado.clientes[i.x.itemId] = { nombre: i.x.empresa || i.x.nombre, ultima: hoy, dias: i.x.cadencia.dias, estadoCuenta: i.r.estado };
      guardarEstado(estado); // uno por uno: si algo se cae a mitad, lo hecho ya queda marcado
      guardarDelDia(hoy, i.r.texto);
    }
    const seg = await apiMax("POST", null, { accion: "revision-seguimiento" }).catch(() => null);

    const cab = [
      `📋 *Revisión de cuentas · ${fechaLarga(hoy)}*`,
      `Hoy ${informes.length}: ${informes.map((i) => i.x.empresa || i.x.nombre).join(", ")}.`,
      "",
      [cuenta["no-optimizada"] && `⚠️ ${plural(cuenta["no-optimizada"], "no optimizada", "no optimizadas")}`, cuenta.escalar && `🚀 ${cuenta.escalar} para escalar`, cuenta.optimizada && `✅ ${plural(cuenta.optimizada, "al día", "al día")}`, cuenta["sin-gasto"] && `⏸️ ${cuenta["sin-gasto"]} sin gasto`].filter(Boolean).join(" · "),
      vistaPrevia ? "👀 Vista previa: los estrategas todavía no reciben nada. Te mando los resúmenes como les llegarían." : "Cada estratega recibió su resumen por Slack y lo marca en Ritmo.",
      seg && seg.pendientes ? `⏰ Sin marcar de antes: ${plural(seg.pendientes, "punto", "puntos")} en ${plural(seg.abiertos, "cuenta abierta", "cuentas abiertas")}${seg.recordados ? ` (recordé a ${seg.recordados})` : ""}.` : "",
      sinEstratega.length ? `Sin estratega asignado en Pulse: ${sinEstratega.join(", ")}.` : "",
      enFila ? `Quedan ${enFila} en fila para los próximos días.` : "",
      `${RITMO()}/ritmo/cuentas`,
    ].filter((l, k, xs) => l !== "" || (k > 0 && xs[k - 1] !== "")).join("\n");
    await aElvin(cab);
    if (vistaPrevia) for (const i of informes) await aElvin(i.r.texto);
    await espejoSlack(`[Max] Revisión de cuentas de hoy (${informes.length}) enviada por Telegram.`);
    console.log(`✔ ${informes.length} revisiones · ${vistaPrevia ? "vista previa" : "estrategas avisados"}${enFila ? ` · ${enFila} en fila` : ""}`);
  } else {
    console.log('Uso: node scripts/revision-clientes.mjs lista | cliente "<nombre>" [--enviar] [--caso] [--json] | hoy [--enviar] [--max 8]');
    process.exit(1);
  }
} catch (e) {
  console.error("✖", e.message);
  process.exit(1);
}
