#!/usr/bin/env node
// "H-) Felicitaciones por leads v2" — reemplaza a "H-) Felicitaciones a los 100 - 200 leads v1 (v3.1)",
// que nunca corrió (el proveedor lo dejó a medias: nodos que apuntan a pasos que no existen y la rama de
// referidos sin conectar). Mismos mensajes que ese: al pasar de 100 leads, felicitación + pedido de
// referidos; al pasar de 200, felicitación. Una vez por cliente (columna `felicitaciones` de NocoDB).
//
// Leads = resultados de las campañas "Level Up" de la cuenta del cliente desde `fecha-inicio-campaña`
// (formularios/píxel `lead` + conversaciones de WhatsApp/Messenger iniciadas).
//
//   node scripts/n8n-felicitaciones.mjs crear       → crea el workflow (en SIMULACIÓN) y lo activa
//   node scripts/n8n-felicitaciones.mjs actualizar  → regenera y sube (PUT)
//   node scripts/n8n-felicitaciones.mjs simular     → corre la simulación: a quién le tocaría hoy y por qué
//   node scripts/n8n-felicitaciones.mjs real        → pasa a modo real (SOLO con el OK de Elvin) y apaga el viejo
//
// Env: N8N_API_KEY, PULSE_N8N_SECRET (la credencial "Pulse ↔ n8n" protege el webhook de simulación).
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
const SECRETO = env("PULSE_N8N_SECRET");
const ESTADO = path.join(ROOT, "data/n8n/sync-pulse.json");
const PLANTILLA = path.join(ROOT, "data/n8n/plantillas/felicitaciones-leads.json");

const NOMBRE = "H-) Felicitaciones por leads v2";
const VIEJO = "rTRe0OKhXPAKrFzs"; // H-) Felicitaciones a los 100 - 200 leads v1 (v3.1)
const NOCODB = "https://levelup-media-project-nocodb.ksnxqw.easypanel.host/api/v2";
const T_CLIENTES = "mom1ynk05ap3m1l";
const CRED_NOCODB = { id: "V2awKCkA1AJCFG27", name: "NocoDB Token account" };
const CRED_FACEBOOK = { id: "B89LULeA8wFpxWpo", name: "Levelito Acoount management" };
const CRED_EVO = { id: "o3VodCojIbc9QZ6C", name: "Evolution account" };
const CRED_PG = { id: "GGHKaTkcxaueFMNW", name: "PostgresLevelUpMedia" };
const ERROR_WORKFLOW = "fEOX9Q3Szkf6bLQq";

// Los textos del flujo viejo (solo "MÁS" con tilde).
const TEXTO_100 = "Buenas, nos complace felicitarte por haber alcanzado 🎉*MÁS DE 100 LEADS*🎉 generados por nuestra alianza. Esperamos de corazón seguir consiguiendo resultados grandes trabajando juntos.";
const TEXTO_200 = "Buenas, nos complace felicitarte por haber alcanzado 🎉*MÁS DE 200 LEADS*🎉 generados por nuestra alianza. Esperamos de corazón seguir consiguiendo resultados grandes trabajando juntos.";
const TEXTO_REFERIDOS = "Hola {nombre}, me alegra ver tus resultados 🔥 ¿Conoces a 2 empresarios o profesionales a quienes también podamos ayudar implementando este sistema? Si es así, envíame sus nombres y números por aquí y te sumamos al programa de referidos con 5% o hasta 1,000 puntos de recompensa por cada referido.  ¡Gracias por tu confianza y por ser parte de Level Up Media! 💪";

async function api(ruta, init = {}) {
  if (!KEY) throw new Error("Falta N8N_API_KEY en .env.local");
  const r = await fetch(`${URL_N8N}/api/v1${ruta}`, { ...init, headers: { "X-N8N-API-KEY": KEY, "Content-Type": "application/json", Accept: "application/json", ...(init.headers || {}) }, signal: AbortSignal.timeout(30000) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${ruta}: ${txt.slice(0, 300)}`);
  return txt ? JSON.parse(txt) : {};
}
const leerEstado = () => { try { return JSON.parse(fs.readFileSync(ESTADO, "utf8")); } catch { return {}; } };
const guardarEstado = (o) => fs.writeFileSync(ESTADO, JSON.stringify({ ...leerEstado(), ...o, actualizadoEl: new Date().toISOString() }, null, 2) + "\n");

let x = 0;
const pos = (col, fila) => [col * 260, fila * 200];
const opts = { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 };
const cond = (left) => ({ id: `c${++x}`, leftValue: left, rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } });
const nodo = (name, type, typeVersion, parameters, p, extra = {}) => ({ id: `f-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name, type, typeVersion, position: p, parameters, ...extra });
const ROBUSTO = { retryOnFail: true, maxTries: 3, waitBetweenTries: 2000, onError: "continueRegularOutput" };
const conectar = (...cadena) => {
  const c = {};
  for (let i = 0; i < cadena.length - 1; i++) {
    const [de, salida = 0] = Array.isArray(cadena[i]) ? cadena[i] : [cadena[i]];
    const a = Array.isArray(cadena[i + 1]) ? cadena[i + 1][0] : cadena[i + 1];
    c[de] ??= { main: [] };
    while (c[de].main.length <= salida) c[de].main.push([]);
    c[de].main[salida].push({ node: a, type: "main", index: 0 });
  }
  return c;
};
const unir = (...cs) => {
  const out = {};
  for (const c of cs) for (const [k, v] of Object.entries(c)) {
    out[k] ??= { main: [] };
    v.main.forEach((s, i) => { while (out[k].main.length <= i) out[k].main.push([]); out[k].main[i].push(...s); });
  }
  return out;
};

function armar(modo, credId) {
  const nodes = [
    nodo("Nota", "n8n-nodes-base.stickyNote", 1, { width: 560, height: 280, content: `## Felicitaciones por leads v2\nReemplaza al "H-) … v1 (v3.1)" que nunca corrió.\n\n- **Todos los días 4:20 PM PR** revisa los clientes de NocoDB (los alimenta Pulse).\n- Leads = campañas "Level Up" de su cuenta desde \`fecha-inicio-campaña\` (lead + conversaciones iniciadas).\n- ≥ 100 y sin felicitar → felicitación 100 + pedido de referidos. ≥ 200 y felicitado en 100 → felicitación 200.\n- Guarda \`felicitaciones\` = 100/200 en NocoDB (una vez por cliente) y deja el mensaje en la memoria del agente de onboarding.\n- MODO: **${modo}**. En simulación no manda nada (el webhook \`felicitaciones-leads\` devuelve la lista).\n\nFuente: scripts/n8n-felicitaciones.mjs (content-os). No editar a mano.` }, pos(0, -2)),
    nodo("Todos los días 4:20 PM", "n8n-nodes-base.scheduleTrigger", 1.2, { rule: { interval: [{ triggerAtHour: 16, triggerAtMinute: 20 }] } }, pos(0, 0)),
    nodo("Simulación (webhook)", "n8n-nodes-base.webhook", 2, { httpMethod: "POST", path: "felicitaciones-leads", authentication: "headerAuth", responseMode: "lastNode", responseData: "allEntries", options: {} }, pos(0, 1), { webhookId: "felicitaciones-leads", credentials: { httpHeaderAuth: { id: credId, name: "Pulse ↔ n8n (x-pulse-secret)" } } }),
    nodo("Modo programado", "n8n-nodes-base.set", 3.4, { assignments: { assignments: [{ id: "m1", name: "real", value: modo === "real", type: "boolean" }] }, options: {} }, pos(1, 0)),
    nodo("Modo simulación", "n8n-nodes-base.set", 3.4, { assignments: { assignments: [{ id: "m2", name: "real", value: false, type: "boolean" }] }, options: {} }, pos(1, 1)),
    nodo("Clientes (NocoDB)", "n8n-nodes-base.httpRequest", 4.2, { url: `${NOCODB}/tables/${T_CLIENTES}/records`, authentication: "predefinedCredentialType", nodeCredentialType: "nocoDbApiToken", sendQuery: true, queryParameters: { parameters: [{ name: "limit", value: "1000" }] }, options: {} }, pos(2, 0), { credentials: { nocoDbApiToken: CRED_NOCODB }, retryOnFail: true, maxTries: 3, waitBetweenTries: 3000 }),
    nodo("Candidatos", "n8n-nodes-base.code", 2, { jsCode: `// Clientes con cuenta publicitaria, fecha de inicio y sin la felicitación de 200 todavía.
const real = $('Modo programado').isExecuted ? $('Modo programado').first().json.real : false;
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Puerto_Rico' });
const out = [];
for (const f of ($json.list || [])) {
  const cuenta = String(f['ID-cuenta-publicitaria'] || '').replace(/\\D/g, '');
  const inicio = String(f['fecha-inicio-campaña'] || '').slice(0, 10);
  const fel = String(f.felicitaciones ?? '').trim();
  if (!cuenta || !/^\\d{4}-\\d{2}-\\d{2}$/.test(inicio) || fel === '200') continue;
  out.push({ json: { id: f.Id, nombre: f.nombre || '', empresa: f.empresa || '', telefono: String(f.telefono || '').replace(/\\D/g, ''), cuenta, inicio, hoy, felicitaciones: fel, real } });
}
return out;` }, pos(3, 0)),
    nodo("Leads en Meta", "n8n-nodes-base.httpRequest", 4.2, { url: "=https://graph.facebook.com/v23.0/act_{{ $json.cuenta }}/insights", authentication: "predefinedCredentialType", nodeCredentialType: "facebookGraphApi", sendQuery: true, queryParameters: { parameters: [
      { name: "fields", value: "actions" },
      { name: "level", value: "account" },
      { name: "time_range", value: "={{ JSON.stringify({ since: $json.inicio, until: $json.hoy }) }}" },
      { name: "filtering", value: "[{\"field\":\"campaign.name\",\"operator\":\"CONTAIN\",\"value\":\"level up\"}]" },
    ] }, options: { batching: { batch: { batchSize: 1, batchInterval: 400 } } } }, pos(4, 0), { credentials: { facebookGraphApi: CRED_FACEBOOK }, ...ROBUSTO }),
    nodo("Decidir", "n8n-nodes-base.code", 2, { jsCode: `// Cuenta los leads y decide qué felicitación toca (una por cliente y corrida).
const TIPOS = ['lead', 'onsite_conversion.messaging_conversation_started_7d'];
const out = [];
$input.all().forEach((it, i) => {
  const c = $('Candidatos').all()[i].json;
  const acciones = (it.json.data && it.json.data[0] && it.json.data[0].actions) || [];
  const error = it.json.error ? String(it.json.error.message || it.json.error).slice(0, 120) : null;
  const leads = acciones.filter((a) => TIPOS.includes(a.action_type)).reduce((s, a) => s + Number(a.value || 0), 0);
  // Como el viejo: si ya pasó de 200 sin haber sido felicitado, va directo la de 200.
  let hito = null;
  if (leads >= 200) hito = 200;
  else if (leads >= 100 && !c.felicitaciones) hito = 100;
  const primerNombre = (c.nombre.trim().split(/\\s+/)[0]) || '';
  out.push({ json: { ...c, leads, hito, error, primerNombre, puedeEnviar: !!hito && c.telefono.length >= 10 } });
});
return out;` }, pos(5, 0)),
    nodo("¿Envío real?", "n8n-nodes-base.if", 2.2, { conditions: { options: opts, conditions: [cond("={{ $json.real === true && $json.puedeEnviar === true }}")], combinator: "and" }, options: {} }, pos(6, 0)),
    // --- real
    nodo("¿100 o 200?", "n8n-nodes-base.if", 2.2, { conditions: { options: opts, conditions: [cond("={{ $json.hito === 100 }}")], combinator: "and" }, options: {} }, pos(7, -1)),
    nodo("Felicitación 100", "n8n-nodes-evolution-api.evolutionApi", 1, { resource: "messages-api", instanceName: "Level-Up-Media-Whatsapp", remoteJid: "={{ $json.telefono }}@s.whatsapp.net", messageText: TEXTO_100, options_message: {} }, pos(8, -2), { credentials: { evolutionApi: CRED_EVO }, onError: "continueRegularOutput" }),
    nodo("Esperar 1 min", "n8n-nodes-base.wait", 1.1, { amount: 1, unit: "minutes" }, pos(9, -2)),
    nodo("Referidos", "n8n-nodes-evolution-api.evolutionApi", 1, { resource: "messages-api", instanceName: "Level-Up-Media-Whatsapp", remoteJid: "={{ $('¿100 o 200?').item.json.telefono }}@s.whatsapp.net", messageText: `={{ ${JSON.stringify(TEXTO_REFERIDOS)}.replace('{nombre}', $('¿100 o 200?').item.json.primerNombre) }}`, options_message: {} }, pos(10, -2), { credentials: { evolutionApi: CRED_EVO }, onError: "continueRegularOutput" }),
    nodo("Felicitación 200", "n8n-nodes-evolution-api.evolutionApi", 1, { resource: "messages-api", instanceName: "Level-Up-Media-Whatsapp", remoteJid: "={{ $json.telefono }}@s.whatsapp.net", messageText: TEXTO_200, options_message: {} }, pos(8, -1), { credentials: { evolutionApi: CRED_EVO }, onError: "continueRegularOutput" }),
    nodo("Lo que se mandó", "n8n-nodes-base.code", 2, { mode: "runOnceForEachItem", jsCode: `const c = $('¿Envío real?').item.json;
const textos = c.hito === 100 ? [${JSON.stringify(TEXTO_100)}, ${JSON.stringify(TEXTO_REFERIDOS)}.replace('{nombre}', c.primerNombre)] : [${JSON.stringify(TEXTO_200)}];
return { json: { ...c, sessionId: c.telefono + '@s.whatsapp.net', texto: textos.join('\\n\\n') } };` }, pos(11, -1)),
    nodo("Memoria del agente", "n8n-nodes-base.postgres", 2.6, { operation: "executeQuery", query: "INSERT INTO n8n_chat_histories_3344 (session_id, message)\nVALUES ($1, $2::jsonb);", options: { queryReplacement: "={{ [$json.sessionId, JSON.stringify({ type: 'ai', content: $json.texto, additional_kwargs: {}, tool_calls: [], invalid_tool_calls: [], response_metadata: {} })] }}" } }, pos(12, -1), { credentials: { postgres: CRED_PG }, onError: "continueRegularOutput" }),
    nodo("Marcar en NocoDB", "n8n-nodes-base.httpRequest", 4.2, { method: "PATCH", url: `${NOCODB}/tables/${T_CLIENTES}/records`, authentication: "predefinedCredentialType", nodeCredentialType: "nocoDbApiToken", sendBody: true, specifyBody: "json", jsonBody: "={{ JSON.stringify([{ Id: $('Lo que se mandó').item.json.id, felicitaciones: String($('Lo que se mandó').item.json.hito) }]) }}", options: {} }, pos(13, -1), { credentials: { nocoDbApiToken: CRED_NOCODB }, ...ROBUSTO }),
    // --- simulación / nada que mandar
    nodo("Resumen", "n8n-nodes-base.code", 2, { jsCode: `// Lo que habría pasado hoy (o por qué no le toca a nadie).
const filas = $input.all().map((i) => i.json);
return [{ json: {
  modo: filas.some((f) => f.real) ? 'real' : 'simulacion',
  columnaFelicitaciones: (() => { const l = $('Clientes (NocoDB)').first().json.list || []; return l.length ? Object.prototype.hasOwnProperty.call(l[0], 'felicitaciones') : null; })(),
  revisados: $('Decidir').all().length,
  tocaHoy: filas.filter((f) => f.hito).map((f) => ({ cliente: f.nombre, empresa: f.empresa, leads: f.leads, hito: f.hito, desde: f.inicio, telefono: f.telefono ? '…' + f.telefono.slice(-4) : 'SIN TELÉFONO' })),
  conError: filas.filter((f) => f.error).map((f) => ({ cliente: f.nombre, cuenta: f.cuenta, error: f.error })),
  top: filas.filter((f) => !f.hito && !f.error).sort((a, b) => b.leads - a.leads).slice(0, 10).map((f) => ({ cliente: f.nombre, leads: f.leads, felicitaciones: f.felicitaciones || '—' })),
} }];` }, pos(7, 1)),
  ];
  const connections = unir(
    conectar("Todos los días 4:20 PM", "Modo programado", "Clientes (NocoDB)", "Candidatos", "Leads en Meta", "Decidir", "¿Envío real?"),
    conectar("Simulación (webhook)", "Modo simulación", "Clientes (NocoDB)"),
    conectar("¿Envío real?", "¿100 o 200?", "Felicitación 100", "Esperar 1 min", "Referidos", "Lo que se mandó", "Memoria del agente", "Marcar en NocoDB"),
    conectar(["¿100 o 200?", 1], "Felicitación 200", "Lo que se mandó"),
    conectar(["¿Envío real?", 1], "Resumen"),
  );
  return { name: NOMBRE, nodes, connections, settings: { executionOrder: "v1", errorWorkflow: ERROR_WORKFLOW, timezone: "America/Puerto_Rico" } };
}

const cmd = process.argv[2];
const est = leerEstado();
try {
  if (cmd === "crear" || cmd === "actualizar" || cmd === "real") {
    const modo = cmd === "real" ? "real" : est.felicitacionesModo || "simulacion";
    if (!est.credencialId) throw new Error("Falta la credencial Pulse ↔ n8n (corre n8n-sync-pulse.mjs crear primero).");
    const w = armar(modo, est.credencialId);
    fs.mkdirSync(path.dirname(PLANTILLA), { recursive: true });
    fs.writeFileSync(PLANTILLA, JSON.stringify(w, null, 2) + "\n");
    if (est.felicitacionesWorkflowId) {
      const r = await api(`/workflows/${est.felicitacionesWorkflowId}`, { method: "PUT", body: JSON.stringify(w) });
      await api(`/workflows/${r.id}/deactivate`, { method: "POST" });
      await api(`/workflows/${r.id}/activate`, { method: "POST" });
      console.log(`Actualizado: ${r.name} (modo ${modo})`);
    } else {
      const r = await api("/workflows", { method: "POST", body: JSON.stringify(w) });
      guardarEstado({ felicitacionesWorkflowId: r.id });
      await api(`/workflows/${r.id}/activate`, { method: "POST" });
      console.log(`Creado y activo: ${r.name} (modo ${modo}) → ${URL_N8N}/workflow/${r.id}`);
    }
    guardarEstado({ felicitacionesModo: modo });
    if (cmd === "real") {
      await api(`/workflows/${VIEJO}/deactivate`, { method: "POST" }).catch(() => {});
      console.log("Viejo (v1 v3.1) desactivado. Desde hoy felicita de verdad a las 4:20 PM.");
    }
  } else if (cmd === "simular") {
    const r = await fetch(`${URL_N8N}/webhook/felicitaciones-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-pulse-secret": SECRETO }, body: "{}", signal: AbortSignal.timeout(300000) });
    const txt = await r.text();
    let j; try { j = JSON.parse(txt); } catch { j = txt; }
    console.log(JSON.stringify(Array.isArray(j) ? j[0] : j, null, 2));
  } else {
    console.error("Comandos: crear | actualizar | simular | real");
    process.exit(1);
  }
} catch (e) { console.error(`felicitaciones: ${e.message}`); process.exit(1); }
