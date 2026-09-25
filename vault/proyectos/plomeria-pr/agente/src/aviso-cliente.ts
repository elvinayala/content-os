/**
 * Le escribe al CLIENTE por el mismo canal por donde llegó (25/sep/2026). Con el WhatsApp del negocio bloqueado,
 * los clientes llegan por Messenger/Instagram, y la confirmación de la cita, el "va en camino", el cobro y la
 * garantía salían solo por WhatsApp: no les llegaba nada. Messenger/IG usan la conversación guardada en el
 * contacto (Meta solo deja escribir dentro de las 24 h del último mensaje del cliente).
 */
import { almacen } from "./almacen.js";
import { avisarAlTelefono } from "./canales/telefono.js";
import { enviarDM } from "./canales/zernio.js";
import { archivar, leerHistorial } from "./historial.js";

export async function avisarCliente(d: { contactoId?: string; telefono?: string }, texto: string): Promise<boolean> {
  const c = d.contactoId ? almacen.contacto(d.contactoId) : undefined;
  try {
    // Messenger/IG solo deja escribir dentro de las 24 h del último mensaje del cliente; pasado eso, al teléfono.
    const ultimoDelCliente = c ? new Date(leerHistorial(c.id, 80).filter((e) => e.autor === "cliente").at(-1)?.fecha ?? 0).getTime() : 0;
    const tel = d.telefono || c?.telefono;
    if (c && (c.canal === "messenger" || c.canal === "instagram") && c.dm && Date.now() - ultimoDelCliente < 23 * 3600_000) await enviarDM(c.dm.conversationId, c.dm.accountId, texto);
    else if (tel) { if (!(await avisarAlTelefono(String(tel), texto, { contacto: c }))) return false; }
    else return false;
    if (c) archivar(c.id, "resuelto", texto);
    return true;
  } catch (e) { console.error("aviso al cliente", d.contactoId, e); return false; }
}
