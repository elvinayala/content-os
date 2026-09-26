import "server-only";

import type { Marca } from "./reglas";

// Timelines.ai = el puente de WhatsApp (los números siguen conectados allá). Cada marca con su
// token: TIMELINES_TOKEN_LU / TIMELINES_TOKEN_AIB (Timelines → Integrations → Public API).
// API: https://timelines.ai/docs · 50 req/min · webhooks sin firma → secreto en la URL.
const BASE = "https://app.timelines.ai/integrations/api";

export const tokenTimelines = (m: Marca) => (m === "level_up" ? process.env.TIMELINES_TOKEN_LU : process.env.TIMELINES_TOKEN_AIB) ?? "";
export const timelinesListo = (m: Marca) => Boolean(tokenTimelines(m));

async function llamar<T>(m: Marca, metodo: "GET" | "POST", ruta: string, body?: unknown): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const token = tokenTimelines(m);
  if (!token) return { ok: false, status: 0, error: "Falta el token de Timelines de esta marca" };
  try {
    const r = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    const txt = await r.text();
    let data: unknown;
    try {
      data = JSON.parse(txt);
    } catch {
      data = txt;
    }
    if (!r.ok) {
      const msg = typeof data === "object" && data ? String((data as Record<string, unknown>).message ?? (data as Record<string, unknown>).error ?? txt) : txt;
      return { ok: false, status: r.status, error: msg.slice(0, 300) };
    }
    return { ok: true, status: r.status, data: data as T };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Manda un WhatsApp: por el chat existente si lo hay, si no al teléfono desde el número de la empresa. */
export async function enviarWhatsapp(m: Marca, v: { chatId?: string | null; telefono?: string | null; cuenta?: string | null; texto: string }): Promise<{ ok: boolean; mensajeId: string | null; error?: string }> {
  const texto = v.texto.trim().slice(0, 4000);
  if (!texto) return { ok: false, mensajeId: null, error: "Mensaje vacío" };
  const r = v.chatId
    ? await llamar<Record<string, unknown>>(m, "POST", `/chats/${encodeURIComponent(v.chatId)}/messages`, { text: texto })
    : await llamar<Record<string, unknown>>(m, "POST", "/messages", {
        phone: `+${v.telefono}`,
        text: texto,
        ...(v.cuenta ? { whatsapp_account_id: `${v.cuenta}@s.whatsapp.net` } : {}),
      });
  if (!r.ok) return { ok: false, mensajeId: null, error: r.error };
  const d = (r.data ?? {}) as Record<string, unknown>;
  const inner = (d.data ?? d) as Record<string, unknown>;
  return { ok: true, mensajeId: String(inner.message_uid ?? inner.uid ?? "") || null };
}

export async function cuentasTimelines(m: Marca) {
  return llamar<unknown>(m, "GET", "/whatsapp_accounts");
}

export async function webhooksTimelines(m: Marca) {
  return llamar<unknown>(m, "GET", "/webhooks");
}

export async function crearWebhookTimelines(m: Marca, url: string, evento: string) {
  return llamar<unknown>(m, "POST", "/webhooks", { event_type: evento, url, enabled: true });
}

/** Datos del chat (teléfono/nombre) cuando el aviso no los trae. */
export async function chatTimelines(m: Marca, chatId: string) {
  return llamar<Record<string, unknown>>(m, "GET", `/chats/${encodeURIComponent(chatId)}`);
}
