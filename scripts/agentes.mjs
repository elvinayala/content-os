#!/usr/bin/env node
// Cómo se hablan los agentes entre sí y con el equipo de Elvin. Pedido de Elvin (20/sep/2026):
// "los agentes se tienen que poder hablar entre sí — Sofi le pide algo a Nico, Max le pide algo
// a Nico — y con mi equipo personal también".
//
//   node scripts/agentes.mjs mensaje <agente> "<texto>"        deja un mensaje en el buzón de otro
//                                                              agente (sofi | nico | max | lola | elvin)
//   node scripts/agentes.mjs buzon [agente]                    mis mensajes pendientes (YO = PUENTE_BOT)
//   node scripts/agentes.mjs atendido <id> ["<respuesta>"]    marca un mensaje como atendido (y
//                                                              la respuesta vuelve al buzón del que preguntó)
//   node scripts/agentes.mjs historial [agente] [n]            últimos mensajes (panel)
//   node scripts/agentes.mjs equipo                            directorio del equipo humano (Slack)
//   node scripts/agentes.mjs slack <nombre|Uxxxx> "<texto>"    DM por Slack a alguien del equipo
//                                                              (firma automática "— <Agente>")
//   node scripts/agentes.mjs elvin "<texto>"                   avisarle a Elvin (Telegram del bot
//                                                              actual + espejo Slack)
//
// El buzón vive en la base de Pulse vía POST/GET /api/agentes (CONTENT_OS_URL + CRON_SECRET), el
// único punto que comparten los contenedores de Railway y la Mac. Cada puente lo revisa cada
// ~20 s y atiende lo que le llegó (ver telegram-puente.mjs → buzonLoop). Todo mensaje se espeja al
// DM de Slack de Elvin como [Agentes] para que él vea la conversación.
//
// Reglas (van también en cada cerebro): a Elvin y a los otros agentes, libre. Al EQUIPO HUMANO
// solo lo que su cerebro permite (Sofi: logística con Aure; Max: trazabilidad con Aure; Nico y
// Lola: nada sin OK de Elvin). Nunca a clientes. Nunca secretos.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}

const YO = (process.env.PUENTE_BOT || process.env.AGENTE || "sofi").toLowerCase();
const NOMBRE = { sofi: "Sofi", nico: "Nico", max: "Max", lola: "Lola", jarvis: "Jarvis", elvin: "Elvin" };
const BASE = env("CONTENT_OS_URL") || "https://content-os-chi-seven.vercel.app";
const SECRETO = env("CRON_SECRET");
const CEO_SLACK = env("CEO_SLACK_ID") || "U08U9777PUY";

// Directorio del equipo humano (mismo que lib/equipo-slack.ts; ids de Slack, no son secretos).
export const EQUIPO = [
  { id: "U07V7MVJ18B", nombre: "Carilin", rol: "Directora de Operaciones" },
  { id: "U08HA9QCJBG", nombre: "Aure", rol: "Asistente + Directora Comercial" },
  { id: "U08SN35L2UX", nombre: "Jessica", rol: "Project Manager (onboarding)" },
  { id: "U091X0MQXV0", nombre: "María García", rol: "Tesorería LUM" },
  { id: "U08Q51UFLSH", nombre: "Yaileen", rol: "Tesorería AIB / Team Scaling" },
  { id: "U09D4GB4MPW", nombre: "Juan Diego", rol: "Director de Estrategas (tráfico)" },
  { id: "U0916SXJE9Z", nombre: "María del Carmen", rol: "Directora Creativa" },
  { id: "U0B8FM57ECR", nombre: "Heidy", rol: "Community Manager" },
  { id: "U08CZV7EL2C", nombre: "Valentina", rol: "Sales Team Leader" },
  { id: "U0ARDBKQDCJ", nombre: "Felipe Durán", rol: "Estratega Digital" },
  { id: "U09HS09R37T", nombre: "Santiago Gutiérrez", rol: "Estratega Digital" },
  { id: "U0A3JTY3MFZ", nombre: "David Bonilla", rol: "Dev (producto AIB)" },
  { id: "U0AC0FWJ0CF", nombre: "Michael González", rol: "Creativos / edición" },
  { id: "U08U9777PUY", nombre: "Elvin", rol: "CEO" },
];
const sinAcentos = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function resolverPersona(q) {
  if (/^U[A-Z0-9]{8,}$/.test(q)) return EQUIPO.find((p) => p.id === q) || { id: q, nombre: q, rol: "" };
  const n = sinAcentos(q.replace(/^@/, ""));
  return EQUIPO.find((p) => sinAcentos(p.nombre) === n) || EQUIPO.find((p) => sinAcentos(p.nombre).startsWith(n)) || null;
}

async function api(metodo, params, body) {
  if (!SECRETO) throw new Error("Falta CRON_SECRET (.env.local o variable del servicio).");
  const url = new URL("/api/agentes", BASE);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, String(v));
  const r = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json", "x-cron-secret": SECRETO }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.ok === false) throw new Error(`api/agentes ${r.status}: ${j.error || JSON.stringify(j).slice(0, 200)}`);
  return j;
}

async function slack(token, canal, texto) {
  const r = await fetch("https://slack.com/api/chat.postMessage", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` }, body: JSON.stringify({ channel: canal, text: texto.slice(0, 3900) }), signal: AbortSignal.timeout(10000) });
  return r.json();
}
async function espejoElvin(texto) {
  const t = env("SLACK_BOT_TOKEN"); if (!t) return;
  try { await slack(t, CEO_SLACK, texto); } catch {}
}

// ---- API para importar desde el puente ----
export async function enviarMensaje(de, para, texto, hilo) {
  const j = await api("POST", {}, { de, para, texto, hilo });
  await espejoElvin(`[Agentes] ${NOMBRE[de] || de} → ${NOMBRE[para] || para}: ${texto.slice(0, 1500)}`);
  return j;
}
export async function pendientes(agente) {
  const j = await api("GET", { para: agente, pendientes: 1 });
  return j.mensajes || [];
}
export async function marcar(id, estado, respuesta) {
  return api("POST", {}, { id, estado, respuesta });
}

// ---- CLI ----
const [cmd, ...rest] = process.argv.slice(2);
// (la ruta del repo tiene un espacio: comparar rutas, no URLs)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    if (cmd === "mensaje") {
      const para = (rest[0] || "").toLowerCase(); const texto = rest.slice(1).join(" ").trim();
      if (!NOMBRE[para] || !texto) throw new Error('Uso: mensaje <sofi|nico|max|lola|elvin> "<texto>"');
      if (para === "elvin") { await avisarElvin(texto); }
      else { const j = await enviarMensaje(YO, para, texto); console.log(`✓ Mensaje #${j.id} para ${NOMBRE[para]}. Lo atiende en su próxima ronda (≤ 1 min) y su respuesta te llega a tu buzón.`); }
    } else if (cmd === "buzon") {
      const quien = (rest[0] || YO).toLowerCase();
      const m = await pendientes(quien);
      if (!m.length) console.log(`Buzón de ${NOMBRE[quien] || quien}: vacío.`);
      for (const x of m) console.log(`#${x.id} · de ${NOMBRE[x.de] || x.de} · ${String(x.creado_el).slice(0, 16)}${x.hilo ? ` · responde a #${x.hilo}` : ""}\n${x.texto}\n`);
    } else if (cmd === "atendido") {
      const id = Number(rest[0]); const respuesta = rest.slice(1).join(" ").trim();
      if (!id) throw new Error('Uso: atendido <id> ["<respuesta>"]');
      await marcar(id, "atendido", respuesta || undefined);
      if (respuesta) {
        const orig = (await api("GET", { para: YO, ultimos: 200 })).mensajes.find((x) => x.id === id);
        if (orig && orig.de !== YO) await enviarMensaje(YO, orig.de, respuesta, id);
      }
      console.log(`✓ #${id} atendido${respuesta ? " y respondido" : ""}.`);
    } else if (cmd === "historial") {
      const quien = rest[0] && NOMBRE[rest[0].toLowerCase()] ? rest[0].toLowerCase() : "";
      const j = await api("GET", quien ? { para: quien, ultimos: rest[1] || 30 } : { ultimos: rest[0] || 30 });
      for (const x of j.mensajes.reverse()) console.log(`#${x.id} ${String(x.creado_el).slice(0, 16)} ${NOMBRE[x.de] || x.de} → ${NOMBRE[x.para] || x.para} [${x.estado}]: ${x.texto.slice(0, 160)}${x.respuesta ? `\n   ↳ ${x.respuesta.slice(0, 160)}` : ""}`);
    } else if (cmd === "equipo") {
      for (const p of EQUIPO) console.log(`${p.nombre.padEnd(20)} ${p.rol.padEnd(36)} ${p.id}`);
    } else if (cmd === "slack") {
      const persona = resolverPersona(rest[0] || ""); const texto = rest.slice(1).join(" ").trim();
      if (!persona || !texto) throw new Error('Uso: slack <nombre|Uxxxx> "<texto>"  (ver: equipo)');
      const token = env("SLACK_BOT_TOKEN"); if (!token) throw new Error("Falta SLACK_BOT_TOKEN.");
      const firmado = /—\s*(Sofi|Nico|Max|Lola)\s*$/.test(texto) ? texto : `${texto}\n— ${NOMBRE[YO] || YO} (agente de Elvin)`;
      const r = await slack(token, persona.id, firmado);
      if (!r.ok) throw new Error(`Slack: ${r.error}`);
      await espejoElvin(`[Agentes] ${NOMBRE[YO] || YO} → ${persona.nombre} (Slack DM): ${texto.slice(0, 1500)}`);
      console.log(`✓ DM enviado a ${persona.nombre} (${r.channel}).`);
    } else if (cmd === "elvin") {
      await avisarElvin(rest.join(" ").trim());
    } else {
      console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).slice(0, 24).map((l) => l.slice(3)).join("\n"));
    }
  } catch (e) { console.error(`✖ ${e.message}`); process.exit(1); }
}

async function avisarElvin(texto) {
  if (!texto) throw new Error('Uso: elvin "<texto>"');
  const tokenVar = { nico: "TELEGRAM_BOT_TOKEN_NICO", max: "TELEGRAM_BOT_TOKEN_MAX", lola: "TELEGRAM_BOT_TOKEN_LOLA" }[YO] || "TELEGRAM_BOT_TOKEN";
  const tg = env(tokenVar) || env("TELEGRAM_BOT_TOKEN"); const chat = env("TELEGRAM_CEO_CHAT_ID");
  let ok = false;
  if (tg && chat) {
    const r = await fetch(`https://api.telegram.org/bot${tg}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: texto.slice(0, 3900), disable_web_page_preview: true }), signal: AbortSignal.timeout(10000) }).then((r) => r.json()).catch(() => ({}));
    ok = Boolean(r.ok);
  }
  await espejoElvin(`[${NOMBRE[YO] || YO}] ${texto}`);
  console.log(ok ? "✓ Avisado a Elvin por Telegram (+ espejo Slack)." : "✓ Avisado a Elvin por Slack (Telegram no disponible aquí).");
}
