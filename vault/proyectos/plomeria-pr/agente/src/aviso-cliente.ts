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

/**
 * Aure (22/oct/2026): "luego de que se confirma la fecha, la IA no debe escribirle más nada a ese chat; ahí se encarga
 * el plomero, Yaileen y Heileen" — los clientes se confundían. Los avisos automáticos después de agendar (confirmando
 * plomero, cita confirmada, va en camino, garantía) y el link de pago (el cobro lo mandan a mano según el diagnóstico)
 * ya NO salen al cliente: quedan en el historial como nota. AVISOS_CLIENTE=on los vuelve a prender.
 */
export async function avisoAutomatico(d: { contactoId?: string; telefono?: string }, texto: string): Promise<boolean> {
  if (process.env.AVISOS_CLIENTE === "on") return avisarCliente(d, texto);
  if (d.contactoId) archivar(d.contactoId, "sistema", `[No enviado al cliente: lo atiende el equipo] ${texto}`);
  return false;
}

/** Estados en que el chat del cliente es del equipo (agendado → cobrado). Pasado el cobro, el agente vuelve a atender. */
const ACTIVO = new Set(["agendado", "en-camino", "en-sitio", "completado"]);
const DIAS_ACTIVO = 30;

/** Trabajo activo de este contacto (o undefined). Pura sobre la lista: testeable. */
export function trabajoActivoDe<T extends { contactoId: string; estado: string; creado: string; inicio?: string }>(trabajos: T[], contactoId: string, ahora = Date.now()): T | undefined {
  const limite = ahora - DIAS_ACTIVO * 86_400_000;
  return trabajos.filter((t) => t.contactoId === contactoId && ACTIVO.has(t.estado) && Math.max(Date.parse(t.creado) || 0, Date.parse(t.inicio ?? "") || 0) > limite).at(-1);
}
