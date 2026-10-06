#!/usr/bin/env node
// Zernio = la única API de canales de AutoFlow (Elvin, 5/oct/2026): número, WhatsApp, IG/FB, SMS y llamadas.
// EXCEPTO clientes médicos (HIPAA: Zernio no ofrece BAA) → esos van por Meta oficial en GHL + Retell
// (.claude/commands/autoflow.md §4). Este script se niega a crear el perfil de un negocio médico.
//
// La llave maestra (AIB_ZERNIO_API_KEY) es del equipo de Zernio donde también vive Resuelto: este script
// solo toca los perfiles "AutoFlow · …" que crea él, y a cada cliente le da una key LIMITADA a su perfil
// (scope: profiles) que se escribe en el .dev.vars de su repo. Ninguna key ni contraseña sale en pantalla.
//
//   node scripts/zernio.mjs estado                                  perfiles, cuentas, números y troncales (sin secretos)
//   node scripts/zernio.mjs perfil <slug> "<Negocio>" --giro "<giro>"   crea (o encuentra) el perfil del cliente
//   node scripts/zernio.mjs numeros [787|939] [--sms]                números disponibles en PR
//   node scripts/zernio.mjs comprar <slug> [+1787…] [--sin-whatsapp] [--ok]   compra (GASTO: sin --ok solo muestra el plan)
//   node scripts/zernio.mjs whatsapp-codigo <slug> [SMS|VOICE]      pide el código de WhatsApp del número de Zernio
//   node scripts/zernio.mjs voz <slug> --agente <retellAgentId>      troncal SIP → Retell + importa el número con el agente
//   node scripts/zernio.mjs key <slug> --dir <repo del cliente>      key limitada al perfil → <repo>/.dev.vars
//   node scripts/zernio.mjs cuentas <slug> [--dir <repo>]           cuentas del perfil; con --dir escribe ZERNIO_ACCOUNT_ID (WhatsApp)
//
// Registro sin secretos en data/zernio-clientes.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRO = path.join(ROOT, "data", "zernio-clientes.json");
const BASE = (process.env.ZERNIO_API_BASE || "https://zernio.com/api/v1").replace(/\/$/, "");
const PREFIJO = "AutoFlow · ";
const TZ = "America/Puerto_Rico";

// Lo que toque datos de pacientes no va por Zernio (regla de Elvin). En duda, se trata como médico.
export const MEDICO =
  /m[eé]dic|cl[ií]nic|consultori|doctor|\bdr\.?\b|dental|dentist|odont|ortodonc|laborator|farmac|hospital|salud|terapi|psic[oó]|psiquiatr|quiropr|fisiatr|pediatr|ginec|obstetr|cardi[oó]|dermat|oftalm|[oó]ptic|optometr|enfermer|rehabilit|nutricion|med\s?spa|medspa|plan m[eé]dico|seguro de salud/i;

function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \\t]*=[ \\t]*([^\\n]+)$`, "m"));
    return m ? m[1].trim() : "";
  } catch {
    return "";
  }
}
const KEY = env("AIB_ZERNIO_API_KEY");
const RETELL = env("RETELL_API_KEY");

const leer = () => {
  try {
    return JSON.parse(fs.readFileSync(REGISTRO, "utf8"));
  } catch {
    return { clientes: {} };
  }
};
const guardar = (r) => fs.writeFileSync(REGISTRO, JSON.stringify(r, null, 2) + "\n");
const cliente = (slug) => {
  const c = leer().clientes[slug];
  if (!c) throw new Error(`No hay perfil para "${slug}". Primero: perfil ${slug} "<Negocio>" --giro "<giro>".`);
  return c;
};
function anotar(slug, datos) {
  const r = leer();
  r.clientes[slug] = { ...(r.clientes[slug] || {}), ...datos, actualizado: new Date().toISOString() };
  guardar(r);
}

async function api(metodo, ruta, cuerpo) {
  if (!KEY) throw new Error("Falta AIB_ZERNIO_API_KEY (.env.local o variable del servicio).");
  const r = await fetch(BASE + ruta, {
    method: metodo,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const t = await r.text();
  let j = {};
  try {
    j = JSON.parse(t);
  } catch {
    j = { error: t.slice(0, 300) };
  }
  if (!r.ok) throw new Error(`Zernio ${metodo} ${ruta} → ${r.status} ${j.code || ""} ${j.error || ""}`.trim());
  return j;
}

// Escribe/actualiza variables en el .dev.vars del repo del cliente (ignorado por git). Nunca imprime valores.
function escribirVars(dir, vars) {
  const archivo = path.join(dir.replace(/^~/, process.env.HOME), ".dev.vars");
  if (!fs.existsSync(path.dirname(archivo))) throw new Error(`No existe la carpeta ${path.dirname(archivo)}`);
  let txt = fs.existsSync(archivo) ? fs.readFileSync(archivo, "utf8") : "";
  for (const [k, v] of Object.entries(vars)) {
    const linea = `${k}=${v}`;
    txt = new RegExp(`^${k}=.*$`, "m").test(txt) ? txt.replace(new RegExp(`^${k}=.*$`, "m"), linea) : `${txt.replace(/\n?$/, "\n")}${linea}\n`;
  }
  fs.writeFileSync(archivo, txt, { mode: 0o600 });
  return archivo;
}

const flag = (args, n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

async function estado() {
  const [p, a, n, t] = await Promise.all([api("GET", "/profiles"), api("GET", "/accounts"), api("GET", "/phone-numbers"), api("GET", "/phone-numbers/sip-trunks").catch(() => ({}))]);
  console.log("Perfiles:");
  for (const x of p.profiles || []) console.log(`  ${x.name.startsWith(PREFIJO) ? "●" : "○"} ${x.name} (${x.accountCount} cuentas) ${x._id}`);
  console.log("Cuentas:");
  for (const x of a.accounts || []) console.log(`  ${x.platform} ${x.username} → ${x.profileId?.name} ${x.isActive ? "" : "(inactiva)"}`);
  console.log("Números:");
  for (const x of n.numbers || []) console.log(`  ${x.phoneNumber} ${x.status} → ${x.profileId?.name}`);
  const troncales = t.trunks || t.sipTrunks || [];
  if (troncales.length) {
    console.log("Troncales SIP:");
    for (const x of troncales) console.log(`  ${x.label} → ${x.sipHost} (${x.numbersAttached ?? 0} números)`);
  }
  console.log("\n● = AutoFlow (lo maneja este script) · ○ = de otro equipo (Resuelto): no se toca.");
}

async function perfil(slug, nombre, giro) {
  if (!slug || !nombre || !giro) throw new Error('Uso: perfil <slug> "<Negocio>" --giro "<a qué se dedica>"');
  if (MEDICO.test(`${nombre} ${giro}`))
    throw new Error(`"${nombre}" parece de salud (${giro}). Por HIPAA los clientes médicos NO van por Zernio: Meta oficial en GHL + Retell (/autoflow §4).`);
  const nombreZ = PREFIJO + nombre;
  const ya = await api("GET", `/profiles?name=${encodeURIComponent(nombreZ)}`);
  const p = ya.profiles?.[0] ?? (await api("POST", "/profiles", { name: nombreZ, description: `AutoFlow de AI Borinquen · ${giro}`, timezone: TZ })).profile;
  anotar(slug, { negocio: nombre, giro, profileId: p._id });
  console.log(`Perfil ${ya.profiles?.[0] ? "existente" : "creado"}: ${nombreZ} (${p._id})`);
}

async function numeros(area, sms) {
  const q = new URLSearchParams({ country: "PR", limit: "10" });
  if (area) q.set("areaCode", area);
  if (sms) q.set("sms", "true");
  const r = await api("GET", `/phone-numbers/available?${q}`);
  if (!r.numbers?.length) return console.log("No hay números con ese filtro.");
  for (const x of r.numbers) console.log(`  ${x.phoneNumber}  ${x.locality || ""}  [${(x.features || []).map((f) => (typeof f === "string" ? f : f.name || f.feature || "")).join(", ")}]${x.bestEffort ? " (fuera del filtro)" : ""}`);
}

async function comprar(slug, numero, conWhatsapp, ok) {
  const c = cliente(slug);
  if (c.numberId) return console.log(`${slug} ya tiene número: ${c.telefono} (${c.numberId}).`);
  const cuerpo = { profileId: c.profileId, country: "PR", wantsSms: true, purchaseIntentId: `autoflow-${slug}`, ...(numero ? { phoneNumber: numero } : {}), ...(conWhatsapp ? {} : { connectWhatsapp: false }) };
  if (!ok) {
    console.log(`PLAN (no compré nada): número de PR ${numero || "(el primero disponible)"} para ${c.negocio}, con SMS${conWhatsapp ? " y WhatsApp" : ""}. ~$3/mes + uso.`);
    console.log("Es gasto: pídele el OK a Elvin y repite con --ok.");
    return;
  }
  const r = await api("POST", "/phone-numbers/purchase", cuerpo);
  if (r.checkoutUrl) return console.log(`Zernio pide pagar el primer número en el navegador (lo hace Elvin): ${r.checkoutUrl}`);
  const tel = r.phoneNumber?.phoneNumber || r.phoneNumber || r.numberId;
  const id = r.phoneNumber?._id || r.phoneNumber?.id || r.numberId;
  anotar(slug, { numberId: id, telefono: typeof tel === "string" ? tel : undefined });
  console.log(`Comprado: ${typeof tel === "string" ? tel : "(ver estado)"} (${id})${conWhatsapp ? ". Siguiente: whatsapp-codigo " + slug : ""}`);
}

async function whatsappCodigo(slug, metodo) {
  const c = cliente(slug);
  if (!c.numberId) throw new Error("Ese cliente no tiene número de Zernio todavía.");
  const r = await api("POST", `/phone-numbers/${c.numberId}/whatsapp/request-code`, metodo ? { method: metodo.toUpperCase() } : {});
  if (r.replaced) anotar(slug, { telefono: r.newPhoneNumber });
  console.log(r.alreadyVerified ? "WhatsApp ya estaba verificado: número activo." : `${r.message || "Código pedido"} (${r.method || "auto"})${r.replaced ? ` · Meta cambió el número a ${r.newPhoneNumber}` : ""}`);
}

async function voz(slug, agente) {
  const c = cliente(slug);
  if (!c.numberId || !c.telefono) throw new Error("Ese cliente no tiene número de Zernio todavía.");
  if (!agente) throw new Error("Falta --agente <id del agente de Retell> (sale de retell.ids.json del cliente).");
  if (!RETELL) throw new Error("Falta RETELL_API_KEY.");
  // Una troncal por cliente: cada una con sus credenciales y su tope, así los clientes quedan aislados.
  const t = await api("POST", "/phone-numbers/sip-trunks", { label: `${PREFIJO}${c.negocio}`, sipHost: "sip.retellai.com", transport: "tcp" });
  await api("POST", `/phone-numbers/${c.numberId}/sip-trunk`, { trunkId: t.id });
  const r = await fetch("https://api.retellai.com/import-phone-number", {
    method: "POST",
    headers: { Authorization: `Bearer ${RETELL}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      phone_number: c.telefono,
      termination_uri: t.termination?.uri || "sip.telnyx.com",
      sip_trunk_auth_username: t.termination?.username,
      sip_trunk_auth_password: t.digestPassword,
      transport: "TCP",
      nickname: `${PREFIJO}${c.negocio}`,
      inbound_agents: [{ agent_id: agente, weight: 1 }],
      outbound_agents: [{ agent_id: agente, weight: 1 }],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) throw new Error(`Retell import → ${r.status} ${(await r.text()).slice(0, 200)} (la troncal ${t.id} quedó creada; la contraseña se puede rotar).`);
  anotar(slug, { trunkId: t.id, retellAgente: agente });
  console.log(`Voz lista: ${c.telefono} → troncal ${t.id} → Retell (${agente}). Prueba llamando al número.`);
}

async function key(slug, dir) {
  const c = cliente(slug);
  if (!dir) throw new Error("Falta --dir <repo del cliente>: la key se escribe en su .dev.vars, nunca en pantalla.");
  const r = await api("POST", "/api-keys", { name: `${PREFIJO}${c.negocio}`, scope: "profiles", profileIds: [c.profileId] });
  const k = r.apiKey?.key;
  if (!k) throw new Error("Zernio no devolvió la key.");
  const archivo = escribirVars(dir, { ZERNIO_API_KEY: k, ZERNIO_PROFILE_ID: c.profileId });
  anotar(slug, { keyId: r.apiKey.id, keyPreview: r.apiKey.keyPreview });
  console.log(`Key limitada al perfil de ${c.negocio} guardada en ${archivo} (ZERNIO_API_KEY). Súbela al servicio con las demás variables.`);
}

async function cuentas(slug, dir) {
  const c = cliente(slug);
  const a = await api("GET", "/accounts");
  const mias = (a.accounts || []).filter((x) => (x.profileId?._id || x.profileId) === c.profileId);
  if (!mias.length) return console.log(`El perfil de ${c.negocio} todavía no tiene cuentas conectadas (WhatsApp/IG/FB).`);
  for (const x of mias) console.log(`  ${x.platform} ${x.username} ${x._id} ${x.isActive ? "" : "(inactiva)"}`);
  const wa = mias.find((x) => x.platform === "whatsapp" && x.isActive);
  anotar(slug, { cuentas: mias.map((x) => ({ platform: x.platform, id: x._id, username: x.username })) });
  if (dir && wa) console.log(`ZERNIO_ACCOUNT_ID (WhatsApp) → ${escribirVars(dir, { ZERNIO_ACCOUNT_ID: wa._id, CANAL_MODO: "zernio" })}`);
}

const [cmd, ...args] = process.argv.slice(2);
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) try {
  if (cmd === "estado") await estado();
  else if (cmd === "perfil") await perfil(args[0], args[1], flag(args, "--giro"));
  else if (cmd === "numeros") await numeros(args.find((x) => /^\d{3}$/.test(x)), args.includes("--sms"));
  else if (cmd === "comprar") await comprar(args[0], args.find((x) => /^\+\d{10,}$/.test(x)), !args.includes("--sin-whatsapp"), args.includes("--ok"));
  else if (cmd === "whatsapp-codigo") await whatsappCodigo(args[0], args[1]);
  else if (cmd === "voz") await voz(args[0], flag(args, "--agente"));
  else if (cmd === "key") await key(args[0], flag(args, "--dir"));
  else if (cmd === "cuentas") await cuentas(args[0], flag(args, "--dir"));
  else {
    console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).slice(0, 18).join("\n"));
    process.exit(cmd ? 1 : 0);
  }
} catch (e) {
  console.error("✗", e.message);
  process.exit(1);
}
