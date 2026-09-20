/**
 * Instagram DM y Facebook Messenger (Meta Graph API, producto "Messenger" de la misma app).
 * Docs: https://developers.facebook.com/docs/messenger-platform/instagram
 */
import { config } from "../config.js";
import { clasificarMime, type Adjunto } from "../integraciones/media.js";
import type { Canal } from "../almacen.js";

const GRAPH = "https://graph.facebook.com/v21.0";

export async function enviarTexto(psid: string, texto: string) {
  if (!config.tiene.meta()) { console.log(`[Meta simulado → ${psid}] ${texto}`); return; }
  const r = await fetch(`${GRAPH}/me/messages?access_token=${config.meta.pageToken}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: psid }, messaging_type: "RESPONSE", message: { text: texto } }),
  });
  if (!r.ok) console.error("Meta enviar", r.status, await r.text());
}

export async function descargarAdjunto(url: string): Promise<Adjunto | null> {
  const r = await fetch(url);
  if (!r.ok) return null;
  const mime = (r.headers.get("content-type") ?? "application/octet-stream").split(";")[0];
  return { tipo: clasificarMime(mime), mime, datos: Buffer.from(await r.arrayBuffer()) };
}

export interface MensajeMeta { canal: Canal; de: string; id: string; texto?: string; adjuntosUrl: string[] }
export function parsearWebhook(body: any): MensajeMeta[] {
  const salida: MensajeMeta[] = [];
  const canal: Canal = body?.object === "instagram" ? "instagram" : "messenger";
  for (const entry of body?.entry ?? []) for (const ev of entry.messaging ?? []) {
    if (!ev.message || ev.message.is_echo) continue;
    const msg: MensajeMeta = { canal, de: ev.sender.id, id: ev.message.mid, texto: ev.message.text, adjuntosUrl: [] };
    for (const a of ev.message.attachments ?? []) if (a.payload?.url) msg.adjuntosUrl.push(a.payload.url);
    salida.push(msg);
  }
  return salida;
}
