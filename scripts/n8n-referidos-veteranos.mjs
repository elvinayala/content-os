#!/usr/bin/env node
// Pedido de referidos a los clientes veteranos de Level Up (Elvin, 25/sep/2026): los 34 que ya pasaron de
// 200 leads y se marcaron como "ya felicitados" sin mensaje (sin Oliver Sotillo/Tinos: riesgo de churn).
//
// Reglas de Elvin: personalizado (nombre, negocio, sus leads, desde cuándo), texto un poco distinto para
// cada uno, de 5 en 5 por día (tope 10), cada uno a una hora distinta. Nada de ráfagas.
// Protección: el workflow manda UNO por corrida (cada 10 min, solo si ya le tocó la hora), nunca dos a menos
// de 45 min, el plan solo usa horas futuras, no manda nada
// con más de 3 h de atraso, y si un envío falla se PAUSA solo y avisa (workflow de errores).
// Las respuestas las atiende el agente de onboarding v5 (su rama de referidos → Slack a Elvin).
//
//   node scripts/n8n-referidos-veteranos.mjs plan     → escribe data/n8n/referidos-veteranos.json (textos + horas)
//   node scripts/n8n-referidos-veteranos.mjs crear    → crea/actualiza el workflow y lo activa
//   node scripts/n8n-referidos-veteranos.mjs estado   → quién ya recibió (última ejecución) y quién falta
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
const URL_N8N = (env("N8N_URL") || "https://n8nv2.levelupmediapr.net").replace(/\/$/, "");
const KEY = env("N8N_API_KEY");
const ESTADO = path.join(ROOT, "data/n8n/sync-pulse.json");
const PLAN = path.join(ROOT, "data/n8n/referidos-veteranos.json");
const NOCODB = "https://levelup-media-project-nocodb.ksnxqw.easypanel.host/api/v2";
const T_CLIENTES = "mom1ynk05ap3m1l";
const CRED_NOCODB = { id: "V2awKCkA1AJCFG27", name: "NocoDB Token account" };
const CRED_EVO = { id: "o3VodCojIbc9QZ6C", name: "Evolution account" };
const CRED_PG = { id: "GGHKaTkcxaueFMNW", name: "PostgresLevelUpMedia" };
const ERROR_WORKFLOW = "fEOX9Q3Szkf6bLQq";
const NOMBRE_WF = "K-) Referidos veteranos (una vez, sep 2026)";

// nombre exacto en NocoDB · nombre corto del negocio · leads (Meta, campañas Level Up, 24/sep) · inicio
const CLIENTES = [
  ["Christopher Taveras", "K. Clothing", 13600, "2025-01-04"],
  ["Rafael Caban Valentin", "Vida Divina", 7714, "2025-06-12"],
  ["Grisell Villanueva", "tu medspa", 7396, "2025-10-01"],
  ["Emilio Jimenez", "ReAwaken Upper Cervical", 6446, "2025-05-24"],
  ["Linette Lugo", "HOME ID", 5413, "2025-12-17"],
  ["Marie Pagan", "RK Automatic Transmission", 4989, "2025-07-15"],
  ["Nitza Sanchez", "Fancy Halo", 4738, "2026-05-11"],
  ["Joshua Santana", "Xtilos Door", 4000, "2025-03-14"],
  ["Edgar Lugo", "Warranty Plus", 3726, "2025-03-10"],
  ["Josean Martinez", "Tu Casa Segura", 3493, "2025-06-30"],
  ["Julio Santiago", "JJ Aluminum", 3365, "2025-10-15"],
  ["Katiusca Casado", "Peluche Professional Institute", 3332, "2025-07-21"],
  ["Bryan Vega", "Topchiro", 3182, "2025-01-11"],
  ["Carlos Rivera Auto Corp", "Rivera Auto Corp", 2677, "2025-07-11"],
  ["Angel Marrero", "Pitipua", 2616, "2026-03-28"],
  ["Shaidimar Berrios", "Shai Shai", 2489, "2025-10-22"],
  ["Luis Maldonado", "L.M Interior Designer", 1988, "2025-04-22"],
  ["Reina Marrero", "Mister iPhone", 1973, "2025-11-10"],
  ["Jemil Vasquez", "AutoLux", 1766, "2026-03-10"],
  ["Ernest Crisson", "tu oficina", 1388, "2026-04-22"],
  ["Carmelo Mendez", "CM Insurance", 1101, "2026-04-06"],
  ["Rocio Zayas", "Holistic Care Clinic", 725, "2026-03-05"],
  ["Xavier Rufino", "Punto Rojo", 564, "2026-05-08"],
  ["Marieliz Cordero", "JC Painting", 564, "2026-04-20"],
  ["Miguel Correa", "Golden Capital", 499, "2026-08-04"],
  ["Deborah Soler", "Farmacias Deborah", 494, "2025-10-11"],
  ["Felix Vazquez", "FV Gate Services", 461, "2026-07-22"],
  ["Kenia Carrera", "Restora Wellness", 457, "2025-10-17"],
  ["Axel Rios", "ITS Demo Guaynabo", 450, "2026-08-05"],
  ["Juan Santana", "Venergy Solar", 435, "2025-01-24"],
  ["Luis Negron", "Boricuas Auto Parts", 338, "2026-07-27"],
  ["Rebecca Erazo", "Cuchifrito Costero", 306, "2026-07-24"],
  ["Rafael Prats", "Hearing Tec", 292, "2026-08-13"],
  ["Gabriel Fernandez", "SunKeep", 206, "2026-05-21"],
];

// Piezas intercambiables: cada cliente sale con una combinación distinta (mismo fondo, distinta forma).
const SALUDO = ["Hola {n} 👋", "¡Saludos, {n}!", "Buenas, {n}.", "Hola {n}, ¿cómo estás?", "¡Hola, {n}!", "{n}, ¡saludos!", "Buenas tardes, {n}."];
const QUIEN = ["Te escribe el equipo de Level Up Media.", "Aquí el equipo de Level Up Media 🙌", "Te saluda el equipo de Level Up Media.", "Es el equipo de Level Up Media por aquí."];
const LOGRO = [
  "Desde que arrancamos juntos en {mes}, las campañas de {neg} ya van por más de {L} leads.",
  "Estuvimos revisando los números de {neg}: más de {L} leads desde {mes}. ¡Eso es trabajo en equipo!",
  "Desde {mes} hasta hoy, {neg} lleva más de {L} leads con nosotros 🔥",
  "Más de {L} leads para {neg} desde que empezamos en {mes}. Nos alegra mucho verlo.",
  "Te cuento: desde {mes}, las campañas de {neg} han generado más de {L} leads.",
];
const GRACIAS = ["Gracias por la confianza.", "Gracias por confiar en nosotros.", "De verdad, gracias por creer en el proceso.", "Nos encanta crecer contigo.", "Gracias por dejarnos ser parte de tu crecimiento."];
const PEDIDO = [
  "¿Conoces a 1 o 2 dueños de negocio a quienes les vendría bien un sistema así?",
  "Te quería preguntar: ¿hay algún empresario o profesional que conozcas al que le caería bien algo así?",
  "¿Tienes algún amigo o colega con negocio que también quiera más clientes?",
  "Una pregunta rápida: ¿conoces a alguien con negocio que se beneficiaría de lo mismo?",
  "¿Se te ocurre algún dueño de negocio que esté buscando más clientes como tú?",
];
const COMO = [
  "Pásame su nombre y número por aquí y nosotros lo contactamos.",
  "Si me envías su nombre y número por aquí, nosotros nos encargamos del resto.",
  "Solo mándame su nombre y teléfono por aquí; lo contactamos nosotros con cuidado.",
  "Con su nombre y número por aquí es suficiente, nosotros hacemos el contacto.",
];
const PREMIO = [
  "Por cada referido que se una recibes 5 % o hasta 1,000 puntos de recompensa.",
  "Entras a nuestro programa de referidos: 5 % o hasta 1,000 puntos por cada referido que se una.",
  "Y por cada uno que se una, te llevas 5 % o hasta 1,000 puntos de recompensa.",
];
const CIERRE = ["¡Vamos por más! 💪", "¡Seguimos creciendo juntos! 💪", "Un abrazo 🙌", "¡Seguimos! 🔥", "¡Éxito en todo!"];

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const mesDe = (iso) => { const [a, m] = iso.split("-").map(Number); return `${MESES[m - 1]} de ${a}`; };
const redondear = (n) => (n >= 1000 ? Math.floor(n / 100) * 100 : Math.floor(n / 10) * 10).toLocaleString("en-US");
const primerNombre = (s) => { const p = s.trim().split(/\s+/)[0]; return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(); };
const pick = (arr, i, paso) => arr[(i * paso + Math.floor(i / arr.length)) % arr.length];

function texto([nombre, neg, leads, inicio], i) {
  const v = { n: primerNombre(nombre), neg, L: redondear(leads), mes: mesDe(inicio) };
  const fill = (s) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);
  let saludo = pick(SALUDO, i, 3);
  if (/tardes/.test(saludo)) saludo = "Buenas, {n}.";
  const partes = [`${fill(saludo)} ${fill(pick(QUIEN, i, 1))}`, `${fill(pick(LOGRO, i, 2))} ${pick(GRACIAS, i, 3)}`, `${pick(PEDIDO, i, 1)} ${pick(COMO, i, 3)} ${pick(PREMIO, i, 2)}`, pick(CIERRE, i, 2)];
  return partes.join("\n\n");
}

// Días hábiles desde hoy (PR), 5 por día, horas distintas entre 10:00 y 17:00 con ≥ 55 min entre envíos.
const HORAS = [
  ["10:12", "11:34", "13:05", "14:41", "16:18"],
  ["10:47", "12:09", "13:38", "15:02", "16:36"],
  ["10:05", "11:21", "12:52", "14:27", "15:55"],
  ["11:03", "12:31", "13:56", "15:24", "16:51"],
  ["10:29", "11:48", "13:17", "14:49", "16:07"],
];
function diasHabiles(desde, n) {
  const out = [];
  const d = new Date(`${desde}T12:00:00-04:00`);
  while (out.length < n) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// Solo horas que todavía no pasaron (con 20 min de margen): si hoy ya no quedan, arranca el próximo día hábil.
function armarPlan(desde) {
  const limite = Date.now() + 20 * 60 * 1000;
  const turnos = [];
  diasHabiles(desde, 20).forEach((dia, d) => {
    for (const hora of HORAS[d % HORAS.length]) {
      const iso = `${dia}T${hora}:00-04:00`;
      if (Date.parse(iso) > limite) turnos.push(iso);
    }
  });
  return CLIENTES.map((c, i) => ({ i, nombre: c[0], negocio: c[1], leads: c[2], desde: c[3], enviarEl: turnos[i], texto: texto(c, i) }));
}

function armarWorkflow(plan) {
  const nodo = (name, type, typeVersion, parameters, position, extra = {}) => ({ id: `r-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name, type, typeVersion, position, parameters, ...extra });
  const nodes = [
    nodo("Nota", "n8n-nodes-base.stickyNote", 1, { width: 560, height: 300, content: `## Referidos veteranos (una vez)\nPedido de referidos a los 34 clientes que ya pasaron de 200 leads (Elvin, 25/sep/2026; sin Oliver/Tinos).\n\n- 5 por día hábil, cada uno a su hora (10 AM–5 PM), texto distinto y con su nombre, negocio, leads y desde cuándo.\n- Manda **uno por corrida** (cada 10 min) y solo lo que ya le tocó; si se atrasó > 3 h, lo salta.\n- Si un envío falla: se **pausa solo** y avisa por el workflow de errores.\n- Las respuestas las atiende el agente de onboarding v5 (referidos → Slack a Elvin).\n- Para parar: desactivar este workflow.\n\nFuente: scripts/n8n-referidos-veteranos.mjs (content-os).` }, [0, -420]),
    nodo("Cada 10 min", "n8n-nodes-base.scheduleTrigger", 1.2, { rule: { interval: [{ field: "minutes", minutesInterval: 10 }] } }, [0, 0]),
    nodo("¿A quién le toca?", "n8n-nodes-base.code", 2, { jsCode: `const PLAN = ${JSON.stringify(plan.map(({ i, nombre, negocio, enviarEl, texto }) => ({ i, nombre, negocio, enviarEl, texto })))};
const g = $getWorkflowStaticData('global');
const s = (g.v2 = g.v2 || {});
s.enviados = s.enviados || {};
if (s.pausado) return [];
const ahora = Date.now();
// Nunca dos envíos a menos de 45 min, pase lo que pase (si n8n estuvo caído no sale una ráfaga).
if (s.ultimo && ahora - s.ultimo < 45 * 60 * 1000) return [];
const toca = PLAN.find((p) => !s.enviados[p.i] && Date.parse(p.enviarEl) <= ahora);
if (!toca) return [];
if (ahora - Date.parse(toca.enviarEl) > 3 * 3600 * 1000) { s.enviados[toca.i] = { saltado: true, motivo: 'atraso > 3 h', el: new Date().toISOString() }; return []; }
return [{ json: toca }];` }, [260, 0]),
    nodo("Cliente en NocoDB", "n8n-nodes-base.httpRequest", 4.2, { url: `${NOCODB}/tables/${T_CLIENTES}/records`, authentication: "predefinedCredentialType", nodeCredentialType: "nocoDbApiToken", sendQuery: true, queryParameters: { parameters: [{ name: "where", value: "=(nombre,eq,{{ $json.nombre }})" }, { name: "limit", value: "1" }] }, options: {} }, [520, 0], { credentials: { nocoDbApiToken: CRED_NOCODB }, retryOnFail: true, maxTries: 3, waitBetweenTries: 3000 }),
    nodo("Teléfono", "n8n-nodes-base.code", 2, { jsCode: `const p = $('¿A quién le toca?').first().json;
const f = (($json.list) || [])[0];
const tel = String((f && f.telefono) || '').replace(/\\D/g, '');
const s = $getWorkflowStaticData('global').v2;
if (!f || tel.length < 10) { s.enviados[p.i] = { saltado: true, motivo: 'sin teléfono en NocoDB', el: new Date().toISOString() }; return []; }
return [{ json: { ...p, telefono: tel.length === 10 ? '1' + tel : tel } }];` }, [780, 0]),
    nodo("¿Ya se le mandó?", "n8n-nodes-base.postgres", 2.6, { operation: "executeQuery", query: "SELECT count(*)::int AS n FROM n8n_chat_histories_3344 WHERE session_id = $1 AND message->>'content' LIKE '%1,000 puntos%';", options: { queryReplacement: "={{ [$json.telefono + '@s.whatsapp.net'] }}" } }, [900, 0], { credentials: { postgres: CRED_PG }, alwaysOutputData: true }),
    nodo("Solo si es nuevo", "n8n-nodes-base.code", 2, { jsCode: `// Segunda llave, en la base (no depende de staticData): una vez que salió, nunca más.
const p = $('Teléfono').first().json;
const s = $getWorkflowStaticData('global').v2;
if (Number(($json && $json.n) || 0) > 0) { s.enviados[p.i] = { ok: true, nombre: p.nombre, yaEstaba: true, el: new Date().toISOString() }; return []; }
return [{ json: p }];` }, [960, 0]),
    nodo("Enviar WhatsApp", "n8n-nodes-evolution-api.evolutionApi", 1, { resource: "messages-api", instanceName: "Level-Up-Media-Whatsapp", remoteJid: "={{ $json.telefono }}@s.whatsapp.net", messageText: "={{ $json.texto }}", options_message: {} }, [1040, 0], { credentials: { evolutionApi: CRED_EVO }, onError: "continueRegularOutput" }),
    nodo("Registrar", "n8n-nodes-base.code", 2, { jsCode: `// OJO: n8n solo guarda staticData si la corrida termina bien → aquí NUNCA se lanza error (26/sep: un throw
// hizo que el "enviado" no se guardara y se reenviara cada 10 min).
const p = $('Teléfono').first().json;
const r = $json || {};
const s = $getWorkflowStaticData('global').v2;
const key = (r.data && r.data.key) || r.key;
const ok = !!(key && key.id);
s.ultimo = Date.now();
if (!ok) {
  s.pausado = true;
  s.enviados[p.i] = { fallo: true, el: new Date().toISOString() };
  return [{ json: { fallo: true, nombre: p.nombre } }];
}
s.enviados[p.i] = { ok: true, nombre: p.nombre, el: new Date().toISOString() };
return [{ json: { sessionId: p.telefono + '@s.whatsapp.net', mensaje: JSON.stringify({ type: 'ai', content: p.texto, additional_kwargs: {}, tool_calls: [], invalid_tool_calls: [], response_metadata: {} }), nombre: p.nombre, enviados: Object.values(s.enviados).filter((e) => e.ok).length } }];` }, [1300, 0]),
    nodo("Memoria del agente", "n8n-nodes-base.postgres", 2.6, { operation: "executeQuery", query: "INSERT INTO n8n_chat_histories_3344 (session_id, message)\nVALUES ($1, $2::jsonb);", options: { queryReplacement: "={{ [$json.sessionId, $json.mensaje] }}" } }, [1560, 0], { credentials: { postgres: CRED_PG }, onError: "continueRegularOutput" }),
  ];
  const c = (a, b) => ({ [a]: { main: [[{ node: b, type: "main", index: 0 }]] } });
  const connections = { ...c("Cada 10 min", "¿A quién le toca?"), ...c("¿A quién le toca?", "Cliente en NocoDB"), ...c("Cliente en NocoDB", "Teléfono"), ...c("Teléfono", "¿Ya se le mandó?"), ...c("¿Ya se le mandó?", "Solo si es nuevo"), ...c("Solo si es nuevo", "Enviar WhatsApp"), ...c("Enviar WhatsApp", "Registrar"), ...c("Registrar", "Memoria del agente") };
  return { name: NOMBRE_WF, nodes, connections, settings: { executionOrder: "v1", errorWorkflow: ERROR_WORKFLOW, timezone: "America/Puerto_Rico" } };
}

async function api(ruta, init = {}) {
  const r = await fetch(`${URL_N8N}/api/v1${ruta}`, { ...init, headers: { "X-N8N-API-KEY": KEY, "Content-Type": "application/json", Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${ruta}: ${txt.slice(0, 300)}`);
  return txt ? JSON.parse(txt) : {};
}
const leerEstado = () => { try { return JSON.parse(fs.readFileSync(ESTADO, "utf8")); } catch { return {}; } };
const guardarEstado = (o) => fs.writeFileSync(ESTADO, JSON.stringify({ ...leerEstado(), ...o, actualizadoEl: new Date().toISOString() }, null, 2) + "\n");

const [cmd, arg] = process.argv.slice(2);
try {
  if (cmd === "plan") {
    const desde = arg || new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
    const plan = armarPlan(desde);
    fs.writeFileSync(PLAN, JSON.stringify({ creadoEl: new Date().toISOString(), desde, total: plan.length, plan }, null, 2) + "\n");
    const unicos = new Set(plan.map((p) => p.texto.replace(/\d[\d,]*/g, "#").replace(/\{.*?\}/g, ""))).size;
    console.log(`Plan: ${plan.length} mensajes, ${unicos} textos distintos → ${path.relative(ROOT, PLAN)}`);
    for (const p of plan) console.log(`${p.enviarEl.slice(0, 16).replace("T", " ")}  ${p.nombre}`);
  } else if (cmd === "crear") {
    const { plan } = JSON.parse(fs.readFileSync(PLAN, "utf8"));
    const w = armarWorkflow(plan);
    const est = leerEstado();
    if (est.referidosWorkflowId) {
      await api(`/workflows/${est.referidosWorkflowId}`, { method: "PUT", body: JSON.stringify(w) });
      await api(`/workflows/${est.referidosWorkflowId}/deactivate`, { method: "POST" });
      await api(`/workflows/${est.referidosWorkflowId}/activate`, { method: "POST" });
      console.log(`Actualizado y activo: ${NOMBRE_WF}`);
    } else {
      const r = await api("/workflows", { method: "POST", body: JSON.stringify(w) });
      guardarEstado({ referidosWorkflowId: r.id });
      await api(`/workflows/${r.id}/activate`, { method: "POST" });
      console.log(`Creado y activo: ${NOMBRE_WF} → ${URL_N8N}/workflow/${r.id}`);
    }
  } else if (cmd === "estado") {
    const id = leerEstado().referidosWorkflowId;
    const r = await api(`/executions?workflowId=${id}&limit=100&includeData=true`);
    const enviados = r.data.filter((e) => e.data?.resultData?.runData?.Registrar).map((e) => `${e.startedAt.slice(0, 16)} ✓ ${e.data.resultData.runData.Registrar[0].data?.main?.[0]?.[0]?.json?.nombre ?? "?"}`);
    const errores = r.data.filter((e) => e.status === "error").map((e) => `${e.startedAt.slice(0, 16)} ✗ ${e.data?.resultData?.error?.message ?? ""}`);
    console.log([...enviados, ...errores].sort().join("\n") || "Todavía no salió ninguno.");
  } else {
    console.error("Comandos: plan [YYYY-MM-DD] | crear | estado");
    process.exit(1);
  }
} catch (e) { console.error(`referidos: ${e.message}`); process.exit(1); }
