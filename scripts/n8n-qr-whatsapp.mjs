#!/usr/bin/env node
// "L-2) QR WhatsApp (Content OS)" — le da a Content OS el estado y el QR de la instancia de WhatsApp de Level Up
// (Evolution) sin sacar la llave de Evolution de n8n. Lo usa /vincular-whatsapp (página con QR que se renueva sola,
// con enlace temporal para quien tiene el teléfono). Webhook POST /webhook/whatsapp-qr con la credencial
// "Pulse ↔ n8n (x-pulse-secret)". Devuelve { estado: "open"|"connecting"|..., base64? }.
//   node scripts/n8n-qr-whatsapp.mjs crear
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
const EVO = "https://levelup-media-project-evolution-api.ksnxqw.easypanel.host";
const INSTANCIA = "Level-Up-Media-Whatsapp";
const CRED_EVO = { id: "o3VodCojIbc9QZ6C", name: "Evolution account" };
const NOMBRE = "L-2) QR WhatsApp (Content OS)";

async function api(ruta, init = {}) {
  const r = await fetch(`${URL_N8N}/api/v1${ruta}`, { ...init, headers: { "X-N8N-API-KEY": KEY, "Content-Type": "application/json" }, signal: AbortSignal.timeout(30000) });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${ruta}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : {};
}
const opts = { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 };
const nodo = (name, type, typeVersion, parameters, position, extra = {}) => ({ id: `q-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name, type, typeVersion, position, parameters, ...extra });
const http = (name, url, position) => nodo(name, "n8n-nodes-base.httpRequest", 4.2, { url, authentication: "predefinedCredentialType", nodeCredentialType: "evolutionApi", options: {} }, position, { credentials: { evolutionApi: CRED_EVO }, onError: "continueRegularOutput" });

function armar(credId) {
  const nodes = [
    nodo("Nota", "n8n-nodes-base.stickyNote", 1, { width: 480, height: 200, content: "## QR de WhatsApp (Content OS)\nContent OS (/vincular-whatsapp) lo llama para saber si la instancia de Level Up está conectada y, si no, traer un QR fresco.\nDevuelve `{ estado, base64? }`. No manda ningún mensaje.\nFuente: scripts/n8n-qr-whatsapp.mjs" }, [0, -300]),
    nodo("QR (webhook)", "n8n-nodes-base.webhook", 2, { httpMethod: "POST", path: "whatsapp-qr", authentication: "headerAuth", responseMode: "lastNode", responseData: "firstEntryJson", options: {} }, [0, 0], { webhookId: "whatsapp-qr", credentials: { httpHeaderAuth: { id: credId, name: "Pulse ↔ n8n (x-pulse-secret)" } } }),
    http("Estado", `${EVO}/instance/connectionState/${INSTANCIA}`, [260, 0]),
    nodo("¿Conectado?", "n8n-nodes-base.if", 2.2, { conditions: { options: opts, conditions: [{ id: "c1", leftValue: "={{ $json.instance && $json.instance.state }}", rightValue: "open", operator: { type: "string", operation: "equals" } }], combinator: "and" }, options: {} }, [520, 0]),
    nodo("Ya está conectado", "n8n-nodes-base.code", 2, { jsCode: "return [{ json: { estado: 'open' } }];" }, [780, -80]),
    http("Pedir QR", `${EVO}/instance/connect/${INSTANCIA}`, [780, 100]),
    nodo("Con QR", "n8n-nodes-base.code", 2, { jsCode: "const r = $json || {};\nreturn [{ json: { estado: r.base64 ? 'connecting' : 'error', base64: r.base64 || null } }];" }, [1040, 100]),
  ];
  const lista = [["QR (webhook)", "Estado", 0], ["Estado", "¿Conectado?", 0], ["¿Conectado?", "Ya está conectado", 0], ["¿Conectado?", "Pedir QR", 1], ["Pedir QR", "Con QR", 0]];
  const connections = {};
  for (const [de, a, salida] of lista) {
    connections[de] ??= { main: [] };
    while (connections[de].main.length <= salida) connections[de].main.push([]);
    connections[de].main[salida].push({ node: a, type: "main", index: 0 });
  }
  return { name: NOMBRE, nodes, connections, settings: { executionOrder: "v1", timezone: "America/Puerto_Rico" } };
}

if (process.argv[2] === "crear") {
  const est = JSON.parse(fs.readFileSync(ESTADO, "utf8"));
  const w = armar(est.credencialId);
  fs.writeFileSync(path.join(ROOT, "data/n8n/plantillas/qr-whatsapp.json"), JSON.stringify(w, null, 2) + "\n");
  if (est.qrWhatsappWorkflowId) {
    await api(`/workflows/${est.qrWhatsappWorkflowId}`, { method: "PUT", body: JSON.stringify(w) });
    await api(`/workflows/${est.qrWhatsappWorkflowId}/deactivate`, { method: "POST" });
    await api(`/workflows/${est.qrWhatsappWorkflowId}/activate`, { method: "POST" });
    console.log("Actualizado y activo:", NOMBRE);
  } else {
    const r = await api("/workflows", { method: "POST", body: JSON.stringify(w) });
    fs.writeFileSync(ESTADO, JSON.stringify({ ...est, qrWhatsappWorkflowId: r.id }, null, 2) + "\n");
    await api(`/workflows/${r.id}/activate`, { method: "POST" });
    console.log("Creado y activo:", NOMBRE, r.id);
  }
} else console.error("Comando: crear");
