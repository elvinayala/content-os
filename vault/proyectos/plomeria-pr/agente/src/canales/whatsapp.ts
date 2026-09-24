/**
 * Facade del canal WhatsApp. Elige el proveedor por WA_PROVEEDOR:
 *  - zernio (default si hay ZERNIO_API_KEY): canales/zernio.ts
 *  - meta: canales/whatsapp-meta.ts (Cloud API directa)
 * Todo el resto del agente (herramientas, despacho, encuestas, cotizador) importa de aquí.
 */
import { config } from "../config.js";
import * as meta from "./whatsapp-meta.js";
import * as zernio from "./zernio.js";

export type { MensajeWA } from "./whatsapp-meta.js";
export const proveedor = () => config.wa.proveedor;

/** `respuesta: true` solo cuando se contesta algo que esa persona acaba de escribir (ver canales/salud-wa.ts). */
export const enviarTexto = (a: string, texto: string, op: { respuesta?: boolean } = {}) => (proveedor() === "zernio" ? zernio.enviarTexto(a, texto, op) : meta.enviarTexto(a, texto));
export const avisarCoordinador = (texto: string) => (proveedor() === "zernio" ? zernio.avisarCoordinador(texto) : meta.avisarCoordinador(texto));
/** `ref` = mediaId (Meta) o URL autenticada (Zernio); cada proveedor sabe qué le llega. */
export const descargarMedia = (ref: string) => (proveedor() === "zernio" ? zernio.descargarMedia(ref) : meta.descargarMedia(ref));
