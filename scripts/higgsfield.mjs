#!/usr/bin/env node
// Higgsfield para Max (y para cualquier tarea sin navegador): cliente del MCP oficial
// (https://mcp.higgsfield.ai/mcp) con OAuth propio, para que el media buyer pueda generar
// imágenes/videos, multiplicar anuncios (Ad Multiplier), usar Marketing Studio, etc. desde
// Railway sin conector de claude.ai.
//
//   node scripts/higgsfield.mjs login                 una vez, en la Mac (abre el navegador; guarda tokens)
//   node scripts/higgsfield.mjs quien                 verifica sesión (workspace, créditos)
//   node scripts/higgsfield.mjs tools [filtro]        lista herramientas del MCP (nombre + resumen)
//   node scripts/higgsfield.mjs esquema <tool>        schema de entrada de una herramienta
//   node scripts/higgsfield.mjs call <tool> '<json>'  llama cualquier herramienta (lo que usa Max)
//   node scripts/higgsfield.mjs imagen "<prompt>" [--modelo soul_2] [--ar 9:16] [--n 1] [--calidad 2k]
//   node scripts/higgsfield.mjs video "<prompt>" [--modelo <id>] [--img <media_id|job_id>] [--dur 8] [--ar 9:16]
//   node scripts/higgsfield.mjs esperar <job_id[,job_id…]>   espera y devuelve las URLs
//   node scripts/higgsfield.mjs subir <url>           importa un video/imagen por URL (media_id para Ad Multiplier)
//   node scripts/higgsfield.mjs modelos [q]           explora modelos
//   node scripts/higgsfield.mjs flujo <nombre>        instrucciones de un flujo (ad-multiplier, ugc-review-video…)
//
// Tokens: HIGGSFIELD_AUTH_FILE (default data/higgsfield-auth.json, ignorado por git) o la variable
// HIGGSFIELD_OAUTH_JSON (base64 del mismo JSON; así viaja a Railway). Se refrescan solos
// (offline_access). Higgsfield solo permite el flujo con navegador para clientes registrados
// dinámicamente (el de código de dispositivo lo reserva a sus propios agentes), por eso el
// `login` se hace una vez en la Mac y el archivo se sube a Railway.
import { createServer } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const MCP = "https://mcp.higgsfield.ai/mcp";
const AUTH = { authorize: "https://clerk.higgsfield.ai/oauth/authorize", token: "https://clerk.higgsfield.ai/oauth/token", register: "https://clerk.higgsfield.ai/oauth/register" };
const SCOPE = "openid email offline_access";
const PUERTO = Number(process.env.HIGGSFIELD_LOGIN_PORT || 8765);
const REDIRECT = `http://localhost:${PUERTO}/cb`;
const ARCHIVO = process.env.HIGGSFIELD_AUTH_FILE || resolve(process.env.PUENTE_ESTADO_DIR || resolve(ROOT, "data"), "higgsfield-auth.json");

const args = process.argv.slice(2);
const flags = {}; const pos = [];
for (let i = 0; i < args.length; i++) { const a = args[i]; if (a.startsWith("--")) { const [k, v] = a.slice(2).split("="); flags[k] = v ?? (args[i + 1]?.startsWith("--") ? true : args[++i]); } else pos.push(a); }
const [cmd, ...rest] = pos;

// ---------- credenciales ----------
function leerAuth() {
  if (existsSync(ARCHIVO)) try { return JSON.parse(readFileSync(ARCHIVO, "utf8")); } catch {}
  if (process.env.HIGGSFIELD_OAUTH_JSON) try { return JSON.parse(Buffer.from(process.env.HIGGSFIELD_OAUTH_JSON, "base64").toString("utf8")); } catch {}
  return null;
}
function guardarAuth(a) { mkdirSync(dirname(ARCHIVO), { recursive: true }); writeFileSync(ARCHIVO, JSON.stringify(a, null, 2) + "\n", { mode: 0o600 }); }
async function form(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${url} → ${r.status} ${j.error || ""} ${j.error_description || ""}`.trim());
  return j;
}
async function registrarCliente() {
  const r = await fetch(AUTH.register, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_name: "Max · media buyer de IA Market", redirect_uris: [REDIRECT], grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none", scope: SCOPE }) });
  const j = await r.json();
  if (!j.client_id) throw new Error("No pude registrar el cliente OAuth: " + JSON.stringify(j).slice(0, 200));
  return j.client_id;
}
async function login() {
  const client_id = await registrarCliente();
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(12).toString("base64url");
  const url = `${AUTH.authorize}?${new URLSearchParams({ client_id, redirect_uri: REDIRECT, response_type: "code", scope: SCOPE, code_challenge: challenge, code_challenge_method: "S256", state, resource: MCP })}`;
  const code = await new Promise((res, rej) => {
    const srv = createServer((req, r) => {
      const u = new URL(req.url, REDIRECT);
      if (u.pathname !== "/cb") { r.writeHead(404); return r.end(); }
      if (u.searchParams.get("state") !== state) { r.writeHead(400); r.end("state incorrecto"); return rej(new Error("state incorrecto")); }
      r.writeHead(200, { "content-type": "text/html; charset=utf-8" }); r.end("<h2>Listo. Max ya puede usar Higgsfield. Puedes cerrar esta pestaña.</h2>");
      srv.close(); res(u.searchParams.get("code"));
    });
    srv.listen(PUERTO, () => {
      console.log("Abre este enlace en el navegador (si no se abre solo) y autoriza:\n\n  " + url + "\n");
      const abrir = process.platform === "darwin" ? "open" : "xdg-open";
      try { spawn(abrir, [url], { stdio: "ignore", detached: true }).unref(); } catch {}
    });
    setTimeout(() => { srv.close(); rej(new Error("Se acabó el tiempo (5 min) esperando la autorización")); }, 300000);
  });
  const t = await form(AUTH.token, { grant_type: "authorization_code", code, redirect_uri: REDIRECT, client_id, code_verifier: verifier, resource: MCP });
  const auth = { client_id, access_token: t.access_token, refresh_token: t.refresh_token || null, expires_at: Date.now() + (Number(t.expires_in || 3600) - 60) * 1000, scope: t.scope || SCOPE, creado: new Date().toISOString() };
  guardarAuth(auth);
  console.log(`✔ Sesión guardada en ${ARCHIVO.replace(ROOT + "/", "")}${auth.refresh_token ? " (con refresh: se renueva sola)" : " (⚠ sin refresh token: habrá que repetir login al vencer)"}.`);
  console.log("\nPara que Max la use en Railway:\n  node scripts/higgsfield.mjs exportar   → imprime el comando de railway variables");
}
async function tokenVigente() {
  let a = leerAuth();
  if (!a) throw new Error("Sin sesión de Higgsfield. Corre en la Mac: node scripts/higgsfield.mjs login");
  if (Date.now() < (a.expires_at || 0)) return a.access_token;
  if (!a.refresh_token) throw new Error("La sesión de Higgsfield venció y no tiene refresh token: repite `login`.");
  const t = await form(AUTH.token, { grant_type: "refresh_token", refresh_token: a.refresh_token, client_id: a.client_id, resource: MCP });
  a = { ...a, access_token: t.access_token, refresh_token: t.refresh_token || a.refresh_token, expires_at: Date.now() + (Number(t.expires_in || 3600) - 60) * 1000, renovado: new Date().toISOString() };
  try { guardarAuth(a); } catch {}
  return a.access_token;
}

// ---------- cliente MCP (Streamable HTTP) ----------
let sesion = null, rpcId = 0;
async function rpc(method, params, { notificacion = false } = {}) {
  const token = await tokenVigente();
  const body = notificacion ? { jsonrpc: "2.0", method, params } : { jsonrpc: "2.0", id: ++rpcId, method, params };
  const r = await fetch(MCP, { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json", accept: "application/json, text/event-stream", ...(sesion ? { "mcp-session-id": sesion } : {}) }, body: JSON.stringify(body) });
  if (r.headers.get("mcp-session-id")) sesion = r.headers.get("mcp-session-id");
  if (notificacion) return null;
  const ct = r.headers.get("content-type") || "";
  const texto = await r.text();
  if (!r.ok) throw new Error(`MCP ${method} → ${r.status}: ${texto.slice(0, 300)}`);
  let msg = null;
  if (ct.includes("text/event-stream")) {
    for (const linea of texto.split("\n")) if (linea.startsWith("data:")) { try { const j = JSON.parse(linea.slice(5).trim()); if (j.id === body.id) msg = j; } catch {} }
  } else msg = JSON.parse(texto);
  if (!msg) throw new Error(`MCP ${method}: respuesta vacía`);
  if (msg.error) throw new Error(`MCP ${method}: ${msg.error.message || JSON.stringify(msg.error)}`);
  return msg.result;
}
async function conectar() {
  const init = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "max-media-buyer", version: "1.0" } });
  await rpc("notifications/initialized", {}, { notificacion: true });
  return init;
}
async function herramientas() { const r = await rpc("tools/list", {}); return r.tools || []; }
async function llamar(nombre, argumentos) {
  const r = await rpc("tools/call", { name: nombre, arguments: argumentos });
  const textos = (r.content || []).filter((c) => c.type === "text").map((c) => c.text);
  return { texto: textos.join("\n"), estructurado: r.structuredContent ?? null, error: !!r.isError, contenido: r.content };
}
const json = (s) => { try { return JSON.parse(s); } catch { throw new Error("JSON inválido: " + s.slice(0, 80)); } };
function mostrar(res) {
  if (res.error) console.error("✖ " + res.texto);
  else console.log(res.estructurado ? JSON.stringify(res.estructurado, null, 2) : res.texto);
}

try {
  if (!cmd || cmd === "ayuda") { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).slice(0, 18).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); }
  else if (cmd === "login") await login();
  else if (cmd === "exportar") {
    const a = leerAuth(); if (!a) throw new Error("Sin sesión: corre login primero");
    const b64 = Buffer.from(JSON.stringify(a)).toString("base64");
    console.log(`cd "${ROOT}" && npx @railway/cli variables --service max --set "HIGGSFIELD_OAUTH_JSON=${b64}"`);
  }
  else if (cmd === "quien") {
    const init = await conectar();
    console.log("Servidor:", init.serverInfo?.name, init.serverInfo?.version, "| protocolo", init.protocolVersion);
    const ws = await llamar("list_workspaces", {}); mostrar(ws);
  }
  else if (cmd === "tools") {
    await conectar();
    const t = await herramientas();
    const f = rest[0] ? t.filter((x) => new RegExp(rest[0], "i").test(x.name + " " + (x.description || ""))) : t;
    for (const x of f) console.log(`- ${x.name}: ${(x.description || "").replace(/\s+/g, " ").slice(0, 160)}`);
    console.log(`${f.length} herramientas`);
  }
  else if (cmd === "esquema") { await conectar(); const t = (await herramientas()).find((x) => x.name === rest[0]); if (!t) throw new Error("No existe " + rest[0]); console.log(JSON.stringify({ name: t.name, description: t.description, inputSchema: t.inputSchema }, null, 2)); }
  else if (cmd === "call") { await conectar(); mostrar(await llamar(rest[0], rest[1] ? json(rest[1]) : {})); }
  else if (cmd === "imagen") {
    await conectar();
    const params = { model: flags.modelo || "soul_2", prompt: rest[0], count: Number(flags.n || 1), aspect_ratio: flags.ar || "9:16", quality: flags.calidad || "2k" };
    if (flags.img) params.medias = String(flags.img).split(",").map((v) => ({ value: v, role: "image" }));
    if (flags.unlim) params.use_unlim = true;
    mostrar(await llamar("generate_image", { params }));
  }
  else if (cmd === "video") {
    await conectar();
    const params = { model: flags.modelo || "kling_3", prompt: rest[0], count: Number(flags.n || 1), duration: Number(flags.dur || 8), aspect_ratio: flags.ar || "9:16", resolution: flags.res || "720p" };
    if (flags.img) params.medias = String(flags.img).split(",").map((v) => ({ value: v, role: "image" }));
    if (flags.audio === "false") params.generate_audio = false;
    if (flags.unlim) params.use_unlim = true;
    mostrar(await llamar("generate_video", { params }));
  }
  else if (cmd === "esperar") { await conectar(); mostrar(await llamar("jobs_wait", { job_ids: rest[0].split(",") })); }
  else if (cmd === "subir") { await conectar(); mostrar(await llamar("media_import_url", { url: rest[0] })); }
  else if (cmd === "modelos") { await conectar(); mostrar(await llamar("models_explore", rest[0] ? { action: "search", query: rest[0] } : { action: "list" })); }
  else if (cmd === "flujo") { await conectar(); mostrar(await llamar("get_workflow_instructions", rest[0] ? { workflow: rest[0] } : {})); }
  else { console.error("Comando desconocido:", cmd); process.exit(1); }
} catch (e) { console.error("✖", e.message); process.exit(1); }
