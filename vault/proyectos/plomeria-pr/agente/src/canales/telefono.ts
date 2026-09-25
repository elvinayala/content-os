/**
 * A un número de teléfono (plomero o cliente que dio su número): por WhatsApp mientras la cuenta esté sana; si Meta
 * la tiene caída (salud-wa.ts), por SMS desde el número de Resuelto (sms.ts). 25/sep/2026.
 */
import * as wa from "./whatsapp.js";
import { leer as saludWa } from "./salud-wa.js";
import { enviarSMS } from "./sms.js";
import type { Contacto } from "../almacen.js";

export const whatsappSano = () => saludWa().ultimo?.ok !== false;
export async function avisarAlTelefono(tel: string, texto: string, op: { contacto?: Contacto } = {}): Promise<boolean> {
  if (whatsappSano()) { await wa.enviarTexto(tel, texto); return true; }
  return enviarSMS(tel, texto.replace(/\*/g, ""), op); // el SMS no tiene negritas
}
