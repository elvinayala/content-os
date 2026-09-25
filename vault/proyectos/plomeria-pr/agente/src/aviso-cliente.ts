/**
 * Le escribe al CLIENTE por el mismo canal por donde llegó (25/sep/2026). Con el WhatsApp del negocio bloqueado,
 * los clientes llegan por Messenger/Instagram, y la confirmación de la cita, el "va en camino", el cobro y la
 * garantía salían solo por WhatsApp: no les llegaba nada. Messenger/IG usan la conversación guardada en el
 * contacto (Meta solo deja escribir dentro de las 24 h del último mensaje del cliente).
 */
import { almacen } from "./almacen.js";
import * as wa from "./canales/whatsapp.js";
import { enviarDM } from "./canales/zernio.js";
import { archivar } from "./historial.js";

export async function avisarCliente(d: { contactoId?: string; telefono?: string }, texto: string): Promise<boolean> {
  const c = d.contactoId ? almacen.contacto(d.contactoId) : undefined;
  try {
    if (c && (c.canal === "messenger" || c.canal === "instagram") && c.dm) await enviarDM(c.dm.conversationId, c.dm.accountId, texto);
    else if (d.telefono || c?.telefono) await wa.enviarTexto(String(d.telefono || c?.telefono), texto);
    else return false;
    if (c) archivar(c.id, "resuelto", texto);
    return true;
  } catch (e) { console.error("aviso al cliente", d.contactoId, e); return false; }
}
