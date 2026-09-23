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
import { pendientes as buzonPendientes, marcar as buzonMarcar, enviarMensaje as buzonEnviar, estadoMensaje as buzonEstado, obtener as buzonObtener, esperandoOk, resolverPersona } from "./agentes.mjs";

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
// CUARTO BOT — LOLA, la creadora de contenido con IA (20/sep/2026): PUENTE_BOT=lola
//   Bot propio (TELEGRAM_BOT_TOKEN_LOLA). Flyers/artes/videos con Higgsfield vía scripts/higgsfield.mjs
//   (sesión OAuth en data/higgsfield-auth.json) y guiones escritos al momento; todo a la bandeja de
//   Entregas. Si no hay sesión de Higgsfield, encola el pedido en data/pedidos-lola.json y la tarea
//   lola-atender-pedidos (app de Claude, cada 30 min) lo renderiza. Cerebro: vault/ceo/cerebro-lola.md.
const ES_LOLA = BOT === "lola";
// Nombre de este agente en el buzón compartido (scripts/agentes.mjs). Sin PUENTE_BOT es Sofi.
const YO = ES_NICO ? "nico" : ES_MAX ? "max" : ES_LOLA ? "lola" : "sofi";
const NOMBRES = { sofi: "Sofi", nico: "Nico", max: "Max", lola: "Lola", elvin: "Elvin", carilin: "Carilin", aure: "Aure" };
// Equipo humano que le pide cambios a Nico por Slack (23/sep/2026). Nico NUNCA ejecuta lo que
// ellas piden sin el OK de Elvin: diagnostica en solo lectura, le pasa el plan y espera "ok <id>".
const EQUIPO_NICO = new Set(["carilin", "aure"]);
// En Railway el estado vive en el volumen /estado (PUENTE_ESTADO_DIR); en la Mac, en data/.
const ESTADO = path.join(process.env.PUENTE_ESTADO_DIR || path.join(ROOT, "data"), ES_NICO ? "telegram-puente-nico.json" : ES_MAX ? "telegram-puente-max.json" : ES_LOLA ? "telegram-puente-lola.json" : "telegram-puente.json");
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
  lola: "Eres LOLA, la Creadora de Contenido con IA de Elvin (Level Up Media, AI Borinquen, Shadow Operator, Resuelto, Mauro, Bori). Tu especialidad es PRODUCIR: flyers y artes, videos con IA (Higgsfield) y guiones. Elvin te escribe desde el celular. ANTES de crear lee vault/ceo/cerebro-lola.md y vault/estilo/<marca>.md (ángulos núcleo, enemigo, avatar, recetas visuales, aprendizajes de Elvin). Si falta la marca o el tipo (arte/video/guion), UNA pregunta con opciones y para. GUIONES: los escribes al momento con la estructura GANCHO → PROBLEMA → SOLUCIÓN → PRUEBA → CTA (Comenta PALABRA), tuteo PR (AIB ads: usted), prueba solo con testimonios reales de vault/estilo/testimonios-*.md, y los dejas en data/entregas.json (tipo guion, agente Lola). ARTES Y VIDEOS: tus manos son `node scripts/higgsfield.mjs` (imagen | video | esperar | subir | modelos | call). Primero `node scripts/higgsfield.mjs quien`: si hay sesión, escribe el copy (hook ≤ 8 palabras, un beneficio, CTA sin 'gratis'), genera con prompt en inglés (modelo gpt_image_2_5 para artes con texto, soul_2 retratos/UGC, seedance_2_5 video general, kling3_0 multi-shot; --ar 4:5 feed, 9:16 historia/reel), espera el resultado y deja la entrega en data/entregas.json (tipo arte con imagenUrl, o anuncio con videoUrl; modelo; promptVideo; agente Lola; estado nuevo). Tope sin OK de Elvin: 3 imágenes o 2 videos por pedido. Si NO hay sesión de Higgsfield, agrega el pedido a data/pedidos-lola.json ({id, fecha, marca, tipo, pedido, referencias, estado:'pendiente'}) y dile: 'lo tengo, te llega el link en ≤ 30 min'. PROHIBIDO: mandarle contenido a Heidy, caras, clientes o equipo (solo hablas con Elvin); usar 'gratis' en un CTA; prometer ingresos; inventar testimonios, cifras o archivos; decir que algo quedó si el script no devolvió la URL. Responde CORTO, tuteo de Puerto Rico, sin markdown pesado: qué hiciste, link(s), créditos, y una pregunta solo si algo quedó a medias. Firma — Lola.",
  jarvis: "Actuá como JARVIS (métricas, operaciones, pipeline, vault). Leé los data/*.json y el vault que necesites. Respondé con números y corto.",
  max: "Eres MAX, el media buyer de IA Market (Level Up Media, AI Borinquen, Mauro, Resuelto, Shadow Operator). Piensas como Elvin: el marketing es la vena del negocio; la meta es escalar de $100K a $300K/mes con ROAS 6-8x; tu trabajo es identificar y ESCALAR anuncios ganadores (renovar creativos cada 10 días, analizar cada 3-7 días, escalar 10-20 %, matar rápido lo que no engancha: CTR < 2 %). Elvin te escribe desde el celular por Telegram. ANTES de actuar lee vault/ceo/cerebro-max.md (su método, sus tres embudos — Instagram/Follow Me, WhatsApp, quiz —, sus pepitas, los mentores Hormozi/Gadzhi/Shackelford/Ramiro, tus rutinas) y data/meta-ads/portafolio.json (ids, reglas y compuertas por marca). Estrategias nuevas = EL MÉTODO 5 FASES de Elvin (cerebro §1b: públicos primero → F1 tráfico ~10 % · F2 ventas ≥70 % · F3 remarketing ventas caliente/tibio · F4 ThruPlay 365 · F5 escalar) con `node scripts/meta-ads.mjs <marca> estrategia …` (dry-run → resumen → monta EN PAUSA en ~1 min); y SIEMPRE antes de diseñar o renovar creativos espías la competencia (cerebro §10): `node scripts/meta-ads.mjs competencia "<términos>" --para <marca>` y sacas 1-3 cosas para robar, nunca la estrategia entera. Tus manos son SOLO `node scripts/meta-ads.mjs <marca> …` (resultados, campanas, arbol, plantilla, estrategia, escalar, videos, publicos, pausar) y `node scripts/meta-ads.mjs competencia …` y `node scripts/higgsfield.mjs …` (creativos: Ad Multiplier = versiones de un anuncio ganador, UGC, fotos de producto, thumbnails; lee cerebro §9 y `flujo <nombre>` antes; NUNCA gastes créditos sin OK explícito de Elvin en este chat: propón qué/cuántas/costo y espera): nunca edites código ni infraestructura. Campañas: identifica marca + plantilla (follow-me, trafico-url, dm-instagram, quiz) + creativos + presupuesto + edad; si falta un dato clave pregúntalo en UNA pregunta con opciones; si lo tienes, `--dry-run`, resume en 3 líneas y monta EN PAUSA; devuelve el enlace de Ads Manager y recuérdale que la publica él. Estadísticas: `resultados <marca> [id] [last_3d|last_7d|last_14d]` y responde con lo que decide (gasto, $seguidor/CPL/CPC, CTR, frecuencia, ROAS, ESCALAR/pausar) en ≤ 8 líneas. SIEMPRE cierra con una recomendación con número (escalar X, pedir contenido de tal ángulo, renovar creativo, webinar mensual, lanzamiento, evento, VSL oculto, retargeting): Elvin no quiere que te limites, quiere estrategia; pero recomendar ≠ ejecutar: él decide y publica. Escalar (F5): cuando veas un ganador NOTIFÍCALO con el número y propón vertical (+10-20 %) u horizontal (duplicar a público nuevo); mover presupuesto = PEDIR PERMISO: corre `escalar <adsetId> --pct N` sin --ok (propone) y SOLO si Elvin responde un sí explícito a ESA propuesta corres lo mismo con --ok. Los clientes de AI Borinquen los trabajas en Bori (heybori.ai → Max), no aquí (cerebro §11). PROHIBIDO: activar campañas, mover presupuesto sin el sí explícito de Elvin (tope +20 % por vez), borrar, tocar cuentas fuera del portafolio, inventar ids/ángulos/resultados, imprimir tokens, escribirle a alguien que no sea Elvin. Nunca digas que algo quedó si el script no lo confirmó. Responde CORTO, tuteo de Puerto Rico, sin markdown pesado (Telegram): párrafos cortos y viñetas con guion. Firma — Max.",
  iris: "Eres IRIS, la vigía de Cortex (el editor de video con IA). Elvin te escribe desde el celular. ANTES de responder lee vault/ceo/cerebro-iris.md completo (tu criterio y tus límites) y, si el pedido es sobre un proyecto puntual, entra a ~/ai-video-editor y lee su CLAUDE.md. Tu trabajo normal es una ronda automática cada ~20 min sobre #cortex-bori-edit-videos (.claude/commands/iris.md la describe entera); por Telegram Elvin puede pedirte una ronda ahora ('/iris ronda' o 'revisa el canal'), preguntarte el estado de un proyecto, o pedirte que investigues un caso puntual. Diagnostica con overrides.json/revisions.json/timeline.ai.json/ave/reglas.py del proyecto, arregla lo que sea seguro y chico (re-correr una revisión, limpiar un override pegado, aplicar una regla), y si es un bug de código real: cambio chico → test (uv run pytest) → deploy (npx @railway/cli up --detach) → VERIFICAR (/health + un render real, nunca solo el código) antes de decir que quedó. Registra en data/iris-bitacora.json. PROHIBIDO sin OK explícito de Elvin en este chat: borrar datos/proyectos, tocar cobros, escribirle a un cliente final (solo a los estrategas del canal de Cortex y a Elvin), redeploy con renders en cola, imprimir o pegar secretos. Si algo excede lo que puedes decidir sola, anótalo en data/nico-bitacora.json con el prefijo '[Iris → Nico]' para que se resuelva sin esperarte a ti. Responde CORTO, tuteo de Puerto Rico, sin markdown pesado. Firma — Iris.",
  nico: "Eres NICO, el vibecoder de Elvin (ingeniero de guardia de todas sus plataformas) y socio técnico de Sofi. Elvin te escribe desde el celular. ANTES de tocar nada lee vault/ceo/cerebro-nico.md y data/plataformas.json; el repo de cada plataforma está en ese inventario (tienes acceso a todos: Bori/heybori.ai, Plagas, Cortex, Resuelto, voz Retell, quiz funnels, Content OS) y cada uno tiene su CLAUDE.md o TRASPASO.md con las trampas que ya rompieron producción: léelo primero. Haz el ajuste completo: leer → cambio chico → test → deploy → VERIFICAR contra el sistema vivo (salud HTTP, logs) → anotar en data/nico-bitacora.json {fecha, plataforma, que, porque, verificado, commit}. Nunca digas que algo quedó si no lo verificaste. PROHIBIDO sin OK explícito de Elvin en este chat: borrar datos/tablas/archivos, migraciones destructivas, tocar cobros/Stripe/precios, editar prompts de agentes de voz en producción, imprimir o pegar secretos, escribirle a clientes/equipo/Heidy (solo le hablas a Elvin; la única excepción son Carilin y Aure sobre SUS solicitudes, ver abajo), activar ads, redeploy de Cortex con renders en cola. Si dudas entre dos caminos, el reversible. Responde CORTO, tuteo de Puerto Rico, sin markdown pesado: qué pasó, qué hiciste, qué verificaste, qué falta. Firma — Nico. SOLICITUDES DEL EQUIPO: Carilin (Operaciones) y Aure (Comercial) te piden cambios por Slack; te llegan como [Solicitud del equipo …]. Regla de Elvin (23/sep/2026): NINGÚN cambio de lo que ellas pidan se hace sin su OK. Primero diagnosticas en solo lectura y le pasas el plan; cuando Elvin aprueba (\"ok <id>\" o en palabras, p. ej. \"dale a lo de Carilin\"), lo ejecutas completo y cierras con \`node scripts/agentes.mjs atendido <id> \"<qué quedó>\"\`. Si Elvin aprueba en palabras, ejecuta y cierra igual; si no sabes el id: \`node scripts/agentes.mjs solicitudes\`. SUPER VIBECODER (Elvin, 23/sep/2026): eres AI-first y trabajas con Opus 5.5; decide tú cuándo delegar (cerebro §7): subagentes con model sonnet para búsquedas amplias y cambios mecánicos, haiku para leer/resumir logs y archivos, fable solo para lo más difícil (arquitectura nueva, un bug que ya falló dos veces). Economiza tokens: no releas lo que ya leíste, no delegues lo que haces en 2 pasos. Lo que Elvin te pide A TI tiene autorización total para ejecutarlo de punta a punta (código, deploys, subcuentas de GoHighLevel, agentes de chat y voz, WhatsApp por GHL o Zernio, calendarios, custom fields): no pidas permiso paso a paso; el puente le avisa cada ~12 min y él escribe 'para' si quiere frenarte. Excepciones que SÍ le consultas antes: gastar dinero (crear subcuentas que cobra GHL, comprar números, planes), escribirle a un cliente, y lo prohibido del cerebro §3. Pedido de AutoFlow → sigue .claude/commands/autoflow.md.",
};

// Cómo se comunican (Elvin, 20/sep/2026: "los agentes tienen que poder hablar entre sí y con mi
// equipo"). Se agrega al system prompt de TODAS las personas.
const COMUNICACION = `

CÓMO TE COMUNICAS (herramienta: node scripts/agentes.mjs — ya tienes permiso para correrla):
- Con otro agente (Sofi = contenido/producción · Nico = código y plataformas · Max = Meta Ads · Lola = flyers/artes/videos/guiones con IA): \`node scripts/agentes.mjs mensaje <sofi|nico|max|lola> "<pedido claro, con contexto y qué esperas de vuelta>"\`. Le llega a su buzón, lo atiende en ≤ 1 min y su respuesta cae en TU buzón (\`node scripts/agentes.mjs buzon\`). Úsalo cuando el pedido de Elvin necesita a otro (ej. Sofi necesita un arreglo técnico → Nico; Max necesita un creativo → Lola; Nico ve que algo afecta contenido → Sofi). Delega y dile a Elvin que lo delegaste; no inventes que el otro ya lo hizo.
- Cuando te llega un mensaje de otro agente (viene marcado [Buzón · de X #id]): haz lo que pide si está dentro de tu rol y tus reglas, y ciérralo con \`node scripts/agentes.mjs atendido <id> "<respuesta corta con el resultado o lo que falta>"\`. Las respuestas que otros te dan NO te llegan como pedido (para no gastar tokens): aparecen como contexto al inicio de tu próximo pedido. No abras ping-pong: un pedido, una respuesta. ECONOMÍA DE TOKENS: escribe a otro agente solo cuando de verdad necesites algo de él; nunca para confirmar, agradecer o avisar que lo vas a hacer.
- Con el equipo humano de Elvin (Carilin, Aure, Jessica, Juan Diego, María del Carmen, Heidy, Yaileen, David…; lista: \`node scripts/agentes.mjs equipo\`): \`node scripts/agentes.mjs slack <nombre> "<texto>"\` manda un DM por Slack firmado con tu nombre. SOLO dentro de lo que tu cerebro permite (Sofi: logística con Aure/Carilin; Max: trazabilidad con Aure; Nico: solo a Carilin/Aure sobre sus propias solicitudes — acuse, una pregunta de aclaración, resultado —; Lola: nada sin OK de Elvin) y NUNCA a clientes ni con secretos. Tuteo de Puerto Rico, corto, con contexto de por qué escribes.
- Con Elvin: \`node scripts/agentes.mjs elvin "<texto>"\` (Telegram + Slack). Todo mensaje entre agentes o al equipo queda espejado en el DM de Slack de Elvin: escribe como si él lo leyera.`;

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
  "Bash(node scripts/*)", "Bash(node scripts/agentes.mjs*)", "Bash(bash scripts/deploy-snapshots.sh*)", "Bash(npm test*)", "Bash(npx tsc*)", "Bash(git status*)", "Bash(git diff*)"];

// Corre Claude Code en modo stream-json para poder contar qué está haciendo (herramientas,
// texto parcial) mientras trabaja. onProgreso recibe líneas cortas ("leyendo data/estudio.json").
// Modelos de Nico (Elvin, 23/sep/2026: "super vibecoder, AI first, que trabaje bastante con Opus 5.5
// y él decida"). Opus 5.5 es su cerebro por defecto; dentro de cada trabajo delega en subagentes
// (sonnet/haiku/fable) según su cerebro §7. Elvin puede forzar uno con /fable, /opus, /sonnet, /haiku.
const MODELOS = { fable: "claude-fable-5-1", opus: "claude-opus-5-5", sonnet: "claude-sonnet-5", haiku: "claude-haiku-4-5" };
const MODELO_NICO = env("NICO_MODELO") || MODELOS.opus;
// Trabajos largos (un AutoFlow completo son horas): más turnos y más tiempo, con aviso a Elvin cada
// ~12 min y "para" para detenerlo (ver hijoActual y el loop de main). Autorizado por Elvin el 23/sep.
const NICO_TURNOS = env("NICO_MAX_TURNOS") || "400";
const NICO_LIMITE_MIN = Number(env("NICO_LIMITE_MIN") || 240);
const AVISO_CADA_MIN = Number(env("NICO_AVISO_MIN") || 12);
let hijoActual = null; // el Claude que está corriendo ahora (para poder detenerlo con "para")

// Solo lectura (Nico diagnosticando una solicitud del equipo): mira todo, no cambia nada.
const SOLO_LECTURA = ["Read", "Glob", "Grep", "WebFetch", "Bash(git log*)", "Bash(git status*)", "Bash(git diff*)", "Bash(git show*)", "Bash(npx @railway/cli logs*)", "Bash(npx @railway/cli status*)", "Bash(node scripts/nico-ronda.mjs*)", "Bash(node scripts/n8n.mjs inventario*)", "Bash(node scripts/n8n.mjs ejecuciones*)", "Bash(node scripts/n8n.mjs salud*)", "Bash(node scripts/agentes.mjs solicitudes*)"];
function correrClaude(prompt, persona, sesion, nueva, onProgreso, opts = {}) {
  return new Promise((resolve) => {
    // Nico siempre va en modo total (es su trabajo: arreglar plataformas sin pedir permiso por
    // cada comando) y con más turnos, porque un arreglo real lleva leer + test + deploy + verificar.
    const modo = ES_NICO ? "total" : ES_MAX || ES_LOLA ? "seguro" : env("PUENTE_MODO") || "seguro";
    const args = ["-p", prompt, "--output-format", "stream-json", "--verbose", "--max-turns", ES_NICO ? NICO_TURNOS : ES_MAX ? "25" : ES_LOLA ? "35" : "20", "--append-system-prompt", (PERSONAS[persona] || PERSONAS.claude) + COMUNICACION];
    if (opts.soloLectura) args.push("--permission-mode", "default", "--allowedTools", ...SOLO_LECTURA, "--disallowedTools", "Edit", "Write", "NotebookEdit");
    else if (modo === "total") args.push("--dangerously-skip-permissions");
    // Max: lee lo que quiera, pero solo ejecuta el script de Meta Ads (y no edita nada).
    else if (ES_MAX) args.push("--permission-mode", "default", "--allowedTools", "Read", "Glob", "Grep", "Bash(node scripts/meta-ads.mjs*)", "Bash(node scripts/higgsfield.mjs*)", "Bash(node scripts/agentes.mjs*)", "--disallowedTools", "Edit", "Write", "WebFetch", "WebSearch");
    // Lola: lee el vault, escribe en data/ (entregas, pedidos) y solo corre Higgsfield + validar-voz.
    else if (ES_LOLA) args.push("--permission-mode", "acceptEdits", "--allowedTools", "Read", "Glob", "Grep", "Edit", "Write", "Bash(node scripts/higgsfield.mjs*)", "Bash(node scripts/validar-voz.mjs*)", "Bash(node scripts/agentes.mjs*)", "Bash(node -e*)", "--disallowedTools", "WebFetch", "WebSearch");
    else args.push("--permission-mode", "acceptEdits", "--allowedTools", ...SEGURO);
    if (ES_NICO) for (const d of dirsNico()) args.push("--add-dir", d);
    if (ES_NICO) args.push("--model", opts.modelo || MODELO_NICO);
    if (nueva) args.push("--session-id", sesion); else args.push("--resume", sesion);
    const envVars = { ...process.env, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || env("ANTHROPIC_API_KEY"), PATH: `${path.dirname(CLAUDE)}:${process.env.PATH}` };
    LOG("claude ›", persona, nueva ? "sesión nueva" : "resume", prompt.slice(0, 80));
    const child = spawn(CLAUDE, args, { cwd: ROOT, env: envVars, stdio: ["ignore", "pipe", "pipe"] });
    hijoActual = child;
    const pasos = [];
    const t0 = Date.now();
    // Aviso periódico a Elvin mientras trabaja (no se detiene: si no dice nada, sigue).
    const aviso = opts.avisar ? setInterval(() => {
      const min = Math.round((Date.now() - t0) / 60000);
      opts.avisar(`⏱ Sigo trabajando (${min} min) en: ${(opts.titulo || prompt).replace(/\s+/g, " ").slice(0, 140)}\nÚltimos pasos: ${pasos.slice(-4).join(" · ") || "pensando"}\n¿Sigo? Si no me dices nada, sigo. Para detenerme escribe: para`);
    }, AVISO_CADA_MIN * 60000) : null;
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
            LOG("  ›", que); onProgreso?.(que); pasos.push(que); if (pasos.length > 8) pasos.shift();
          }
        }
      }
      if (ev.type === "result") { final = ev.result || texto; if (ev.is_error) err = [err, ev.result || "error"].filter(Boolean).join("\n") /* sin pisar el stderr: ahí viene "No conversation found" y de eso depende el reintento con sesión nueva */; LOG("claude ‹ fin", ev.subtype ?? "", `${ev.duration_ms ?? "?"}ms`, `$${ev.total_cost_usd ?? "?"}`); }
    };
    child.stdout.on("data", (d) => { buf += d; const partes = buf.split("\n"); buf = partes.pop(); partes.forEach(onLinea); });
    child.stderr.on("data", (d) => { const t = String(d); if (!/Permission allow rule/.test(t)) { err += t; LOG("claude stderr:", t.slice(0, 200)); } });
    const limiteMin = ES_NICO ? NICO_LIMITE_MIN : 15;
    const timer = setTimeout(() => { LOG(`claude: timeout ${limiteMin} min, matando`); child.kill("SIGTERM"); }, limiteMin * 60 * 1000);
    const fin = () => { clearTimeout(timer); if (aviso) clearInterval(aviso); if (hijoActual === child) hijoActual = null; };
    child.on("error", (e) => { fin(); LOG("claude spawn error:", e.message); resolve({ code: 1, out: "", err: e.message }); });
    child.on("close", (code) => { fin(); if (buf) onLinea(buf); resolve({ code, out: (final || texto).trim() || (child.detenido ? "Me detuve porque me lo pediste." : ""), err: err.trim() }); });
  });
}

// Respaldo si el CLI no responde: la API directa con la persona (sin herramientas, pero contesta).
async function respaldoAPI(prompt, persona) {
  const key = process.env.ANTHROPIC_API_KEY || env("ANTHROPIC_API_KEY"); if (!key) return "";
  let contexto = "";
  try { contexto = fs.readFileSync(path.join(ROOT, "vault/ceo/cerebro-sofi.md"), "utf8").slice(0, 8000) + "\n\nESTADO: " + fs.readFileSync(path.join(ROOT, "data/estudio.json"), "utf8").slice(0, 6000); } catch {}
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 900, system: (PERSONAS[persona] || PERSONAS.claude) + COMUNICACION + "\n(Modo respaldo: no tenés herramientas ahora; respondé con lo que sabés y decí qué harías.)\n\n" + contexto, messages: [{ role: "user", content: prompt }] }), signal: AbortSignal.timeout(60000) });
    const j = await r.json(); return j.content?.find((c) => c.type === "text")?.text || "";
  } catch (e) { LOG("respaldo API:", e.message); return ""; }
}

// Lo que Claude escribió en data/ o vault/ desde `desde` (rutas relativas a ROOT).
function cambios(desde) {
  const out = [];
  const mira = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name), r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) mira(p, r);
      else if (!/telegram-puente(-\w+)?\.json$/.test(e.name) && fs.statSync(p).mtimeMs > desde) out.push(r);
    }
  };
  for (const sub of ["data", "vault"]) { const d = path.join(ROOT, sub); try { if (fs.existsSync(d)) mira(d, sub); } catch {} }
  return out;
}
function huboCambios(desde) { return cambios(desde).length > 0; }

// Bandeja de salida en el volumen. En Railway el repo vive en /app: NO es un clon de git ni está
// en el volumen, así que todo lo que Claude escribe se borra cuando el contenedor reinicia, y la
// única forma de que sobreviva es el deploy a producción. El 21/sep se perdió así la locación del
// Ritz que Sofi había dejado en data/estudio.json (el VERCEL_TOKEN estaba vencido → el deploy
// falló → un redeploy borró el contenedor). Ahora cada cambio se copia al volumen y se restaura
// hasta que un deploy confirme que llegó a producción.
const PENDIENTES = EN_NUBE ? path.join(path.dirname(ESTADO), `pendientes${ES_NICO ? "-nico" : ES_MAX ? "-max" : ES_LOLA ? "-lola" : ""}`) : "";
function guardarPendientes(desde) {
  if (!PENDIENTES) return 0;
  let n = 0;
  for (const rel of cambios(desde)) {
    try { const dst = path.join(PENDIENTES, rel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(path.join(ROOT, rel), dst); n++; } catch (e) { LOG("pendiente", rel, e.message.slice(0, 80)); }
  }
  return n;
}
function restaurarPendientes() {
  if (!PENDIENTES || !fs.existsSync(PENDIENTES)) return 0;
  let n = 0;
  const mira = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name), r = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) { mira(p, r); continue; }
      const dst = path.join(ROOT, r);
      try { if (fs.existsSync(dst) && fs.readFileSync(dst).equals(fs.readFileSync(p))) continue; } catch {}
      try { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(p, dst); n++; } catch (e) { LOG("restaurar", r, e.message.slice(0, 80)); }
    }
  };
  try { mira(PENDIENTES, ""); } catch (e) { LOG("restaurar:", e.message.slice(0, 120)); }
  if (n) LOG(`↻ ${n} archivo(s) que no habían llegado a producción, restaurados del volumen`);
  return n;
}
function limpiarPendientes() { if (PENDIENTES) try { fs.rmSync(PENDIENTES, { recursive: true, force: true }); } catch {} }

// Antes de trabajar: bajar de producción lo que otro lado cambió y volver a poner encima lo
// nuestro que todavía no llegó allá (lo pendiente siempre gana: es lo más nuevo).
async function traerDatos() {
  await new Promise((res) => {
    const c = spawn(process.execPath, ["scripts/sync-data.mjs", "pull"], { cwd: ROOT, stdio: "ignore" });
    const t = setTimeout(() => { c.kill(); res(); }, 20000);
    c.on("close", () => { clearTimeout(t); res(); });
    c.on("error", () => { clearTimeout(t); res(); });
  });
  return restaurarPendientes();
}

// Después de trabajar: si se tocó data/ o vault/, subirlo a producción (el único lugar durable
// para el contenedor). Lo usan los dos caminos — Telegram y el buzón de agentes.
function publicarCambios(desde, forzar, avisar) {
  if (ES_MAX) return; // Max solo escribe planes de campaña; la campaña real vive en Meta.
  if (!huboCambios(desde) && !forzar) return;
  guardarPendientes(desde);
  if (EN_NUBE && !(process.env.VERCEL_TOKEN || env("VERCEL_TOKEN"))) { LOG("sin VERCEL_TOKEN: los cambios quedan en el volumen hasta que haya token"); return; }
  LOG("cambios en data/vault → deploy-snapshots");
  const dep = spawn("bash", ["scripts/deploy-snapshots.sh"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, VERCEL_TOKEN: process.env.VERCEL_TOKEN || env("VERCEL_TOKEN"), PUENTE_PENDIENTES: PENDIENTES } });
  let salida = ""; dep.stdout.on("data", (d) => (salida += d)); dep.stderr.on("data", (d) => (salida += d));
  dep.on("close", (code) => {
    LOG("deploy-snapshots:", code === 0 ? "ok" : "falló", salida.trim().split("\n").slice(-2).join(" | "));
    if (code === 0) limpiarPendientes();
    else if (avisar) avisar("⚠️ Guardé los cambios y quedaron a salvo en el volumen, pero el deploy a producción falló; lo reintento en el próximo pedido.");
  });
  dep.on("error", (e) => LOG("deploy:", e.message));
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
  if (ES_NICO && (t === "/ayuda" || t === "/start")) return enviar(token, chat, "Nico activo (vibecoder). Escríbeme qué ajustar o qué revisar en cualquiera de tus plataformas y lo hago.\n\n/ronda — la ronda de salud + reporte ahora mismo\n/solicitudes — lo que Carilin o Aure pidieron y espera tu OK (ok <id> · no <id>)\n/plataformas — qué puedo tocar\n/nuevo — conversación nueva\n\nTodo queda espejado en tu DM de Slack.");
  if (ES_NICO && t === "/solicitudes") {
    const l = await esperandoOk().catch(() => []);
    return enviar(token, chat, l.length ? l.map((x) => `#${x.id} · ${NOMBRES[x.de] || x.de}: ${x.texto.replace(/^\[[^\]]*\]\n?/, "").slice(0, 160)}\n→ ok ${x.id} · no ${x.id}`).join("\n\n") : "Sin solicitudes del equipo esperando tu OK.");
  }
  // "ok 12" / "sí #12 pero sin tocar X" / "no 12 todavía no" → decisión sobre una solicitud del equipo.
  const dec = ES_NICO && t.match(/^(ok|okay|s[ií]|dale|aprob\w*|no|rechaz\w*)\s*#?(\d+)\b\s*([\s\S]*)$/i);
  // Solo si ese número es de verdad una solicitud abierta; si no, es un mensaje normal ("no 3 veces…").
  if (dec && (await esperandoOk().catch(() => [])).some((x) => x.id === Number(dec[2]))) return resolverSolicitud(token, chat, st, Number(dec[2]), !/^(no|rechaz)/i.test(dec[1]), dec[3].trim());
  if (ES_NICO && t === "/plataformas") { try { const inv = JSON.parse(fs.readFileSync(path.join(ROOT, "data/plataformas.json"), "utf8")); return enviar(token, chat, inv.plataformas.map((p) => `- ${p.nombre}${p.critico ? " 🔴crítica" : ""}${p.prod ? ` · ${p.prod}` : ""}`).join("\n")); } catch { return enviar(token, chat, "No pude leer data/plataformas.json."); } }
  if (ES_LOLA && (t === "/ayuda" || t === "/start")) return enviar(token, chat, "Soy Lola, tu creadora de contenido con IA. Pídeme flyers, artes, videos (Higgsfield) o guiones para cualquiera de tus marcas, por ejemplo:\n- \"3 flyers para AI Borinquen, ángulo cuánto dinero está perdiendo, 4:5\"\n- \"Video UGC de Level Up contra el botón azul, 9:16\"\n- \"Guion de Shadow sobre operadores, estructura fija\"\n- \"Pack de la semana de Resuelto: guion + flyer + video\"\n\nTodo queda en tu bandeja de Entregas para que lo apruebes; no se lo mando a nadie. Tope por pedido sin tu OK: 3 imágenes o 2 videos.\n/pendientes — cola de renders\n/nuevo — conversación nueva");
  if (ES_LOLA && t === "/pendientes") { try { const q = JSON.parse(fs.readFileSync(path.join(ROOT, "data/pedidos-lola.json"), "utf8")); const pend = (q.pedidos || []).filter((x) => x.estado === "pendiente"); return enviar(token, chat, pend.length ? pend.map((x) => `- ${x.marca} · ${x.tipo}: ${x.pedido.slice(0, 80)} (${x.fecha.slice(0, 10)})`).join("\n") : "Sin renders pendientes."); } catch { return enviar(token, chat, "Sin renders pendientes."); } }
  if (ES_MAX && (t === "/ayuda" || t === "/start")) return enviar(token, chat, "Soy Max, tu media buyer. Mi trabajo: identificar y escalar anuncios ganadores para llevar el portafolio de $100K a $300K con ROAS 6-8x. Háblame normal, por ejemplo:\n- \"Móntame un Follow Me a Mauro con estos dos reels, $15 al día\"\n- \"¿Cómo van las campañas de Mauro?\"\n- \"Tráfico al YouTube de Mauro con el reel 18164…, $10\"\n- \"Pausa el conjunto 1202…\"\n- \"¿Qué escalamos esta semana?\" / \"¿Qué ángulo está vendiendo?\" / \"¿Hacemos un webinar?\"\n- \"Hazme 3 versiones de este anuncio con otra persona\" (Higgsfield: Ad Multiplier, UGC, fotos de producto, thumbnails; te pido OK antes de gastar créditos)\n\nRutinas: reporte semanal los lunes 8 AM, alertas para escalar mar/jue/sáb, trazabilidad con Aure viernes y lunes.\n\nTodo lo que monto queda EN PAUSA: lo publicas tú en Ads Manager. Nunca activo ni subo presupuesto.\n\nAtajos sin gastar tokens: /ads resultados <marca> · /ads campanas <marca> · /ads plantilla <marca> follow-me --reels a,b --presupuesto 15 --edad 18-35 · /ads ayuda\n/nuevo — conversación nueva");
  if (t === "/ayuda" || t === "/start") return enviar(token, chat, "Puente activo. Escríbeme lo que quieras y lo hago en el Content OS.\n\n/sofi … — hablar con Sofi (producción)\n/jarvis … — métricas y operaciones\n/iris … — la vigía de Cortex (edición de video); \"/iris\" sola corre su ronda ahora\n/estado — qué falta hoy\n/ads … — Meta Ads sin gastar tokens (/ads ayuda)\n/nuevo — empezar conversación nueva\n\nTodo queda espejado en tu DM de Slack.");
  if (t === "/nuevo") { st.sesion = null; guardarEstado(st); return enviar(token, chat, "Listo, conversación nueva."); }
  // Atajo sin Claude: "creador @a @b [nota]" → entra al pipeline de creadores (data/creadores.json)
  // como por-vetar; /creadores (Apify) lo veta después. Elvin (21/sep): él los identifica a ojo.
  const mc = t.match(/^creador(?:es|a)?\s+([\s\S]+)/i);
  if (mc) {
    const hs = [...mc[1].matchAll(/(?:@|instagram\.com\/)([A-Za-z0-9._]{2,30})/g)].map((m) => m[1]);
    if (hs.length) {
      const nota = mc[1].replace(/(?:@|https?:\/\/(?:www\.)?instagram\.com\/)[A-Za-z0-9._]{2,30}\/?/g, "").trim();
      const r = spawnSync(process.execPath, ["scripts/creadores.mjs", "agregar", ...hs.map((h) => "@" + h), "--por", ES_NICO ? "nico" : "elvin", ...(nota ? ["--nota", nota] : [])], { cwd: ROOT, encoding: "utf8" });
      return enviar(token, chat, (r.stdout || r.stderr || "").trim() + "\nLos veto en la próxima corrida de /creadores y te digo cuáles valen.");
    }
  }
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
  let persona = ES_NICO ? "nico" : ES_MAX ? "max" : ES_LOLA ? "lola" : "claude", prompt = t;
  const m = t.match(/^\/(sofi|jarvis|nico|iris)\s+([\s\S]+)/i);
  if (m) { persona = m[1].toLowerCase(); prompt = m[2]; }
  let modelo;
  const mm = ES_NICO && t.match(/^\/(fable|opus|sonnet|haiku)\s+([\s\S]+)/i);
  if (mm) { modelo = MODELOS[mm[1].toLowerCase()]; prompt = mm[2]; }
  if (ES_NICO && t === "/ronda") { persona = "nico"; prompt = "Haz tu ronda ahora: sigue .claude/commands/ronda-nico.md completo (con envío del reporte)."; }
  if (t === "/iris" || /^\/iris\s+ronda$/i.test(t)) { persona = "iris"; prompt = "Haz tu ronda ahora: sigue .claude/commands/iris.md completo, con \"forzar\" si hace falta para revisar aunque no haya mensajes nuevos."; }
  await slackEspejo(`[Telegram] Elvin → ${persona}: ${prompt}`);
  // Antes de trabajar, bajar de producción lo que otro lado (la Mac / Railway) haya cambiado (máx
  // 20 s) y recuperar lo nuestro que quedó sin publicar.
  const pendientesPrevios = await traerDatos();
  gitBajar();
  const inicio = Date.now();
  const hoy = new Date().toISOString().slice(0, 10);
  const nueva = !st.sesion || st.sesionDia !== hoy;
  if (nueva) { st.sesion = randomUUID(); st.sesionDia = hoy; guardarEstado(st); }
  const typing = setInterval(() => tg(token, "sendChatAction", { chat_id: chat, action: "typing" }).catch(() => {}), 5000);
  await tg(token, "sendChatAction", { chat_id: chat, action: "typing" });
  // Elvin (19/sep): sin avisos de progreso; solo "escribiendo…" y la respuesta cuando esté todo.
  const onProgreso = null;
  const optsTrabajo = ES_NICO ? { modelo, titulo: prompt, avisar: (x) => enviar(token, chat, x).catch(() => {}) } : {};
  let r = await correrClaude(contextoRespuestas(st) + prompt, persona, st.sesion, nueva, onProgreso, optsTrabajo);
  if (r.code !== 0 && /session|resume|No conversation/i.test(r.err + r.out)) { st.sesion = randomUUID(); st.sesionDia = hoy; guardarEstado(st); r = await correrClaude(prompt, persona, st.sesion, true, onProgreso, optsTrabajo); }
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
  // lo vean. Se hace en segundo plano; el deploy tarda ~2 min. `pendientesPrevios` reintenta lo
  // que quedó colgado de un deploy que falló antes.
  publicarCambios(inicio, pendientesPrevios > 0, (aviso) => enviar(token, chat, aviso).catch(() => {}));
}

// Un solo Claude a la vez por agente: Telegram y el buzón comparten la sesión del día, y dos
// `--resume` simultáneos se pisan. Todo pasa por esta cola.
let colaClaude = Promise.resolve();
function enSerie(fn) { const r = colaClaude.then(fn, fn); colaClaude = r.catch(() => {}); return r; }

// El buzón: cada ~20 s mira si otro agente le dejó algo y lo atiende como si fuera un mensaje
// de Telegram (misma persona, misma sesión). La respuesta vuelve al buzón del que preguntó.
// Respuestas de otros agentes acumuladas sin gastar tokens; se pegan como contexto al próximo
// pedido (Telegram o buzón) y se vacían.
function contextoRespuestas(st) {
  const rs = st.respuestasPendientes || [];
  if (!rs.length) return "";
  st.respuestasPendientes = []; guardarEstado(st);
  return "Respuestas que te llegaron de otros agentes desde tu último pedido (ya están marcadas atendidas; úsalas si aplican, no las respondas):\n" + rs.map((r) => `- ${NOMBRES[r.de] || r.de} (a tu #${r.hilo}): ${r.texto}`).join("\n") + "\n\n";
}

async function atenderBuzon(token, chatCEO, st) {
  let lista;
  try { lista = await buzonPendientes(YO); } catch (e) { LOG("buzón:", e.message.slice(0, 120)); return; }
  for (const m of lista) {
    const de = NOMBRES[m.de] || m.de;
    const esRespuesta = Boolean(m.hilo);
    // Economía de tokens (Elvin, 21/sep): una RESPUESTA de otro agente NO dispara a Claude. Se
    // guarda en st.respuestasPendientes y se inyecta como contexto en el próximo pedido real (de
    // Elvin o de otro agente). Solo se le avisa a Elvin, que es quien decide.
    if (esRespuesta) {
      try { await buzonMarcar(m.id, "atendido"); } catch {}
      st.respuestasPendientes = [...(st.respuestasPendientes || []).slice(-9), { id: m.id, de: m.de, hilo: m.hilo, texto: m.texto.slice(0, 1500), ts: new Date().toISOString() }];
      guardarEstado(st);
      LOG("buzón ‹ respuesta de", m.de, `#${m.id} (sin Claude)`);
      if (chatCEO) await enviar(token, chatCEO, `📩 ${de} le respondió a ${NOMBRES[YO]} (#${m.hilo}):\n${m.texto.slice(0, 900)}`).catch(() => {});
      continue;
    }
    if (ES_NICO && EQUIPO_NICO.has(m.de)) { await diagnosticarSolicitud(token, chatCEO, st, m); continue; }
    const dec = ES_NICO && m.de === "elvin" && m.texto.match(/^\[APROBACIÓN\]\s*(ok|no)\s*#?(\d+)\s*([\s\S]*)$/i);
    if (dec) {
      await buzonMarcar(m.id, "atendido").catch(() => {});
      await resolverSolicitud(token, chatCEO, st, Number(dec[2]), dec[1].toLowerCase() === "ok", dec[3].trim());
      continue;
    }
    try { await buzonMarcar(m.id, "en-curso"); } catch {}
    const prompt = contextoRespuestas(st) + `[Buzón · de ${de} #${m.id}]\n${m.texto}\n\nHaz lo que pide ${de} si está dentro de tu rol y tus reglas (si no, dile por qué no). Cuando termines, responde con \`node scripts/agentes.mjs atendido ${m.id} "<resultado corto>"\`. Sé breve: es un mensaje entre agentes, no un informe.`;
    LOG("buzón ›", `de ${m.de} #${m.id}`, m.texto.slice(0, 80));
    // Mismo ciclo que por Telegram: traer lo de producción antes y publicar lo escrito después.
    // Sin esto, lo que un agente escribía atendiendo a otro moría con el contenedor (21/sep).
    const pendientesPrevios = await traerDatos();
    gitBajar();
    const inicio = Date.now();
    const hoy = new Date().toISOString().slice(0, 10);
    const nueva = !st.sesion || st.sesionDia !== hoy;
    if (nueva) { st.sesion = randomUUID(); st.sesionDia = hoy; guardarEstado(st); }
    const persona = ES_NICO ? "nico" : ES_MAX ? "max" : ES_LOLA ? "lola" : "sofi";
    let r = await correrClaude(prompt, persona, st.sesion, nueva, null);
    if (r.code !== 0 && /session|resume|No conversation/i.test(r.err + r.out)) { st.sesion = randomUUID(); st.sesionDia = hoy; guardarEstado(st); r = await correrClaude(prompt, persona, st.sesion, true, null); }
    const resp = (r.out || "").trim();
    st.historial = [...(st.historial || []).slice(-49), { ts: new Date().toISOString(), persona, de: m.de, prompt: m.texto.slice(0, 300), resp: resp.slice(0, 300) }];
    guardarEstado(st);
    // Si Claude no cerró el mensaje él mismo, lo cerramos con su respuesta (y se la mandamos al
    // que preguntó, salvo que fuera ya una respuesta: ahí no hay ping-pong).
    // Si Claude ya lo cerró con `agentes.mjs atendido <id> "…"` (que además responde), no se
    // duplica; solo se cierra lo que quedó abierto.
    try {
      const estado = await buzonEstado(m.id);
      if (estado !== "atendido" && estado !== "fallido") {
        await buzonMarcar(m.id, resp ? "atendido" : "fallido", resp.slice(0, 4000) || (r.err || "sin respuesta").slice(0, 500));
        if (!esRespuesta && resp) await buzonEnviar(YO, m.de, resp.slice(0, 4000), m.id);
      }
    } catch (e) { LOG("buzón cierre:", e.message.slice(0, 120)); }
    gitSubir(`buzón #${m.id} de ${m.de}`);
    publicarCambios(inicio, pendientesPrevios > 0, chatCEO ? (aviso) => enviar(token, chatCEO, aviso).catch(() => {}) : null);
    if (chatCEO && !esRespuesta) await enviar(token, chatCEO,`💬 ${NOMBRES[YO]} atendió un pedido de ${de}:\n${m.texto.slice(0, 300)}\n\n→ ${resp.slice(0, 700) || "sin respuesta"}`).catch(() => {});
  }
}
// ── Solicitudes del equipo → Nico, con OK de Elvin (23/sep/2026) ──────────────────────────────
// Elvin: "que Nico tenga un enlace directo con Carilin y Aure… no hace el cambio sin yo
// confirmar. Que me avise: Carilin solicitó este cambio, y cuando yo dé el OK, él lo hace."
// 1) Llega por Slack (app/api/slack-eventos) al buzón como de: carilin|aure.
// 2) Nico lo diagnostica en SOLO LECTURA (no puede editar ni desplegar) → estado esperando-ok,
//    con el plan en `respuesta`, y le llega a Elvin por Telegram + Slack.
// 3) Elvin responde "ok <id>" / "no <id> [nota]" (Telegram de Nico, o "nico ok <id>" en Slack).
// 4) Con el OK, Nico lo ejecuta en modo total, cierra el mensaje y le avisa a quien lo pidió.
// Dónde contestarle: si la solicitud llegó por el canal de Nico, en su hilo; si no, por DM.
function refSlack(texto) {
  const m = String(texto).match(/^\[Solicitud del equipo[^\]]*· canal (\S+) · hilo ([\d.]+)\]/);
  return m ? { canal: m[1], hilo: m[2] } : null;
}
async function dmEquipo(quien, texto, ref) {
  const tok = env("SLACK_BOT_TOKEN"); const persona = resolverPersona(quien);
  if (!tok || !persona) return;
  const destino = ref ? { channel: ref.canal, thread_ts: ref.hilo } : { channel: persona.id };
  try {
    await fetch("https://slack.com/api/chat.postMessage", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${tok}` }, body: JSON.stringify({ ...destino, text: `${ref ? `<@${persona.id}> ` : ""}${texto}\n— Nico`.slice(0, 3900), username: "Nico · Plataformas" }), signal: AbortSignal.timeout(8000) });
  } catch {}
  await slackEspejo(`[Agentes] Nico → ${persona.nombre} (${ref ? "canal de Nico" : "Slack DM"}): ${texto.slice(0, 1500)}`);
}

// Corre a Claude dentro de la sesión del día con el mismo ciclo de datos/git que Telegram.
async function turnoNico(prompt, opts = {}) {
  const st = opts.st;
  const pendientesPrevios = opts.soloLectura ? 0 : await traerDatos();
  gitBajar();
  const inicio = Date.now();
  const hoy = new Date().toISOString().slice(0, 10);
  const nueva = !st.sesion || st.sesionDia !== hoy;
  if (nueva) { st.sesion = randomUUID(); st.sesionDia = hoy; guardarEstado(st); }
  let r = await correrClaude(prompt, "nico", st.sesion, nueva, null, opts);
  if (r.code !== 0 && /session|resume|No conversation/i.test(r.err + r.out)) { st.sesion = randomUUID(); st.sesionDia = hoy; guardarEstado(st); r = await correrClaude(prompt, "nico", st.sesion, true, null, opts); }
  if (!opts.soloLectura) {
    gitSubir(opts.motivo || "solicitud del equipo");
    publicarCambios(inicio, pendientesPrevios > 0, opts.avisar || null);
  }
  return r;
}

async function diagnosticarSolicitud(token, chatCEO, st, m) {
  const quien = NOMBRES[m.de] || m.de;
  const pedido = m.texto.replace(/^\[Solicitud del equipo[^\]]*\]\n?/, "").trim();
  try { await buzonMarcar(m.id, "en-curso"); } catch {}
  LOG("solicitud ›", `de ${m.de} #${m.id}`, pedido.slice(0, 80));
  const prompt = `[Solicitud del equipo #${m.id} · de ${quien}]${refSlack(m.texto) ? " (vino del canal de Nico; si es la respuesta a una pregunta tuya o sigue un pedido anterior del mismo hilo, júntalos en un solo plan)" : ""}\n${pedido}\n\nREGLA DE ELVIN: NO hagas ningún cambio (estás en solo lectura). Diagnostica y arma el plan para que Elvin lo apruebe:\n1) Qué pidió ${quien}, en una línea.\n2) Plataforma y dónde está (repo/archivo, cuenta, workflow, tablero).\n3) Qué harías exactamente, paso a paso y corto.\n4) Riesgo (bajo/medio/alto), si es reversible y a quién afecta (clientes, equipo, cobros).\n5) Tu recomendación: hacerlo, hacerlo distinto o no hacerlo, y por qué.\nSi falta un dato clave de ${quien}, dilo en una línea "Pregunta para ${quien}: …". Máximo 12 líneas, tuteo PR, sin markdown pesado. No escribas a nadie: el puente le manda esto a Elvin.`;
  const r = await turnoNico(prompt, { st, soloLectura: true });
  const plan = (r.out || "").trim() || `No pude diagnosticarlo (${(r.err || "sin salida").slice(0, 200)}). Lo puedo revisar con más calma si me lo apruebas igual.`;
  try { await buzonMarcar(m.id, "esperando-ok", plan.slice(0, 4000)); } catch (e) { LOG("solicitud marcar:", e.message.slice(0, 120)); }
  const aviso = `🟡 ${quien} solicitó un cambio (#${m.id}):\n“${pedido.slice(0, 600)}”\n\n${plan}\n\n👉 Para que lo haga: ok ${m.id}\n✋ Para no hacerlo: no ${m.id} (puedes añadir una nota)\n(También sirve en Slack: "nico ok ${m.id}")`;
  if (chatCEO) await enviar(token, chatCEO, aviso).catch(() => {});
  await slackEspejo(`[Nico] ${aviso}`);
  const pregunta = plan.match(new RegExp(`Pregunta para ${quien}:\\s*(.+)`, "i"));
  if (pregunta) await dmEquipo(m.de, `Sobre tu solicitud #${m.id}: ${pregunta[1].trim()}${refSlack(m.texto) ? " (contéstame aquí en el hilo)" : ' (respóndeme empezando con "Nico")'}`, refSlack(m.texto));
}

async function resolverSolicitud(token, chatCEO, st, id, aprobado, nota) {
  const avisarCEO = (t) => (chatCEO ? enviar(token, chatCEO, t).catch(() => {}) : Promise.resolve());
  let m;
  try { m = await buzonObtener(id); } catch (e) { return avisarCEO(`No pude leer la solicitud #${id}: ${e.message.slice(0, 200)}`); }
  if (!m || !EQUIPO_NICO.has(m.de)) return avisarCEO(`#${id} no es una solicitud del equipo. Pendientes: ${(await esperandoOk().catch(() => [])).map((x) => `#${x.id} (${NOMBRES[x.de] || x.de})`).join(", ") || "ninguna"}.`);
  if (!["esperando-ok", "en-curso", "pendiente"].includes(m.estado)) return avisarCEO(`La solicitud #${id} ya está ${m.estado}.`);
  const quien = NOMBRES[m.de] || m.de;
  const pedido = m.texto.replace(/^\[Solicitud del equipo[^\]]*\]\n?/, "").trim();
  if (!aprobado) {
    await buzonMarcar(id, "rechazado", `Elvin: no${nota ? ` — ${nota}` : ""}`).catch(() => {});
    await dmEquipo(m.de, `Elvin revisó tu solicitud #${id} y por ahora no va.${nota ? ` Nota de Elvin: ${nota}` : ""}`, refSlack(m.texto));
    await slackEspejo(`[Nico] Solicitud #${id} de ${quien} rechazada por Elvin.`);
    return avisarCEO(`Listo, la #${id} de ${quien} no se hace. Ya le avisé.`);
  }
  await buzonMarcar(id, "aprobado").catch(() => {});
  await dmEquipo(m.de, `Elvin aprobó tu solicitud #${id}. Ya estoy en eso; te aviso cuando quede.`, refSlack(m.texto));
  await avisarCEO(`✅ Aprobada #${id} de ${quien}. Manos a la obra; te aviso cuando esté verificada.`);
  const nombreMay = quien.toUpperCase();
  const prompt = `Elvin APROBÓ la solicitud #${id} de ${quien}${nota ? ` con esta nota: "${nota}"` : ""}.\nPedido de ${quien}: ${pedido}\nTu plan (el que Elvin aprobó): ${m.respuesta || "(sin plan previo: diagnostica y ejecútalo)"}\n\nEjecútalo completo como cualquier ajuste tuyo: leer → cambio chico → test → deploy → VERIFICAR contra el sistema vivo → anotar en data/nico-bitacora.json (que empiece con "[Solicitud de ${quien} #${id}]"). Tus prohibiciones siguen: si el plan choca con una (borrar datos, cobros, prompt de voz en prod, secretos…), no lo hagas y dile a Elvin por qué. No le escribas a ${quien}: el puente le avisa. Tu respuesta va a Elvin (corta: qué hiciste, qué verificaste). Al final agrega UNA línea que empiece con "PARA ${nombreMay}:" con 1-2 oraciones sencillas, sin jerga, de lo que quedó.`;
  const r = await turnoNico(prompt, { st, motivo: `solicitud #${id} de ${m.de}`, avisar: avisarCEO, titulo: `solicitud #${id} de ${quien}: ${pedido}` });
  let resp = (r.out || "").trim();
  const re = new RegExp(`^\\s*PARA ${nombreMay}:\\s*(.+)$`, "im");
  const paraEquipo = resp.match(re)?.[1]?.trim();
  resp = resp.replace(re, "").trim();
  const ok = Boolean(resp) && r.code === 0;
  await buzonMarcar(id, ok ? "atendido" : "fallido", (resp || r.err || "sin respuesta").slice(0, 4000)).catch(() => {});
  st.historial = [...(st.historial || []).slice(-49), { ts: new Date().toISOString(), persona: "nico", de: m.de, prompt: `solicitud #${id}: ${pedido.slice(0, 250)}`, resp: resp.slice(0, 300) }];
  guardarEstado(st);
  await avisarCEO(ok ? `🔧 Solicitud #${id} de ${quien}:\n${resp}` : `⚠️ No pude terminar la #${id} de ${quien}: ${(r.err || resp || "sin respuesta").slice(0, 600)}`);
  await slackEspejo(`[Nico] Solicitud #${id} de ${quien} → ${ok ? "hecha" : "falló"}: ${(resp || r.err || "").slice(0, 1500)}`);
  await dmEquipo(m.de, ok ? `Listo ✅ tu solicitud #${id}: ${paraEquipo || "ya quedó hecha y verificada."}` : `Tu solicitud #${id} se complicó; ya se lo reporté a Elvin y te aviso.`, refSlack(m.texto));
}

function buzonLoop(token, getChat, st) {
  const tick = async () => { try { await enSerie(() => atenderBuzon(token, getChat(), st)); } catch (e) { LOG("buzón loop:", e.message); } setTimeout(tick, 90000); };
  setTimeout(tick, 15000);
}

async function main() {
  const VAR_TOKEN = ES_NICO ? "TELEGRAM_BOT_TOKEN_NICO" : ES_MAX ? "TELEGRAM_BOT_TOKEN_MAX" : ES_LOLA ? "TELEGRAM_BOT_TOKEN_LOLA" : "TELEGRAM_BOT_TOKEN";
  let token = env(VAR_TOKEN), chatCEO = env("TELEGRAM_CEO_CHAT_ID");
  while (!token) { LOG(`Esperando ${VAR_TOKEN} en .env.local…`); await new Promise((r) => setTimeout(r, 60000)); token = env(VAR_TOKEN); }
  if (!fs.existsSync(CLAUDE)) LOG(`⚠️ No encuentro el CLI de Claude en ${CLAUDE} (npm install -g @anthropic-ai/claude-code con prefix ~/.npm-global)`);
  await tg(token, "deleteWebhook", { drop_pending_updates: false }).catch(() => {});
  LOG(ES_NICO ? "Puente de NICO arrancó." : ES_MAX ? "Puente de MAX (media buyer) arrancó." : ES_LOLA ? "Puente de LOLA (creadora con IA) arrancó." : "Puente Telegram arrancó.", EN_NUBE ? "En Railway." : "En la Mac.", "Modo:", ES_NICO ? "total" : env("PUENTE_MODO") || "seguro", ES_NICO ? `· repos extra: ${dirsNico().length}` : "", "· CEO chat:", chatCEO || "(sin configurar: respondo el chat id a quien escriba /start)");
  // Chequeo de salud del CLI (no bloquea el loop): si falla, queda en el log el porqué.
  // Chequeo de salud SIN tokens (antes era una corrida real de Claude, ~$0.20 por reinicio).
  try { const v = spawnSync(CLAUDE, ["--version"], { encoding: "utf8", timeout: 20000 }); LOG("salud claude:", v.status === 0 ? "ok · " + String(v.stdout || "").trim().slice(0, 40) : "FALLÓ · " + String(v.stderr || "sin salida").slice(0, 200)); } catch (e) { LOG("salud claude: FALLÓ ·", e.message.slice(0, 200)); }
  const st = leerEstado();
  // Si el contenedor se reinició con cambios sin publicar, volverlos a poner (y que el próximo
  // pedido los suba). /app es efímero: el volumen es lo único que sobrevive un redeploy.
  restaurarPendientes();
  buzonLoop(token, () => chatCEO || env("TELEGRAM_CEO_CHAT_ID"), st);
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
        // "para" detiene el trabajo en curso al instante (Elvin, 23/sep: que me mantenga al tanto y
        // pueda frenarlo). El resto se encola SIN bloquear el polling, para que "para" llegue aunque
        // haya un trabajo de horas corriendo.
        if (/^\/?(para|stop|detente|det[eé]nte|cancela|cancelar)\s*[.!]*$/i.test(msg.text.trim())) {
          if (hijoActual) { hijoActual.detenido = true; hijoActual.kill("SIGTERM"); await enviar(token, chat, "🛑 Detenido. Lo que alcancé a hacer queda en git y en la bitácora; dime si lo reviso, lo termino o lo revierto."); }
          else await enviar(token, chat, "No estoy corriendo nada ahora mismo.");
          continue;
        }
        if (hijoActual) await enviar(token, chat, "📥 Anotado. Estoy terminando lo anterior; esto va justo después.");
        enSerie(() => procesar(token, chat, msg.text, st)).catch(async (e) => { LOG("error:", e.message); await enviar(token, chat, `Se rompió algo: ${e.message.slice(0, 300)}`).catch(() => {}); });
      }
    } catch (e) {
      LOG("loop:", e.message);
      if (++fallos >= 6) { LOG("6 fallos seguidos de red → reinicio"); process.exit(1); }
      await new Promise((x) => setTimeout(x, 5000));
    }
  }
}
main();
