#!/usr/bin/env node
// Revisión de cuentas de clientes de Level Up — la hace Max (v2, 15/oct/2026). Reglas: scripts/meta-ads/revision.mjs
// (skill .claude/skills/revision-clientes). SOLO LOS LUNES, por grupos fijos: acuerdo de $3,000+ → dos veces al mes (Grupo A
// 1.º y 3.er lunes, Grupo B 2.º y 4.º); lo demás → una vez al mes (Grupos 1-4, su lunes). Cada cuenta abre un caso en Ritmo
// (/ritmo/cuentas); cada estratega recibe UN mensaje con sus cuentas de la semana y tiene hasta el miércoles para marcarlas.
// Jueves: recordatorio; viernes: aviso a la dirección de tráfico. Elvin recibe el resumen del lunes por el Telegram de Max.
//
//   node scripts/revision-clientes.mjs lista                                    quién, cada cuánto y en qué grupo
//   node scripts/revision-clientes.mjs cliente "<nombre|empresa|cuenta>" [--enviar] [--caso] [--json]   un cliente ya (antes de una reunión)
//   node scripts/revision-clientes.mjs lunes [--dia AAAA-MM-DD] [--enviar] [--forzar]   la tanda del lunes (sin --enviar: solo ver)
//   node scripts/revision-clientes.mjs seguimiento                              recordatorios (jueves) y aviso a la dirección (viernes)
//
// Datos: clientes de Pulse por GET /api/max?revision=1 (CRON_SECRET; o --clientes <archivo.json> para probar) y anuncios
// por la Marketing API (META_ADS_TOKEN). SOLO LECTURA de Meta: no pausa, no cambia presupuestos.
// Estado: data/meta-ads/revisiones/estado.json (`pausa` la detiene); lo enviado en el día: data/meta-ads/revisiones/<fecha>.md.

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as M from "./meta-ads/core.mjs";
import { PERIODOS, acciones, analizar, asignarGrupos, cadencia, esLunes, lunesDelMes, nombreGrupo, sumarDias, textoReporte, tocanEsteLunes, venceEl } from "./meta-ads/revision.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIR = resolve(ROOT, "data/meta-ads/revisiones");
const ESTADO = resolve(DIR, "estado.json");

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const valor = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const [cmd, ...resto] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--max", "--clientes", "--dia"].includes(args[i - 1])));

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

let _c = null;
const c0 = () => (_c ??= M.crearCliente(leerEnv("META_ADS_TOKEN")));
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

try {
  const token = leerEnv("META_ADS_TOKEN");
  const lista = await clientes();
  const estado = leerEstado();
  const hoy = hoyPR();
  // Grupos fijos y parejos (se guardan: nadie cambia de semana salvo que cambie su acuerdo).
  estado.grupos = asignarGrupos(lista, estado.grupos || {});

  if (cmd === "lista") {
    const filas = lista.map((x) => {
      const g = estado.grupos[x.itemId];
      return { cliente: (x.empresa || x.nombre).slice(0, 30), cada: g.dias === 15 ? "2×/mes" : "mensual", grupo: nombreGrupo(g.grupo), estratega: (x.estratega || "—").slice(0, 18), motivo: cadencia(x).motivo.slice(0, 44), ultima: estado.clientes[x.itemId]?.ultima || "nunca" };
    }).sort((a, b) => a.grupo.localeCompare(b.grupo) || a.cliente.localeCompare(b.cliente));
    console.table(filas);
    const por = (g) => filas.filter((f) => f.grupo.startsWith(`Grupo ${g} `)).length;
    console.log(`${lista.length} clientes · 2×/mes: A ${por("A")} · B ${por("B")} · mensual: 1) ${por(1)} 2) ${por(2)} 3) ${por(3)} 4) ${por(4)} · sin cuenta: ${lista.filter((x) => !x.cuentaId).length}${estado.pausa ? ` · EN PAUSA: ${estado.pausa}` : ""}`);
    guardarEstado(estado);
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
  } else if (cmd === "seguimiento") {
    const r = await apiMax("POST", null, { accion: "revision-seguimiento" });
    console.log(`Seguimiento: ${r.abiertos} cuentas abiertas · ${r.pendientes} puntos sin marcar · recordatorios ${r.recordados} · a la dirección ${r.escalados}`);
  } else if (cmd === "lunes" || cmd === "hoy") {
    if (!token) throw new Error("Falta META_ADS_TOKEN");
    const dia = valor("--dia") || hoy;
    if (flag("--enviar") && estado.pausa && !flag("--forzar")) { console.log(`Revisión en pausa: ${estado.pausa}`); process.exit(0); }
    if (flag("--enviar") && estado.ultimaTanda === dia && !flag("--forzar")) { console.log(`La tanda de ${dia} ya salió. --forzar para mandar otra.`); process.exit(0); }
    if (!esLunes(dia)) {
      let prox = sumarDias(dia, 1);
      while (!esLunes(prox) || lunesDelMes(prox) > 4) prox = sumarDias(prox, 1);
      console.log(`Las revisiones salen los lunes. La próxima: ${prox} (${lunesDelMes(prox)}.º lunes: Grupo ${lunesDelMes(prox) % 2 ? "A" : "B"} + Grupo ${lunesDelMes(prox)}, ${tocanEsteLunes(lista, estado.grupos, prox).length} cuentas).`);
      guardarEstado(estado);
      process.exit(0);
    }
    const tocan = tocanEsteLunes(lista, estado.grupos, dia);
    if (!tocan.length) { console.log("Este lunes no toca revisión (5.º lunes del mes)."); guardarEstado(estado); process.exit(0); }
    const informes = [];
    for (const x of tocan) informes.push({ x, r: await revisar(c0(), x) });
    if (!flag("--enviar")) { console.log(informes.map((i) => i.r.texto).join("\n\n---\n\n")); console.log(`\n${informes.length} cuentas · ${lunesDelMes(dia)}.º lunes`); guardarEstado(estado); process.exit(0); }

    estado.ultimaTanda = dia;
    const cuenta = { "no-optimizada": 0, escalar: 0, optimizada: 0, "sin-gasto": 0 }, sinEstratega = [];
    for (const i of informes) {
      if (i.r.acciones.length) await abrirCaso(i.x, i.r).catch((e) => console.error("caso", i.x.empresa || i.x.nombre, e.message));
      cuenta[i.r.estado] = (cuenta[i.r.estado] || 0) + 1;
      if (!i.x.estratega) sinEstratega.push(i.x.empresa || i.x.nombre);
      estado.clientes[i.x.itemId] = { nombre: i.x.empresa || i.x.nombre, ultima: dia, dias: i.x.cadencia.dias, grupo: i.x.grupo, estadoCuenta: i.r.estado };
      guardarEstado(estado); // uno por uno: si algo se cae a mitad, lo hecho ya queda marcado
      guardarDelDia(dia, i.r.texto);
    }
    // UN mensaje por estratega con sus cuentas de la semana (en vista previa vuelven los textos sin mandarse).
    const av = await apiMax("POST", null, { accion: "revision-avisar" });
    const vistaPrevia = av.textos.length > 0 && av.avisados === 0 && !av.textos.some((t) => t.avisado);
    const cab = [
      `📋 *Revisión de cuentas · ${fechaLarga(dia)}*`,
      `${informes.length} cuentas (${lunesDelMes(dia)}.º lunes) · plazo: *${fechaLarga(venceEl(dia))}*`,
      "",
      [cuenta["no-optimizada"] && `⚠️ ${plural(cuenta["no-optimizada"], "no optimizada", "no optimizadas")}`, cuenta.escalar && `🚀 ${cuenta.escalar} para escalar`, cuenta.optimizada && `✅ ${cuenta.optimizada} al día`, cuenta["sin-gasto"] && `⏸️ ${cuenta["sin-gasto"]} sin gasto`].filter(Boolean).join(" · "),
      ...av.textos.map((t) => `• ${t.estratega}: ${plural(t.cuentas, "cuenta", "cuentas")}${t.avisado ? " ✓" : ""}`),
      vistaPrevia ? "👀 Vista previa: los estrategas todavía no reciben nada. Te mando lo que le llegaría a cada uno." : "Cada estratega recibió su mensaje y lo marca en Ritmo hasta el miércoles.",
      sinEstratega.length ? `Sin estratega asignado en Pulse: ${sinEstratega.join(", ")}.` : "",
      `${RITMO()}/ritmo/cuentas`,
    ].filter((l, k, xs) => l !== "" || (k > 0 && xs[k - 1] !== "")).join("\n");
    await aElvin(cab);
    if (vistaPrevia) for (const t of av.textos) await aElvin(`_Le llegaría a ${t.estratega}:_\n\n${t.texto.replace(/<([^|>]+)\|([^>]+)>/g, "$2: $1")}`);
    await espejoSlack(`[Max] Revisión de cuentas del lunes (${informes.length}) enviada por Telegram.`);
    console.log(`✔ ${informes.length} cuentas · ${av.textos.length} estrategas · ${vistaPrevia ? "vista previa" : `${av.avisados} avisados`}`);
  } else {
    console.log('Uso: node scripts/revision-clientes.mjs lista | cliente "<nombre>" [--enviar] [--caso] [--json] | lunes [--dia AAAA-MM-DD] [--enviar] | seguimiento');
    process.exit(1);
  }
} catch (e) {
  console.error("✖", e.message);
  process.exit(1);
}
