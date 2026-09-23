/**
 * WhatsApp vía Zernio (envoltorio de la Cloud API de Meta): el número se conecta desde su
 * dashboard sin crear app en Meta, y trae un inbox web para que un humano tome el chat.
 * Docs: https://docs.zernio.com/platforms/whatsapp · /webhooks/inbox
 *
 * Zernio habla por conversación (conversationId), no por número, así que guardamos el mapa
 * teléfono → conversación en data/estado/zernio.json para poder escribirle a alguien después
 * (recordatorios, ofertas a plomeros, avisos).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { RAIZ } from "../almacen.js";
import { clasificarMime, type Adjunto } from "../integraciones/media.js";
import type { MensajeWA } from "./whatsapp-meta.js";

const ARCHIVO = path.join(RAIZ, "data", "estado", "zernio.json");
interface Estado { conversaciones: Record<string, string> } // teléfono (sin +) → conversationId
function leerEstado(): Estado { try { return JSON.parse(fs.readFileSync(ARCHIVO, "utf8")); } catch { return { conversaciones: {} }; } }
function guardarEstado(e: Estado) { fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true }); fs.writeFileSync(ARCHIVO + ".tmp", JSON.stringify(e, null, 2)); fs.renameSync(ARCHIVO + ".tmp", ARCHIVO); }

const normalizar = (tel: string) => tel.replace(/[^0-9]/g, "");
export function conversacionDe(telefono: string): string | undefined { return leerEstado().conversaciones[normalizar(telefono)]; }
export function recordarConversacion(telefono: string, conversationId: string) {
  const e = leerEstado();
  if (e.conversaciones[normalizar(telefono)] === conversationId) return;
  e.conversaciones[normalizar(telefono)] = conversationId;
  guardarEstado(e);
}

async function api(ruta: string, init: RequestInit = {}) {
  return fetch(`${config.zernio.base}${ruta}`, {
    ...init,
    headers: { Authorization: `Bearer ${config.zernio.apiKey}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

export function firmaValida(rawBody: Buffer, firma?: string | string[]): boolean {
  if (!config.zernio.webhookSecret) return true; // sin secreto no validamos (solo en desarrollo)
  const f = Array.isArray(firma) ? firma[0] : firma;
  if (!f) return false;
  const esperada = crypto.createHmac("sha256", config.zernio.webhookSecret).update(rawBody).digest("hex");
  const a = Buffer.from(esperada), b = Buffer.from(f.trim().toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Envía texto a un teléfono. Si ya hay conversación (el cliente nos escribió), responde en ella;
 *  si no, intenta abrirla con Meta Direct Send (utility). Fuera de la ventana de 24 h Meta puede
 *  rechazarlo: en ese caso hace falta una plantilla aprobada (ver docs/templates). */
export async function enviarTexto(a: string, texto: string) {
  if (!config.tiene.whatsapp()) { console.log(`[WA simulado → ${a}] ${texto}`); return; }
  const tel = normalizar(a);
  const conv = conversacionDe(tel);
  const r = conv
    ? await api(`/inbox/conversations/${encodeURIComponent(conv)}/messages`, { method: "POST", body: JSON.stringify({ accountId: config.zernio.accountId, message: texto }) })
    : await api(`/inbox/conversations`, { method: "POST", body: JSON.stringify({ accountId: config.zernio.accountId, participantId: tel, message: texto, category: "utility" }) });
  if (!r.ok) { console.error("Zernio enviar", r.status, await r.text()); return; }
  if (!conv) {
    const j = (await r.json().catch(() => null)) as { data?: { conversationId?: string } } | null;
    if (j?.data?.conversationId) recordarConversacion(tel, j.data.conversationId);
  }
}

export async function marcarLeido(conversationId: string) {
  if (!config.tiene.whatsapp() || !conversationId) return;
  await api(`/inbox/conversations/${encodeURIComponent(conversationId)}/read`, { method: "POST", body: JSON.stringify({ accountId: config.zernio.accountId }) }).catch(() => undefined);
}

/** Los adjuntos entrantes llegan como URL a GET /v1/whatsapp/media/{id}; hay que bajarlos ya (Meta los borra pronto). */
export async function descargarMedia(url: string): Promise<Adjunto | null> {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${config.zernio.apiKey}` } });
  if (!r.ok) { console.error("Zernio media", r.status, url); return null; }
  const mime = (r.headers.get("content-type") ?? "application/octet-stream").split(";")[0].trim();
  return { tipo: clasificarMime(mime), mime, datos: Buffer.from(await r.arrayBuffer()) };
}

/** Meta no deja abrir una conversación con texto libre (DIRECT_SEND_NOT_ELIGIBLE): fuera de la ventana
 *  de 24 h hace falta una plantilla aprobada. `aviso_equipo_resuelto` (UTILITY, es) tiene 3 variables:
 *  titular · quién · detalle. Meta rechaza parámetros vacíos o con saltos de línea, así que se aplanan. */
const PLANTILLA_AVISO = process.env.ZERNIO_PLANTILLA_AVISO || "aviso_equipo_resuelto";
export function partesDeAviso(texto: string): [string, string, string] {
  const limpio = (v: string) => v.replace(/\s+/g, " ").trim().slice(0, 300);
  const lineas = String(texto ?? "").split("\n").map(limpio).filter(Boolean);
  const primera = lineas[0] ?? "Aviso";
  const corte = primera.indexOf(":");
  const titular = corte > 0 ? limpio(primera.slice(0, corte)) : primera;
  const quien = corte > 0 ? limpio(primera.slice(corte + 1)) : "—";
  const detalle = limpio(lineas.slice(1).join(" · "));
  return [titular || "Aviso", quien || "—", detalle || "—"];
}

/** Abre una conversación con la plantilla aprobada. Devuelve true si Meta la aceptó. */
export async function enviarPlantillaAviso(telefono: string, texto: string): Promise<boolean> {
  const tel = normalizar(telefono);
  const r = await api(`/inbox/conversations`, { method: "POST", body: JSON.stringify({ accountId: config.zernio.accountId, participantId: tel, templateName: PLANTILLA_AVISO, templateLanguage: "es", templateParams: partesDeAviso(texto) }) });
  if (!r.ok) { console.error("Zernio plantilla", r.status, (await r.text()).slice(0, 200)); return false; }
  const j = (await r.json().catch(() => null)) as { data?: { conversationId?: string } } | null;
  if (j?.data?.conversationId) recordarConversacion(tel, j.data.conversationId);
  return true;
}

/** Aviso al humano: Telegram si está configurado (llega siempre), y WhatsApp al coordinador si hay número. */
export async function avisarCoordinador(texto: string) {
  const { botToken, coordinadorChatId } = config.telegram;
  let avisado = false;
  if (botToken && coordinadorChatId) {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: coordinadorChatId, text: `Resuelto · ${texto}` }) }).catch(() => null);
    avisado = !!r?.ok;
    if (!avisado) console.error("Telegram aviso", r?.status);
  }
  if (config.coordinadorWhatsapp && config.tiene.whatsapp()) {
    // Si ya hay conversación abierta con el coordinador, texto libre; si no, la plantilla aprobada.
    if (conversacionDe(config.coordinadorWhatsapp)) { await enviarTexto(config.coordinadorWhatsapp, texto); avisado = true; }
    else if (await enviarPlantillaAviso(config.coordinadorWhatsapp, texto)) avisado = true;
  }
  if (!avisado) console.log(`[Aviso al coordinador] ${texto}`);
}

export interface MensajeZernio extends MensajeWA { conversationId: string; standby: boolean }

/** Mensajes entrantes de un evento `message.received`. */
export function parsearWebhook(body: any): MensajeZernio[] {
  if (body?.event !== "message.received" || body?.message?.direction !== "incoming") return [];
  if (config.zernio.accountId && body.account?.accountId && body.account.accountId !== config.zernio.accountId) return [];
  const m = body.message;
  const de = normalizar(m.sender?.phoneNumber ?? m.sender?.id ?? "");
  if (!de) return [];
  const meta = body.metadata ?? {};
  const msg: MensajeZernio = { de, nombre: m.sender?.name, id: m.platformMessageId ?? m.id, mediaIds: [], texto: m.text ?? undefined, conversationId: m.conversationId, standby: !!meta.standby };
  for (const a of m.attachments ?? []) if (a?.url) msg.mediaIds.push(a.url);
  if (meta.location?.latitude) msg.ubicacion = { lat: meta.location.latitude, lng: meta.location.longitude, direccion: meta.location.address ?? meta.location.name };
  return [msg];
}

/** `message.sent` escrito por una persona (inbox de Zernio o la app de WhatsApp Business en modo coexistencia). */
// Los webhooks de Zernio son POR EQUIPO: aquí también llegan los eventos del WhatsApp de Bori
// (misma cuenta de Zernio). Sin filtrar por cuenta, Lis contestando en Bori callaría a Resuelto.
export function tomaHumana(body: any): { telefono: string; conversationId: string } | null {
  if (body?.event !== "message.sent") return null;
  if (config.zernio.accountId && body.account?.accountId && body.account.accountId !== config.zernio.accountId) return null;
  const m = body.message ?? {};
  const humano = m.sentVia === "human" || m.source === "whatsapp_business_app";
  if (!humano) return null;
  const tel = normalizar(body.conversation?.participantId ?? "");
  return tel ? { telefono: tel, conversationId: m.conversationId } : null;
}
