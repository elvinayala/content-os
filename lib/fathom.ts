// Fathom → Slack (Solicitud de Aure #29, aprobada por Elvin el 24/sep/2026).
// Cada llamada que graba el Fathom de elvin@levelupmediapr.net, cuando Fathom termina de
// procesarla, llega a /api/fathom (webhook "new meeting content ready") y sale resumida en el
// canal de Slack de Aure. Aquí solo lo puro: verificar la firma y armar el mensaje (tests en
// tests/fathom.test.mjs). La ruta se encarga de la base (no repetir) y de Slack.
// Payload: https://developers.fathom.ai/api-reference/webhook-payloads/new-meeting-content-ready
import { createHmac, timingSafeEqual } from "node:crypto";

export interface ReunionFathom {
  recording_id: number;
  title?: string;
  meeting_title?: string | null;
  url?: string;
  share_url?: string;
  scheduled_start_time?: string;
  recording_start_time?: string;
  recording_end_time?: string;
  recorded_by?: { name?: string; email?: string } | null;
  calendar_invitees?: { name?: string | null; email?: string | null; is_external?: boolean }[] | null;
  default_summary?: { template_name?: string; markdown_formatted?: string } | null;
  action_items?: {
    description?: string;
    completed?: boolean;
    recording_playback_url?: string;
    assignee?: { name?: string | null; email?: string | null } | null;
  }[] | null;
}

const TZ = "America/Puerto_Rico";
const TOLERANCIA_S = 5 * 60;

// Firma estilo Svix: base64(HMAC-SHA256(base64decode(secreto sin "whsec_"), `${id}.${ts}.${body}`)),
// el header trae una o varias "v1,<firma>" separadas por espacio.
export function firmaValida(
  secreto: string,
  headers: { id: string | null; timestamp: string | null; firma: string | null },
  cuerpo: string,
  ahoraS = Math.floor(Date.now() / 1000),
): boolean {
  const { id, timestamp, firma } = headers;
  if (!secreto || !id || !timestamp || !firma) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(ahoraS - ts) > TOLERANCIA_S) return false;
  const clave = Buffer.from(secreto.replace(/^whsec_/, ""), "base64");
  const esperada = createHmac("sha256", clave).update(`${id}.${timestamp}.${cuerpo}`).digest();
  return firma.split(" ").some((parte) => {
    const dada = Buffer.from(parte.replace(/^v\d+,/, ""), "base64");
    return dada.length === esperada.length && timingSafeEqual(dada, esperada);
  });
}

// Slack interpreta <, > y &: se escapan como pide su doc.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// El resumen de Fathom viene en markdown; Slack usa mrkdwn (*negrita*, <url|texto>).
export function markdownASlack(md: string): string {
  return esc(md)
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_, t, u) => `<${u}|${t}>`)
    .replace(/^#{1,6}\s*(.+)$/gm, (_, t) => `*${t.replace(/\*+/g, "").trim()}*`)
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/^(\s*)[-*]\s+/gm, "$1• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fechaHora(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dia = new Intl.DateTimeFormat("es-PR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
  const hora = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return `${dia.replace(",", "")}, ${hora} (hora PR)`;
}

function duracion(a?: string, b?: string): string | null {
  if (!a || !b) return null;
  const min = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
  return Number.isFinite(min) && min > 0 ? `${min} min` : null;
}

export function participantes(r: ReunionFathom): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  const add = (nombre?: string | null, email?: string | null) => {
    const clave = (email || nombre || "").toLowerCase().trim();
    if (!clave || vistos.has(clave)) return;
    vistos.add(clave);
    out.push(nombre?.trim() || email!.trim());
  };
  add(r.recorded_by?.name, r.recorded_by?.email);
  for (const i of r.calendar_invitees ?? []) add(i.name, i.email);
  return out;
}

const MAX_RESUMEN = 2800;

// Mensaje de Slack: título, fecha y hora, participantes, resumen (con sus puntos clave, tal como
// los arma Fathom), tareas y link. Todo dentro de los límites de Slack (bloques de ≤ 3000).
export function mensajeSlack(r: ReunionFathom): { text: string; blocks: unknown[] } {
  const titulo = (r.meeting_title || r.title || "Llamada sin título").trim();
  const link = r.share_url || r.url;
  const gente = participantes(r);
  const dur = duracion(r.recording_start_time, r.recording_end_time);
  const cabecera = [
    `*Fecha:* ${fechaHora(r.recording_start_time || r.scheduled_start_time)}${dur ? ` · ${dur}` : ""}`,
    `*Participantes:* ${gente.length ? esc(gente.join(", ")) : "Fathom no los identificó"}`,
  ].join("\n");

  let resumen = markdownASlack(r.default_summary?.markdown_formatted ?? "");
  if (resumen.length > MAX_RESUMEN) resumen = `${resumen.slice(0, MAX_RESUMEN).replace(/\s+\S*$/, "")}…\n_(sigue en Fathom)_`;

  const tareas = (r.action_items ?? []).filter((t) => t.description?.trim());
  let textoTareas = tareas
    .map((t) => {
      const quien = t.assignee?.name || t.assignee?.email;
      return `${t.completed ? "☑" : "☐"} ${esc(t.description!.trim())}${quien ? ` — _${esc(quien)}_` : ""}`;
    })
    .join("\n");
  if (textoTareas.length > MAX_RESUMEN) textoTareas = `${textoTareas.slice(0, MAX_RESUMEN).replace(/\n[^\n]*$/, "")}\n…`;

  const seccion = (t: string) => ({ type: "section", text: { type: "mrkdwn", text: t } });
  const blocks: unknown[] = [
    { type: "header", text: { type: "plain_text", text: `🎙️ ${titulo}`.slice(0, 150), emoji: true } },
    seccion(cabecera),
    { type: "divider" },
    seccion(resumen ? `*Resumen*\n${resumen}` : "*Resumen*\n_Fathom no generó resumen para esta llamada._"),
    seccion(`*Tareas / próximos pasos*\n${textoTareas || "_Sin tareas identificadas._"}`),
  ];
  if (link) blocks.push(seccion(`<${link}|▶️ Ver grabación y transcripción en Fathom>`));

  const text = `🎙️ ${titulo} · ${fechaHora(r.recording_start_time || r.scheduled_start_time)}`;
  return { text, blocks };
}

// ── Onboarding → Max (Elvin, 24/sep/2026) ──────────────────────────────────────────────────────
// "Max debe recibir rápido el Fathom de la sesión de onboarding del cliente: que Jessica termine la
// reunión y él comience a trabajar inmediatamente." Una reunión es de onboarding si su título lo dice.
export interface ReunionConTranscripcion extends ReunionFathom {
  transcript?: { speaker?: { display_name?: string | null } | null; text?: string; timestamp?: string }[] | null;
}

const RE_ONBOARDING = /\b(onboarding|on-boarding|bienvenida|kick-?off|arranque|auditor[ií]a inicial)\b/i;

// Elvin (24/sep): "las llamadas de Jessica son las llamadas etiquetadas de onboarding" — solo cuenta el
// título. Una llamada sin la etiqueta no le llega a Max, la haya grabado quien la haya grabado.
export function esOnboarding(r: ReunionFathom): boolean {
  return RE_ONBOARDING.test(`${r.meeting_title ?? ""} ${r.title ?? ""}`);
}

// El cliente de la reunión = los invitados externos (no del equipo). Nombre para el expediente: el
// título sin la palabra "onboarding" si dice algo, si no el nombre del primer externo.
export function clienteDeReunion(r: ReunionFathom, dominiosEquipo = ["levelupmediapr.net", "aiborinquen.com"]): { nombre: string; emails: string[] } {
  const externos = (r.calendar_invitees ?? []).filter((i) => {
    const dom = (i.email || "").toLowerCase().split("@")[1] || "";
    return i.is_external !== false && !dominiosEquipo.some((d) => dom === d || dom.endsWith("." + d));
  });
  const emails = externos.map((i) => (i.email || "").toLowerCase().trim()).filter(Boolean);
  const delTitulo = (r.meeting_title || r.title || "")
    .replace(RE_ONBOARDING, "")
    .replace(/\b(level up( media)?|lum|llamada|sesi[oó]n|reuni[oó]n|zoom|meet|call|con|de|y|x)\b/gi, " ")
    .replace(/[|·:\-–—()[\]]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const nombre = (delTitulo.length >= 3 ? delTitulo : "") || externos[0]?.name?.trim() || emails[0] || "Cliente nuevo";
  return { nombre: nombre.slice(0, 120), emails };
}

// Transcripción compacta para la ficha de Max (tope para no inflar tokens).
export function transcripcionCorta(r: ReunionConTranscripcion, max = 15000): string {
  const t = (r.transcript ?? []).map((x) => `${x.speaker?.display_name || "?"}: ${(x.text || "").trim()}`).filter((l) => l.length > 3).join("\n");
  return t.length > max ? `${t.slice(0, max)}\n…(sigue en Fathom)` : t;
}
