/**
 * El plomero habla con el cliente SIN su número personal (26/sep/2026, Elvin: "¿cómo se comunica Edgar con los
 * clientes si no puede usar su teléfono personal?"). Desde la app:
 *  - "Llamar por Resuelto": Zernio llama al celular del plomero; cuando contesta oye "te conecto con…" y se une el
 *    cliente, que ve el 787-956-1111. Ninguno de los dos ve el número del otro.
 *  - "Escribirle": el mensaje sale de Resuelto (Messenger/IG si el cliente escribió hace < 23 h; si no, texto del
 *    787-956-1111) firmado "Edgar, tu plomero de Resuelto". Si el cliente contesta, lo atiende el agente en esa misma
 *    conversación y lo que sea para el plomero se le pasa por la nota del trabajo.
 * El contrato ya lo dice: el plomero no da números personales ni atiende clientes por fuera de Resuelto.
 */
import { config } from "./config.js";
import { almacen, type Trabajo } from "./almacen.js";
import type { Proveedor } from "./proveedores.js";
import { archivar } from "./historial.js";
import { e164 } from "./canales/sms.js";
import { avisarCliente } from "./aviso-cliente.js";

const ultimaLlamada = new Map<string, number>();
const mensajesHoy = new Map<string, { dia: string; n: number }>();

export async function llamarAlCliente(t: Trabajo, p: Proveedor): Promise<{ ok: boolean; motivo?: string; mensaje?: string }> {
  const plomero = e164(p.whatsapp), cliente = e164(t.telefono ?? "");
  if (!plomero || !cliente) return { ok: false, motivo: "Falta el teléfono del cliente o el tuyo. Avísale a Resuelto." };
  if (!config.zernio.apiKey || !config.sms.numero) return { ok: false, motivo: "Las llamadas por Resuelto no están activas todavía." };
  const k = t.id + p.id; if (Date.now() - (ultimaLlamada.get(k) ?? 0) < 90_000) return { ok: false, motivo: "Ya te estamos llamando. Espera un minuto." };
  ultimaLlamada.set(k, Date.now());
  const r = await fetch(`${config.zernio.base}/voice/calls`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.zernio.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `llamar-${k}-${Math.floor(Date.now() / 60_000)}` },
    body: JSON.stringify({ to: plomero, fromNumber: config.sms.numero, forwardTo: `tel:${cliente}`, greeting: `Resuelto. Te conecto con ${t.nombre.split(" ")[0]}, del trabajo en ${t.municipio}.`, recordOverride: false, transcriptionLanguage: "es" }),
  }).catch(() => null);
  if (!r?.ok) { console.error("llamar al cliente", r?.status, r ? (await r.text()).slice(0, 300) : ""); return { ok: false, motivo: "No se pudo conectar la llamada. Intenta otra vez en un minuto." }; }
  archivar(t.contactoId, "plomero", `[${p.nombre} llamó al cliente por Resuelto]`, t.id);
  return { ok: true, mensaje: "📞 Te estamos llamando. Contesta y te conectamos con el cliente (le sale el número de Resuelto)." };
}

export async function escribirAlCliente(t: Trabajo, p: Proveedor, texto: string): Promise<{ ok: boolean; motivo?: string }> {
  const limpio = String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, 400);
  if (limpio.length < 2) return { ok: false, motivo: "Escribe el mensaje." };
  // No se cuelan números ni redes personales (el contrato lo prohíbe).
  if (/\b\d{3}[-. )]*\d{3}[-. ]*\d{4}\b|wa\.me|whatsapp|@\w{3,}/i.test(limpio)) return { ok: false, motivo: "Por aquí no se mandan números personales ni redes. Si hace falta hablar, usa \"Llamar por Resuelto\"." };
  const dia = new Date().toISOString().slice(0, 10), m = mensajesHoy.get(t.id);
  const n = m?.dia === dia ? m.n : 0; if (n >= 10) return { ok: false, motivo: "Llegaste al máximo de mensajes de hoy para este cliente." };
  mensajesHoy.set(t.id, { dia, n: n + 1 });
  const firmado = `${p.nombre.split(" ")[0]}, tu plomero de Resuelto: ${limpio}`;
  await avisarCliente(t, firmado);
  archivar(t.contactoId, "plomero", firmado, t.id);
  // Que el agente sepa de dónde viene si el cliente contesta.
  const conv = almacen.conversacion(t.contactoId);
  conv.mensajes.push({ role: "user", content: [{ type: "text", text: `[Contexto interno] El plomero ${p.nombre} le escribió al cliente por Resuelto sobre ${t.id}. Si el cliente contesta algo para el plomero, dile que se lo pasas y usa la nota del trabajo.` }] } as any, { role: "assistant", content: [{ type: "text", text: firmado }] } as any);
  almacen.guardarConversacion(conv);
  return { ok: true };
}
