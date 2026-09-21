#!/usr/bin/env node
// Puente Telegram ↔ agentes de Elvin. Corre en la Mac y le da control remoto desde el
// celular: cualquier mensaje suyo se ejecuta con Claude Code en este repo (skills, comandos,
// memoria, vault, scripts) y la respuesta vuelve a Telegram. Decisión de Elvin, 19/sep/2026:
// "que todos mis agentes me hablen por Telegram y yo pueda pedirles cualquier cosa desde el
// celular, como si estuviera hablando por Claude".
//
// Cómo rutea (SOLO mensajes del chat TELEGRAM_CEO_CHAT_ID; todo lo demás se ignora):
//   texto normal       → Claude Code (`claude -p`) en el repo, sesión persistente por día
//   /sofi <texto>      → lo mismo, actuando como Sofi (cerebro + data/estudio.json)
//   /jarvis <texto>    → lo mismo, como Jarvis (métricas/ops/vault)
//   /nuevo             → sesión nueva (borra el contexto del día)
//   /estado            → qué falta hoy (lee data/estudio.json, sin gastar tokens)
//   /ayuda             → esta lista
//
// Modo de permisos (PUENTE_MODO en .env.local):
//   seguro (default) → edita archivos y corre solo los scripts del repo (node scripts/*, bash
//                      scripts/deploy-snapshots.sh, npm test). No puede correr cualquier comando.
//   total            → sin límites (--dangerously-skip-permissions). Solo si Elvin lo decide.
//
// Usa long polling (getUpdates): al arrancar quita el webhook de Vercel. Si la Mac se apaga,
// Telegram guarda los mensajes hasta 24 h y el puente los procesa al volver. Todo se espeja al
// DM de Slack de Elvin ([Telegram] …) para que la ronda diaria de Sofi lo lea como bitácora.
//
// Correr a mano:  node scripts/telegram-puente.mjs
// Como servicio:  ver scripts/launchd/ (launchctl load del plist).
//
// SEGUNDO BOT — NICO, el vibecoder (19/sep/2026):  PUENTE_BOT=nico node scripts/telegram-puente.mjs
//   Bot de Telegram aparte (TELEGRAM_BOT_TOKEN_NICO), modo total siempre, 60 turnos, y --add-dir
//   con todos los repos de data/plataformas.json. Comandos: /ronda, /plataformas, /nuevo. Cerebro:
//   vault/ceo/cerebro-nico.md. Corre en Railway (servicio `nico`, Dockerfile.nico +
//   scripts/nico-nube.sh: clona los repos de GitHub en /estado/repos, git pull antes de cada pedido
//   y commit+push después). Respaldo en la Mac: scripts/launchd/com.iamarket.nico-puente.plist.
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const ROOT = process.cwd();
// PUENTE_BOT=nico → segundo bot (el vibecoder): token TELEGRAM_BOT_TOKEN_NICO, estado propio,
// persona por defecto "nico", modo total y acceso a TODOS los repos de data/plataformas.json
// (--add-dir). Sin PUENTE_BOT es el de Sofi.
const BOT = (process.env.PUENTE_BOT || "").toLowerCase();
const ES_NICO = BOT === "nico";
// TERCER BOT — MAX, el media buyer (21/sep/2026): PUENTE_BOT=max node scripts/telegram-puente.mjs
//   Bot propio (TELEGRAM_BOT_TOKEN_MAX). Habla en lenguaje natural de campañas y las monta EN
//   PAUSA con scripts/meta-ads.mjs (plantillas) o lee resultados; cerebro en vault/ceo/cerebro-max.md.
//   Modo seguro + Bash solo del script de Meta Ads. Nunca activa ni sube presupuesto.
const ES_MAX = BOT === "max";
// En Railway el estado vive en el volumen /estado (PUENTE_ESTADO_DIR); en la Mac, en data/.
const ESTADO = path.join(process.env.PUENTE_ESTADO_DIR || path.join(ROOT, "data"), ES_NICO ? "telegram-puente-nico.json" : ES_MAX ? "telegram-puente-max.json" : "telegram-puente.json");
const EN_NUBE = process.env.PUENTE_EN_NUBE === "1";
const CLAUDE = process.env.CLAUDE_BIN || path.join(process.env.HOME, ".npm-global", "bin", "claude");
const LOG = (...a) => console.log(new Date().toISOString(), ...a);

function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}
const leerEstado = () => { try { return JSON.parse(fs.readFileSync(ESTADO, "utf8")); } catch { return { offset: 0, sesion: null, sesionDia: null, historial: [] }; } };
const guardarEstado = (s) => fs.writeFileSync(ESTADO, JSON.stringify(s, null, 2) + "\n");

async function tg(token, m, body) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${m}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}), signal: AbortSignal.timeout(70000) });
  return r.json();
}
// Markdown ligero → HTML de Telegram.
const html = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/```[a-z]*\n([\s\S]*?)```/g, (_, c) => `<pre>${c}</pre>`).replace(/`([^`\n]+)`/g, "<code>$1</code>")
  .replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/(^|\s)\*([^*\n]+)\*(?=\s|$|[.,;:!?])/g, "$1<b>$2</b>")
  .replace(/^\s*[-•]\s+/gm, "• ").replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');
async function enviar(token, chat, texto) {
  const partes = []; let cur = "";
  for (const p of String(texto).split("\n\n")) { if ((cur + "\n\n" + p).length > 3800 && cur) { partes.push(cur); cur = p; } else cur = cur ? cur + "\n\n" + p : p; }
  if (cur) partes.push(cur);
  for (const parte of partes) {
    let r = await tg(token, "sendMessage", { chat_id: chat, text: html(parte), parse_mode: "HTML", disable_web_page_preview: true });
    if (!r.ok) r = await tg(token, "sendMessage", { chat_id: chat, text: parte });
    if (!r.ok) LOG("sendMessage falló:", r.description);
  }
}
async function slackEspejo(texto) {
  const tok = env("SLACK_BOT_TOKEN"); if (!tok) return;
  try {
    await fetch("https://slack.com/api/chat.postMessage", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${tok}` }, body: JSON.stringify({ channel: env("CEO_SLACK_ID") || "U08U9777PUY", text: texto.slice(0, 3900) }), signal: AbortSignal.timeout(8000) });
  } catch {}
}

const PERSONAS = {
  claude: "Sos el Content OS de Elvin Ayala respondiendo desde su Telegram (está en el celular, lejos de la computadora). Hacé el trabajo completo que te pide en este repo (skills, comandos de .claude/commands, memoria, vault) y respondé CORTO: qué hiciste, qué falta, una pregunta si hace falta. Sin markdown pesado (es Telegram): párrafos cortos, viñetas con guion. Tuteo de Puerto Rico. Nunca digas que algo está hecho si no lo verificaste. REGLAS DURAS: (1) NO corras el deploy ni edites scripts/deploy-snapshots.sh: el puente hace el deploy solo después de tu respuesta si tocaste data/ o vault/. (2) Si un script o comando falla, NO intentes arreglarlo editando infraestructura: reportá el error en una línea y seguí. (3) Máximo 15 acciones por pedido; si necesitás más, resumí lo hecho y preguntá.",
  sofi: "Actuá como SOFI, la Coordinadora de Producción. Antes de responder leé vault/ceo/cerebro-sofi.md y data/estudio.json, y actualizá data/estudio.json con lo que Elvin te cuente (guiones listos, fecha de grabación, respuestas de creadores, locación elegida). Regla: contenido no sale a nadie sin su OK; logística directo con Aure por Slack. Respondé corto, tuteo PR, firmá — Sofi.",
  jarvis: "Actuá como JARVIS (métricas, operaciones, pipeline, vault). Leé los data/*.json y el vault que necesites. Respondé con números y corto.",
  max: "Eres MAX, el media buyer de IA Market (Level Up Media, AI Borinquen, Mauro, Resuelto, Shadow Operator). Piensas como Elvin: el marketing es la vena del negocio; la meta es escalar de $100K a $300K/mes con ROAS 6-8x; tu trabajo es identificar y ESCALAR anuncios ganadores (renovar creativos cada 10 días, analizar cada 3-7 días, escalar 10-20 %, matar rápido lo que no engancha: CTR < 2 %). Elvin te escribe desde el celular por Telegram. ANTES de actuar lee vault/ceo/cerebro-max.md (su método, sus tres embudos — Instagram/Follow Me, WhatsApp, quiz —, sus pepitas, los mentores Hormozi/Gadzhi/Shackelford/Ramiro, tus rutinas) y data/meta-ads/portafolio.json (ids, reglas y compuertas por marca). Tus manos son SOLO `node scripts/meta-ads.mjs <marca> …` (resultados, campanas, arbol, plantilla, videos, publicos, pausar) y `node scripts/higgsfield.mjs …` (creativos: Ad Multiplier = versiones de un anuncio ganador, UGC, fotos de producto, thumbnails; lee cerebro §9 y `flujo <nombre>` antes; NUNCA gastes créditos sin OK explícito de Elvin en este chat: propón qué/cuántas/costo y espera): nunca edites código ni infraestructura. Campañas: identifica marca + plantilla (follow-me, trafico-url, dm-instagram, quiz) + creativos + presupuesto + edad; si falta un dato clave pregúntalo en UNA pregunta con opciones; si lo tienes, `--dry-run`, resume en 3 líneas y monta EN PAUSA; devuelve el enlace de Ads Manager y recuérdale que la publica él. Estadísticas: `resultados <marca> [id] [last_3d|last_7d|last_14d]` y responde con lo que decide (gasto, $seguidor/CPL/CPC, CTR, frecuencia, ROAS, ESCALAR/pausar) en ≤ 8 líneas. SIEMPRE cierra con una recomendación con número (escalar X, pedir contenido de tal ángulo, renovar creativo, webinar mensual, lanzamiento, evento, VSL oculto, retargeting): Elvin no quiere que te limites, quiere estrategia; pero recomendar ≠ ejecutar: él decide y publica. PROHIBIDO: activar campañas, subir presupuestos, borrar, tocar cuentas fuera del portafolio, inventar ids/ángulos/resultados, imprimir tokens, escribirle a alguien que no sea Elvin. Nunca digas que algo quedó si el script no lo confirmó. Responde CORTO, tuteo de Puerto Rico, sin markdown pesado (Telegram): párrafos cortos y viñetas con guion. Firma — Max.",
  nico: "Eres NICO, el vibecoder de Elvin (ingeniero de guardia de todas sus plataformas) y socio técnico de Sofi. Elvin te escribe desde el celular. ANTES de tocar nada lee vault/ceo/cerebro-nico.md y data/plataformas.json; el repo de cada plataforma está en ese inventario (tienes acceso a todos: Bori/heybori.ai, Plagas, Cortex, Resuelto, voz Retell, quiz funnels, Content OS) y cada uno tiene su CLAUDE.md o TRASPASO.md con las trampas que ya rompieron producción: léelo primero. Haz el ajuste completo: leer → cambio chico → test → deploy → VERIFICAR contra el sistema vivo (salud HTTP, logs) → anotar en data/nico-bitacora.json {fecha, plataforma, que, porque, verificado, commit}. Nunca digas que algo quedó si no lo verificaste. PROHIBIDO sin OK explícito de Elvin en este chat: borrar datos/tablas/archivos, migraciones destructivas, tocar cobros/Stripe/precios, editar prompts de agentes de voz en producción, imprimir o pegar secretos, escribirle a clientes/equipo/Heidy (solo le hablas a Elvin), activar ads, redeploy de Cortex con renders en cola. Si dudas entre dos caminos, el reversible. Responde CORTO, tuteo de Puerto Rico, sin markdown pesado: qué pasó, qué hiciste, qué verificaste, qué falta. Firma — Nico.",
};

// Repos extra que Nico puede tocar (--add-dir), sacados del inventario. Solo los que existen.
// En la nube (Railway) no existen las rutas de la Mac: cada plataforma con campo `github` vive
// clonada en NICO_REPOS_DIR/<id> (las clona scripts/nico-nube.sh al arrancar).
const REPOS_NUBE = process.env.NICO_REPOS_DIR || "/estado/repos";
function dirsNico() {
  try {
    const inv = JSON.parse(fs.readFileSync(path.join(ROOT, "data/plataformas.json"), "utf8"));
    const dirs = new Set();
    for (const p of inv.plataformas || []) {
      const d = EN_NUBE ? (p.github ? path.join(REPOS_NUBE, p.id) : "") : p.repo;
      if (d && d !== ROOT && !d.startsWith(ROOT + "/") && fs.existsSync(d)) dirs.add(d);
    }
    return [...dirs];
  } catch { return []; }
}
// Git en la nube: GitHub es la fuente de verdad. Antes de cada pedido se baja lo nuevo de cada
// repo; después, lo que Nico cambió se commitea y se sube. La Mac es una copia (git pull).
function git(dir, args, ms = 90000) {
  try {
    const r = spawnSync("git", args, { cwd: dir, encoding: "utf8", timeout: ms, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
    return { ok: r.status === 0, out: ((r.stdout || "") + (r.stderr || "")).trim() };
  } catch (e) { return { ok: false, out: e.message }; }
}
function gitBajar() {
  if (!EN_NUBE || !ES_NICO) return;
  for (const d of [ROOT, ...dirsNico()]) {
    if (!fs.existsSync(path.join(d, ".git"))) continue;
    const r = git(d, ["pull", "--rebase", "--autostash", "-q"]);
    if (!r.ok) LOG("git pull falló en", path.basename(d), "→", r.out.slice(0, 200));
  }
}
function gitSubir(motivo) {
  if (!EN_NUBE || !ES_NICO) return [];
  const subidos = [];
  for (const d of [ROOT, ...dirsNico()]) {
    if (!fs.existsSync(path.join(d, ".git"))) continue;
    if (!git(d, ["status", "--porcelain"]).out) continue;
    git(d, ["add", "-A"]);
    const c = git(d, ["commit", "-q", "-m", `Nico: ${motivo.replace(/\s+/g, " ").slice(0, 70)}`]);
    if (!c.ok) { LOG("git commit falló en", path.basename(d), "→", c.out.slice(0, 200)); continue; }
    let p = git(d, ["push", "-q"]);
    if (!p.ok) { git(d, ["pull", "--rebase", "-q"]); p = git(d, ["push", "-q"]); }
    if (p.ok) subidos.push(path.basename(d)); else LOG("git push falló en", path.basename(d), "→", p.out.slice(0, 200));
  }
  return subidos;
}

// Herramientas permitidas en modo seguro: editar el repo y correr SOLO sus scripts.
const SEGURO = ["Read", "Edit", "Write", "Glob", "Grep", "WebSearch", "WebFetch",
  "Bash(node scripts/*)", "Bash(bash scripts/deploy-snapshots.sh*)", "Bash(npm test*)", "Bash(npx tsc*)", "Bash(git status*)", "Bash(git diff*)"];

// Corre Claude Code en modo stream-json para poder contar qué está haciendo (herramientas,
// texto parcial) mientras trabaja. onProgreso recibe líneas cortas ("leyendo data/estudio.json").
function correrClaude(prompt, persona, sesion, nueva, onProgreso) {
  return new Promise((resolve) => {
    // Nico siempre va en modo total (es su trabajo: arreglar plataformas sin pedir permiso por
    // cada comando) y con más turnos, porque un arreglo real lleva leer + test + deploy + verificar.
    const modo = ES_NICO ? "total" : ES_MAX ? "seguro" : env("PUENTE_MODO") || "seguro";
    const args = ["-p", prompt, "--output-format", "stream-json", "--verbose", "--max-turns", ES_NICO ? "60" : ES_MAX ? "25" : "20", "--append-system-prompt", PERSONAS[persona] || PERSONAS.claude];
    if (modo === "total") args.push("--dangerously-skip-permissions");
    // Max: lee lo que quiera, pero solo ejecuta el script de Meta Ads (y no edita nada).
    else if (ES_MAX) args.push("--permission-mode", "default", "--allowedTools", "Read", "Glob", "Grep", "Bash(node scripts/meta-ads.mjs*)", "Bash(node scripts/higgsfield.mjs*)", "--disallowedTools", "Edit", "Write", "WebFetch", "WebSearch");
    else args.push("--permission-mode", "acceptEdits", "--allowedTools", ...SEGURO);
    if (ES_NICO) for (const d of dirsNico()) args.push("--add-dir", d);
    if (nueva) args.push("--session-id", sesion); else args.push("--resume", sesion);
    const envVars = { ...process.env, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || env("ANTHROPIC_API_KEY"), PATH: `${path.dirname(CLAUDE)}:${process.env.PATH}` };
    LOG("claude ›", persona, nueva ? "sesión nueva" : "resume", prompt.slice(0, 80));
    const child = spawn(CLAUDE, args, { cwd: ROOT, env: envVars, stdio: ["ignore", "pipe", "pipe"] });
    let final = "", texto = "", err = "", buf = "";
    const onLinea = (linea) => {
      if (!linea.trim()) return;
      let ev; try { ev = JSON.parse(linea); } catch { return; }
      if (ev.type === "assistant" && ev.message?.content) {
        for (const c of ev.message.content) {
          if (c.type === "text" && c.text) texto = c.text;
          if (c.type === "tool_use") {
            const i = c.input || {};
            const que = c.name === "Read" ? `leyendo ${i.file_path?.split("/").slice(-2).join("/") ?? ""}` :
              c.name === "Edit" || c.name === "Write" ? `editando ${i.file_path?.split("/").slice(-2).join("/") ?? ""}` :
              c.name === "Bash" ? `corriendo: ${String(i.command ?? "").slice(0, 60)}` :
              c.name === "Grep" || c.name === "Glob" ? `buscando ${i.pattern ?? ""}` : `usando ${c.name}`;
            LOG("  ›", que); onProgreso?.(que);
          }
        }
      }
      if (ev.type === "result") { final = ev.result || texto; if (ev.is_error) err = ev.result || "error"; LOG("claude ‹ fin", ev.subtype ?? "", `${ev.duration_ms ?? "?"}ms`, `$${ev.total_cost_usd ?? "?"}`); }
    };
    child.stdout.on("data", (d) => { buf += d; const partes = buf.split("\n"); buf = partes.pop(); partes.forEach(onLinea); });
    child.stderr.on("data", (d) => { const t = String(d); if (!/Permission allow rule/.test(t)) { err += t; LOG("claude stderr:", t.slice(0, 200)); } });
    const limiteMin = ES_NICO ? 40 : 15;
    const timer = setTimeout(() => { LOG(`claude: timeout ${limiteMin} min, matando`); child.kill("SIGTERM"); }, limiteMin * 60 * 1000);
    child.on("error", (e) => { clearTimeout(timer); LOG("claude spawn error:", e.message); resolve({ code: 1, out: "", err: e.message }); });
    child.on("close", (code) => { clearTimeout(timer); if (buf) onLinea(buf); resolve({ code, out: (final || texto).trim(), err: err.trim() }); });
  });
}

// Respaldo si el CLI no responde: la API directa con la persona (sin herramientas, pero contesta).
async function respaldoAPI(prompt, persona) {
  const key = process.env.ANTHROPIC_API_KEY || env("ANTHROPIC_API_KEY"); if (!key) return "";
  let contexto = "";
  try { contexto = fs.readFileSync(path.join(ROOT, "vault/ceo/cerebro-sofi.md"), "utf8").slice(0, 8000) + "\n\nESTADO: " + fs.readFileSync(path.join(ROOT, "data/estudio.json"), "utf8").slice(0, 6000); } catch {}
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 900, system: (PERSONAS[persona] || PERSONAS.claude) + "\n(Modo respaldo: no tenés herramientas ahora; respondé con lo que sabés y decí qué harías.)\n\n" + contexto, messages: [{ role: "user", content: prompt }] }), signal: AbortSignal.timeout(60000) });
    const j = await r.json(); return j.content?.find((c) => c.type === "text")?.text || "";
  } catch (e) { LOG("respaldo API:", e.message); return ""; }
}

function huboCambios(desde) {
  const dirs = [path.join(ROOT, "data"), path.join(ROOT, "vault")];
  const mira = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (mira(p)) return true; } else if (fs.statSync(p).mtimeMs > desde && !p.endsWith("telegram-puente.json")) return true; } return false; };
  try { return dirs.some((d) => fs.existsSync(d) && mira(d)); } catch { return false; }
}

const ADS_COMANDOS = new Set(["resultados", "campanas", "arbol", "cuentas", "publicos", "videos", "intereses", "pixel", "plantilla", "crear", "pausar"]);
function correrAds(linea) {
  return new Promise((res) => {
    const partes = (linea.match(/"[^"]*"|\S+/g) || []).map((x) => x.replace(/^"|"$/g, ""));
    const [cmd, marca, ...rest] = partes;
    if (!cmd || cmd === "ayuda") return res("Agente de Meta Ads (sin gastar tokens):\n/ads resultados <marca> [last_3d]\n/ads campanas <marca>\n/ads arbol <marca> <campaignId>\n/ads plantilla <marca> follow-me --reels a,b --presupuesto 15 --edad 18-35\n/ads plantilla <marca> trafico-url --url … --reels a --presupuesto 10\n/ads plantilla <marca> dm-instagram --videos a,b --presupuesto 30\n/ads pausar <marca> <id>\nMarcas: level-up, ai-borinquen, mauro, resuelto, shadow-operator. Todo lo que crea queda EN PAUSA; publica tú en Ads Manager.\nPara pedirlo en lenguaje natural, escríbeme sin /ads y lo armo yo.");
    if (!ADS_COMANDOS.has(cmd) || !marca) return res("No entendí. Formato: /ads <comando> <marca> …  (/ads ayuda)");
    const child = spawn(process.execPath, ["scripts/meta-ads.mjs", marca, cmd, ...rest], { cwd: ROOT, env: process.env });
    let out = "";
    child.stdout.on("data", (d) => { out += String(d); });
    child.stderr.on("data", (d) => { out += String(d); });
    const timer = setTimeout(() => { child.kill(); out += "\n⏱ se pasó de 90 s"; }, 90000);
    child.on("close", () => { clearTimeout(timer); res(out.replace(/[│┌┐└┘├┤┬┴┼─]+/g, " ").replace(/[ \t]+/g, " ").trim().slice(0, 3800) || "(sin salida)"); });
    child.on("error", (e) => { clearTimeout(timer); res("Error: " + e.message); });
  });
}

async function procesar(token, chat, texto, st) {
  const t = texto.trim();
  if (ES_NICO && (t === "/ayuda" || t === "/start")) return enviar(token, chat, "Nico activo (vibecoder). Escríbeme qué ajustar o qué revisar en cualquiera de tus plataformas y lo hago.\n\n/ronda — la ronda de salud + reporte ahora mismo\n/plataformas — qué puedo tocar\n/nuevo — conversación nueva\n\nTodo queda espejado en tu DM de Slack.");
  if (ES_NICO && t === "/plataformas") { try { const inv = JSON.parse(fs.readFileSync(path.join(ROOT, "data/plataformas.json"), "utf8")); return enviar(token, chat, inv.plataformas.map((p) => `- ${p.nombre}${p.critico ? " 🔴crítica" : ""}${p.prod ? ` · ${p.prod}` : ""}`).join("\n")); } catch { return enviar(token, chat, "No pude leer data/plataformas.json."); } }
  if (ES_MAX && (t === "/ayuda" || t === "/start")) return enviar(token, chat, "Soy Max, tu media buyer. Mi trabajo: identificar y escalar anuncios ganadores para llevar el portafolio de $100K a $300K con ROAS 6-8x. Háblame normal, por ejemplo:\n- \"Móntame un Follow Me a Mauro con estos dos reels, $15 al día\"\n- \"¿Cómo van las campañas de Mauro?\"\n- \"Tráfico al YouTube de Mauro con el reel 18164…, $10\"\n- \"Pausa el conjunto 1202…\"\n- \"¿Qué escalamos esta semana?\" / \"¿Qué ángulo está vendiendo?\" / \"¿Hacemos un webinar?\"\n- \"Hazme 3 versiones de este anuncio con otra persona\" (Higgsfield: Ad Multiplier, UGC, fotos de producto, thumbnails; te pido OK antes de gastar créditos)\n\nRutinas: reporte semanal los lunes 8 AM, alertas para escalar mar/jue/sáb, trazabilidad con Aure viernes y lunes.\n\nTodo lo que monto queda EN PAUSA: lo publicas tú en Ads Manager. Nunca activo ni subo presupuesto.\n\nAtajos sin gastar tokens: /ads resultados <marca> · /ads campanas <marca> · /ads plantilla <marca> follow-me --reels a,b --presupuesto 15 --edad 18-35 · /ads ayuda\n/nuevo — conversación nueva");
  if (t === "/ayuda" || t === "/start") return enviar(token, chat, "Puente activo. Escríbeme lo que quieras y lo hago en el Content OS.\n\n/sofi … — hablar con Sofi (producción)\n/jarvis … — métricas y operaciones\n/estado — qué falta hoy\n/ads … — Meta Ads sin gastar tokens (/ads ayuda)\n/nuevo — empezar conversación nueva\n\nTodo queda espejado en tu DM de Slack.");
  if (t === "/nuevo") { st.sesion = null; guardarEstado(st); return enviar(token, chat, "Listo, conversación nueva."); }
  // /ads → el agente de Meta Ads sin pasar por Claude (0 tokens): corre scripts/meta-ads.mjs
  // y devuelve la salida. Escritura solo en pausa (plantilla/crear) o pausar; nunca activa.
  //   /ads resultados mauro [last_3d]        /ads campanas level-up
  //   /ads plantilla mauro follow-me --reels 18…,18… --presupuesto 15 --edad 18-35
  //   /ads plantilla mauro trafico-url --url https://youtu.be/… --reels 18… --presupuesto 10
  //   /ads pausar mauro <id>                  /ads ayuda
  if (/^\/ads\b/i.test(t)) return enviar(token, chat, await correrAds(t.replace(/^\/ads\s*/i, "")));
  if (t === "/estado") {
    try {
      const e = JSON.parse(fs.readFileSync(path.join(ROOT, "data/estudio.json"), "utf8"));
      const pend = (e.plan?.pendientesElvin || []).filter((p) => p.estado !== "hecho").slice(0, 6).map((p) => `- ${p.que} (${p.para || "sin fecha"})`).join("\n");
      const loc = e.locaciones?.propuestaActual ? `Locación propuesta: ${e.locaciones.propuestaActual.opciones?.[0]?.nombre || "sí"} · fechas ${(e.locaciones.propuestaActual.fechasSugeridas || []).join(" / ")}` : "Locación: sin propuesta";
      return enviar(token, chat, `*Te toca a ti:*\n${pend || "- nada pendiente"}\n\n${loc}\nGrabación: ${e.diaDeGrabacion?.proximo || "sin fecha"}\nCreadores: ${(e.creadores?.pipeline || []).filter((c) => c.estado !== "mes 2").map((c) => `${c.handle} (${c.estado})`).join(", ")}`);
    } catch { return enviar(token, chat, "No pude leer data/estudio.json."); }
  }
  let persona = ES_NICO ? "nico" : ES_MAX ? "max" : "claude", prompt = t;
  const m = t.match(/^\/(sofi|jarvis|nico)\s+([\s\S]+)/i);
  if (m) { persona = m[1].toLowerCase(); prompt = m[2]; }
  if (ES_NICO && t === "/ronda") { persona = "nico"; prompt = "Haz tu ronda ahora: sigue .claude/commands/ronda-nico.md completo (con envío del reporte)."; }
  await slackEspejo(`[Telegram] Elvin → ${persona}: ${prompt}`);
  // Antes de trabajar, bajar de producción lo que otro lado (la Mac / Railway) haya cambiado (máx 20 s).
  await new Promise((res) => { const c = spawn(process.execPath, ["scripts/sync-data.mjs", "pull"], { cwd: ROOT, stdio: "ignore" }); const t = setTimeout(() => { c.kill(); res(); }, 20000); c.on("close", () => { clearTimeout(t); res(); }); c.on("error", () => { clearTimeout(t); res(); }); });
  gitBajar();
  const inicio = Date.now();
  const hoy = new Date().toISOString().slice(0, 10);
  const nueva = !st.sesion || st.sesionDia !== hoy;
  if (nueva) { st.sesion = randomUUID(); st.sesionDia = hoy; guardarEstado(st); }
  const typing = setInterval(() => tg(token, "sendChatAction", { chat_id: chat, action: "typing" }).catch(() => {}), 5000);
  await tg(token, "sendChatAction", { chat_id: chat, action: "typing" });
  // Elvin (19/sep): sin avisos de progreso; solo "escribiendo…" y la respuesta cuando esté todo.
  const onProgreso = null;
  let r = await correrClaude(prompt, persona, st.sesion, nueva, onProgreso);
  if (r.code !== 0 && /session|resume|No conversation/i.test(r.err + r.out)) { st.sesion = randomUUID(); st.sesionDia = hoy; guardarEstado(st); r = await correrClaude(prompt, persona, st.sesion, true, onProgreso); }
  clearInterval(typing);
  let resp = r.out;
  if (!resp) { LOG("sin salida del CLI (code", r.code, ") → respaldo API"); resp = await respaldoAPI(prompt, persona); }
  if (!resp) resp = r.err ? `No pude completarlo: ${r.err.slice(0, 600)}` : "No obtuve respuesta. Inténtalo de nuevo o escribe /nuevo.";
  st.historial = [...(st.historial || []).slice(-49), { ts: new Date().toISOString(), persona, prompt: prompt.slice(0, 300), resp: resp.slice(0, 300) }];
  guardarEstado(st);
  await enviar(token, chat, resp);
  await slackEspejo(`[Telegram] ${persona} → Elvin: ${resp.slice(0, 3500)}`);
  const subidos = gitSubir(prompt);
  if (subidos.length) LOG("git push:", subidos.join(", "));
  // Si Claude tocó data/ (o vault/), subirlo a producción para que la Mac y el Command Center
  // lo vean. Se hace en segundo plano; el deploy tarda ~2 min.
  // Max solo escribe planes en data/meta-ads/campanas (la campaña real vive en Meta): sin deploy.
  if (!ES_MAX && huboCambios(inicio) && (process.env.VERCEL_TOKEN || env("VERCEL_TOKEN") || !EN_NUBE)) {
    LOG("cambios en data/vault → deploy-snapshots");
    const dep = spawn("bash", ["scripts/deploy-snapshots.sh"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, VERCEL_TOKEN: process.env.VERCEL_TOKEN || env("VERCEL_TOKEN") } });
    let salida = ""; dep.stdout.on("data", (d) => (salida += d)); dep.stderr.on("data", (d) => (salida += d));
    dep.on("close", (code) => { LOG("deploy-snapshots:", code === 0 ? "ok" : "falló", salida.trim().split("\n").slice(-2).join(" | ")); if (code !== 0) enviar(token, chat, "⚠️ Guardé los cambios pero el deploy a producción falló; se sube en el próximo intento.").catch(() => {}); });
    dep.on("error", (e) => LOG("deploy:", e.message));
  }
}

async function main() {
  const VAR_TOKEN = ES_NICO ? "TELEGRAM_BOT_TOKEN_NICO" : ES_MAX ? "TELEGRAM_BOT_TOKEN_MAX" : "TELEGRAM_BOT_TOKEN";
  let token = env(VAR_TOKEN), chatCEO = env("TELEGRAM_CEO_CHAT_ID");
  while (!token) { LOG(`Esperando ${VAR_TOKEN} en .env.local…`); await new Promise((r) => setTimeout(r, 60000)); token = env(VAR_TOKEN); }
  if (!fs.existsSync(CLAUDE)) LOG(`⚠️ No encuentro el CLI de Claude en ${CLAUDE} (npm install -g @anthropic-ai/claude-code con prefix ~/.npm-global)`);
  await tg(token, "deleteWebhook", { drop_pending_updates: false }).catch(() => {});
  LOG(ES_NICO ? "Puente de NICO arrancó." : ES_MAX ? "Puente de MAX (media buyer) arrancó." : "Puente Telegram arrancó.", EN_NUBE ? "En Railway." : "En la Mac.", "Modo:", ES_NICO ? "total" : env("PUENTE_MODO") || "seguro", ES_NICO ? `· repos extra: ${dirsNico().length}` : "", "· CEO chat:", chatCEO || "(sin configurar: respondo el chat id a quien escriba /start)");
  // Chequeo de salud del CLI (no bloquea el loop): si falla, queda en el log el porqué.
  correrClaude("Responde solo: ok", "claude", randomUUID(), true).then((r) => LOG("salud claude:", r.code === 0 && r.out ? "ok · " + r.out.slice(0, 40) : "FALLÓ · " + (r.err || "sin salida").slice(0, 300)));
  const st = leerEstado();
  // Vigía: si el polling falla 6 veces seguidas (la red quedó pegada, p. ej. la Mac durmió), el
  // proceso sale y launchd/Railway lo levantan limpio. Sin esto, el 20/sep quedó "vivo" sin oír.
  let fallos = 0;
  for (;;) {
    try {
      const r = await tg(token, "getUpdates", { offset: st.offset, timeout: 50, allowed_updates: ["message"] });
      if (!r.ok) { LOG("getUpdates:", r.description); await new Promise((x) => setTimeout(x, 5000)); continue; }
      fallos = 0;
      for (const u of r.result) {
        st.offset = u.update_id + 1; guardarEstado(st);
        const msg = u.message; if (!msg?.text) continue;
        const chat = String(msg.chat.id);
        chatCEO = chatCEO || env("TELEGRAM_CEO_CHAT_ID");
        if (!chatCEO || chat !== chatCEO) {
          if (msg.text.startsWith("/start") || !chatCEO) await enviar(token, chat, `Tu chat id es ${chat}. Ponlo en TELEGRAM_CEO_CHAT_ID (.env.local) y vuelve a escribirme.`);
          continue;
        }
        try { await procesar(token, chat, msg.text, st); } catch (e) { LOG("error:", e.message); await enviar(token, chat, `Se rompió algo: ${e.message.slice(0, 300)}`); }
      }
    } catch (e) {
      LOG("loop:", e.message);
      if (++fallos >= 6) { LOG("6 fallos seguidos de red → reinicio"); process.exit(1); }
      await new Promise((x) => setTimeout(x, 5000));
    }
  }
}
main();
