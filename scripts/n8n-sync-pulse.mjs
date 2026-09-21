#!/usr/bin/env node
// Arma y sube a n8n el workflow "A-) Sync Pulse → NocoDB v1": el reemplazo del alimentador
// Monday → NocoDB ("A-) Migracion de datos de monday v5"). Pulse (lib/pulse/puente-n8n.ts)
// manda el registro plano de cada cliente; este workflow lo convierte en la fila de la tabla
// `clientes` de NocoDB que leen todos los agentes, con sus links a equipo (admin/traffiker) e
// industrias, y saca la fecha de la primera campaña Level Up de Meta como hacía el viejo.
//
//   node scripts/n8n-sync-pulse.mjs generar     → escribe data/n8n/plantillas/sync-pulse-nocodb.json
//   node scripts/n8n-sync-pulse.mjs crear       → crea la credencial del secreto (si falta) y el
//                                                  workflow (inactivo). Guarda ids en data/n8n/sync-pulse.json
//   node scripts/n8n-sync-pulse.mjs actualizar  → PUT del workflow ya creado (tras cambiar este archivo)
//   node scripts/n8n-sync-pulse.mjs activar     → lo activa (SOLO con OK de Elvin)
//   node scripts/n8n-sync-pulse.mjs probar      → manda un cliente de prueba al webhook (simulación)
//
// Env: N8N_URL, N8N_API_KEY, PULSE_N8N_SECRET (el mismo que Vercel), PULSE_URL opcional.
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
const URL_PULSE = (env("PULSE_URL") || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
const ESTADO = path.join(ROOT, "data/n8n/sync-pulse.json");
const PLANTILLA = path.join(ROOT, "data/n8n/plantillas/sync-pulse-nocodb.json");

// Lo que ya existe en el n8n de Level Up (ids sacados de "Migracion de datos de monday v5").
const NOCODB = "https://levelup-media-project-nocodb.ksnxqw.easypanel.host/api/v2";
const T = { clientes: "mom1ynk05ap3m1l", equipo: "m0uib6kq4i1gelp", industrias: "mur2zaymbw5791i" };
const LINK = { traffiker: "ct33f49i8som5rx", admin: "c2c88wzry5od96o", industrias: "c7xyj70esnqjve0" };
const CRED_NOCODB = { id: "V2awKCkA1AJCFG27", name: "NocoDB Token account" };
const CRED_FACEBOOK = { id: "B89LULeA8wFpxWpo", name: "Levelito Acoount management" };
const ERROR_WORKFLOW = "fEOX9Q3Szkf6bLQq"; // "Notificación Error"
const NOMBRE = "A-) Sync Pulse → NocoDB v1";
const NOMBRE_CRED = "Pulse ↔ n8n (x-pulse-secret)";

async function api(ruta, init = {}) {
  if (!KEY) throw new Error("Falta N8N_API_KEY en .env.local");
  const r = await fetch(`${URL_N8N}/api/v1${ruta}`, { ...init, headers: { "X-N8N-API-KEY": KEY, "Content-Type": "application/json", Accept: "application/json", ...(init.headers || {}) }, signal: AbortSignal.timeout(30000) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${ruta}: ${txt.slice(0, 300)}`);
  return txt ? JSON.parse(txt) : {};
}
const leerEstado = () => { try { return JSON.parse(fs.readFileSync(ESTADO, "utf8")); } catch { return {}; } };
const guardarEstado = (o) => fs.writeFileSync(ESTADO, JSON.stringify({ ...leerEstado(), ...o, actualizadoEl: new Date().toISOString() }, null, 2) + "\n");

// ---------- constructores de nodos ----------
let x = 0;
const pos = (col, fila) => [col * 260, fila * 200];
const cond = (left, right, operation = "equals", type = "string") => ({ id: `c${++x}`, leftValue: left, rightValue: right, operator: { type, operation, ...(operation === "true" || operation === "exists" || operation === "notEmpty" ? { singleValue: true } : {}) } });
const opts = { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 };
const nodo = (name, type, typeVersion, parameters, p, extra = {}) => ({ id: `n-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name, type, typeVersion, position: p, parameters, ...extra });
const nocoHttp = (name, method, url, p, body, extra = {}) =>
  nodo(name, "n8n-nodes-base.httpRequest", 4.2, { method, url, authentication: "predefinedCredentialType", nodeCredentialType: "nocoDbApiToken", ...(body ? { sendBody: true, specifyBody: "json", jsonBody: body } : {}), options: {} }, p, { credentials: { nocoDbApiToken: CRED_NOCODB }, ...extra });

function armarWorkflow(credId) {
  const credHeader = { httpHeaderAuth: { id: credId, name: NOMBRE_CRED } };
  const nodes = [
    nodo("Nota", "n8n-nodes-base.stickyNote", 1, { width: 520, height: 260, content: `## Sync Pulse → NocoDB v1\nReemplaza a "A-) Migracion de datos de monday v5" como alimentador de la tabla **clientes** de NocoDB (la que leen todos los agentes).\n\n- **Webhook Pulse**: Pulse avisa en caliente cada cambio (crear/editar/mover/borrar) en LEVEL UP MEDIA o Asignación de Estrategas.\n- **Cada noche 5:10**: repasa todos los clientes desde Pulse (GET /api/pulse/n8n/clientes).\n- Fila = solo si está en CLIENTE ACTIVO; si sale del grupo o se borra, se elimina.\n- Links: traffiker/admin por ID-monday o email en \`equipo\`; industria por nombre.\n- \`simulacion: true\` (PULSE_N8N_MODO ≠ real) → no escribe nada, solo pasa por "Simulación".\n\nFuente: scripts/n8n-sync-pulse.mjs (content-os). No editar a mano: regenerar y \`actualizar\`.` }, pos(0, -2)),

    nodo("Webhook Pulse", "n8n-nodes-base.webhook", 2.1, { httpMethod: "POST", path: "pulse-cliente", authentication: "headerAuth", responseMode: "onReceived", options: {} }, pos(0, 0), { webhookId: "pulse-cliente-sync", credentials: credHeader }),
    nodo("Cada noche 5:10", "n8n-nodes-base.scheduleTrigger", 1.2, { rule: { interval: [{ triggerAtHour: 5, triggerAtMinute: 10 }] } }, pos(0, 1)),
    nodo("Traer clientes de Pulse", "n8n-nodes-base.httpRequest", 4.2, { url: `${URL_PULSE}/api/pulse/n8n/clientes`, authentication: "genericCredentialType", genericAuthType: "httpHeaderAuth", options: { timeout: 90000 } }, pos(1, 1), { credentials: credHeader }),

    nodo("Normalizar", "n8n-nodes-base.code", 2, { jsCode: `// Un item por cliente, venga del webhook (body.clientes) o de la corrida nocturna (clientes).
const salida = [];
for (const item of $input.all()) {
  const j = item.json || {};
  const cuerpo = j.body && typeof j.body === 'object' ? j.body : j;
  const lote = Array.isArray(cuerpo.clientes) ? cuerpo.clientes : [];
  for (const c of lote) {
    if (!c || !c.idMonday) continue;
    salida.push({ json: { ...c, simulacion: cuerpo.simulacion !== false, motivo: cuerpo.motivo || 'nocturna' } });
  }
}
return salida;` }, pos(2, 0)),

    nocoHttp("Buscar en NocoDB", "GET", `${NOCODB}/tables/${T.clientes}/records`, pos(3, 0), null, {}),

    nodo("Decidir", "n8n-nodes-base.code", 2, { mode: "runOnceForEachItem", jsCode: `const c = $('Normalizar').item.json;
const fila = (($json.list) || [])[0] || null;
const tel = String(c.telefono || '').replace(/\\D/g, '');
const campos = {
  'ID-monday': String(c.idMonday),
  nombre: c.nombre || '',
  empresa: c.empresa || '',
  'ID-cuenta-publicitaria': c.idCuenta || '',
  email: c.email || '',
  telefono: tel ? Number(tel) : null,
};
let accion = 'nada';
if (c.activo && !fila) accion = 'crear';
else if (c.activo && fila) accion = 'actualizar';
else if (!c.activo && fila) accion = 'borrar';
const cambios = fila
  ? Object.keys(campos).filter((k) => k !== 'ID-monday' && String(fila[k] ?? '') !== String(campos[k] ?? ''))
  : Object.keys(campos);
if (c.simulacion && accion !== 'nada') accion = 'simular';
const cuentaCambio = !fila || String(fila['ID-cuenta-publicitaria'] ?? '') !== campos['ID-cuenta-publicitaria'];
return { json: { accion, motivo: c.motivo, cliente: c, fila, filaId: fila ? fila.Id : null, campos, cambios, cuentaCambio, resumen: accion + ' ' + c.nombre + (cambios.length ? ' [' + cambios.join(', ') + ']' : '') } };` }, pos(4, 0)),

    nodo("¿Qué hacer?", "n8n-nodes-base.switch", 3.2, { rules: { values: ["crear", "actualizar", "borrar"].map((k) => ({ conditions: { options: opts, conditions: [cond("={{ $json.accion }}", k)], combinator: "and" }, renameOutput: true, outputKey: k })) }, options: { fallbackOutput: "extra" } }, pos(5, 0)),

    // crear
    nocoHttp("Crear fila", "POST", `${NOCODB}/tables/${T.clientes}/records`, pos(6, -1), "={{ JSON.stringify({ ...$json.campos, 'doble-verificacion': true }) }}"),
    nodo("Después de crear", "n8n-nodes-base.code", 2, { mode: "runOnceForEachItem", jsCode: `return { json: { ...$('Decidir').item.json, filaId: $json.Id, cuentaCambio: true } };` }, pos(7, -1)),
    // actualizar
    nodo("¿Cambió algo?", "n8n-nodes-base.if", 2.2, { conditions: { options: opts, conditions: [cond("={{ $json.cambios.length > 0 }}", "", "true", "boolean")], combinator: "and" }, options: {} }, pos(6, 0)),
    nocoHttp("Actualizar fila", "PATCH", `${NOCODB}/tables/${T.clientes}/records`, pos(7, 0), "={{ JSON.stringify([{ Id: $json.filaId, ...$json.campos }]) }}"),
    nodo("Después de actualizar", "n8n-nodes-base.code", 2, { mode: "runOnceForEachItem", jsCode: `return { json: $('Decidir').item.json };` }, pos(8, 0)),
    // borrar
    nocoHttp("Borrar fila", "DELETE", `${NOCODB}/tables/${T.clientes}/records`, pos(6, 1), "={{ JSON.stringify([{ Id: $json.filaId }]) }}"),
    nodo("Simulación (no escribe)", "n8n-nodes-base.noOp", 1, {}, pos(6, 2)),

    // links
    nodo("Plan de links", "n8n-nodes-base.code", 2, { jsCode: `// Por cliente: 3 links (traffiker, admin → equipo; industria → industrias).
const out = [];
for (const it of $input.all()) {
  const { cliente: c, fila, filaId } = it.json;
  if (!filaId) continue;
  out.push({ json: { filaId, nombre: 'traffiker', linkCol: '${LINK.traffiker}', tabla: '${T.equipo}', persona: c.traffiker || {}, actual: fila && fila.traffiker ? fila.traffiker.Id : null } });
  out.push({ json: { filaId, nombre: 'admin', linkCol: '${LINK.admin}', tabla: '${T.equipo}', persona: c.admin || {}, actual: fila && fila.admin ? fila.admin.Id : null } });
  out.push({ json: { filaId, nombre: 'industrias', linkCol: '${LINK.industrias}', tabla: '${T.industrias}', valor: c.industria || '', actual: fila && fila.industrias ? fila.industrias.Id : null } });
}
return out;` }, pos(9, -1)),
    nocoHttp("Buscar destino", "GET", `=${NOCODB}/tables/{{ $json.tabla }}/records?limit=500`, pos(10, -1), null),
    nodo("Elegir destino", "n8n-nodes-base.code", 2, { mode: "runOnceForEachItem", jsCode: `const plan = $('Plan de links').item.json;
const filas = ($json.list) || [];
let hit = null;
if (plan.tabla === '${T.equipo}') {
  const p = plan.persona || {};
  hit = (p.idMonday && filas.find((f) => String(f['ID-monday'] || '') === String(p.idMonday)))
     || (p.email && filas.find((f) => String(f.email || '').trim().toLowerCase() === String(p.email).trim().toLowerCase()))
     || null;
} else {
  const n = String(plan.valor || '').trim().toLowerCase();
  hit = n ? filas.find((f) => String(f.nombre || '').trim().toLowerCase() === n) || null : null;
}
const nuevoId = hit ? hit.Id : null;
// Regla v1: si Pulse no trae a la persona/industria, el link que ya tenía NocoDB se respeta
// (nunca 'quitar'). Solo se pone o se reemplaza cuando Pulse sí tiene un valor.
let accionLink = 'nada';
if (nuevoId && nuevoId !== plan.actual) accionLink = plan.actual ? 'reemplazar' : 'poner';
return { json: { ...plan, nuevoId, destino: hit ? (hit.nombre || '') : null, accionLink } };` }, pos(11, -1)),
    nodo("¿Link?", "n8n-nodes-base.switch", 3.2, { rules: { values: [
      { conditions: { options: opts, conditions: [cond("={{ $json.accionLink }}", "poner")], combinator: "and" }, renameOutput: true, outputKey: "poner" },
      { conditions: { options: opts, conditions: [cond("={{ $json.accionLink }}", "quitar"), cond("={{ $json.accionLink }}", "reemplazar")], combinator: "or" }, renameOutput: true, outputKey: "quitar/reemplazar" },
    ] }, options: { fallbackOutput: "none" } }, pos(12, -1)),
    nocoHttp("Desenlazar viejo", "DELETE", `=${NOCODB}/tables/${T.clientes}/links/{{ $json.linkCol }}/records/{{ $json.filaId }}`, pos(13, 0), "={{ JSON.stringify({ Id: $json.actual }) }}"),
    nodo("¿Hay nuevo?", "n8n-nodes-base.if", 2.2, { conditions: { options: opts, conditions: [cond("={{ !!$('Elegir destino').item.json.nuevoId }}", "", "true", "boolean")], combinator: "and" }, options: {} }, pos(14, 0)),
    nocoHttp("Enlazar", "POST", `=${NOCODB}/tables/${T.clientes}/links/{{ $('Elegir destino').item.json.linkCol }}/records/{{ $('Elegir destino').item.json.filaId }}`, pos(15, -1), "={{ JSON.stringify({ Id: $('Elegir destino').item.json.nuevoId }) }}"),

    // fecha de la primera campaña Level Up (Meta), como hacía el viejo
    nodo("¿Buscar campañas?", "n8n-nodes-base.if", 2.2, { conditions: { options: opts, conditions: [cond("={{ $json.cuentaCambio === true && /^\\d{6,}$/.test(String($json.campos['ID-cuenta-publicitaria'] || '')) }}", "", "true", "boolean")], combinator: "and" }, options: {} }, pos(9, 1)),
    nodo("Campañas de Meta", "n8n-nodes-base.httpRequest", 4.2, { url: "=https://graph.facebook.com/v23.0/act_{{ $json.campos['ID-cuenta-publicitaria'] }}/campaigns", authentication: "predefinedCredentialType", nodeCredentialType: "facebookGraphApi", sendQuery: true, queryParameters: { parameters: [
      { name: "filtering", value: "[{\"field\":\"effective_status\",\"operator\":\"IN\",\"value\":[\"ACTIVE\",\"PAUSED\",\"DELETED\",\"ARCHIVED\",\"IN_PROCESS\",\"WITH_ISSUES\"]}]" },
      { name: "limit", value: "50" },
      { name: "fields", value: "id,name,created_time,status,account_id" },
    ] }, options: {} }, pos(10, 1), { credentials: { facebookGraphApi: CRED_FACEBOOK }, onError: "continueRegularOutput" }),
    nodo("Primera campaña Level Up", "n8n-nodes-base.code", 2, { mode: "runOnceForEachItem", jsCode: `const d = $('¿Buscar campañas?').item.json;
const lista = Array.isArray($json.data) ? $json.data : [];
const lu = lista.filter((c) => /level ?up/i.test(c.name || '')).sort((a, b) => String(a.created_time).localeCompare(String(b.created_time)));
const fecha = lu.length ? String(lu[0].created_time).slice(0, 10) : null;
return { json: { filaId: d.filaId, fecha, actual: d.fila ? d.fila['fecha-inicio-campaña'] : null } };` }, pos(11, 1)),
    nodo("¿Fecha nueva?", "n8n-nodes-base.if", 2.2, { conditions: { options: opts, conditions: [cond("={{ !!$json.fecha && $json.fecha !== $json.actual }}", "", "true", "boolean")], combinator: "and" }, options: {} }, pos(12, 1)),
    nocoHttp("Guardar fecha campaña", "PATCH", `${NOCODB}/tables/${T.clientes}/records`, pos(13, 1), "={{ JSON.stringify([{ Id: $json.filaId, 'fecha-inicio-campaña': $json.fecha }]) }}"),
  ];

  const to = (n, i = 0) => ({ node: n, type: "main", index: i });
  const connections = {
    "Webhook Pulse": { main: [[to("Normalizar")]] },
    "Cada noche 5:10": { main: [[to("Traer clientes de Pulse")]] },
    "Traer clientes de Pulse": { main: [[to("Normalizar")]] },
    Normalizar: { main: [[to("Buscar en NocoDB")]] },
    "Buscar en NocoDB": { main: [[to("Decidir")]] },
    Decidir: { main: [[to("¿Qué hacer?")]] },
    "¿Qué hacer?": { main: [[to("Crear fila")], [to("¿Cambió algo?")], [to("Borrar fila")], [to("Simulación (no escribe)")]] },
    "Crear fila": { main: [[to("Después de crear")]] },
    "Después de crear": { main: [[to("Plan de links"), to("¿Buscar campañas?")]] },
    "¿Cambió algo?": { main: [[to("Actualizar fila")], [to("Después de actualizar")]] },
    "Actualizar fila": { main: [[to("Después de actualizar")]] },
    "Después de actualizar": { main: [[to("Plan de links"), to("¿Buscar campañas?")]] },
    "Plan de links": { main: [[to("Buscar destino")]] },
    "Buscar destino": { main: [[to("Elegir destino")]] },
    "Elegir destino": { main: [[to("¿Link?")]] },
    "¿Link?": { main: [[to("Enlazar")], [to("Desenlazar viejo")]] },
    "Desenlazar viejo": { main: [[to("¿Hay nuevo?")]] },
    "¿Hay nuevo?": { main: [[to("Enlazar")], []] },
    "¿Buscar campañas?": { main: [[to("Campañas de Meta")], []] },
    "Campañas de Meta": { main: [[to("Primera campaña Level Up")]] },
    "Primera campaña Level Up": { main: [[to("¿Fecha nueva?")]] },
    "¿Fecha nueva?": { main: [[to("Guardar fecha campaña")], []] },
  };
  // El GET de búsqueda lleva la query como parámetros (evita problemas de encoding).
  const buscar = nodes.find((n) => n.name === "Buscar en NocoDB");
  buscar.parameters.sendQuery = true;
  buscar.parameters.queryParameters = { parameters: [{ name: "where", value: "=(ID-monday,eq,{{ $json.idMonday }})" }, { name: "limit", value: "1" }] };

  return { name: NOMBRE, nodes, connections, settings: { executionOrder: "v1", errorWorkflow: ERROR_WORKFLOW } };
}

async function credencial() {
  const est = leerEstado();
  if (est.credencialId) return est.credencialId;
  if (!SECRETO) throw new Error("Falta PULSE_N8N_SECRET en .env.local (openssl rand -hex 24) — el mismo que va en Vercel.");
  const c = await api("/credentials", { method: "POST", body: JSON.stringify({ name: NOMBRE_CRED, type: "httpHeaderAuth", data: { name: "x-pulse-secret", value: SECRETO } }) });
  guardarEstado({ credencialId: c.id, credencialNombre: c.name });
  console.log(`Credencial creada: ${c.name} (${c.id})`);
  return c.id;
}

function generar(credId = leerEstado().credencialId || "PENDIENTE") {
  const w = armarWorkflow(credId);
  fs.mkdirSync(path.dirname(PLANTILLA), { recursive: true });
  fs.writeFileSync(PLANTILLA, JSON.stringify(w, null, 2) + "\n");
  console.log(`Plantilla: ${path.relative(ROOT, PLANTILLA)} (${w.nodes.length} nodos)`);
  return w;
}

const cmd = process.argv[2] || "generar";
try {
  if (cmd === "generar") generar();
  else if (cmd === "crear") {
    const credId = await credencial();
    const w = generar(credId);
    const est = leerEstado();
    if (est.workflowId) throw new Error(`Ya existe (${est.workflowId}): usá 'actualizar'.`);
    const r = await api("/workflows", { method: "POST", body: JSON.stringify(w) });
    guardarEstado({ workflowId: r.id, nombre: r.name });
    console.log(`Workflow creado (inactivo): ${r.name} → ${URL_N8N}/workflow/${r.id}`);
    console.log(`Webhook: ${URL_N8N}/webhook/pulse-cliente (activo solo cuando el workflow esté activo)`);
  } else if (cmd === "actualizar") {
    const est = leerEstado();
    if (!est.workflowId) throw new Error("No hay workflowId en data/n8n/sync-pulse.json: corré 'crear'.");
    const w = generar(est.credencialId);
    const r = await api(`/workflows/${est.workflowId}`, { method: "PUT", body: JSON.stringify(w) });
    console.log(`Actualizado: ${r.name} (activo=${r.active})`);
  } else if (cmd === "activar") {
    const est = leerEstado();
    const r = await api(`/workflows/${est.workflowId}/activate`, { method: "POST" });
    guardarEstado({ activadoEl: new Date().toISOString() });
    console.log(`Activado: ${r.name}`);
  } else if (cmd === "probar") {
    const r = await fetch(`${URL_N8N}/webhook/pulse-cliente`, { method: "POST", headers: { "Content-Type": "application/json", "x-pulse-secret": SECRETO }, body: JSON.stringify({ origen: "pulse", motivo: "prueba", simulacion: true, enviadoEl: new Date().toISOString(), clientes: [{ idMonday: "pulse:prueba-nico", pulseId: "prueba", nombre: "Cliente de prueba (Nico)", empresa: "Prueba", industria: "Otro", idCuenta: "", email: "prueba@example.com", telefono: "7875550000", admin: { idMonday: "68180590", nombre: "Carilin Consuegra", email: "carilin@levelupmediapr.net" }, traffiker: { idMonday: null, nombre: null, email: null }, activo: true, grupo: "CLIENTE ACTIVO", actualizadoEl: new Date().toISOString() }] }) });
    console.log(`Webhook → ${r.status} ${(await r.text()).slice(0, 200)}`);
  } else if (cmd === "reporte") {
    // Qué decidió n8n en las últimas ejecuciones (sirve igual en simulación): crear/actualizar/borrar
    // por cliente, con los campos que cambian. Es el "diff" Pulse vs NocoDB de la doble corrida.
    const est = leerEstado();
    if (!est.workflowId) throw new Error("No hay workflowId: corré 'crear'.");
    const n = Number(process.argv[3]) || 3;
    const lista = await api(`/executions?workflowId=${est.workflowId}&limit=${n}`);
    for (const e of lista.data || []) {
      const full = await api(`/executions/${e.id}?includeData=true`);
      const rd = full.data?.resultData?.runData || {};
      const dec = (rd["Decidir"] || []).flatMap((r) => (r.data?.main?.[0] || []).map((i) => i.json));
      const porAccion = {};
      for (const d of dec) (porAccion[d.accion] ||= []).push(d);
      console.log(`\n== Ejecución ${e.id} (${e.mode}, ${e.status}) ${e.startedAt} — ${dec.length} clientes`);
      for (const [acc, ds] of Object.entries(porAccion)) {
        console.log(`  ${acc}: ${ds.length}`);
        for (const d of ds.slice(0, 40)) if (acc !== "nada") console.log(`    - ${d.resumen}${d.cliente?.simulacion ? "" : ""}`);
      }
      const err = full.data?.resultData?.error;
      if (err) console.log(`  ERROR en "${full.data.resultData.lastNodeExecuted}": ${err.message}`);
    }
  } else { console.error("Comandos: generar | crear | actualizar | activar | probar | reporte [n]"); process.exit(1); }
} catch (e) { console.error(`sync-pulse: ${e.message}`); process.exit(1); }
