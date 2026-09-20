#!/usr/bin/env node
// Productividad/asistencia del equipo en Slack (Level Up). Por cada persona del
// ROSTER mide, en la ventana laboral (L-V 8am-6pm, Sáb 8am-1pm, hora PR):
//   - mensajes de hoy y de los últimos 7 días
//   - última actividad
//   - HUECO más grande hoy dentro de la ventana → >2h = ALERTA ROJA
//   - tiempo de respuesta aprox. (qué tan rápido entra cuando otro escribe, 7d)
// Escribe data/actividad-equipo.json (para el panel) y, con REPORTE=1, manda el
// reporte del día al DM de Carilin con @mención (notificación) para que investigue.
//
// Uso: node scripts/actividad-equipo.mjs            (snapshot)
//      REPORTE=1 node scripts/actividad-equipo.mjs  (snapshot + DM a Carilin)
//      DRY_RUN=1 REPORTE=1 ...                       (no escribe ni postea; imprime)

import fs from "node:fs";
import path from "node:path";

function cargarEnv() {
  if (process.env.SLACK_LEVELUP_TOKEN && process.env.SLACK_BOT_TOKEN) return;
  const f = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(f)) return;
  for (const l of fs.readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
cargarEnv();

const BOT = process.env.SLACK_BOT_TOKEN;
const USER = process.env.SLACK_LEVELUP_TOKEN;
const DRY = process.env.DRY_RUN === "1";
const HACER_REPORTE = process.env.REPORTE === "1";
const CARILIN = "U07V7MVJ18B";

// ROSTER a medir (id + rol + líder al que Carilin escala su red flag).
const ROSTER = [
  { id: "U07V7MVJ18B", nombre: "Carilin Sofía", rol: "COO / Operaciones", lider: "Elvin" },
  { id: "U08U9777PUY", nombre: "Elvin", rol: "CEO", lider: "—" },
  { id: "U09D4GB4MPW", nombre: "Juan Diego", rol: "Director de Estrategas", lider: "Elvin / Carilin" },
  { id: "U09MAUPKPEG", nombre: "Daisy Buendía", rol: "Estratega", lider: "Juan Diego" },
  { id: "U0916SSH9RC", nombre: "Bárbara Quero", rol: "Estratega / Trafficker", lider: "Juan Diego" },
  { id: "U09HS09R37T", nombre: "Santiago Gutiérrez", rol: "Estratega", lider: "Juan Diego" },
  { id: "U0ARDBKQDCJ", nombre: "Felipe Durán", rol: "Estratega", lider: "Juan Diego" },
  { id: "U0BE6859KDG", nombre: "Juan José Cruz", rol: "Estratega", lider: "Juan Diego" },
  { id: "U08N6T2P3L7", nombre: "María del Carmen Valencia", rol: "Media Traffic Auditor", lider: "Juan Diego" },
  { id: "U0AD55PEWB0", nombre: "Ana Milena Consuegra", rol: "CSM", lider: "Carilin" },
  { id: "U08SN35L2UX", nombre: "Jessica De La Cruz", rol: "Project Manager", lider: "Carilin" },
  { id: "U07VDTQU8F4", nombre: "Marcos Ruiz", rol: "Diseñador", lider: "Líder de Diseño" },
  { id: "U09FNS3QE5B", nombre: "Eros Gutiérrez", rol: "Diseñador", lider: "Líder de Diseño" },
  { id: "U09216B1VD4", nombre: "Manuel Abreu", rol: "Diseñador", lider: "Líder de Diseño" },
];
const ES_ROSTER = new Set(ROSTER.map((r) => r.id));

const SIEMPRE = ["C0B4K58DUSD", "C09ERUWPLJ2", "C08T8BWTH1P", "C07VCFWV283"];
const RE_EQUIPO = /office|equipo|team|ventas|sales|setter|closer|fulfillment|fullfilment|operaciones|daily|general|onboarding|csm|clientes|traffic|creativ|dise|report/i;
const HUECO_ROJO_MIN = 120; // >2h sin actividad en la ventana = rojo

async function slack(token, method, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`https://slack.com/api/${method}${qs ? "?" + qs : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ---- Ventana laboral de HOY en PR (UTC-4, sin DST) ----
function ventanaHoy() {
  const fecha = new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" }); // YYYY-MM-DD
  const dow = new Date(`${fecha}T12:00:00-04:00`).getUTCDay(); // 0=Dom..6=Sáb
  if (dow === 0) return null; // domingo: no se monitorea
  const finHora = dow === 6 ? "13:00:00" : "18:00:00"; // sáb hasta 1pm
  const inicio = Math.floor(Date.parse(`${fecha}T08:00:00-04:00`) / 1000);
  const fin = Math.floor(Date.parse(`${fecha}T${finHora}-04:00`) / 1000);
  const ahora = Math.floor(Date.now() / 1000);
  return { fecha, dow, inicio, fin, corte: Math.min(ahora, fin), ahora };
}

function fmtHora(unix) {
  return new Date(unix * 1000).toLocaleTimeString("es-PR", {
    timeZone: "America/Puerto_Rico", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}
function fmtDur(min) {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}
function haceCuanto(unix) {
  if (!unix) return "sin registro";
  const min = Math.floor((Date.now() / 1000 - unix) / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}
function mediana(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function main() {
  if (!BOT || !USER) { console.error("Faltan tokens"); process.exit(1); }
  const V = ventanaHoy();

  // 1) Canales de equipo.
  const lista = await slack(BOT, "conversations.list", { types: "public_channel", limit: "1000", exclude_archived: "true" });
  if (!lista.ok) { console.error("list:", lista.error); process.exit(1); }
  const objetivo = lista.channels.filter((c) => SIEMPRE.includes(c.id) || RE_EQUIPO.test(c.name)).slice(0, 30);

  const ahora = Math.floor(Date.now() / 1000);
  const oldest = ahora - 7 * 86400;
  const m7 = new Map();      // id -> count 7d
  const msgsHoy = new Map(); // id -> [ts...] dentro de HOY
  const ultima = new Map();  // id -> ts última actividad
  const respGaps = new Map();// id -> [gaps min] tiempo de respuesta
  let canalesLeidos = 0;

  for (const c of objetivo) {
    let cursor, paginas = 0;
    const buffer = [];
    do {
      const h = await slack(USER, "conversations.history", { channel: c.id, oldest: String(oldest), limit: "200", ...(cursor ? { cursor } : {}) });
      if (!h.ok) break;
      canalesLeidos++;
      for (const m of h.messages || []) {
        if ((m.subtype && m.subtype !== "") || m.bot_id || !m.user) continue;
        buffer.push({ user: m.user, ts: parseFloat(m.ts) });
      }
      cursor = h.response_metadata?.next_cursor; paginas++;
    } while (cursor && paginas < 3);

    buffer.sort((a, b) => a.ts - b.ts);
    for (let i = 0; i < buffer.length; i++) {
      const { user, ts } = buffer[i];
      m7.set(user, (m7.get(user) || 0) + 1);
      if (ts > (ultima.get(user) || 0)) ultima.set(user, ts);
      if (V && ts >= V.inicio && ts <= V.corte) {
        if (!msgsHoy.has(user)) msgsHoy.set(user, []);
        msgsHoy.get(user).push(ts);
      }
      // tiempo de respuesta: msg de roster precedido (<4h) por OTRO usuario
      if (ES_ROSTER.has(user) && i > 0) {
        const prev = buffer[i - 1];
        if (prev.user !== user && ts - prev.ts <= 4 * 3600) {
          if (!respGaps.has(user)) respGaps.set(user, []);
          respGaps.get(user).push((ts - prev.ts) / 60);
        }
      }
    }
  }

  // 2) Evaluar cada persona del roster.
  const personas = ROSTER.map((r) => {
    const hoy = (msgsHoy.get(r.id) || []).sort((a, b) => a - b);
    let maxGap = 0, gapDesde = null, gapHasta = null, estado = "verde", motivo = "";
    if (V) {
      const puntos = [V.inicio, ...hoy, V.corte];
      for (let i = 1; i < puntos.length; i++) {
        const g = (puntos[i] - puntos[i - 1]) / 60;
        if (g > maxGap) { maxGap = g; gapDesde = puntos[i - 1]; gapHasta = puntos[i]; }
      }
      const ventanaMin = (V.corte - V.inicio) / 60;
      if (hoy.length === 0 && ventanaMin > HUECO_ROJO_MIN) {
        estado = "rojo"; motivo = "sin actividad hoy en horario laboral";
      } else if (maxGap > HUECO_ROJO_MIN) {
        estado = "rojo"; motivo = `hueco de ${fmtDur(maxGap)} (${fmtHora(gapDesde)}→${fmtHora(gapHasta)})`;
      } else if (maxGap > 90) {
        estado = "amarillo"; motivo = `hueco de ${fmtDur(maxGap)}`;
      }
    } else {
      estado = "na"; motivo = "domingo (no se monitorea)";
    }
    return {
      id: r.id, nombre: r.nombre, rol: r.rol, lider: r.lider,
      mensajesHoy: hoy.length, mensajes7d: m7.get(r.id) || 0,
      ultimaActividad: ultima.get(r.id) ? new Date(ultima.get(r.id) * 1000).toISOString() : null,
      ultimaHace: haceCuanto(ultima.get(r.id)),
      maxGapMin: Math.round(maxGap), estado, motivo,
      respuestaMin: (() => { const mm = mediana(respGaps.get(r.id) || []); return mm == null ? null : Math.round(mm); })(),
    };
  });

  const orden = { rojo: 0, amarillo: 1, verde: 2, na: 3 };
  personas.sort((a, b) => orden[a.estado] - orden[b.estado] || b.mensajes7d - a.mensajes7d);

  const snapshot = {
    actualizadoEl: new Date().toISOString(),
    ventana: V ? { fecha: V.fecha, sabado: V.dow === 6 } : null,
    canalesLeidos, personas,
  };

  if (!DRY) {
    fs.writeFileSync(path.join(process.cwd(), "data", "actividad-equipo.json"), JSON.stringify(snapshot, null, 2));
  }

  const rojos = personas.filter((p) => p.estado === "rojo");

  // 3) Historial de red flags (para "3 en la semana → evaluar productividad").
  const histPath = path.join(process.cwd(), "data", "actividad-historial.json");
  let hist = { dias: [] };
  try { hist = JSON.parse(fs.readFileSync(histPath, "utf8")); } catch {}
  if (V && !DRY) {
    hist.dias = (hist.dias || []).filter((d) => d.fecha !== V.fecha);
    hist.dias.push({ fecha: V.fecha, rojos: rojos.map((p) => p.id) });
    hist.dias = hist.dias.slice(-40);
    fs.writeFileSync(histPath, JSON.stringify(hist, null, 2));
  }
  // conteo rolling 7 días por persona (incluye hoy).
  const hace7 = new Date(Date.now() - 7 * 86400 * 1000).toISOString().slice(0, 10);
  const conteoRF = new Map();
  const dias = [...(hist.dias || [])];
  if (V && DRY && !dias.some((d) => d.fecha === V.fecha)) dias.push({ fecha: V.fecha, rojos: rojos.map((p) => p.id) });
  for (const d of dias) {
    if (d.fecha < hace7) continue;
    for (const id of d.rojos) conteoRF.set(id, (conteoRF.get(id) || 0) + 1);
  }

  // 4) Coverage guard: si demasiados "sin registro", la cobertura está rota → NO enviar.
  const sinRegistro = personas.filter((p) => !p.ultimaActividad).length;
  const coberturaOk = sinRegistro / personas.length <= 0.4;

  const fechaTxt = V ? new Date(`${V.fecha}T12:00:00-04:00`).toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", weekday: "long", day: "numeric", month: "long" }) : "hoy";
  const motivoCorto = (p) => p.motivo.replace(" en horario laboral", "").replace("hueco de", "hueco");

  // Reporte LEAN para Carilin: solo red flags + a quién escalar + reincidencia.
  const lineasRojos = rojos.map((p) => {
    const n = conteoRF.get(p.id) || 1;
    const reinc = n >= 3 ? `  ⚠️ *${n}ª red flag en 7 días → evaluar productividad (amonestación)*` : "";
    return `• *${p.nombre}* (${p.rol}) — ${motivoCorto(p)} → avisar a *${p.lider}*.${reinc}`;
  });
  const texto = rojos.length
    ? [
        `:rotating_light: *Red flags del día — ${fechaTxt}*`,
        `<@${CARILIN}> averiguá qué pasó y pasalo al líder:`,
        ...lineasRojos,
        `\n_+2h sin escribir en horario = red flag. 3 en la semana = evaluación de productividad._`,
      ].join("\n")
    : `✅ *${fechaTxt}* — sin red flags. Todo el equipo activo en horario. — <@${CARILIN}>`;

  if (HACER_REPORTE && V) {
    if (!coberturaOk) {
      console.log(`⚠️ cobertura insuficiente (${sinRegistro}/${personas.length} sin registro) — NO envío a Carilin para no acusar en falso. Falta scope search:read.`);
    } else if (DRY) {
      console.log("[DRY] reporte a Carilin:\n" + texto);
    } else {
      const post = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${BOT}` },
        body: JSON.stringify({ channel: CARILIN, text: texto }),
      });
      const pj = await post.json();
      console.log("reporte a Carilin:", pj.ok ? "OK ✓" : "ERROR " + pj.error);
    }
  }

  console.log(`${DRY ? "[DRY] " : ""}roster: ${personas.length} · rojos: ${rojos.length} · sinRegistro: ${sinRegistro} · coberturaOk: ${coberturaOk} · canales: ${canalesLeidos}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
