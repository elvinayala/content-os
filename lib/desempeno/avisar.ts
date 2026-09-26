import "server-only";

import { eq } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { slackIdPorEmail } from "../pulse/slack-dm";
import { desempenoPerfiles } from "./schema";

// Avisos de Ritmo por Slack: SIEMPRE desde el bot Command Center (nunca desde la cuenta de Elvin).
// Solo salen con DESEMPENO_AVISOS=real. El bot no tiene users:read.email, así que a cada persona se
// la ubica por el `slack_id` de su perfil (se busca solo por nombre al guardar; RR.HH. lo corrige).

export const avisosReales = () => process.env.DESEMPENO_AVISOS === "real";

/** Texto escrito por empleados → seguro para Slack (sin <links|falsos>, @channel ni menciones inyectadas). */
export const esc = (s: string | null | undefined) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function slack<T>(metodo: string, body?: Record<string, unknown>, query?: Record<string, string>): Promise<T | null> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  try {
    const r = await fetch(`https://slack.com/api/${metodo}${query ? `?${new URLSearchParams(query)}` : ""}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json; charset=utf-8" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

/** Busca a la persona en Slack por su nombre (único resultado o nada). */
export async function buscarSlackPorNombre(nombre: string): Promise<string | null> {
  const buscado = norm(nombre);
  const partes = buscado.split(" ").filter((p) => p.length > 1);
  if (!partes.length) return null;
  const candidatos: string[] = [];
  let cursor = "";
  for (let i = 0; i < 10; i++) {
    const l = await slack<{ ok: boolean; members?: { id: string; deleted?: boolean; is_bot?: boolean; real_name?: string; profile?: { real_name?: string; display_name?: string } }[]; response_metadata?: { next_cursor?: string } }>("users.list", undefined, { limit: "200", ...(cursor ? { cursor } : {}) });
    if (!l?.ok) break;
    for (const m of l.members ?? []) {
      if (m.deleted || m.is_bot) continue;
      const nombres = [m.real_name, m.profile?.real_name, m.profile?.display_name].filter(Boolean).map((x) => norm(x!));
      // Coincide si es igual, si el nombre de Slack (2+ palabras) está completo dentro del de Pulse
      // ("Santiago Gutierrez" ⊂ "Santiago Alejandro Gutiérrez Castaño") o al revés con nombre + apellido.
      const ok = nombres.some((n) => {
        const t = n.split(" ").filter((x) => x.length > 1);
        if (n === buscado) return true;
        if (t.length >= 2 && t.every((x) => partes.includes(x))) return true;
        return partes.length >= 2 && partes.slice(0, 2).every((x) => t.includes(x));
      });
      if (ok && !candidatos.includes(m.id)) candidatos.push(m.id);
    }
    cursor = l.response_metadata?.next_cursor ?? "";
    if (!cursor) break;
  }
  return candidatos.length === 1 ? candidatos[0] : null;
}

async function idDe(userId: string): Promise<string | null> {
  const d = await db();
  const [r] = await d.select({ slackId: desempenoPerfiles.slackId, email: pulseUsers.email }).from(pulseUsers).leftJoin(desempenoPerfiles, eq(desempenoPerfiles.userId, pulseUsers.id)).where(eq(pulseUsers.id, userId));
  if (!r) return null;
  return r.slackId || (await slackIdPorEmail(r.email));
}

async function enviar(id: string | null, texto: string): Promise<boolean> {
  if (!id) return false;
  const r = await slack<{ ok: boolean }>("chat.postMessage", { channel: id, text: texto, unfurl_links: false });
  return !!r?.ok;
}

/** DM a una persona de Ritmo (por su id de usuario). */
export async function avisarPersona(userId: string | null, texto: string): Promise<boolean> {
  if (!userId || !avisosReales()) return false;
  return enviar(await idDe(userId), texto);
}

/** DM por correo (Carilin, RR.HH., destinatarios fijos). */
export async function avisarCorreo(email: string, texto: string): Promise<boolean> {
  if (!avisosReales()) return false;
  return enviar(await slackIdPorEmail(email), texto);
}

/** Recursos Humanos (RITMO_RRHH). */
export async function avisarRrhh(texto: string): Promise<number> {
  let n = 0;
  for (const e of (process.env.RITMO_RRHH ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)) if (await avisarCorreo(e, texto)) n++;
  return n;
}
