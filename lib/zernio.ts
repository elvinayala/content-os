import "server-only";

import crypto from "node:crypto";

// WhatsApp por Zernio (envoltorio de la Cloud API oficial de Meta: sin baneos por automatizar). Mismo
// patrón que el canal de Resuelto (vault/proyectos/plomeria-pr/agente/src/canales/zernio.ts), pero sin
// estado en disco (Vercel es efímero): el conversationId lo guarda quien llama.
//
// Una "cuenta" = un número de WhatsApp conectado en Zernio (accountId). La API key es del equipo de
// Zernio; los webhooks también son por equipo, así que SIEMPRE se filtra por accountId (si no, un
// humano contestando en otro número callaría a este agente).
//
// Reglas de Meta: se le puede escribir libre a alguien durante 24 h después de su último mensaje;
// fuera de esa ventana (o si nunca escribió) solo con una PLANTILLA aprobada.

export interface CuentaZernio {
  apiKey: string;
  accountId: string;
  webhookSecret?: string;
}

const BASE = (process.env.ZERNIO_API_BASE || "https://zernio.com/api/v1").replace(/\/$/, "");
const soloDigitos = (tel: string) => String(tel || "").replace(/\D/g, "");

async function api(cuenta: CuentaZernio, ruta: string, init: RequestInit = {}) {
  return fetch(`${BASE}${ruta}`, {
    ...init,
    headers: { Authorization: `Bearer ${cuenta.apiKey}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  });
}

/** Firma HMAC-SHA256 del cuerpo crudo (cabecera `x-zernio-signature`). Sin secreto: solo en desarrollo. */
export function firmaValida(raw: string, firma: string | null, secreto?: string): boolean {
  if (!secreto) return process.env.NODE_ENV !== "production";
  if (!firma) return false;
  const esperada = crypto.createHmac("sha256", secreto).update(raw).digest("hex");
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma.trim().toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Texto libre dentro de una conversación abierta (ventana de 24 h). */
export async function enviarTexto(cuenta: CuentaZernio, conversationId: string, texto: string): Promise<boolean> {
  const r = await api(cuenta, `/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ accountId: cuenta.accountId, message: texto }),
  });
  if (!r.ok) console.error("[zernio] enviar", r.status, (await r.text()).slice(0, 200));
  return r.ok;
}

/** Abre (o retoma) una conversación con una plantilla aprobada. Devuelve el conversationId o null. */
export async function enviarPlantilla(
  cuenta: CuentaZernio,
  telefono: string,
  plantilla: string,
  params: string[],
  idioma = "es",
): Promise<string | null> {
  // Meta rechaza parámetros vacíos o con saltos de línea.
  const limpios = params.map((p) => String(p ?? "").replace(/\s+/g, " ").trim().slice(0, 300) || "—");
  const r = await api(cuenta, "/inbox/conversations", {
    method: "POST",
    body: JSON.stringify({ accountId: cuenta.accountId, participantId: soloDigitos(telefono), templateName: plantilla, templateLanguage: idioma, templateParams: limpios }),
  });
  if (!r.ok) {
    console.error("[zernio] plantilla", plantilla, r.status, (await r.text()).slice(0, 200));
    return null;
  }
  const j = (await r.json().catch(() => null)) as { data?: { conversationId?: string } } | null;
  return j?.data?.conversationId ?? "";
}

export interface EntranteZernio {
  telefono: string;
  nombre?: string;
  texto: string;
  conversationId: string;
  adjuntos: number;
}

/** Mensaje entrante (`message.received`, dirección incoming) de ESTA cuenta; null si es otra cosa. */
export function parsearEntrante(body: unknown, accountId: string): EntranteZernio | null {
  const b = body as {
    event?: string;
    account?: { accountId?: string };
    message?: { direction?: string; text?: string; conversationId?: string; attachments?: unknown[]; sender?: { phoneNumber?: string; id?: string; name?: string } };
  };
  if (b?.event !== "message.received" || b.message?.direction !== "incoming") return null;
  if (accountId && b.account?.accountId && b.account.accountId !== accountId) return null;
  const m = b.message;
  const telefono = soloDigitos(m.sender?.phoneNumber ?? m.sender?.id ?? "");
  if (!telefono || !m.conversationId) return null;
  return { telefono, nombre: m.sender?.name, texto: String(m.text ?? "").trim(), conversationId: m.conversationId, adjuntos: (m.attachments ?? []).length };
}

/** Mensaje enviado por una PERSONA desde el inbox de Zernio (toma humana) en esta cuenta. */
export function tomaHumana(body: unknown, accountId: string): { telefono: string; conversationId: string } | null {
  const b = body as {
    event?: string;
    account?: { accountId?: string };
    message?: { sentVia?: string; source?: string; conversationId?: string };
    conversation?: { participantId?: string };
  };
  if (b?.event !== "message.sent") return null;
  if (accountId && b.account?.accountId && b.account.accountId !== accountId) return null;
  const m = b.message ?? {};
  if (m.sentVia !== "human" && m.source !== "whatsapp_business_app") return null;
  const telefono = soloDigitos(b.conversation?.participantId ?? "");
  return telefono && m.conversationId ? { telefono, conversationId: m.conversationId } : null;
}
