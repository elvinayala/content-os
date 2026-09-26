/**
 * Llamadas al 787-956-1111 (26/sep/2026, Elvin: "¿quién va a responder a ese número?"). El número vive en Zernio
 * (no hay un teléfono físico): en horario, Zernio desvía la llamada al celular de quien cierra (forwardTo); fuera de
 * horario o si nadie contesta, cae en la contestadora, que la transcribe. Aquí llega el evento call.ended:
 *  - contestada → queda en el historial del cliente;
 *  - perdida o mensaje de voz → al que llamó le sale UN texto ("te devolvemos la llamada" + enlace de reserva) y al
 *    equipo le llega un aviso por Telegram con el número y lo que dijo, para devolver la llamada.
 * La respuesta por texto la atiende el agente en el mismo hilo de SMS. Nunca se le escribe a un número interno.
 */
import { config } from "../config.js";
import { almacen } from "../almacen.js";
import { archivar } from "../historial.js";
import { avisarVentas, linkCliente, esReclutamiento } from "../ventas.js";
import { dmSlack } from "../integraciones/slack.js";
import { e164, enviarSMS, contactoPorTelefono } from "./sms.js";

type Llamada = { id: string; direction?: string; from?: string; to?: string; durationSeconds?: number; endReason?: string; isVoicemail?: boolean };

/** ¿Qué pasó con la llamada? Pura (tests/llamadas.test.mjs). Solo entrantes al número de Resuelto. */
export function clasificarLlamada(c: Llamada, numeroResuelto: string | undefined): "perdida" | "contestada" | null {
  if (c.direction !== "inbound" || !c.from || !numeroResuelto || e164(c.to ?? "") !== e164(numeroResuelto)) return null;
  if (c.isVoicemail || c.endReason === "no_answer" || c.endReason === "rejected" || c.endReason === "error") return "perdida";
  return (c.durationSeconds ?? 0) >= 15 ? "contestada" : "perdida"; // colgó antes de hablar con nadie
}

const telBonito = (t: string) => t.replace(/^\+1/, "").replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");
const ultimoTexto = new Map<string, number>(); // un solo texto automático por número cada 12 h

async function transcripcion(id: string): Promise<string> {
  // La contestadora transcribe unos segundos después de colgar.
  await new Promise((r) => setTimeout(r, 45_000));
  try {
    const r = await fetch(`${config.zernio.base}/calls/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${config.zernio.apiKey}` } });
    if (!r.ok) return "";
    const call = (await r.json())?.call ?? {};
    return (Array.isArray(call.transcript) ? call.transcript.map((s: any) => s.text).join(" ") : call.lastTranscriptSnippet ?? "").trim().slice(0, 700);
  } catch { return ""; }
}

export async function atenderLlamada(body: any) {
  const c: Llamada = body?.call ?? {};
  const tipo = clasificarLlamada(c, config.sms.numero);
  if (!tipo) return;
  const de = e164(c.from!)!;
  const contacto = contactoPorTelefono(de) ?? almacen.obtenerOCrearContacto("sms", de);
  if (!contacto.telefono) almacen.guardarContacto({ ...contacto, telefono: de.replace(/^\+1/, "") });
  const minutos = Math.round((c.durationSeconds ?? 0) / 6) / 10;

  if (tipo === "contestada") { archivar(contacto.id, "cliente", `[Llamada contestada] ${minutos} min`); return console.log("llamada contestada", de); }

  const voz = c.isVoicemail ? await transcripcion(c.id) : "";
  archivar(contacto.id, "cliente", `[Llamada perdida]${voz ? " Mensaje de voz: " + voz : " Sin mensaje."}`);
  const conocido = almacen.contacto(contacto.id) ?? contacto;
  // Reclutamiento es 100 % de Yaileen (Elvin, 26/sep): un plomero o candidato que llama no le llega a la setter.
  const recluta = esReclutamiento(conocido);

  let texto = false;
  if (Date.now() - (ultimoTexto.get(de) ?? 0) > 12 * 3600_000) {
    ultimoTexto.set(de, Date.now());
    const hola = `Hola${conocido.nombre ? " " + conocido.nombre.split(" ")[0] : ""}, es Resuelto PR. Vimos tu llamada y te la devolvemos en breve.`;
    const msg = recluta ? hola : `${hola} Si quieres adelantar, cuéntanos aquí qué te pasó y mándanos una foto del área. O reserva tú mismo: ${config.urlPublica}/reservar?o=llamada`;
    texto = await enviarSMS(de, msg, { contacto: conocido });
    if (texto) {
      archivar(contacto.id, "resuelto", msg, "llamada-perdida-sms");
      const conv = almacen.conversacion(contacto.id); // que el agente sepa de dónde viene si contesta el texto
      conv.mensajes.push({ role: "user", content: [{ type: "text", text: "[Contexto interno] Esta persona llamó al 787-956-1111 y nadie contestó. Le mandamos este texto." }] } as any, { role: "assistant", content: [{ type: "text", text: msg }] } as any);
      almacen.guardarConversacion(conv);
    }
  }
  if (recluta) { await dmSlack(config.slack.reclutamiento, `📞 Llamada perdida de ${conocido.nombre ?? "un candidato"} · ${telBonito(de)} al 787-956-1111 (reclutamiento).${voz ? " Dejó mensaje: \"" + voz + "\"" : ""} Devuélvele la llamada.`); return; }
  await avisarVentas(`📞 Llamada perdida: ${conocido.nombre ?? "sin nombre"} · ${telBonito(de)}${conocido.municipio ? " · " + conocido.municipio : ""}\n${voz ? "Dejó mensaje: \"" + voz + "\"" : "No dejó mensaje."}\n${texto ? "Ya le salió un texto automático. " : ""}Devuélvele la llamada.\nConversación: ${linkCliente(contacto.id)}`);
}
