#!/usr/bin/env node
// "L-) Enviar WhatsApp (Content OS)" — un solo flujo para que Content OS (Vercel) le mande un WhatsApp a un
// cliente por el número de Level Up (Evolution), sin tener la llave de Evolution afuera de n8n. Lo usa la
// encuesta de fin de onboarding (lib/onboarding/encuesta.ts). Webhook POST /webhook/enviar-whatsapp con la
// credencial "Pulse ↔ n8n (x-pulse-secret)" y body { telefono, texto }.
//
// Reglas aprendidas el 25/sep (referidos mandó 18 veces): este flujo NUNCA lanza error después de enviar
// (devuelve { ok, id, error }) y la respuesta de Evolution se lee en data.key. El control de "una sola vez" lo
// lleva quien lo llama (Content OS registra antes de mandar). Deja el mensaje en la memoria del agente de
// onboarding para que sepa de qué habla el cliente si contesta por WhatsApp.
//
//   node scripts/n8n-enviar-whatsapp.mjs crear      → crea/actualiza el flujo y lo activa
//   node scripts/n8n-enviar-whatsapp.mjs probar     → prueba el cableado con un teléfono inválido (NO manda nada)
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
const NOMBRE = "L-) Enviar WhatsApp (Content OS)";
const CRED_EVO = { id: "o3VodCojIbc9QZ6C", name: "Evolution account" };
const CRED_PG = { id: "GGHKaTkcxaueFMNW", name: "PostgresLevelUpMedia" };
const ERROR_WORKFLOW = "fEOX9Q3Szkf6bLQq";

const leerEstado = () => { try { return JSON.parse(fs.readFileSync(ESTADO, "utf8")); } catch { return {}; } };
async function api(ruta, init = {}) {
  const r = await fetch(`${URL_N8N}/api/v1${ruta}`, { ...init, headers: { "X-N8N-API-KEY": KEY, "Content-Type": "application/json", Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${ruta}: ${txt.slice(0, 300)}`);
  return txt ? JSON.parse(txt) : {};
}

const opts = { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 };
const nodo = (name, type, typeVersion, parameters, position, extra = {}) => ({ id: `w-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name, type, typeVersion, position, parameters, ...extra });

function armar(credId) {
  const nodes = [
    nodo("Nota", "n8n-nodes-base.stickyNote", 1, { width: 520, height: 240, content: `## Enviar WhatsApp (Content OS)\nContent OS (Vercel) lo llama para mandar UN mensaje por el WhatsApp de Level Up (Evolution).\n\n- Body: \`{ telefono, texto }\` (10 dígitos de PR o con código de país).\n- Devuelve \`{ ok, id, error }\`. **Nunca lanza error** después de enviar.\n- Deja el mensaje en la memoria del agente de onboarding.\n- El "una sola vez" lo controla quien llama.\n\nFuente: scripts/n8n-enviar-whatsapp.mjs (content-os).` }, [0, -320]),
    nodo("Enviar WhatsApp (webhook)", "n8n-nodes-base.webhook", 2, { httpMethod: "POST", path: "enviar-whatsapp", authentication: "headerAuth", responseMode: "lastNode", responseData: "firstEntryJson", options: {} }, [0, 0], { webhookId: "enviar-whatsapp", credentials: { httpHeaderAuth: { id: credId, name: "Pulse ↔ n8n (x-pulse-secret)" } } }),
    nodo("Validar", "n8n-nodes-base.code", 2, { jsCode: `const b = $json.body || {};
let tel = String(b.telefono || '').replace(/\\D/g, '');
if (tel.length === 10) tel = '1' + tel;
const texto = String(b.texto || '').trim();
if (tel.length < 11 || tel.length > 15) return [{ json: { ok: false, error: 'telefono-invalido' } }];
if (!texto || texto.length > 1500) return [{ json: { ok: false, error: 'texto-invalido' } }];
return [{ json: { ok: true, telefono: tel, texto } }];` }, [260, 0]),
    nodo("¿Datos válidos?", "n8n-nodes-base.if", 2.2, { conditions: { options: opts, conditions: [{ id: "c1", leftValue: "={{ $json.ok }}", rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {} }, [520, 0]),
    nodo("Enviar", "n8n-nodes-evolution-api.evolutionApi", 1, { resource: "messages-api", instanceName: "Level-Up-Media-Whatsapp", remoteJid: "={{ $json.telefono }}@s.whatsapp.net", messageText: "={{ $json.texto }}", options_message: {} }, [780, -80], { credentials: { evolutionApi: CRED_EVO }, onError: "continueRegularOutput" }),
    nodo("Resultado", "n8n-nodes-base.code", 2, { jsCode: `const v = $('Validar').first().json;
const r = $json || {};
const key = (r.data && r.data.key) || r.key;
const ok = !!(key && key.id);
return [{ json: { ok, id: ok ? key.id : null, error: ok ? null : String((r.error && r.error.message) || r.message || 'evolution-sin-id').slice(0, 160), sessionId: v.telefono + '@s.whatsapp.net', mensaje: JSON.stringify({ type: 'ai', content: v.texto, additional_kwargs: {}, tool_calls: [], invalid_tool_calls: [], response_metadata: {} }) } }];` }, [1040, -80]),
    nodo("Memoria del agente", "n8n-nodes-base.postgres", 2.6, { operation: "executeQuery", query: "INSERT INTO n8n_chat_histories_3344 (session_id, message)\nVALUES ($1, $2::jsonb);", options: { queryReplacement: "={{ [$json.sessionId, $json.mensaje] }}" } }, [1300, -80], { credentials: { postgres: CRED_PG }, onError: "continueRegularOutput", alwaysOutputData: true }),
    nodo("Respuesta", "n8n-nodes-base.code", 2, { jsCode: `// Respuesta final: si hubo envío, lo que salió; si no, el error de validación.
if ($('Resultado').isExecuted) { const r = $('Resultado').first().json; return [{ json: { ok: r.ok, id: r.id, error: r.error } }]; }
const v = $('Validar').first().json;
return [{ json: { ok: false, id: null, error: v.error || 'datos' } }];` }, [1560, 0]),
  ];
  const lista = [
    ["Enviar WhatsApp (webhook)", "Validar", 0], ["Validar", "¿Datos válidos?", 0],
    ["¿Datos válidos?", "Enviar", 0], ["¿Datos válidos?", "Respuesta", 1],
    ["Enviar", "Resultado", 0], ["Resultado", "Memoria del agente", 0], ["Memoria del agente", "Respuesta", 0],
  ];
  const connections = {};
  for (const [de, a, salida] of lista) {
    connections[de] ??= { main: [] };
    while (connections[de].main.length <= salida) connections[de].main.push([]);
    connections[de].main[salida].push({ node: a, type: "main", index: 0 });
  }
  return { name: NOMBRE, nodes, connections, settings: { executionOrder: "v1", errorWorkflow: ERROR_WORKFLOW, timezone: "America/Puerto_Rico" } };
}

const cmd = process.argv[2];
try {
  if (cmd === "crear") {
    const est = JSON.parse(fs.readFileSync(ESTADO, "utf8"));
    if (!est.credencialId) throw new Error("Falta la credencial Pulse ↔ n8n (n8n-sync-pulse.mjs crear).");
    const w = armar(est.credencialId);
    fs.writeFileSync(path.join(ROOT, "data/n8n/plantillas/enviar-whatsapp.json"), JSON.stringify(w, null, 2) + "\n");
    const id = est.enviarWhatsappWorkflowId;
    if (id) {
      await api(`/workflows/${id}`, { method: "PUT", body: JSON.stringify(w) });
      await api(`/workflows/${id}/deactivate`, { method: "POST" });
      await api(`/workflows/${id}/activate`, { method: "POST" });
      console.log(`Actualizado y activo: ${NOMBRE}`);
    } else {
      const r = await api("/workflows", { method: "POST", body: JSON.stringify(w) });
      fs.writeFileSync(ESTADO, JSON.stringify({ ...est, enviarWhatsappWorkflowId: r.id, actualizadoEl: new Date().toISOString() }, null, 2) + "\n");
      await api(`/workflows/${r.id}/activate`, { method: "POST" });
      console.log(`Creado y activo: ${NOMBRE} → ${URL_N8N}/workflow/${r.id}`);
    }
  } else if (cmd === "probar") {
    for (const body of [{ telefono: "123", texto: "hola" }, { telefono: "7875550100", texto: "" }]) {
      const r = await fetch(`${URL_N8N}/webhook/enviar-whatsapp`, { method: "POST", headers: { "Content-Type": "application/json", "x-pulse-secret": SECRETO }, body: JSON.stringify(body) });
      console.log(JSON.stringify(body), "→", r.status, (await r.text()).slice(0, 160));
    }
    const sin = await fetch(`${URL_N8N}/webhook/enviar-whatsapp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    console.log("sin secreto →", sin.status);
  } else {
    console.error("Comandos: crear | probar");
    process.exit(1);
  }
} catch (e) { console.error(`enviar-whatsapp: ${e.message}`); process.exit(1); }
