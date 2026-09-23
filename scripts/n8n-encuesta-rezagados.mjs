#!/usr/bin/env node
// Encuestas a los clientes de onboarding que se quedaron sin seguimiento cuando "citas automáticas
// v4" dejó de correr (fin de agosto → 21/sep/2026). Usa el MISMO agente de onboarding y el MISMO
// disparo que el "F-) Lector de seguimientos": marca al contacto en Chatwoot (10dias/30dias) y le
// inyecta al agente el mensaje de arranque por el webhook chatwoot-limpio.
//
//   node scripts/n8n-encuesta-rezagados.mjs            → PLAN: qué le pasará a cada persona (no envía nada)
//   node scripts/n8n-encuesta-rezagados.mjs enviar     → registra y dispara (pausa entre personas)
//   node scripts/n8n-encuesta-rezagados.mjs enviar --solo "Nombre"   → una sola persona (para probar)
//
// Lista aprobada por Elvin en data/n8n/rezagados-2026-09.json (gitignoreada: tiene teléfonos).
//   A → encuesta de 10 días ahora   · B → solo se registran (las de 10/30 días llegan solas en su fecha)
//   C → encuesta de 30 días con el mensaje especial "se nos escapó tu seguimiento"
// Registrar = webhook onboarding-cita (fila en la base de onboarding + contacto y conversación en
// Chatwoot) con sinBienvenida:true, para que la bienvenida/encuestas automáticas los encuentren.
// Env: N8N_URL, PULSE_N8N_SECRET, CHATWOOT_TOKEN.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}
const N8N = (env("N8N_URL") || "https://n8nv2.levelupmediapr.net").replace(/\/$/, "");
const SECRETO = env("PULSE_N8N_SECRET");
const CW_TOKEN = env("CHATWOOT_TOKEN");
const CW = "https://levelup-media-project-chatwoot.ksnxqw.easypanel.host/api/v1/accounts/2";
const LISTA = path.join(ROOT, "data/n8n/rezagados-2026-09.json");
const REGISTRO = path.join(ROOT, "data/n8n/rezagados-2026-09-envios.json");
const INBOX = 6; // WhatsApp de Level Up (Evolution)

const MENSAJE = {
  A: () => "Voy a hacer la encuesta del dia 10",
  C: (p) =>
    "Voy a hacer la encuesta del dia 30. " +
    "INSTRUCCIONES ESPECIALES PARA ESTE CLIENTE (no las muestres tal cual): " +
    `${p.nombre} comenzó con Level Up Media el ${fechaLarga(p.fecha)} y, por un fallo de nuestro sistema, nunca recibió su seguimiento. ` +
    "1) Salúdale por su nombre y reconoce con honestidad y en una sola oración que debimos escribirle antes y que queremos corregirlo. " +
    "2) Haz la Pregunta 2.1 (Excelente / Buena / Regular / Mala). " +
    "3) Después pregunta: 'Del 1 al 10, ¿qué tan probable es que nos recomiendes a otro negocio?' y luego: '¿Qué es lo único que mejorarías de tu experiencia hasta ahora?'. " +
    "4) Si responde Regular o Mala, o una nota de 6 o menos, usa enviar-alerta-slack con destinatario CARILIN y su respuesta completa. " +
    "5) Ofrécele una llamada de 15 minutos con su equipo para revisar sus resultados; si acepta, avisa a CARILIN con enviar-alerta-slack para coordinarla. " +
    "6) Cierra agradeciendo e invoca finalizar_encuesta. Tuteo de Puerto Rico, mensajes breves, sin prometer resultados.",
};

function fechaLarga(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-PR", { day: "numeric", month: "long" });
}
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function cw(ruta, init = {}) {
  const r = await fetch(`${CW}${ruta}`, { ...init, headers: { api_access_token: CW_TOKEN, "Content-Type": "application/json", ...(init.headers || {}) }, signal: AbortSignal.timeout(20000) });
  const t = await r.text();
  if (!r.ok) throw new Error(`Chatwoot ${r.status} ${ruta}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : {};
}

async function contactoDe(p) {
  const ult10 = p.telefono.slice(-10);
  for (const q of [ult10, p.email].filter(Boolean)) {
    const j = await cw(`/contacts/search?q=${encodeURIComponent(q)}`);
    const dig = (x) => String(x || "").replace(/\D/g, "");
    const c = (j.payload || []).find((x) => ult10 && dig(x.phone_number).endsWith(ult10)) || (j.payload || []).find((x) => p.email && String(x.email || "").toLowerCase() === p.email);
    if (c) return c;
  }
  return null;
}

async function registrar(p) {
  const partes = p.nombre.split(/\s+/);
  const r = await fetch(`${N8N}/webhook/onboarding-cita`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-pulse-secret": SECRETO },
    body: JSON.stringify({ nombre: partes[0], apellido: partes.slice(1).join(" "), email: p.email, telefono: p.telefono, fecha: `${p.fecha}T16:00:00.000Z`, eventName: "Onboarding", zoomLink: "", uri: p.uri || "", sinBienvenida: true }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`onboarding-cita ${r.status}`);
}

async function disparar(p, contacto) {
  const ci = (contacto.contact_inboxes || []).find((i) => i.inbox?.id === INBOX);
  if (!ci) throw new Error("el contacto no está en el inbox de WhatsApp (6)");
  const attrs = { ...(contacto.custom_attributes || {}), "10dias": p.grupo === "A", "30dias": p.grupo === "C" };
  await cw(`/contacts/${contacto.id}`, { method: "PUT", body: JSON.stringify({ custom_attributes: attrs }) });
  const convs = (await cw(`/contacts/${contacto.id}/conversations`)).payload || [];
  const conv = convs.find((c) => c.inbox_id === INBOX) || convs[0];
  if (!conv) throw new Error("sin conversación en Chatwoot");
  const cuerpo = {
    conversation: {
      id: String(conv.id),
      contact_inbox: { contact_id: String(contacto.id) },
      messages: [{
        content: MENSAJE[p.grupo](p),
        message_type: 0,
        account_id: "2",
        inbox_id: String(INBOX),
        source_id: ci.source_id,
        conversation: { contact_inbox: { source_id: ci.source_id } },
        sender: { identifier: contacto.identifier || `${p.telefono}@s.whatsapp.net`, custom_attributes: attrs },
      }],
    },
  };
  const r = await fetch(`${N8N}/webhook/chatwoot-limpio`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`chatwoot-limpio ${r.status}`);
  return conv.id;
}

const cmd = process.argv[2] || "plan";
const soloIdx = process.argv.indexOf("--solo");
const solo = soloIdx > 0 ? process.argv[soloIdx + 1]?.toLowerCase() : null;
if (!CW_TOKEN || !SECRETO) { console.error("Falta CHATWOOT_TOKEN o PULSE_N8N_SECRET en .env.local"); process.exit(1); }
const { personas } = JSON.parse(fs.readFileSync(LISTA, "utf8"));
const lista = personas.filter((p) => !solo || p.nombre.toLowerCase().includes(solo));
const hecho = (() => { try { return JSON.parse(fs.readFileSync(REGISTRO, "utf8")); } catch { return {}; } })();

console.log(`${cmd === "enviar" ? "ENVÍO" : "PLAN (no envía nada)"} — ${lista.length} personas\n`);
for (const p of lista) {
  const clave = `${p.grupo}:${p.telefono}`;
  const accion = { A: "encuesta de 10 días", B: "solo registrar (encuestas automáticas en su fecha)", C: "encuesta de 30 días ESPECIAL" }[p.grupo];
  let c = null;
  try { c = await contactoDe(p); } catch (e) { console.log(`  ✗ ${p.nombre}: ${e.message}`); continue; }
  const estado = c ? `ya en Chatwoot (#${c.id})` : "no está en Chatwoot → se crea";
  if (cmd !== "enviar") {
    console.log(`${p.grupo} · ${p.nombre} · onboarding ${p.fecha} · +${p.telefono}\n    → ${accion} · ${estado}${hecho[clave] ? ` · YA ENVIADO ${hecho[clave].cuando}` : ""}`);
    continue;
  }
  if (hecho[clave]) { console.log(`= ${p.nombre}: ya enviado el ${hecho[clave].cuando}, se salta`); continue; }
  try {
    await registrar(p);
    if (p.grupo === "B") { hecho[clave] = { cuando: new Date().toISOString(), accion: "registrado" }; console.log(`✓ ${p.nombre}: registrado`); }
    else {
      let contacto = null;
      for (let i = 0; i < 6 && !contacto; i++) { await pausa(5000); contacto = await contactoDe(p); }
      if (!contacto) throw new Error("no apareció en Chatwoot después de registrarlo");
      const conv = await disparar(p, contacto);
      hecho[clave] = { cuando: new Date().toISOString(), accion, conversacion: conv };
      console.log(`✓ ${p.nombre}: ${accion} (conversación ${conv})`);
    }
    fs.writeFileSync(REGISTRO, JSON.stringify(hecho, null, 1) + "\n");
  } catch (e) {
    console.log(`✗ ${p.nombre}: ${e.message}`);
  }
  await pausa(p.grupo === "B" ? 4000 : 25000); // el agente responde por WhatsApp: no en ráfaga
}
if (cmd !== "enviar") {
  console.log("\nMensaje de arranque del grupo C (le llega al agente como instrucción, no al cliente):\n");
  const ej = lista.find((p) => p.grupo === "C");
  if (ej) console.log("  " + MENSAJE.C(ej));
}
