import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "./db";
import { hoyPR } from "./motor-reglas";
import { pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "./schema";
import { mensajeSop, modoDelDia, type ModoSop, type SopPersona } from "./sop-mensajes";
import type { SettingsColumna, ValorCelda } from "./types";

// Todos los días (9 AM PR) del lunes 28/sep al viernes 2/oct/2026, el bot Command Center le recuerda
// a Carilin y a Aure los SOP de sus departamentos con el progreso real de Pulse. Si ya contestaron
// algo en el DM, solo pregunta el estatus. Si ya publicaron todo, no escribe.

const BASE = process.env.PULSE_URL ?? "https://pulse-eamarket.vercel.app";
const DESDE = process.env.SOP_RECORDATORIO_DESDE ?? "2026-09-28";
const HASTA = process.env.SOP_RECORDATORIO_HASTA ?? "2026-10-02";
const TABLEROS = ["sops-level-up", "sops-ai-borinquen"];
const PERSONAS = [
  { email: "carilin@levelupmediapr.net", nombre: "Carilin", slack: "U07V7MVJ18B" },
  { email: "aure@levelupmediapr.net", nombre: "Aure", slack: "U08HA9QCJBG" },
];
const ELVIN_SLACK = process.env.CEO_SLACK_ID ?? "U08U9777PUY";

async function slack<T>(metodo: string, params: Record<string, string | boolean>, post = false): Promise<T & { ok: boolean; error?: string }> {
  const token = process.env.SLACK_BOT_TOKEN ?? "";
  const r = post
    ? await fetch(`https://slack.com/api/${metodo}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(params), signal: AbortSignal.timeout(15000) })
    : await fetch(`https://slack.com/api/${metodo}?${new URLSearchParams(params as Record<string, string>)}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
  return r.json();
}

async function progreso(email: string, nombre: string): Promise<SopPersona> {
  const d = await db();
  const [u] = await d.select({ id: pulseUsers.id }).from(pulseUsers).where(eq(pulseUsers.email, email));
  const boards = await d.select().from(pulseBoards).where(inArray(pulseBoards.slug, TABLEROS));
  const vacio: SopPersona = { nombre, total: 0, publicados: 0, enRevision: 0, faltan: [], links: [] };
  if (!u || !boards.length) return vacio;
  const ids = boards.map((b) => b.id);
  const [cols, grupos, items] = await Promise.all([
    d.select().from(pulseColumns).where(inArray(pulseColumns.boardId, ids)),
    d.select().from(pulseGroups).where(inArray(pulseGroups.boardId, ids)),
    d.select().from(pulseItems).where(inArray(pulseItems.boardId, ids)),
  ]);
  const p = { ...vacio };
  const faltan = new Set<string>();
  for (const b of boards) {
    const cEstado = cols.find((c) => c.boardId === b.id && c.title === "Estado");
    const cResp = cols.find((c) => c.boardId === b.id && c.title === "Responsable");
    if (!cEstado || !cResp) continue;
    const labels = ((cEstado.settings ?? {}) as SettingsColumna).labels ?? [];
    const suyos = items.filter((i) => i.boardId === b.id && ((i.values as Record<string, ValorCelda>)[cResp.id] as string[] | undefined)?.includes(u.id));
    if (!suyos.length) continue;
    p.links.push(`${BASE}/pulse/${b.slug}`);
    for (const i of suyos) {
      const etiqueta = labels.find((l) => l.id === (i.values as Record<string, ValorCelda>)[cEstado.id])?.label ?? "";
      p.total++;
      if (/publicado/i.test(etiqueta)) p.publicados++;
      else {
        if (/revisi/i.test(etiqueta)) p.enRevision++;
        const g = grupos.find((x) => x.id === i.groupId)?.title ?? i.name;
        faltan.add(b.slug.endsWith("ai-borinquen") ? `${g} (AIB)` : g);
      }
    }
  }
  p.faltan = [...faltan];
  return p;
}

// Lo que ya pasó en el DM con esa persona desde que arrancaron los recordatorios.
async function historial(slackId: string): Promise<{ yaSeLeEscribio: boolean; respondio: boolean; hoyYa: boolean }> {
  const ims = await slack<{ channels?: { id: string; user: string }[] }>("conversations.list", { types: "im", limit: "1000" });
  const canal = ims.channels?.find((c) => c.user === slackId)?.id;
  if (!canal) return { yaSeLeEscribio: false, respondio: false, hoyYa: false };
  const oldest = String(Date.parse(`${DESDE}T00:00:00-04:00`) / 1000 - 86400);
  const h = await slack<{ messages?: { ts: string; user?: string; bot_id?: string; text?: string }[] }>("conversations.history", { channel: canal, oldest, limit: "200" });
  const msgs = (h.messages ?? []).sort((a, b) => Number(a.ts) - Number(b.ts));
  const recordatorios = msgs.filter((m) => m.bot_id && /\bSOP/.test(m.text ?? ""));
  if (!recordatorios.length) return { yaSeLeEscribio: false, respondio: false, hoyYa: false };
  const primero = Number(recordatorios[0].ts);
  const diaPR = (ts: string) => new Date(Number(ts) * 1000).toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
  return {
    yaSeLeEscribio: true,
    respondio: msgs.some((m) => m.user === slackId && !m.bot_id && Number(m.ts) > primero),
    hoyYa: recordatorios.some((m) => diaPR(m.ts) === hoyPR()),
  };
}

export async function recordarSops(opciones: { prueba?: boolean; dry?: boolean } = {}): Promise<{ hoy: string; enviados: { nombre: string; modo: ModoSop | "fuera-de-fecha" | "ya-hoy"; texto: string | null }[] }> {
  const hoy = hoyPR();
  const enviados: { nombre: string; modo: ModoSop | "fuera-de-fecha" | "ya-hoy"; texto: string | null }[] = [];
  const enVentana = hoy >= DESDE && hoy <= HASTA;
  for (const per of PERSONAS) {
    if (!enVentana && !opciones.prueba) {
      enviados.push({ nombre: per.nombre, modo: "fuera-de-fecha", texto: null });
      continue;
    }
    const [p, h] = await Promise.all([progreso(per.email, per.nombre), historial(per.slack)]);
    if (h.hoyYa && !opciones.prueba) {
      enviados.push({ nombre: per.nombre, modo: "ya-hoy", texto: null });
      continue;
    }
    const modo = modoDelDia({ ...h, esUltimoDia: hoy === HASTA, todoPublicado: p.total > 0 && p.publicados === p.total });
    const texto = mensajeSop(p, modo);
    enviados.push({ nombre: per.nombre, modo, texto });
    if (!texto || opciones.dry) continue;
    await slack("chat.postMessage", { channel: opciones.prueba ? ELVIN_SLACK : per.slack, text: opciones.prueba ? `[Vista previa · a ${per.nombre}]\n${texto}` : texto, unfurl_links: false }, true);
  }
  return { hoy, enviados };
}
