/**
 * Cierre humano (Elvin, 25/sep/2026): por Messenger/IG el agente vende y saca el teléfono en los primeros mensajes;
 * si el cliente dio su número y a los 20 minutos no agendó, una persona del equipo lo llama y cierra a mano.
 * El aviso va por Telegram (nunca por el WhatsApp del negocio). El timer vive en memoria: tras un reinicio no se
 * repite, pero la tarjeta y la nota ya quedaron en GHL.
 */
import { almacen } from "./almacen.js";
import { config } from "./config.js";
import { avisarCoordinador } from "./canales/whatsapp.js";

const MINUTOS = Number(process.env.LLAMAR_CLIENTE_MIN ?? 20);
const telBonito = (t: string) => t.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");

export function programarLlamadaHumana(contactoId: string, resumen: string) {
  setTimeout(() => revisar(contactoId, resumen).catch((e) => console.error("llamar cliente", e)), MINUTOS * 60_000);
}

export async function revisar(contactoId: string, resumen: string) {
  const c = almacen.contacto(contactoId);
  if (!c?.telefono) return;
  const agendo = almacen.trabajos().some((t) => t.contactoId === contactoId && t.estado !== "cancelado") || almacen.proyectos().some((p) => p.contactoId === contactoId);
  if (agendo) return;
  await avisarCoordinador(`📞 Llama para cerrar: ${c.nombre ?? "cliente sin nombre"} · ${telBonito(c.telefono)}${c.municipio ? " · " + c.municipio : ""}\n${resumen}\nEscribió por ${c.canal} hace ${MINUTOS} min, dio su número y no ha agendado.\nConversación: ${config.urlPublica}/portal/clientes/${encodeURIComponent(contactoId)}`);
}
