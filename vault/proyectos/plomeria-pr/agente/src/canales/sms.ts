/**
 * SMS desde el número de Resuelto en Zernio (+1 787-956-1111; 25/sep/2026, con WhatsApp desactivado por Meta).
 * Sirve para lo que Messenger no deja (pasadas 24 h del último mensaje del cliente) y para los plomeros:
 * confirmación de cita, "va en camino", cobro, garantía, ofertas de trabajo y un seguimiento.
 * Reglas: solo a quien nos dio su número; el primer texto a cada persona lleva cómo darse de baja; quien responde
 * STOP/BAJA no recibe más; nunca a números internos (así se cayó el WhatsApp: avisos internos al número del negocio).
 * API: POST /v1/sms/messages { from, to, text }.
 */
import { config } from "../config.js";
import { almacen, type Contacto } from "../almacen.js";

export const smsActivo = () => !!(config.zernio.apiKey && config.sms.numero);
export function e164(t: string): string | null {
  const d = String(t ?? "").replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d.startsWith("1")) return "+" + d;
  return null;
}
// SETTER_TELEFONO: el celular al que se desvían las llamadas (26/sep/2026); es del equipo, nunca recibe textos del negocio.
const internos = () => [config.coordinadorWhatsapp, config.sms.numero, config.wa.numeroPublico, ...String(process.env.SETTER_TELEFONO ?? "").split(",")].map((x) => e164(String(x ?? ""))).filter(Boolean);
export const BAJA = /^\s*(stop|baja|parar|cancelar|unsubscribe|no mas|no más)\s*[.!]*\s*$/i;
const PIE = "\n\nResuelto · responde STOP si no quieres recibir textos.";

/** Contacto que ya tiene ese teléfono (el de Messenger/IG que lo dio, para seguir con su historial). */
export function contactoPorTelefono(tel: string): Contacto | undefined {
  const d = String(tel).replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return almacen.contactos().filter((c) => String(c.telefono ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "") === d).sort((a, b) => (b.actualizado ?? "").localeCompare(a.actualizado ?? ""))[0];
}

export async function enviarSMS(tel: string, texto: string, op: { contacto?: Contacto } = {}): Promise<boolean> {
  const to = e164(tel);
  if (!to) return false;
  if (internos().includes(to)) { console.warn("SMS a un número interno: no se envía", to); return false; }
  const c = op.contacto ?? contactoPorTelefono(to);
  if (c?.smsBaja) return false;
  const cuerpo = (texto + (c?.smsEnviados ? "" : PIE)).slice(0, 640);
  if (!smsActivo()) { console.log(`[SMS simulado → ${to}] ${cuerpo}`); return false; }
  const r = await fetch(`${config.zernio.base}/sms/messages`, { method: "POST", headers: { Authorization: `Bearer ${config.zernio.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: config.sms.numero, to, text: cuerpo }) });
  if (!r.ok) { console.error("SMS", r.status, (await r.text()).slice(0, 300)); return false; }
  if (c) almacen.guardarContacto({ ...(almacen.contacto(c.id) ?? c), smsEnviados: (c.smsEnviados ?? 0) + 1 });
  return true;
}

/** SMS entrante (evento message.received de Zernio con plataforma SMS). El formato exacto no está documentado:
 *  se aceptan los campos más probables y se registra el crudo las primeras veces para ajustarlo. */
export function parsearSMS(body: any): { de: string; texto: string; id: string } | null {
  if (body?.event !== "message.received") return null;
  const m = body.message ?? {};
  const plataforma = String(m.platform ?? body.account?.platform ?? body.platform ?? "").toLowerCase();
  if (plataforma !== "sms" && plataforma !== "mms") return null;
  if (m.direction && m.direction !== "incoming") return null;
  const de = e164(m.sender?.phoneNumber ?? m.from ?? m.sender?.id ?? "");
  if (!de) return null;
  return { de, texto: String(m.text ?? m.message ?? m.body ?? ""), id: String(m.id ?? m.platformMessageId ?? body.id ?? "") };
}
