/**
 * WhatsApp Cloud API (Meta) directa. Recibe webhooks, descarga media, envía texto.
 * Se usa cuando WA_PROVEEDOR=meta; el default es Zernio (canales/zernio.ts). Facade: canales/whatsapp.ts
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
import crypto from "node:crypto";
import { config } from "../config.js";
import { clasificarMime, type Adjunto } from "../integraciones/media.js";

const GRAPH = "https://graph.facebook.com/v21.0";

export function firmaValida(rawBody: Buffer, firma?: string): boolean {
  if (!config.wa.appSecret) return true; // sin secret no validamos (solo en desarrollo)
  if (!firma?.startsWith("sha256=")) return false;
  const esperada = "sha256=" + crypto.createHmac("sha256", config.wa.appSecret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(firma));
}

export async function enviarTexto(a: string, texto: string) {
  if (!config.tiene.whatsapp()) { console.log(`[WA simulado → ${a}] ${texto}`); return; }
  const r = await fetch(`${GRAPH}/${config.wa.phoneNumberId}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${config.wa.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: a, type: "text", text: { body: texto, preview_url: true } }),
  });
  if (!r.ok) console.error("WA enviar", r.status, await r.text());
}

export async function marcarLeido(messageId: string) {
  if (!config.tiene.whatsapp()) return;
  await fetch(`${GRAPH}/${config.wa.phoneNumberId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${config.wa.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }) }).catch(() => undefined);
}

export async function descargarMedia(mediaId: string): Promise<Adjunto | null> {
  const meta = await fetch(`${GRAPH}/${mediaId}`, { headers: { Authorization: `Bearer ${config.wa.token}` } });
  if (!meta.ok) return null;
  const j = (await meta.json()) as { url: string; mime_type: string };
  const bin = await fetch(j.url, { headers: { Authorization: `Bearer ${config.wa.token}` } });
  if (!bin.ok) return null;
  const mime = j.mime_type.split(";")[0];
  return { tipo: clasificarMime(mime), mime, datos: Buffer.from(await bin.arrayBuffer()) };
}

export async function avisarCoordinador(texto: string) {
  if (!config.coordinadorWhatsapp) { console.log(`[Aviso al coordinador] ${texto}`); return; }
  await enviarTexto(config.coordinadorWhatsapp, texto);
}

/** Extrae los mensajes entrantes de un webhook de WhatsApp. */
export interface MensajeWA { de: string; nombre?: string; id: string; texto?: string; mediaIds: string[]; ubicacion?: { lat: number; lng: number; direccion?: string } }
export function parsearWebhook(body: any): MensajeWA[] {
  const salida: MensajeWA[] = [];
  for (const entry of body?.entry ?? []) for (const ch of entry.changes ?? []) {
    const v = ch.value;
    if (!v?.messages) continue;
    const nombre = v.contacts?.[0]?.profile?.name;
    for (const m of v.messages) {
      const msg: MensajeWA = { de: m.from, nombre, id: m.id, mediaIds: [] };
      if (m.type === "text") msg.texto = m.text?.body;
      else if (m.type === "image" || m.type === "audio" || m.type === "document" || m.type === "video" || m.type === "sticker") { msg.mediaIds.push(m[m.type]?.id); msg.texto = m[m.type]?.caption; }
      else if (m.type === "location") msg.ubicacion = { lat: m.location.latitude, lng: m.location.longitude, direccion: m.location.address ?? m.location.name };
      else if (m.type === "interactive") msg.texto = m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title;
      else if (m.type === "button") msg.texto = m.button?.text;
      salida.push(msg);
    }
  }
  return salida;
}
