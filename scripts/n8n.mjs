#!/usr/bin/env node
// Manos de Nico sobre el n8n de Level Up (n8nv2.levelupmediapr.net). Solo usa la API pública
// (X-N8N-API-KEY) — nunca la contraseña de la UI. Todo lo que baja queda en data/n8n/ para que
// el repo sea el respaldo: si el proveedor de soporte se va o el servidor muere, los workflows
// se re-importan desde acá.
//
//   node scripts/n8n.mjs inventario   → lista todos los workflows (activo, nodos, triggers,
//                                        credenciales que usa, tags) → data/n8n/inventario.json
//   node scripts/n8n.mjs exportar     → baja el JSON completo de cada workflow a
//                                        data/n8n/workflows/<id>-<slug>.json (idempotente)
//   node scripts/n8n.mjs ejecuciones [dias=7]
//                                     → éxito/error por workflow en los últimos N días, con la
//                                        última falla de cada uno → data/n8n/salud.json
//   node scripts/n8n.mjs salud        → resumen corto (lo que lee la ronda de Nico)
//   node scripts/n8n.mjs todo         → inventario + exportar + ejecuciones + salud
//   node scripts/n8n.mjs subir <id>   → sube data/n8n/workflows/<id>-*.json al servidor (PUT). Es la
//                                        única escritura: editar el JSON local, subir, y volver a
//                                        exportar. No activa ni desactiva nada.
//
// Env (.env.local): N8N_API_KEY (Settings → n8n API → Create API key), N8N_URL opcional.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "data/n8n");

function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}

const URL_BASE = (env("N8N_URL") || "https://n8nv2.levelupmediapr.net").replace(/\/$/, "");
const KEY = env("N8N_API_KEY");

async function api(ruta, params = {}) {
  if (!KEY) throw new Error("Falta N8N_API_KEY en .env.local (n8n → Settings → n8n API → Create API key).");
  const u = new URL(`${URL_BASE}/api/v1${ruta}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  const r = await fetch(u, { headers: { "X-N8N-API-KEY": KEY, Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} en ${ruta}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

// La API pagina con cursor; esto junta todas las páginas.
async function todas(ruta, params = {}) {
  const items = [];
  let cursor;
  do {
    const j = await api(ruta, { ...params, limit: 250, cursor });
    items.push(...(j.data || []));
    cursor = j.nextCursor;
  } while (cursor);
  return items;
}

const slug = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
// Los respaldos van a GitHub: nunca con secretos adentro (tokens de Slack xox…, keys).
const redactar = (txt) => txt.replace(/xox[abpors]-[0-9A-Za-z-]{10,}/g, "xox_-REDACTADO").replace(/sk-[A-Za-z0-9]{20,}/g, "sk-REDACTADO");
const guardar = (nombre, obj) => { fs.mkdirSync(path.dirname(path.join(OUT, nombre)), { recursive: true }); fs.writeFileSync(path.join(OUT, nombre), redactar(JSON.stringify(obj, null, 2)) + "\n"); };

// Resume un workflow a lo que Nico necesita para entenderlo sin abrir n8n.
function resumir(w) {
  const nodos = w.nodes || [];
  const triggers = nodos.filter((n) => /trigger|webhook|cron|schedule|interval|poll/i.test(n.type) || n.type.endsWith("Trigger"));
  const creds = new Set();
  for (const n of nodos) for (const c of Object.values(n.credentials || {})) creds.add(`${c.name || c.id}`);
  const servicios = new Set(nodos.map((n) => n.type.replace(/^n8n-nodes-base\./, "").replace(/^@n8n\/n8n-nodes-langchain\./, "ai:")));
  const webhooks = nodos.filter((n) => n.type === "n8n-nodes-base.webhook").map((n) => `${n.parameters?.httpMethod || "GET"} /webhook/${n.parameters?.path || ""}`);
  const modelosIA = nodos.filter((n) => /lmChat|lmOpenAi|lmAnthropic|openAi|anthropic|gemini|groq/i.test(n.type)).map((n) => n.parameters?.model?.value || n.parameters?.model || n.parameters?.modelId?.value || n.type);
  return {
    id: w.id,
    nombre: w.name,
    activo: Boolean(w.active),
    actualizadoEl: w.updatedAt,
    creadoEl: w.createdAt,
    tags: (w.tags || []).map((t) => t.name),
    nodos: nodos.length,
    triggers: triggers.map((n) => `${n.name} (${n.type.replace(/^n8n-nodes-base\./, "")})`),
    webhooks,
    servicios: [...servicios].sort(),
    credenciales: [...creds].sort(),
    modelosIA: [...new Set(modelosIA)],
    desactivadosDentro: nodos.filter((n) => n.disabled).map((n) => n.name),
    notas: nodos.filter((n) => n.notes).map((n) => `${n.name}: ${String(n.notes).slice(0, 120)}`),
  };
}

async function inventario() {
  const lista = await todas("/workflows");
  const detalle = [];
  for (const w of lista) detalle.push(resumir(await api(`/workflows/${w.id}`)));
  detalle.sort((a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre));
  const res = { generadoEl: new Date().toISOString(), servidor: URL_BASE, total: detalle.length, activos: detalle.filter((w) => w.activo).length, workflows: detalle };
  guardar("inventario.json", res);
  console.log(`Inventario: ${res.total} workflows (${res.activos} activos) → data/n8n/inventario.json`);
  for (const w of detalle) console.log(`  ${w.activo ? "●" : "○"} ${w.nombre}  [${w.nodos} nodos] ${w.triggers.join(", ") || "sin trigger"}`);
  return res;
}

async function exportar() {
  const lista = await todas("/workflows");
  const dir = path.join(OUT, "workflows");
  fs.mkdirSync(dir, { recursive: true });
  const indice = [];
  for (const w of lista) {
    const full = await api(`/workflows/${w.id}`);
    // Se guarda tal cual lo devuelve n8n: se re-importa con "Import from file" o POST /workflows.
    const archivo = `${w.id}-${slug(w.name)}.json`;
    fs.writeFileSync(path.join(dir, archivo), redactar(JSON.stringify(full, null, 2)) + "\n");
    indice.push({ id: w.id, nombre: w.name, activo: w.active, archivo, actualizadoEl: w.updatedAt });
  }
  guardar("workflows/_indice.json", { exportadoEl: new Date().toISOString(), servidor: URL_BASE, total: indice.length, workflows: indice });
  console.log(`Exportados ${indice.length} workflows → data/n8n/workflows/`);
  return indice;
}

async function ejecuciones(dias = 7) {
  const desde = new Date(Date.now() - dias * 86400 * 1000);
  const lista = await todas("/workflows");
  const porWorkflow = {};
  for (const w of lista) porWorkflow[w.id] = { id: w.id, nombre: w.name, activo: w.active, ok: 0, error: 0, otras: 0, ultimaOk: null, ultimoError: null };
  // Una sola pasada por todas las ejecuciones (más barato que una consulta por workflow).
  let cursor, cortar = false, vistas = 0;
  do {
    const j = await api("/executions", { limit: 250, cursor, includeData: false });
    for (const e of j.data || []) {
      vistas++;
      if (new Date(e.startedAt) < desde) { cortar = true; break; }
      const w = porWorkflow[e.workflowId];
      if (!w) continue;
      const st = e.status || (e.finished ? "success" : "unknown");
      if (st === "success") { w.ok++; if (!w.ultimaOk) w.ultimaOk = e.startedAt; }
      else if (st === "error" || st === "crashed" || st === "failed") { w.error++; if (!w.ultimoError) w.ultimoError = { id: e.id, cuando: e.startedAt, modo: e.mode }; }
      else w.otras++;
    }
    cursor = cortar ? undefined : j.nextCursor;
  } while (cursor);
  // Mensaje de la última falla de cada workflow con errores (una llamada por workflow, con datos).
  for (const w of Object.values(porWorkflow)) {
    if (!w.ultimoError) continue;
    try {
      const e = await api(`/executions/${w.ultimoError.id}`, { includeData: true });
      const rd = e.data?.resultData || {};
      w.ultimoError.nodo = rd.lastNodeExecuted || null;
      w.ultimoError.mensaje = String(rd.error?.message || rd.error?.description || "").slice(0, 300) || null;
    } catch {}
  }
  const res = {
    generadoEl: new Date().toISOString(), dias, desde: desde.toISOString(), ejecucionesVistas: vistas,
    workflows: Object.values(porWorkflow).sort((a, b) => b.error - a.error || b.ok - a.ok),
  };
  guardar("salud.json", res);
  console.log(`Ejecuciones (${dias} días): ${vistas} vistas → data/n8n/salud.json`);
  for (const w of res.workflows.filter((w) => w.ok + w.error + w.otras)) console.log(`  ${w.error ? "✗" : "✓"} ${w.nombre}: ${w.ok} ok / ${w.error} error${w.ultimoError?.nodo ? ` — último en "${w.ultimoError.nodo}": ${w.ultimoError.mensaje || ""}` : ""}`);
  return res;
}

// Escribe un workflow parcheado localmente. La API solo acepta name/nodes/connections/settings/staticData.
async function subir(id) {
  const dir = path.join(OUT, "workflows");
  const archivo = fs.readdirSync(dir).find((f) => f.startsWith(`${id}-`));
  if (!archivo) throw new Error(`No hay data/n8n/workflows/${id}-*.json (corré exportar primero).`);
  const w = JSON.parse(fs.readFileSync(path.join(dir, archivo), "utf8"));
  // La API pública rechaza llaves nuevas de settings (timeSavedMode, callerPolicy, availableInMCP…):
  // se mandan solo las del esquema; las demás las conserva el servidor.
  const PERMITIDAS = ["saveExecutionProgress", "saveManualExecutions", "saveDataErrorExecution", "saveDataSuccessExecution", "executionTimeout", "errorWorkflow", "timezone", "executionOrder"];
  const settings = Object.fromEntries(Object.entries(w.settings || {}).filter(([k]) => PERMITIDAS.includes(k)));
  const body = { name: w.name, nodes: w.nodes, connections: w.connections, settings, staticData: w.staticData ?? null };
  const r = await fetch(`${URL_BASE}/api/v1/workflows/${id}`, { method: "PUT", headers: { "X-N8N-API-KEY": KEY, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${r.status} al subir ${id}: ${txt.slice(0, 300)}`);
  const j = JSON.parse(txt);
  console.log(`Subido: ${j.name} (activo=${j.active}, versión ${j.versionId})`);
  return j;
}

// Lo que consume la ronda de Nico: pocas líneas, sin tocar nada.
async function salud() {
  let s;
  try { s = JSON.parse(fs.readFileSync(path.join(OUT, "salud.json"), "utf8")); } catch { s = await ejecuciones(1); }
  const con = s.workflows.filter((w) => w.ok + w.error + w.otras > 0);
  const rotos = con.filter((w) => w.error > 0).map((w) => ({ nombre: w.nombre, error: w.error, ok: w.ok, nodo: w.ultimoError?.nodo, mensaje: w.ultimoError?.mensaje }));
  const mudos = s.workflows.filter((w) => w.activo && w.ok + w.error + w.otras === 0).map((w) => w.nombre);
  const res = { generadoEl: s.generadoEl, dias: s.dias, activos: s.workflows.filter((w) => w.activo).length, conActividad: con.length, conErrores: rotos.length, rotos, activosSinEjecuciones: mudos };
  console.log(JSON.stringify(res, null, 2));
  return res;
}

const cmd = process.argv[2] || "salud";
try {
  if (cmd === "inventario") await inventario();
  else if (cmd === "exportar") await exportar();
  else if (cmd === "ejecuciones") await ejecuciones(Number(process.argv[3]) || 7);
  else if (cmd === "salud") await salud();
  else if (cmd === "subir") await subir(process.argv[3]);
  else if (cmd === "todo") { await inventario(); await exportar(); await ejecuciones(Number(process.argv[3]) || 7); await salud(); }
  else { console.error("Comandos: inventario | exportar | ejecuciones [dias] | salud | subir <id> | todo"); process.exit(1); }
} catch (e) { console.error(`n8n: ${e.message}`); process.exit(1); }
