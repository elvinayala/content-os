#!/usr/bin/env node
// Fábrica de MVPs AutoFlow — "MVP en 24 horas" por prospecto (jugada 3 del plan de
// guerra Q4 2026). El prospecto recibe un paquete que puede TOCAR antes de la llamada:
// propuesta (index) · presentación .pptx · landing (rediseño o nueva) · chat · voz real
// · recorrido "por dentro" del sistema (CRM + dónde vive su agente).
// Patrón simple del repo (como /prospectar): script + JSON, sin DB.
//
//   node scripts/demo-cliente/demo.mjs nuevo --negocio "Clínica X" --nicho "dental" \
//        --web https://... --instagram handle --whatsapp 787... --dolor "..." [--tipo fisico|digital]
//        [--ciudad Caguas] [--contacto "Dra. X"] [--color "#0f766e"] [--logo https://...png]
//   node scripts/demo-cliente/demo.mjs generar   <slug>   # Claude: intents + prompt de voz + propuesta
//   node scripts/demo-cliente/demo.mjs voz       <slug>   # Retell: crea el agente "Demo AutoFlow · X"
//   node scripts/demo-cliente/demo.mjs construir <slug>   # arma el sitio (propuesta + landing + chat + voz + sistema)
//   node scripts/demo-cliente/demo.mjs deck      <slug>   # presentación .pptx personalizada (pptxgenjs)
//   node scripts/demo-cliente/demo.mjs desplegar <slug>   # Netlify (zip deploy) → URL
//   node scripts/demo-cliente/demo.mjs pdf       <slug>   # exporta los .pptx a PDF con Keynote (macOS) → site/pdf/
//   node scripts/demo-cliente/demo.mjs portal    <slug>   # registra el Portal AutoFlow en Content OS (+ webhook de Retell)
//   node scripts/demo-cliente/demo.mjs nota      <slug>   # nota (o deal) en Pipedrive AIB
//   node scripts/demo-cliente/demo.mjs todo      <slug>   # todo lo anterior en orden
//   node scripts/demo-cliente/demo.mjs listar
//   deck acepta --via implementacion|capacitacion (default implementacion): la vía B es la
//   Academia AIB (grupal $2,500 · 1:1 $4,000/4 meses) para el dueño que quiere aprender.
//
// Portal AutoFlow (21/sep/2026): además del sitio estático, cada prospecto tiene un portal vivo en
// Content OS (/portal/<slug>?k=token) con sus agentes, llamadas REALES transcritas, CRM y
// "solicitar cambio". El token es HMAC(AUTOFLOW_PORTAL_SECRET, slug): este script lo calcula igual
// que la app, así el link va en la propuesta, el deck y la nota sin llamar a ninguna API.
//
// Archivos: data/demos/<slug>/{config.json, generado.json, retell.json, site/} y data/demos/index.json.
// Plantillas: demos/_plantilla-autoflow/{chat,voz,propuesta}.html (copias congeladas de Glenn).
// La voz real usa el endpoint central /api/demo-webcall del Content OS (la key de Retell
// nunca viaja al navegador ni a Netlify).

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const DEMOS = path.join(ROOT, "data", "demos");
const TPL = path.join(ROOT, "demos", "_plantilla-autoflow");
const INDEX = path.join(DEMOS, "index.json");

const WEBCALL_URL =
  process.env.DEMO_WEBCALL_URL ||
  "https://content-os-chi-seven.vercel.app/api/demo-webcall";
const WA_AIB = "19393040491";
const CONTENT_OS_URL = (process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
// Escalera vigente (Elvin, 21/sep/2026): mensualidad $147 chat · $297 voz · $497 ambos.
const PRECIOS = {
  chat: { nombre: "Agente de chat", inicial: "$1,500", mensual: "$147/mes", desc: "WhatsApp e Instagram atendidos 24/7. Responde, precalifica, toma datos y agenda. CRM incluido." },
  voz: { nombre: "Agente de voz", inicial: "$2,500", mensual: "$297/mes", desc: "Contesta el teléfono con voz de Puerto Rico. Orienta, toma datos y agenda. Escala a tu equipo." },
  completo: { nombre: "AutoFlow completo", inicial: "$3,500", mensual: "$497/mes", desc: "Chat + voz + CRM configurado (no en blanco) + agenda + portal. Los 2 sistemas: citas y atención." },
  academia: { nombre: "Academia AIB · grupal", inicial: "$2,500", mensual: "3 meses", desc: "12 sesiones en vivo + implementación guiada de tu primer agente + comunidad. Pago único o 3 × $997." },
  uno: { nombre: "Acompañamiento 1:1", inicial: "$4,000", mensual: "4 meses", desc: "Lo construyes tú con nosotros al lado: sesiones semanales, revisión de tu sistema y tu equipo." },
};
const GARANTIA = "Garantía: funcionando en 21 días o no corre la mensualidad · sin permanencia · financiable (inicial + 2 pagos a 30 días)";
const VOICE_ID = "custom_voice_ac0ebbc0d0419afa7cd1882530"; // voz "Valentina" (workspace AIB)
const VOICE_MODEL = "eleven_v3";
const PIPEDRIVE_PIPELINE = 3; // "DIAGNÓSTICO DE AUTOMATIZACIÓN" (cuenta AIB)
const PIPEDRIVE_STAGE = 33;

// ---------- utilidades ----------
function env(name) {
  if (process.env[name]) return process.env[name].trim();
  try {
    const raw = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
    const m = raw.match(new RegExp(`^${name}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}
const log = (s) => console.log(s);
const die = (s) => { console.error(`\n❌ ${s}\n`); process.exit(1); };
const hoy = () => new Date().toISOString().slice(0, 10);
const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const readJSON = (p, fb = null) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fb; } };
const writeJSON = (p, o) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 2) + "\n"); };
const dirDe = (slug) => path.join(DEMOS, slug);
function cargar(slug) {
  const d = dirDe(slug);
  const config = readJSON(path.join(d, "config.json"));
  if (!config) die(`No existe data/demos/${slug}/config.json (corre "nuevo" primero)`);
  return { d, config, generado: readJSON(path.join(d, "generado.json")), retell: readJSON(path.join(d, "retell.json")) };
}
function hexToRgb(hex) {
  const h = (hex || "#10b981").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// Portal AutoFlow: mismo token que lib/portal/acceso.ts (HMAC-SHA256 hex, 32 chars).
function tokenPortal(slug) {
  const secreto = env("AUTOFLOW_PORTAL_SECRET");
  if (!secreto) return "";
  return crypto.createHmac("sha256", secreto).update(`portal:${slug}`).digest("hex").slice(0, 32);
}
function portalUrl(slug) {
  const k = tokenPortal(slug);
  return k ? `${CONTENT_OS_URL}/portal/${slug}?k=${k}` : "";
}
function webhookRetell() {
  const s = env("RETELL_WEBHOOK_SECRET");
  return s ? `${CONTENT_OS_URL}/api/retell-webhook?s=${s}` : "";
}
// Lo que el agente extrae al terminar la llamada; el portal lo convierte en lead.
const POST_CALL_ANALYSIS = [
  { type: "string", name: "nombre", description: "Nombre de la persona que llamó, si lo dijo." },
  { type: "string", name: "telefono", description: "Teléfono que dejó la persona, con dígitos, si lo dio." },
  { type: "string", name: "interes", description: "Servicio, producto o tratamiento por el que preguntó." },
  { type: "boolean", name: "quiere_cita", description: "true si pidió o aceptó una cita, visita o llamada de seguimiento." },
  { type: "string", name: "fecha_preferida", description: "Día u horario que prefirió para la cita, si lo dijo." },
];
function actualizarIndice(slug, patch) {
  const idx = readJSON(INDEX, { actualizadoEl: "", demos: [] });
  const i = idx.demos.findIndex((x) => x.slug === slug);
  const base = i >= 0 ? idx.demos[i] : { slug };
  const nuevo = { ...base, ...patch };
  if (i >= 0) idx.demos[i] = nuevo; else idx.demos.push(nuevo);
  idx.actualizadoEl = new Date().toISOString();
  writeJSON(INDEX, idx);
}
function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { out[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true"; }
    else out._.push(argv[i]);
  }
  return out;
}
const escHtml = (s) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);

// ---------- nuevo ----------
function nuevo(a) {
  if (!a.negocio) die('Falta --negocio "Nombre del negocio"');
  const slug = a.slug || slugify(a.negocio);
  const config = {
    slug, negocio: a.negocio, nicho: a.nicho || "", tipo: a.tipo || "fisico",
    web: a.web || "", instagram: (a.instagram || "").replace(/^@/, ""), whatsapp: a.whatsapp || "",
    telefono: a.telefono || "", ciudad: a.ciudad || "Puerto Rico", contacto: a.contacto || "",
    dolor: a.dolor || "", servicios: a.servicios || "", notas: a.notas || "",
    color: a.color || "#10b981", logoUrl: a.logo || "", creadoEl: hoy(),
  };
  writeJSON(path.join(dirDe(slug), "config.json"), config);
  actualizarIndice(slug, { negocio: config.negocio, nicho: config.nicho, creadoEl: config.creadoEl, estado: "config" });
  log(`✓ data/demos/${slug}/config.json`);
  return slug;
}

// ---------- generar (Claude) ----------
async function scrape(url) {
  if (!url) return "";
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/128 Safari/537.36", "Accept-Language": "es-PR,es;q=0.9" }, signal: AbortSignal.timeout(12000) });
    const html = await r.text();
    const meta = [...html.matchAll(/<meta[^>]+(?:name|property)=["'](?:description|og:description|og:title)["'][^>]+content=["']([^"']+)/gi)].map((m) => m[1]).join(" · ");
    const texto = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    return `${meta}\n${texto}`.slice(0, 7000);
  } catch (e) { log(`  (no pude leer ${url}: ${e.message})`); return ""; }
}
async function scrapeIG(handle) {
  if (!handle) return "";
  try {
    const r = await fetch(`https://www.instagram.com/${handle}/`, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const m = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i);
    return m ? m[1] : "";
  } catch { return ""; }
}
function promptGenerar(c, web, ig) {
  return `Eres el equipo de AI Borinquen (AutoFlow). Vas a preparar la DEMO PERSONALIZADA de un asistente de IA para un prospecto, antes de la llamada de ventas. Devuelve SOLO un JSON válido (sin comentarios, sin markdown).

NEGOCIO: ${c.negocio}
NICHO: ${c.nicho || "(no dado)"} · TIPO: ${c.tipo} · CIUDAD: ${c.ciudad}
CONTACTO: ${c.contacto || "(no dado)"} · WHATSAPP/TEL: ${c.whatsapp || c.telefono || "(no dado)"}
DOLOR PRINCIPAL (lo que dijo el setter): ${c.dolor || "(no dado)"}
SERVICIOS (según el setter): ${c.servicios || "(no dado)"}
NOTAS: ${c.notas || "-"}
TEXTO DE SU WEB (${c.web || "sin web"}):
"""${web || "(sin datos)"}"""
INSTAGRAM (@${c.instagram || "-"}): """${ig || "(sin datos)"}"""

REGLAS DURAS
- Español de Puerto Rico, TUTEO (tú/tienes). Nunca voseo. Nunca la palabra "gratis". Nunca prometas ingresos.
- Usa SOLO información real del negocio (web/IG/setter). Si no sabes precios, horarios o dirección, NO inventes: di que un miembro del equipo confirma y toma los datos.
- El asistente SIEMPRE empuja a UNA acción: dejar nombre + WhatsApp/teléfono (o agendar cita si el negocio agenda).
- Chat: HTML mínimo (<b>, <br>), emojis con moderación. Voz: TEXTO PLANO hablado, sin emojis ni símbolos, 1–2 frases, teléfonos dígito a dígito.
- Palabras clave "k": minúsculas, sin acentos, en español e inglés, ordenadas de lo específico a lo general.

JSON EXACTO:
{
 "asistente": "nombre femenino corto y boricua para la asistente (ej. Camila, Valeria, Nicole)",
 "descripcion": "tarjeta del negocio, ≤110 caracteres, con ciudad si se sabe",
 "saludo": "primer mensaje del chat, empieza con 👋, presenta al asistente virtual de ${c.negocio}, lista 4-5 temas que puede atender, termina invitando a escribir",
 "intents": [ {"k":["..."],"es":"...","en":"..."} ],
 "fallback": {"es":"...","en":"..."},
 "leadReply": {"es":"...","en":"..."},
 "voz": {
   "kb": [ {"k":["..."],"es":"frase hablada","en":"spoken","ofrecerCita":false} ],
   "fallback": {"es":"...","en":"..."},
   "lead": {"es":"...","en":"..."},
   "saludo": {"es":"...","en":"..."},
   "prompt": "prompt de sistema completo para el agente de voz (Retell): # Identidad (nombre, negocio, calidez boricua), # Estilo (tuteo PR, 1-2 frases, sin emojis ni markdown, cambia a inglés si le hablan en inglés, teléfonos dígito a dígito, sin apelativos cariñosos), # Tu tarea (1 entender qué necesita, 2 orientar con la base, 3 tomar nombre + teléfono o agendar, 4 despedirte y usar end_call), # Base de conocimiento (solo lo real; explícito 'nunca inventes precios/horarios'), # Reglas",
   "begin": "primera frase hablada del agente al contestar",
   "boosted": ["nombre del negocio", "marcas o términos propios que el STT deba reconocer"]
 },
 "landing": {
   "eyebrow": "2-4 palabras: qué es el negocio y dónde (ej. 'Clínica de estética · San Juan')",
   "titular": "H1 de la landing del negocio (no de AutoFlow): la promesa al cliente final, ≤12 palabras",
   "subtitulo": "1-2 frases de apoyo dirigidas al cliente final",
   "servicios": [ {"nombre":"...","descripcion":"1 frase"} ],
   "beneficios": ["3-4 razones para elegir a ${c.negocio}, sin superlativos vacíos"],
   "sobre": "2-3 frases sobre el negocio con lo real (años, dueño, especialidad, ciudad)",
   "faq": [ {"p":"pregunta frecuente del cliente final","r":"respuesta corta y honesta (si no sabes un dato, invita a escribir)"} ],
   "cta": "texto del botón principal, ej. 'Agenda tu cita por WhatsApp'",
   "horario": "horario si se conoce, si no: 'Escríbenos y te confirmamos el horario'"
 },
 "deck": {
   "subtitulo": "1 línea bajo el título de portada",
   "situacion": ["3-4 bullets: lo que vimos en ${c.negocio} (dolor, señales de la web/IG, lo que dijo el setter)"],
   "costo": ["3 bullets: qué le cuesta hoy no responder/confirmar (sin inventar cifras de ingresos; usa 78% y 67% de Laura si aplica)"],
   "sistema": ["4 bullets: cómo queda el sistema para ${c.negocio}: agente de chat en sus canales, agente de voz, CRM configurado con su embudo, agenda/confirmaciones"],
   "diaUno": ["3-4 bullets: qué pasa la primera semana (instalación con su número, entrenamiento con sus servicios, prueba en vivo, ajuste)"],
   "proximoPaso": "1 frase: el siguiente paso concreto al terminar la llamada"
 },
 "sistema": {
   "etapas": ["5 etapas del embudo del CRM de ${c.negocio} en orden, nombres cortos (ej. Nuevo → Calificado → Cita agendada → Atendido → Seguimiento)"],
   "leads": [ {"nombre":"nombre boricua ficticio","canal":"WhatsApp|Instagram|Llamada","interes":"servicio real del negocio","etapa":"una de las etapas","hora":"hh:mm p.m."} ],
   "conversacion": [ {"de":"cliente|agente","texto":"..."} ],
   "cita": {"servicio":"...","cuando":"ej. jueves 3:30 p.m.","confirmadaPor":"WhatsApp"}
 },
 "propuesta": {
   "titular": "1 frase para la página de propuesta: qué hace este equipo digital por ${c.negocio}",
   "dolor": "2-3 frases describiendo el problema que vimos (usa el dolor del setter y señales de la web/IG: mensajes sin responder, llamadas perdidas, citas que se caen, etc.)",
   "resumen": "2 frases: qué cambia con AutoFlow para este negocio en concreto",
   "resultados": ["3 o 4 resultados concretos y creíbles, sin cifras inventadas de ingresos"],
   "primerPaso": "1 frase: cuál es el primer paso (ej. instalación en 21 días con su número actual)"
 }
}
Cantidad: 10-14 intents de chat (incluye: precio/cotización, servicios principales por separado, ubicación, horario, contacto, cita/agendar, humano, gracias, hola). 8-12 entradas en voz.kb (las mismas ideas, habladas, cortas; ofrecerCita=true en las de servicios y cita). landing.servicios 4-6, faq 4-5. sistema.leads 6 (repartidos en etapas y canales), sistema.conversacion 6-8 mensajes (el agente toma datos y agenda; en la voz del negocio, tuteo). Los nombres de los leads son ficticios y se marcan como ejemplo.`;
}
async function generar(slug) {
  const { d, config } = cargar(slug);
  const key = env("ANTHROPIC_API_KEY");
  if (!key) die("Falta ANTHROPIC_API_KEY en .env.local");
  log(`→ Leyendo la web e Instagram de ${config.negocio}…`);
  const [web, ig] = await Promise.all([scrape(config.web), scrapeIG(config.instagram)]);
  log(`→ Claude arma el entrenamiento (chat + voz + propuesta)…`);
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: key });
  // tool_use con input_schema = JSON válido garantizado (un prompt de voz multilínea
  // rompía el JSON en texto libre).
  const resp = await client.messages.create({
    model: "claude-sonnet-5", max_tokens: 14000,
    tools: [{
      name: "entregar_demo",
      description: "Entrega el paquete de la demo personalizada con la estructura pedida.",
      input_schema: {
        type: "object",
        properties: {
          asistente: { type: "string" }, descripcion: { type: "string" }, saludo: { type: "string" },
          intents: { type: "array", items: { type: "object", properties: { k: { type: "array", items: { type: "string" } }, es: { type: "string" }, en: { type: "string" } }, required: ["k", "es", "en"] } },
          fallback: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } }, required: ["es", "en"] },
          leadReply: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } }, required: ["es", "en"] },
          voz: { type: "object", properties: {
            kb: { type: "array", items: { type: "object", properties: { k: { type: "array", items: { type: "string" } }, es: { type: "string" }, en: { type: "string" }, ofrecerCita: { type: "boolean" } }, required: ["k", "es", "en"] } },
            fallback: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } }, required: ["es", "en"] },
            lead: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } }, required: ["es", "en"] },
            saludo: { type: "object", properties: { es: { type: "string" }, en: { type: "string" } }, required: ["es", "en"] },
            prompt: { type: "string" }, begin: { type: "string" }, boosted: { type: "array", items: { type: "string" } },
          }, required: ["kb", "fallback", "lead", "saludo", "prompt", "begin", "boosted"] },
          propuesta: { type: "object", properties: { titular: { type: "string" }, dolor: { type: "string" }, resumen: { type: "string" }, resultados: { type: "array", items: { type: "string" } }, primerPaso: { type: "string" } }, required: ["titular", "dolor", "resumen", "resultados", "primerPaso"] },
          landing: { type: "object", properties: {
            eyebrow: { type: "string" }, titular: { type: "string" }, subtitulo: { type: "string" },
            servicios: { type: "array", items: { type: "object", properties: { nombre: { type: "string" }, descripcion: { type: "string" } }, required: ["nombre", "descripcion"] } },
            beneficios: { type: "array", items: { type: "string" } }, sobre: { type: "string" },
            faq: { type: "array", items: { type: "object", properties: { p: { type: "string" }, r: { type: "string" } }, required: ["p", "r"] } },
            cta: { type: "string" }, horario: { type: "string" },
          }, required: ["eyebrow", "titular", "subtitulo", "servicios", "beneficios", "sobre", "faq", "cta", "horario"] },
          deck: { type: "object", properties: {
            subtitulo: { type: "string" }, situacion: { type: "array", items: { type: "string" } }, costo: { type: "array", items: { type: "string" } },
            sistema: { type: "array", items: { type: "string" } }, diaUno: { type: "array", items: { type: "string" } }, proximoPaso: { type: "string" },
          }, required: ["subtitulo", "situacion", "costo", "sistema", "diaUno", "proximoPaso"] },
          sistema: { type: "object", properties: {
            etapas: { type: "array", items: { type: "string" } },
            leads: { type: "array", items: { type: "object", properties: { nombre: { type: "string" }, canal: { type: "string" }, interes: { type: "string" }, etapa: { type: "string" }, hora: { type: "string" } }, required: ["nombre", "canal", "interes", "etapa", "hora"] } },
            conversacion: { type: "array", items: { type: "object", properties: { de: { type: "string" }, texto: { type: "string" } }, required: ["de", "texto"] } },
            cita: { type: "object", properties: { servicio: { type: "string" }, cuando: { type: "string" }, confirmadaPor: { type: "string" } }, required: ["servicio", "cuando", "confirmadaPor"] },
          }, required: ["etapas", "leads", "conversacion", "cita"] },
        },
        required: ["asistente", "descripcion", "saludo", "intents", "fallback", "leadReply", "voz", "propuesta", "landing", "deck", "sistema"],
      },
    }],
    tool_choice: { type: "tool", name: "entregar_demo" },
    messages: [{ role: "user", content: promptGenerar(config, web, ig) }],
  });
  const uso = resp.content.find((b) => b.type === "tool_use");
  if (!uso) die("Claude no devolvió el paquete (sin tool_use)");
  const gen = uso.input;
  if (!Array.isArray(gen.intents) || gen.intents.length < 6) die("Faltan intents");
  gen.fuentes = { web: web ? config.web : null, instagram: ig ? config.instagram : null, generadoEl: new Date().toISOString(), modelo: "claude-sonnet-5" };
  writeJSON(path.join(d, "generado.json"), gen);
  actualizarIndice(slug, { asistente: gen.asistente, estado: "generado" });
  log(`✓ generado.json — asistente "${gen.asistente}", ${gen.intents.length} intents, ${gen.voz?.kb?.length ?? 0} respuestas de voz`);
}

// ---------- voz (Retell) ----------
async function voz(slug) {
  const { d, config, generado } = cargar(slug);
  if (!generado) die("Corre 'generar' primero");
  const key = env("RETELL_API_KEY");
  if (!key) die("Falta RETELL_API_KEY en .env.local");
  const H = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const api = async (p, body) => {
    const r = await fetch("https://api.retellai.com" + p, { method: "POST", headers: H, body: JSON.stringify(body) });
    const t = await r.text(); if (!r.ok) throw new Error(`${p} → ${r.status}: ${t.slice(0, 400)}`); return JSON.parse(t);
  };
  log("→ Creando el Retell LLM…");
  const llm = await api("/create-retell-llm", {
    general_prompt: generado.voz.prompt, begin_message: generado.voz.begin,
    model: "claude-4.5-haiku", model_temperature: 0.4, start_speaker: "agent",
    general_tools: [{ type: "end_call", name: "end_call", description: "Colgar la llamada. Úsala inmediatamente después de despedirte, cuando la persona se despida o confirme que no necesita nada más." }],
  });
  log(`✓ LLM ${llm.llm_id}`);
  log("→ Creando el agente de voz…");
  const agent = await api("/create-agent", {
    agent_name: `Demo AutoFlow · ${config.negocio}`,
    response_engine: { type: "retell-llm", llm_id: llm.llm_id },
    voice_id: config.voiceId || VOICE_ID, voice_model: VOICE_MODEL, language: "multi",
    interruption_sensitivity: 0.6, responsiveness: 0.8, voice_speed: 1.12, voice_temperature: 0.7,
    enable_backchannel: true, max_call_duration_ms: 180000, end_call_after_silence_ms: 90000,
    boosted_keywords: (generado.voz.boosted || []).slice(0, 40),
    post_call_analysis_data: POST_CALL_ANALYSIS,
    ...(webhookRetell() ? { webhook_url: webhookRetell() } : {}),
  });
  const out = { agent_id: agent.agent_id, llm_id: llm.llm_id, voice_id: config.voiceId || VOICE_ID, created_at: new Date().toISOString() };
  writeJSON(path.join(d, "retell.json"), out);
  actualizarIndice(slug, { agentId: agent.agent_id, estado: "voz" });
  log(`✓ Agente ${agent.agent_id} ("Demo AutoFlow · ${config.negocio}")`);
}


// ---------- landing (rediseño o nueva) ----------
function fill(h, tokens) { for (const [k, v] of Object.entries(tokens)) h = h.split(`{{${k}}}`).join(v); return h; }
function waLinkNegocio(c) {
  const num = (c.whatsapp || c.telefono || "").replace(/\D/g, "");
  const n = num ? (num.length === 10 ? "1" + num : num) : WA_AIB;
  return `https://wa.me/${n}?text=${encodeURIComponent(`Hola, vengo de la página de ${c.negocio}`)}`;
}
function construirLanding(c, g) {
  const L = g.landing || {};
  const conv = (g.sistema?.conversacion || []).slice(0, 5);
  const chatPreview = conv.length
    ? conv.map((m) => `<div class="m ${m.de === "cliente" ? "c" : ""}">${escHtml(m.texto)}<i>${m.de === "cliente" ? "" : escHtml(g.asistente)}</i></div>`).join("")
    : `<div class="m c">Hola, quiero información</div><div class="m">${escHtml(g.saludo.replace(/<[^>]+>/g, "").slice(0, 140))}</div>`;
  const tel = c.whatsapp || c.telefono;
  return fill(fs.readFileSync(path.join(TPL, "landing.html"), "utf8"), {
    NEGOCIO: escHtml(c.negocio), COLOR: c.color, EYEBROW: escHtml(L.eyebrow || c.nicho), TITULAR: escHtml(L.titular || ""),
    SUBTITULO: escHtml(L.subtitulo || ""), CTA: escHtml(L.cta || "Escríbenos por WhatsApp"), HORARIO: escHtml(L.horario || ""),
    LOGO: c.logoUrl ? `<img src="${escHtml(c.logoUrl)}" alt="">` : "", INICIAL: escHtml(c.negocio.trim()[0].toUpperCase()),
    CHAT_PREVIEW: chatPreview, WA_LINK: waLinkNegocio(c), CIUDAD: escHtml(c.ciudad || "Puerto Rico"),
    CONTACTO_LINEA: tel ? `WhatsApp ${escHtml(tel)}` : "Por WhatsApp o Instagram" + (c.instagram ? ` · @${escHtml(c.instagram)}` : ""),
    SERVICIOS: (L.servicios || []).map((sv, i) => `<div class="card"><span class="n">${i + 1}</span><h3>${escHtml(sv.nombre)}</h3><p>${escHtml(sv.descripcion)}</p></div>`).join(""),
    BENEFICIOS: (L.beneficios || []).map((b) => `<li>${escHtml(b)}</li>`).join(""),
    SOBRE: escHtml(L.sobre || ""), ANIO: String(new Date().getFullYear()),
    FAQ: (L.faq || []).map((f) => `<details><summary>${escHtml(f.p)}</summary><p>${escHtml(f.r)}</p></details>`).join(""),
  });
}

// ---------- sistema ("por dentro": embudo + conversaciones + agenda + agentes) ----------
function construirSistema(c, g) {
  const S = g.sistema || {};
  const etapas = S.etapas?.length ? S.etapas : ["Nuevo", "Calificado", "Cita agendada", "Atendido", "Seguimiento"];
  const leads = S.leads || [];
  const canal = (x) => /insta/i.test(x) ? "ig" : /llam|tel|voz/i.test(x) ? "tel" : "wa";
  const columnas = etapas.map((e) => {
    const ls = leads.filter((l) => l.etapa === e);
    return `<div class="col"><h4>${escHtml(e)}<i>${ls.length}</i></h4>${ls.map((l) => `<div class="lead-card"><b>${escHtml(l.nombre)}</b>${escHtml(l.interes)}<span class="ch ${canal(l.canal)}">${escHtml(l.canal)}</span><small>${escHtml(l.hora)} · atendido por ${escHtml(g.asistente)}</small></div>`).join("")}</div>`;
  }).join("");
  const conv = S.conversacion || [];
  // La persona de la conversación = el lead cuyo nombre de pila aparece en el chat;
  // si no, el que tiene cita; si no, el primero. Evita etiquetar el hilo con otro nombre.
  const textoConv = conv.map((m) => m.texto).join(" ");
  const primero = leads.find((l) => new RegExp(`\\b${l.nombre.split(" ")[0]}\\b`, "i").test(textoConv))
    || leads.find((l) => /cita|agend/i.test(l.etapa)) || leads[0];
  const ordenados = primero ? [primero, ...leads.filter((l) => l !== primero)] : leads;
  const lista = ordenados.slice(0, 6).map((l, i) => `<div class="it ${i === 0 ? "on" : ""}"><b>${escHtml(l.nombre)}</b>${escHtml(l.canal)} · ${escHtml(l.interes)}</div>`).join("");
  const conversacion = conv.map((m) => `<div class="msg ${m.de === "cliente" ? "c" : "a"}"><span class="who ${m.de === "cliente" ? "" : "ai"}">${m.de === "cliente" ? escHtml(primero?.nombre || "Cliente") : escHtml(g.asistente) + " · asistente"}</span>${escHtml(m.texto)}</div>`).join("");
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const cita = S.cita || {};
  const citas = leads.filter((l) => /cita|agend/i.test(l.etapa)).slice(0, 5);
  const cal = dias.map((d) => `<div class="h">${d}</div>`).join("") + dias.map((d, i) => {
    const evs = citas.filter((_, k) => k % 7 === i).map((l) => `<div class="ev ai">${escHtml(l.hora)} ${escHtml(l.nombre.split(" ")[0])} · ${escHtml(l.interes)}</div>`).join("");
    const propia = i === 3 && cita.servicio ? `<div class="ev">${escHtml(cita.cuando)} · ${escHtml(cita.servicio)}</div>` : "";
    return `<div>${i + 15}${propia}${evs}</div>`;
  }).join("");
  return fill(fs.readFileSync(path.join(TPL, "sistema.html"), "utf8"), {
    NEGOCIO: escHtml(c.negocio), COLOR: c.color, CONTACTO: escHtml(c.contacto || "Tú"), ASISTENTE: escHtml(g.asistente),
    N_LEADS: String(leads.length), N_CITAS: String(citas.length || (cita.servicio ? 1 : 0)),
    COLUMNAS: columnas, LISTA_CONV: lista, CONVERSACION: conversacion, CALENDARIO: cal,
    RESPUESTA: "seg.", SIN_RESPONDER: "—",
    PORTAL_BANNER: portalUrl(c.slug) ? `<div class="expl" style="margin:0 0 18px"><b>Esto es una simulación.</b> Tu portal con tus llamadas y leads reales está aquí: <a href="${escHtml(portalUrl(c.slug))}" style="color:var(--bori)">entrar a tu portal AutoFlow →</a></div>` : "",
    CITA_TEXTO: cita.servicio ? `${escHtml(primero?.nombre || "El cliente")} quedó con cita de ${escHtml(cita.servicio)} el ${escHtml(cita.cuando)}, confirmada por ${escHtml(cita.confirmadaPor)}.` : "Cada cita entra a la agenda con el servicio y el canal por el que llegó.",
  });
}

// ---------- deck (.pptx personalizado) ----------
// Apertura PR de 3 slides (quiénes somos · visión · a quién hemos ayudado) → lo que vimos → lo
// que cuesta → el sistema → pruébalo (links + portal) → la cuenta → niveles/precios → primera
// semana → próximo paso. Con --via capacitacion, la oferta es la Academia AIB (vía B).
// Regla: solo cifras y testimonios respaldados (vault/estilo/testimonios-ai-borinquen.md).
const APERTURA = {
  quienes: [
    "Agencia de automatización con IA, 100 % de Puerto Rico. Hablas con personas de aquí.",
    "Parte de IA Market, la casa de Level Up Media (Meta Ads) y AI Borinquen (agentes de IA).",
    "Desarrolladores propios: los agentes se entrenan con tu negocio, no se copian y pegan.",
    "No vendemos un chatbot: instalamos un empleado digital con un trabajo concreto.",
  ],
  vision: [
    "Que ningún negocio de la isla pierda un cliente por no contestar a tiempo.",
    "Digitalizar Y capacitar: lo instalamos por ti, o te enseñamos a hacerlo tú.",
    "Agentes por rol (recepción, ventas, citas), en tu voz y en tu idioma.",
    "Todo medible: tú ves las llamadas, los mensajes y los leads en tu portal.",
  ],
  casos: [
    ["Teo · Mano Santa PR (terapista)", "Respondía solo el 20 % de sus leads. Hoy responde en segundos, precalifica y agenda.", "\u201cMe da tranquilidad saber que las conversaciones se siguen atendiendo.\u201d"],
    ["Milton · Caribe Paint", "Asistente de atención y seguimiento instalado sin fricción.", "\u201cPensé que la implementación sería mucho más complicada, pero ha sido bastante fácil.\u201d"],
    ["Clínicas, dentistas, contratistas y oficinas de servicio en toda la isla", "Recepción por voz, WhatsApp atendido 24/7 y CRM que no se entrega en blanco.", "Te presentamos al cliente de tu mismo rubro en la llamada."],
  ],
};
const ACADEMIA = {
  situacion: ["Quieres usar la IA en tu negocio y no sabes por dónde empezar.", "Has probado herramientas sueltas y ninguna quedó funcionando.", "No quieres depender de nadie para cambiar un precio o un horario.", "Tienes tiempo para aprender, no presupuesto para que lo hagan todo por ti."],
  programa: ["Semanas 1-2 · Fundamentos: cómo piensa un agente y qué trabajo le vas a dar.", "Semanas 3-5 · Tu agente de chat: entrenado con tu negocio, en WhatsApp e Instagram.", "Semanas 6-8 · Tu agente de voz: la recepcionista que contesta cuando nadie puede.", "Semanas 9-12 · Tu embudo y tu seguimiento: CRM, confirmaciones, medición."],
  construyes: ["Un agente de chat funcionando en tu número.", "Un agente de voz con tu información y tu tono.", "Tu embudo con etapas y confirmaciones automáticas.", "El criterio para seguir mejorándolo tú, sin jerga."],
  diaUno: ["Sesión 1 en vivo (grupal, 90 min) + tu espacio en la comunidad.", "Plantillas y accesos de las herramientas que vamos a usar.", "Tu primer agente de chat en borrador antes de la semana 3.", "Acompañamiento por WhatsApp entre sesiones."],
};
async function deck(slug, via = "implementacion") {
  const { d, config: c, generado: g } = cargar(slug);
  if (!g) die("Corre 'generar' primero");
  const academia = /capac|academ/i.test(via || "");
  const reg = (readJSON(INDEX, { demos: [] }).demos || []).find((x) => x.slug === slug) || {};
  const urls = reg.urls || { propuesta: "(link al MVP)", chat: "chat/", voz: "voz/" };
  const uPortal = portalUrl(slug);
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "AI Borinquen"; pptx.company = "AI Borinquen"; pptx.title = `${c.negocio} · ${academia ? "Academia AIB" : "AutoFlow"}`;
  const ACC = c.color.replace("#", ""), BG = "07160F", PANEL = "0D2118", TXT = "E9F5EE", MUT = "9DB8AA", BORI = "35C06F", GOLD = "E0A93C";
  const F = "Helvetica";
  const base = (s) => { s.background = { color: BG }; s.addText(`AI Borinquen · ${academia ? "Academia AIB" : "AutoFlow"} · Puerto Rico`, { x: 0.4, y: 5.2, w: 5, h: 0.3, fontSize: 9, color: MUT, fontFace: F }); s.addText(c.negocio, { x: 5.6, y: 5.2, w: 4, h: 0.3, fontSize: 9, color: MUT, align: "right", fontFace: F }); };
  const titulo = (s, eyebrow, t) => { s.addText(eyebrow.toUpperCase(), { x: 0.5, y: 0.35, w: 9, h: 0.3, fontSize: 10, color: BORI, bold: true, charSpacing: 3, fontFace: F }); s.addText(t, { x: 0.5, y: 0.65, w: 9, h: 0.8, fontSize: 28, color: TXT, bold: true, fontFace: F }); };
  const bullets = (s, items, y = 1.6, h = 3.3, size = 16) => s.addText((items || []).map((t) => ({ text: t, options: { bullet: { code: "25CF" }, breakLine: true } })), { x: 0.6, y, w: 8.8, h, fontSize: size, color: TXT, fontFace: F, paraSpaceAfter: 8, valign: "top" });
  const tarjetas = (s, items, y = 1.6, h = 3.0) => items.forEach(([t, pr, desc, hot], i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.9, h, fill: { color: PANEL }, line: { color: hot ? GOLD : "1F3A2B", width: hot ? 2 : 1 }, rectRadius: 0.1 });
    if (hot) s.addText(typeof hot === "string" ? hot : "LO QUE PROBASTE", { x: x + 0.2, y: y + 0.05, w: 2.5, h: 0.3, fontSize: 9, bold: true, color: GOLD, charSpacing: 2, fontFace: F });
    s.addText(t, { x: x + 0.2, y: y + 0.35, w: 2.5, h: 0.6, fontSize: 15, bold: true, color: TXT, fontFace: F });
    s.addText(pr, { x: x + 0.2, y: y + 0.95, w: 2.5, h: 0.4, fontSize: 14, bold: true, color: hot ? BORI : MUT, fontFace: F });
    s.addText(desc, { x: x + 0.2, y: y + 1.4, w: 2.5, h: h - 1.5, fontSize: 11, color: MUT, fontFace: F, valign: "top" });
  });
  let n = 0;

  // 1 Portada
  let s = pptx.addSlide(); base(s); n++;
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.25, h: 5.625, fill: { color: ACC } });
  s.addText((academia ? "PROGRAMA PERSONALIZADO · " : "PROPUESTA PERSONALIZADA · ") + hoy(), { x: 0.6, y: 1.2, w: 9, h: 0.3, fontSize: 10, color: BORI, bold: true, charSpacing: 3, fontFace: F });
  s.addText(academia ? `${c.negocio}: aprende a poner la IA a trabajar` : `${c.negocio}: tu equipo digital`, { x: 0.6, y: 1.55, w: 8.8, h: 1.2, fontSize: 36, color: TXT, bold: true, fontFace: F });
  s.addText(g.deck?.subtitulo || g.propuesta?.titular || "", { x: 0.6, y: 2.8, w: 8.4, h: 0.9, fontSize: 16, color: MUT, fontFace: F });
  s.addText(`Preparado para ${c.contacto || c.negocio} · Hecho en Puerto Rico`, { x: 0.6, y: 4.2, w: 8, h: 0.4, fontSize: 12, color: MUT, fontFace: F });
  // 2-4 Apertura PR
  s = pptx.addSlide(); base(s); n++; titulo(s, "Quiénes somos", "AI Borinquen: de Puerto Rico, para negocios de Puerto Rico"); bullets(s, APERTURA.quienes);
  s = pptx.addSlide(); base(s); n++; titulo(s, "Nuestra visión", "Digitalizar y capacitar los negocios de la isla"); bullets(s, APERTURA.vision);
  s = pptx.addSlide(); base(s); n++; titulo(s, "A quién hemos ayudado", "Clientes de aquí, con resultados que puedes verificar");
  APERTURA.casos.forEach(([t, r, q], i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.6, w: 2.9, h: 3.2, fill: { color: PANEL }, line: { color: "1F3A2B" }, rectRadius: 0.1 });
    s.addText(t, { x: x + 0.2, y: 1.7, w: 2.5, h: 0.7, fontSize: 13, bold: true, color: TXT, fontFace: F });
    s.addText(r, { x: x + 0.2, y: 2.4, w: 2.5, h: 1.1, fontSize: 11.5, color: BORI, fontFace: F, valign: "top" });
    s.addText(q, { x: x + 0.2, y: 3.5, w: 2.5, h: 1.2, fontSize: 10.5, italic: true, color: MUT, fontFace: F, valign: "top" });
  });
  // 5 Lo que vimos
  s = pptx.addSlide(); base(s); n++; titulo(s, "Lo que vimos", `Lo que está pasando hoy en ${c.negocio}`); bullets(s, academia ? ACADEMIA.situacion : g.deck?.situacion);
  // 6 Lo que cuesta
  s = pptx.addSlide(); base(s); n++; titulo(s, "Lo que cuesta", "Cada hora sin responder tiene un precio"); bullets(s, g.deck?.costo, 1.6, 2.2);
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 3.9, w: 8.8, h: 1.0, fill: { color: PANEL }, line: { color: "1F3A2B" } });
  s.addText("78% de los clientes cierran con el primero que responde · 67% se van tras una mala experiencia", { x: 0.8, y: 3.95, w: 8.4, h: 0.9, fontSize: 13, color: GOLD, fontFace: F, valign: "middle" });
  // 7 El sistema / El programa
  s = pptx.addSlide(); base(s); n++;
  if (academia) { titulo(s, "El programa", "12 semanas, de cero a tus agentes funcionando"); bullets(s, ACADEMIA.programa); }
  else { titulo(s, "El sistema", `Así queda ${c.negocio} con AutoFlow`); bullets(s, g.deck?.sistema); }
  // 8 Pruébalo (links + portal)
  s = pptx.addSlide(); base(s); n++; titulo(s, academia ? "Esto es lo que vas a saber construir" : "Pruébalo tú mismo", academia ? "Ya te lo montamos para que lo toques" : "Ya está construido para ti");
  const cards = [["💬 Chat", `Escríbele a ${g.asistente} como cliente`, urls.chat], ["📞 Voz", `Habla con ${g.asistente}`, urls.voz], ["🖥️ Tu portal", uPortal ? "Agentes, llamadas y CRM en vivo" : "Embudo, conversaciones y agenda", uPortal || ((urls.propuesta || "") + (urls.propuesta?.endsWith("/") ? "sistema/" : "/sistema/"))]];
  cards.forEach(([t, sub, url], i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.7, w: 2.9, h: 2.4, fill: { color: PANEL }, line: { color: "1F3A2B" }, rectRadius: 0.1 });
    s.addText(t, { x: x + 0.2, y: 1.85, w: 2.5, h: 0.5, fontSize: 18, bold: true, color: TXT, fontFace: F });
    s.addText(sub, { x: x + 0.2, y: 2.35, w: 2.5, h: 0.8, fontSize: 12, color: MUT, fontFace: F });
    s.addText(url, { x: x + 0.2, y: 3.3, w: 2.5, h: 0.6, fontSize: 9, color: BORI, fontFace: F, hyperlink: { url } });
  });
  if (academia) {
    // 9 Lo que construyes
    s = pptx.addSlide(); base(s); n++; titulo(s, "Lo que construyes", "Al terminar, esto queda funcionando en tu negocio"); bullets(s, ACADEMIA.construyes);
    // 10 Las dos vías
    s = pptx.addSlide(); base(s); n++; titulo(s, "Cómo lo hacemos", "Tú eliges cuánto quieres aprender y cuánto delegar");
    tarjetas(s, [
      [PRECIOS.academia.nombre, `${PRECIOS.academia.inicial} · ${PRECIOS.academia.mensual}`, PRECIOS.academia.desc, "RECOMENDADO PARA TI"],
      [PRECIOS.uno.nombre, `${PRECIOS.uno.inicial} · ${PRECIOS.uno.mensual}`, PRECIOS.uno.desc, false],
      ["Lo hacemos por ti · AutoFlow", `${PRECIOS.completo.inicial} + ${PRECIOS.completo.mensual}`, PRECIOS.completo.desc, false],
    ]);
    s.addText("Cupos por cohorte limitados · pago único o 3 pagos · si al terminar no tienes tu agente funcionando, seguimos contigo sin costo hasta que lo tengas", { x: 0.6, y: 4.7, w: 8.8, h: 0.4, fontSize: 11, color: MUT, fontFace: F });
  } else {
    // 9 La cuenta
    s = pptx.addSlide(); base(s); n++; titulo(s, "La cuenta que nadie te hace", "Empleado 24/7 vs AutoFlow");
    s.addTable([
      [{ text: "", options: { fill: { color: PANEL } } }, { text: "Empleado 24/7", options: { bold: true, color: TXT, fill: { color: PANEL } } }, { text: "AutoFlow", options: { bold: true, color: BORI, fill: { color: PANEL } } }],
      ["Costo al año", "~$58,000", { text: "~$9,500", options: { color: BORI, bold: true } }],
      ["Horas cubiertas", "2,080", { text: "8,736 (24/7)", options: { color: BORI, bold: true } }],
      ["Tiempo de respuesta", "~4 horas", { text: "segundos", options: { color: BORI, bold: true } }],
      ["Ahorro año 1", "—", { text: "~$48,000", options: { color: BORI, bold: true } }],
    ], { x: 0.6, y: 1.6, w: 8.8, colW: [3, 2.9, 2.9], fontSize: 14, color: TXT, fontFace: F, border: { type: "solid", color: "1F3A2B", pt: 1 }, fill: { color: BG }, rowH: 0.5 });
    // 10 Niveles / precios
    s = pptx.addSlide(); base(s); n++; titulo(s, "Tu equipo digital", "Elige el agente que necesitas primero");
    tarjetas(s, [
      [PRECIOS.chat.nombre, `${PRECIOS.chat.inicial} + ${PRECIOS.chat.mensual}`, PRECIOS.chat.desc, false],
      [PRECIOS.voz.nombre, `${PRECIOS.voz.inicial} + ${PRECIOS.voz.mensual}`, PRECIOS.voz.desc, false],
      [PRECIOS.completo.nombre, `${PRECIOS.completo.inicial} + ${PRECIOS.completo.mensual}`, PRECIOS.completo.desc, true],
    ]);
    s.addText(GARANTIA, { x: 0.6, y: 4.7, w: 8.8, h: 0.4, fontSize: 11, color: MUT, fontFace: F });
  }
  // 11 La primera semana
  s = pptx.addSlide(); base(s); n++; titulo(s, "La primera semana", "Qué pasa desde que dices que sí"); bullets(s, academia ? ACADEMIA.diaUno : g.deck?.diaUno);
  // 12 Próximo paso
  s = pptx.addSlide(); base(s); n++;
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.25, h: 5.625, fill: { color: ACC } });
  s.addText("PRÓXIMO PASO", { x: 0.6, y: 1.4, w: 9, h: 0.3, fontSize: 10, color: BORI, bold: true, charSpacing: 3, fontFace: F });
  s.addText(academia ? "Reserva tu cupo en la próxima cohorte y sal de la sesión 1 con tu primer agente en borrador." : (g.deck?.proximoPaso || g.propuesta?.primerPaso || ""), { x: 0.6, y: 1.8, w: 8.6, h: 1.4, fontSize: 24, color: TXT, bold: true, fontFace: F });
  s.addText(`WhatsApp AI Borinquen · +1 (939) 304-0491 · ${uPortal || urls.propuesta || ""}`, { x: 0.6, y: 3.5, w: 8.6, h: 0.5, fontSize: 13, color: MUT, fontFace: F });

  const site = path.join(d, "site"); fs.mkdirSync(site, { recursive: true });
  const nombre = academia ? `${slug}-academia.pptx` : `${slug}-autoflow.pptx`;
  await pptx.writeFile({ fileName: path.join(site, nombre) });
  if (!academia) actualizarIndice(slug, { deck: nombre }); else actualizarIndice(slug, { deckAcademia: nombre });
  log(`✓ Presentación: data/demos/${slug}/site/${nombre} (${n} slides · vía ${academia ? "capacitación" : "implementación"})`);
  return nombre;
}

// ---------- construir (sitio estático) ----------
function construirChat(c, g) {
  let h = fs.readFileSync(path.join(TPL, "chat.html"), "utf8");
  const [r, gg, b] = hexToRgb(c.color);
  const rgba = (a) => `rgba(${r},${gg},${b},${a}`;
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(c.negocio)} · AutoFlow — Demo de atención por chat</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="Demo de atención al cliente por WhatsApp para ${escHtml(c.negocio)}, con AutoFlow de AI Borinquen."`)
    .replace(/--glenn-red:#c0161d;/, `--glenn-red:${c.color};`).replace(/--glenn-maroon:#800000;/, `--glenn-maroon:${c.color};`)
    .replace(/rgba\(192,22,29,/g, rgba("")).replace(/rgba\(128,0,0,/g, rgba(""))
    .replace(/<div class="avatar" aria-hidden="true">[\s\S]*?<\/div>\s*(?=<div class="who">)/,
      `<div class="avatar" aria-hidden="true"><span style="color:#fff;font-weight:700;font-size:18px">${escHtml(c.negocio.trim()[0].toUpperCase())}</span></div>\n          `)
    .replace(/<div class="bizcard">\s*<img[^>]*>/,
      c.logoUrl ? `<div class="bizcard"><img src="${escHtml(c.logoUrl)}" alt="${escHtml(c.negocio)}">`
        : `<div class="bizcard"><div style="font-weight:800;font-size:19px;color:${c.color};margin:2px 0 8px;line-height:1.2">${escHtml(c.negocio)}</div>`)
    .replace(/<div class="tag">[\s\S]*?<\/div>/, `<div class="tag">${escHtml(g.descripcion)}</div>`)
    .replace(/\/\/ -{6,} Base de conocimiento[\s\S]*?(?=\n\s*function respond\()/,
      `// ---------- Base de conocimiento (${c.negocio}) ----------\n  var intents=${JSON.stringify(g.intents)};\n  var fallback=${JSON.stringify(g.fallback)};\n  var leadReply=${JSON.stringify(g.leadReply)};\n`)
    .replace(/addBot\('👋[^\n]*\);/, `addBot(${JSON.stringify(g.saludo)});`)
    // Portal AutoFlow: el chat avisa a Content OS cada mensaje y cada lead (sesión anónima por navegador).
    .replace(/\n\s*function respond\(text\)\{/, `\n  var PORTAL = { slug: ${JSON.stringify(c.slug)}, endpoint: ${JSON.stringify(CONTENT_OS_URL + "/api/demo-lead")} };
  var PORTAL_SESION = (function(){ try { var k='portal-sesion'; var v=sessionStorage.getItem(k); if(!v){ v=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)).replace(/[^a-z0-9-]/gi,''); sessionStorage.setItem(k,v);} return v; } catch(e){ return 's'+Date.now(); } })();
  var PORTAL_N = 0, PORTAL_ULTIMO = null;
  function portalAvisar(tipo, texto){
    try {
      var esLead = tipo==='lead'; var tel = (texto.match(/\\b\\d[\\d\\s().-]{6,}\\d\\b/)||[null])[0]; var em = (texto.match(/[\\w.+-]+@[\\w-]+\\.[\\w.]+/)||[null])[0];
      fetch(PORTAL.endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, keepalive:true,
        body: JSON.stringify({ slug: PORTAL.slug, sesion: PORTAL_SESION, tipo: tipo, mensajes: PORTAL_N, texto: esLead ? texto.slice(0,500) : undefined, telefono: esLead ? tel : undefined, email: esLead ? em : undefined, interes: esLead ? PORTAL_ULTIMO : undefined }) }).catch(function(){});
    } catch(e) {}
  }
  function respond(text){`)
    .replace(/for\(var i=0;i<intents.length;i\+\+\)\{ if\(has\(t,intents\[i\]\.k\)\) return en\?intents\[i\]\.en:intents\[i\]\.es; \}/, `for(var i=0;i<intents.length;i++){ if(has(t,intents[i].k)){ PORTAL_ULTIMO = (intents[i].k||[])[0] || null; return en?intents[i].en:intents[i].es; } }`)
    .replace(/var reply=respond\(text\);/, `PORTAL_N++; var esLeadMsg = /\\b\\d[\\d\\s().-]{6,}\\d\\b/.test(text) || /@/.test(text); var reply=respond(text); portalAvisar(esLeadMsg ? 'lead' : 'mensaje', text);`)
    .replace(/Glenn International/g, escHtml(c.negocio)).replace(/glenninternational\.com/g, "");
  return h;
}
function construirVoz(c, g, retell) {
  let h = fs.readFileSync(path.join(TPL, "voz.html"), "utf8");
  const [r, gg, b] = hexToRgb(c.color);
  const rgba = (a) => `rgba(${r},${gg},${b},${a}`;
  const A = g.asistente;
  const kb = (g.voz.kb || []).map((x) => ({ k: x.k, es: x.es, en: x.en, ofrecerCita: !!x.ofrecerCita }));
  const bloque = `// ---------- Base de conocimiento hablada (${c.negocio}) ----------
  var KB = ${JSON.stringify(kb)};
  var KB_FALLBACK = ${JSON.stringify(g.voz.fallback)};
  var KB_LEAD = ${JSON.stringify(g.voz.lead)};
  var KB_SALUDO = ${JSON.stringify(g.voz.saludo)};
  function normVoz(s){ return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,''); }
  function hasVoz(t, arr){ for(var i=0;i<arr.length;i++){ if(t.indexOf(arr[i])>-1) return true; } return false; }
  function detectArea(){ return null; }
  function isEnglishMsg(t){
    if(/[¿¡ñáéíóú]/.test(t)) return false;
    return /\\b(the|you|do|does|what|where|how|hi|hello|hey|price|quote|hours|need|want|looking|appointment|book|thanks|address|contact|yes|no)\\b/.test(t) &&
      !/\\b(hola|buenas|gracias|precio|donde|cuando|necesito|quiero|busco|si|para|con|cita)\\b/.test(t);
  }
  function respond(text){
    var t = normVoz(text);
    if(isEnglishMsg(t) && lang==='es'){ setLang('en'); }
    var L = lang;
    if(/\\d{3}[\\d\\s.\\-]{4,}/.test(text)){ awaitingYesNo=false; return KB_LEAD[L]; }
    if(awaitingYesNo && /\\b(si|sí|claro|dale|ok|okay|yes|sure|perfecto|bueno)\\b/.test(t)){
      awaitingYesNo=false;
      return L==='es' ? 'Perfecto. Dime tu nombre y un teléfono, y te confirmamos enseguida.' : 'Perfect. Tell me your name and a phone number and we will confirm right away.';
    }
    if(awaitingYesNo && /\\b(no|luego|despues|later|not now)\\b/.test(t)){
      awaitingYesNo=false;
      return L==='es' ? 'Sin problema. ¿Hay algo más en lo que te pueda ayudar?' : 'No problem. Anything else I can help you with?';
    }
    for(var i=0;i<KB.length;i++){ if(hasVoz(t, KB[i].k)){ awaitingYesNo = !!KB[i].ofrecerCita; return KB[i][L]; } }
    return KB_FALLBACK[L];
  }
  function greeting(){ return KB_SALUDO[lang]; }

  `;
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(c.negocio)} · ${escHtml(A)} — Asistente de voz (AutoFlow)</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="Asistente de voz de ${escHtml(c.negocio)}: recibe tu llamada, te orienta y toma tus datos."`)
    .replace(/--red:#c0161d;/, `--red:${c.color};`).replace(/rgba\(192,22,29,/g, rgba("")).replace(/rgba\(224,36,46,/g, rgba(""))
    .replace(/<div class="plate">[\s\S]*?<\/div>/, `<div class="plate" style="background:transparent;box-shadow:none;padding:0;font-weight:800;font-size:24px;letter-spacing:.02em;color:#fff">${escHtml(c.negocio)}</div>`)
    .replace(/var RETELL = \{[^}]*\};/, `var RETELL = { agentId: ${JSON.stringify(retell?.agent_id || "")}, endpoint: ${JSON.stringify(WEBCALL_URL)} };`)
    .replace(/fetch\(RETELL\.endpoint, \{ method:'POST' \}\)/, `fetch(RETELL.endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ agent_id: RETELL.agentId, slug: ${JSON.stringify(c.slug)} }) })`)
    .replace(/\/\/ -{6,} Base de conocimiento hablada[\s\S]*?(?=\/\/ -{6,} Voz \(TTS\))/, bloque)
    .replace(/te pasa con el experto del área\./g, "toma tus datos o te agenda.")
    .replace(/connects you with the right expert\./g, "takes your details or books you in.")
    .replace(/<li>Ella te orienta[^<]*<\/li>/, `<li>Ella responde lo que necesitas y toma tus datos para que ${escHtml(c.negocio)} te devuelva la llamada o te agende.</li>`)
    .replace(/Glenn International/g, escHtml(c.negocio)).replace(/Valentina/g, escHtml(A));
  return h;
}
function construirPropuesta(c, g, urls) {
  let h = fs.readFileSync(path.join(TPL, "propuesta.html"), "utf8");
  const p = g.propuesta || {};
  const wa = `https://wa.me/${WA_AIB}?text=${encodeURIComponent(`Hola, vi la demo de ${c.negocio} y quiero instalar AutoFlow`)}`;
  const tokens = {
    NEGOCIO: escHtml(c.negocio), ASISTENTE: escHtml(g.asistente), COLOR: c.color, FECHA: hoy(),
    TITULAR: escHtml(p.titular || ""), DOLOR: escHtml(p.dolor || c.dolor || ""), RESUMEN: escHtml(p.resumen || ""),
    RESULTADOS_LI: (p.resultados || []).map((x) => `<li>${escHtml(x)}</li>`).join(""),
    PRIMER_PASO: escHtml(p.primerPaso || "Instalación en 21 días con tu número actual."),
    URL_CHAT: urls.chat, URL_VOZ: urls.voz, URL_LANDING: urls.landing || "landing/", URL_SISTEMA: urls.sistema || "sistema/",
    DECK_BTN: urls.deck ? `<a class="btn ghost" href="${escHtml(urls.deck)}" download>Descargar la presentación (.pptx)</a>` : "",
    PORTAL_CARD: portalUrl(c.slug)
      ? `<div class="card demo" style="border-color:rgba(53,192,111,.45)"><h3>🖥️ Tu portal AutoFlow</h3><p>Tus agentes, las llamadas que hagas de prueba (con transcripción), tu embudo y un botón para pedir cambios. Es tuyo: guárdalo.</p><a class="btn" href="${escHtml(portalUrl(c.slug))}">Entrar a tu portal</a></div>`
      : "",
    P_CHAT_INI: PRECIOS.chat.inicial, P_CHAT_MES: PRECIOS.chat.mensual, P_VOZ_INI: PRECIOS.voz.inicial, P_VOZ_MES: PRECIOS.voz.mensual,
    P_COMP_INI: PRECIOS.completo.inicial, P_COMP_MES: PRECIOS.completo.mensual, GARANTIA,
    WA_LINK: wa,
  };
  for (const [k, v] of Object.entries(tokens)) h = h.split(`{{${k}}}`).join(v);
  return h;
}
function construir(slug) {
  const { d, config, generado, retell } = cargar(slug);
  if (!generado) die("Corre 'generar' primero");
  const site = path.join(d, "site");
  for (const sub of ["chat", "voz", "landing", "sistema"]) fs.rmSync(path.join(site, sub), { recursive: true, force: true });
  fs.mkdirSync(path.join(site, "chat"), { recursive: true });
  fs.mkdirSync(path.join(site, "voz"), { recursive: true });
  fs.mkdirSync(path.join(site, "landing"), { recursive: true });
  fs.mkdirSync(path.join(site, "sistema"), { recursive: true });
  fs.writeFileSync(path.join(site, "chat", "index.html"), construirChat(config, generado));
  fs.writeFileSync(path.join(site, "voz", "index.html"), construirVoz(config, generado, retell));
  fs.writeFileSync(path.join(site, "landing", "index.html"), construirLanding(config, generado));
  fs.writeFileSync(path.join(site, "sistema", "index.html"), construirSistema(config, generado));
  const reg = (readJSON(INDEX, { demos: [] }).demos || []).find((x) => x.slug === slug) || {};
  fs.writeFileSync(path.join(site, "index.html"), construirPropuesta(config, generado, { chat: "chat/", voz: "voz/", landing: "landing/", sistema: "sistema/", deck: reg.deck ? reg.deck : "" }));
  actualizarIndice(slug, { estado: "construido", vozReal: !!retell?.agent_id });
  log(`✓ MVP en data/demos/${slug}/site/ (index = propuesta · landing · chat · voz${retell?.agent_id ? " real" : " navegador"} · sistema${reg.deck ? " · deck" : ""})`);
  log(`  Ver local: (cd "data/demos/${slug}/site" && python3 -m http.server 8790) → http://localhost:8790`);
}

// ---------- desplegar (Netlify zip deploy) ----------
async function desplegar(slug) {
  const { d, config } = cargar(slug);
  const token = env("NETLIFY_AUTH_TOKEN");
  if (!token) die("Falta NETLIFY_AUTH_TOKEN en .env.local");
  const site = path.join(d, "site");
  if (!fs.existsSync(path.join(site, "index.html"))) die("Corre 'construir' primero");
  const H = { Authorization: `Bearer ${token}` };
  const api = async (p, opts = {}) => {
    const r = await fetch("https://api.netlify.com/api/v1" + p, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
    const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
    if (!r.ok) { const e = new Error(`${p} → ${r.status}: ${t.slice(0, 300)}`); e.status = r.status; throw e; }
    return j;
  };
  const idx = readJSON(INDEX, { demos: [] });
  const reg = idx.demos.find((x) => x.slug === slug) || {};
  let siteId = reg.netlifySiteId;
  if (!siteId) {
    let name = `autoflow-${slug}`;
    log(`→ Creando sitio ${name} en Netlify…`);
    try { const s = await api("/sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }); siteId = s.id; }
    catch (e) {
      if (e.status !== 422) throw e;
      name = `${name}-${Date.now().toString(36).slice(-4)}`;
      const s = await api("/sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }); siteId = s.id;
    }
  }
  const zip = path.join(d, "site.zip");
  fs.rmSync(zip, { force: true });
  execSync(`zip -qr "${zip}" .`, { cwd: site });
  log("→ Subiendo el zip…");
  const dep = await api(`/sites/${siteId}/deploys`, { method: "POST", headers: { "Content-Type": "application/zip" }, body: fs.readFileSync(zip) });
  let estado = dep.state, url = dep.ssl_url || dep.url, tries = 0;
  while (estado !== "ready" && estado !== "error" && tries++ < 40) {
    await new Promise((r) => setTimeout(r, 2500));
    const s = await api(`/deploys/${dep.id}`); estado = s.state; url = s.ssl_url || s.url || url;
  }
  if (estado !== "ready") die(`Deploy en estado ${estado}`);
  const sitio = await api(`/sites/${siteId}`);
  const base = (sitio.ssl_url || sitio.url || url).replace(/\/$/, "");
  const urls = { propuesta: base + "/", chat: base + "/chat/", voz: base + "/voz/", landing: base + "/landing/", sistema: base + "/sistema/" };
  actualizarIndice(slug, { netlifySiteId: siteId, urls, estado: "desplegado", desplegadoEl: new Date().toISOString() });
  fs.rmSync(zip, { force: true });
  log(`✓ MVP en vivo:\n  Propuesta: ${urls.propuesta}\n  Landing:   ${urls.landing}\n  Chat:      ${urls.chat}\n  Voz:       ${urls.voz}\n  Por dentro:${urls.sistema}`);
  return urls;
}

// ---------- nota (Pipedrive AIB) ----------
async function nota(slug) {
  const { config, generado } = cargar(slug);
  const token = env("PIPEDRIVE_AIB_TOKEN");
  if (!token) die("Falta PIPEDRIVE_AIB_TOKEN");
  const reg = (readJSON(INDEX, { demos: [] }).demos || []).find((x) => x.slug === slug) || {};
  if (!reg.urls) die("Corre 'desplegar' primero");
  const pd = async (method, p, body) => {
    const sep = p.includes("?") ? "&" : "?";
    const r = await fetch(`https://api.pipedrive.com/v1/${p}${sep}api_token=${token}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.success === false) throw new Error(`Pipedrive ${method} ${p.split("?")[0]}: ${j.error || r.status}`);
    return j.data;
  };
  let dealId = reg.dealId || null;
  if (!dealId) {
    const s = await pd("GET", `deals/search?term=${encodeURIComponent(config.negocio)}&status=open&limit=1`);
    dealId = s?.items?.[0]?.item?.id ?? null;
  }
  if (!dealId) {
    log("→ No hay deal abierto con ese nombre: creando org + deal en DIAGNÓSTICO DE AUTOMATIZACIÓN…");
    const org = await pd("POST", "organizations", { name: config.negocio });
    const deal = await pd("POST", "deals", { title: `Demo AutoFlow · ${config.negocio}`, org_id: org.id, pipeline_id: PIPEDRIVE_PIPELINE, stage_id: PIPEDRIVE_STAGE });
    dealId = deal.id;
  }
  const p = generado?.propuesta || {};
  const content = `<b>Demo AutoFlow lista (${hoy()})</b><br>` +
    `Propuesta: <a href="${reg.urls.propuesta}">${reg.urls.propuesta}</a><br>` +
    `Chat: <a href="${reg.urls.chat}">${reg.urls.chat}</a> · Voz: <a href="${reg.urls.voz}">${reg.urls.voz}</a>${reg.agentId ? " (voz real)" : " (modo navegador)"}<br>` +
    `Landing: <a href="${reg.urls.landing}">${reg.urls.landing}</a> · Por dentro: <a href="${reg.urls.sistema}">${reg.urls.sistema}</a>${reg.deck ? ` · Deck: <a href="${reg.urls.propuesta}${reg.deck}">.pptx</a>` : ""}<br>` +
    (portalUrl(slug) ? `Portal AutoFlow (vivo): <a href="${portalUrl(slug)}">${portalUrl(slug)}</a><br>` : "") +
    `Asistente: ${escHtml(generado?.asistente || "")} · Dolor: ${escHtml(p.dolor || config.dolor || "")}<br>` +
    `<i>Mandar el link de la propuesta y el del portal por WhatsApp ANTES de la llamada. En la llamada: abrir el portal, no slides.</i>`;
  await pd("POST", "notes", { content, deal_id: dealId, pinned_to_deal_flag: 1 });
  actualizarIndice(slug, { dealId, notaEl: new Date().toISOString() });
  log(`✓ Nota fijada en el deal ${dealId} de Pipedrive AIB`);
}

// ---------- listar / todo ----------
function listar() {
  const idx = readJSON(INDEX, { demos: [] });
  if (!idx.demos.length) return log("(sin demos todavía)");
  for (const x of idx.demos) log(`${x.slug.padEnd(28)} ${String(x.estado || "").padEnd(11)} ${x.negocio || ""}${x.urls ? "  → " + x.urls.propuesta : ""}${x.dealId ? "  deal " + x.dealId : ""}`);
}
async function todo(slug) {
  await generar(slug);
  if (env("RETELL_API_KEY")) { try { await voz(slug); } catch (e) { log(`  ⚠️ Voz real no creada (${e.message}); sigue en modo navegador`); } }
  await deck(slug);
  construir(slug);
  await desplegar(slug);
  await deck(slug); // segunda pasada con las URLs públicas en las slides
  if (env("CRON_SECRET")) { try { await portal(slug); } catch (e) { log(`  ⚠️ Portal: ${e.message}`); } }
  if (env("PIPEDRIVE_AIB_TOKEN")) { try { await nota(slug); } catch (e) { log(`  ⚠️ Pipedrive: ${e.message}`); } }
}

// ---------- pdf (Keynote, solo macOS) ----------
// El closer pide la presentación en PDF: exporta cada .pptx del demo con Keynote por AppleScript.
function pdf(slug) {
  const { d } = cargar(slug);
  const site = path.join(d, "site");
  const outDir = path.join(site, "pdf"); fs.mkdirSync(outDir, { recursive: true });
  const script = path.join(ROOT, "scripts", "demo-cliente", "pptx-a-pdf.applescript");
  const decks = fs.readdirSync(site).filter((f) => f.endsWith(".pptx"));
  if (!decks.length) die("No hay .pptx: corre 'deck' primero");
  if (!fs.existsSync("/Applications/Keynote.app")) die("Falta Keynote (la exportación a PDF usa Keynote en macOS)");
  const hechos = [];
  for (const f of decks) {
    const out = path.join(outDir, f.replace(/\.pptx$/, ".pdf"));
    try {
      execSync(`osascript ${JSON.stringify(script)} ${JSON.stringify(path.join(site, f))} ${JSON.stringify(out)}`, { stdio: "pipe", timeout: 120000 });
      hechos.push(path.relative(ROOT, out));
    } catch (e) { log(`  ⚠️ ${f}: ${String(e.stderr || e.message).trim().slice(0, 200)}`); }
  }
  try { execSync(`osascript -e 'tell application "Keynote" to quit'`, { stdio: "ignore" }); } catch {}
  if (hechos.length) { actualizarIndice(slug, { pdf: hechos.map((h) => path.basename(h)) }); log(`✓ PDF: ${hechos.join(" · ")}`); }
}

// ---------- portal (Content OS) ----------
// Registra el portal vivo del prospecto en Content OS y deja el agente de Retell con webhook +
// análisis post-llamada, para que las llamadas de prueba aparezcan transcritas en el portal.
async function portal(slug) {
  const { config, generado, retell } = cargar(slug);
  const secreto = env("CRON_SECRET");
  if (!secreto) die("Falta CRON_SECRET en .env.local (el mismo de Vercel)");
  if (!env("AUTOFLOW_PORTAL_SECRET")) log("  ⚠️ Sin AUTOFLOW_PORTAL_SECRET: el portal se registra pero el link del prospecto lo genera la app.");
  const reg = (readJSON(INDEX, { demos: [] }).demos || []).find((x) => x.slug === slug) || {};
  const urls = { ...(reg.urls || {}) };
  if (reg.deck && urls.propuesta) urls.deck = urls.propuesta.replace(/\/?$/, "/") + reg.deck;
  const payload = {
    slug, negocio: config.negocio, nicho: config.nicho, contacto: config.contacto, color: config.color,
    asistente: generado?.asistente, agentIdVoz: retell?.agent_id || reg.agentId || null, urls,
    pipedriveDealId: reg.dealId != null ? String(reg.dealId) : null,
    leadsEjemplo: generado?.sistema?.leads || [],
  };
  const r = await fetch(`${CONTENT_OS_URL}/api/autoflow/portales`, { method: "POST", headers: { "Content-Type": "application/json", "x-cron-secret": secreto }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Content OS ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  const url = j.url || portalUrl(slug);
  actualizarIndice(slug, { portal: { url, registradoEl: new Date().toISOString(), agentePreparado: j.agentePreparado } });
  log(`✓ Portal registrado${j.agentePreparado === false ? " (⚠️ el agente de Retell no quedó con webhook: revisa RETELL_WEBHOOK_SECRET en Vercel)" : j.agentePreparado ? " · agente de Retell con webhook" : ""}`);
  if (url) log(`  Link del prospecto: ${url}`);
}

// ---------- main ----------
const a = args(process.argv.slice(2));
const cmd = a._[0];
const slug = a._[1];
try {
  if (cmd === "nuevo") { const s = nuevo(a); if (a.todo === "true") await todo(s); }
  else if (cmd === "generar") await generar(slug || die("Falta <slug>"));
  else if (cmd === "voz") await voz(slug || die("Falta <slug>"));
  else if (cmd === "construir") construir(slug || die("Falta <slug>"));
  else if (cmd === "deck") await deck(slug || die("Falta <slug>"), a.via);
  else if (cmd === "desplegar") await desplegar(slug || die("Falta <slug>"));
  else if (cmd === "pdf") pdf(slug || die("Falta <slug>"));
  else if (cmd === "portal") await portal(slug || die("Falta <slug>"));
  else if (cmd === "nota") await nota(slug || die("Falta <slug>"));
  else if (cmd === "todo") await todo(slug || die("Falta <slug>"));
  else if (cmd === "listar") listar();
  else { log("Uso: demo.mjs nuevo|generar|voz|deck|pdf|construir|desplegar|portal|nota|todo|listar (ver cabecera del archivo)"); process.exit(1); }
} catch (e) { die(e.message); }
