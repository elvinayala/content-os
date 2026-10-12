// Candado de servidor para el gasto en Meta (AI Core, 12-oct-2026; docs/CONTROLES-AGENTES.md del Core).
//
// Hoy `activar` ya exige una aprobación, pero `escalar --ok` (subir presupuesto) solo lo
// frenaba el prompt de Max. Este candado vive en el CLIENTE de Meta: cualquier escritura que gaste dinero
// o prenda pauta —venga del comando que venga, la corra el agente que la corra— exige un ítem aprobado de
// #max-aprobaciones que coincida exactamente con lo que se va a hacer. Sin eso, la llamada a Meta no sale.

import { exigirEscritura } from "../../lib/solo-lectura.mjs";

/** Campos de la Graph API que cambian cuánto se gasta. */
export const CAMPOS_DE_GASTO = ["daily_budget", "lifetime_budget", "bid_amount", "spend_cap", "budget_remaining"];
/** Quién puede autorizar gasto: los mismos que hoy pueden "publica <id>". */
// Solo Elvin autoriza gasto (prender pauta, subir presupuesto): decisión de Elvin del 12-oct. Carilin y Aure piden,
// consultan y revisan, pero no autorizan aumentos ni gasto.
export const PUEDEN_AUTORIZAR = ["elvin"];

export class CandadoError extends Error {
  constructor(motivo) {
    super(`Candado de gasto: ${motivo}`);
    this.name = "CandadoError";
  }
}

/** Crear un objeto NUEVO (campaña, conjunto, anuncio o copia) en una cuenta o debajo de otro. */
const CREAR = /\/(campaigns|adsets|ads|copies)$/;

/**
 * ¿Esta llamada a Meta gasta dinero o prende algo? Leer, pausar y archivar no.
 * Crear algo nuevo EXPLÍCITAMENTE EN PAUSA tampoco, aunque traiga presupuesto: así montan `estrategia`, `crear`
 * y `plantilla` (todo nace en pausa) y no gasta nada hasta que se prende, que sí pasa por el candado. Crear sin
 * decir PAUSED, o ACTIVE, se trata como gasto (Meta podría dejarlo prendido).
 */
export function cambiaGasto(method, params = {}, path = "") {
  if (String(method).toUpperCase() === "GET") return false;
  if (params.status === "ACTIVE" || params.status_option === "ACTIVE") return true;
  if (CREAR.test(String(path))) return !(params.status === "PAUSED" || params.status_option === "PAUSED");
  return CAMPOS_DE_GASTO.some((k) => params[k] !== undefined && params[k] !== null);
}

/**
 * ¿El ítem de #max-aprobaciones autoriza EXACTAMENTE esta acción?
 * accion: "escalar" (objetivo = conjunto, pct = % pedido) | "activar" (objetivo = id del objeto a prender).
 */
export function verificarAprobacion(item, { marca, accion, objetivo, pct }) {
  if (!item) return { ok: false, motivo: "no hay una aprobación con ese número" };
  if (item.tipo !== "publicar") return { ok: false, motivo: `la #${item.id} no es una autorización de pauta` };
  if (item.estado !== "aprobado") return { ok: false, motivo: `la #${item.id} está ${item.estado}, no aprobada` };
  if (!PUEDEN_AUTORIZAR.includes(item.decidido_por)) return { ok: false, motivo: `la #${item.id} no la autorizó Elvin (solo él autoriza gasto)` };
  const d = item.datos || {};
  if (d.marca !== marca) return { ok: false, motivo: `la #${item.id} es de otra marca` };
  if (accion === "escalar") {
    if (d.accion !== "escalar") return { ok: false, motivo: `la #${item.id} no autoriza escalar` };
    if (String(d.adsetId) !== String(objetivo)) return { ok: false, motivo: `la #${item.id} es para otro conjunto` };
    if (!(Number(pct) > 0) || Number(pct) > Number(d.pct)) return { ok: false, motivo: `la #${item.id} autorizó +${d.pct} %, no +${pct} %` };
    return { ok: true };
  }
  if (accion === "activar") {
    if (d.accion === "escalar") return { ok: false, motivo: `la #${item.id} es para escalar, no para prender` };
    if (!(d.ids || []).some((o) => String(o.id) === String(objetivo))) return { ok: false, motivo: `la #${item.id} no incluye ${objetivo}` };
    return { ok: true };
  }
  return { ok: false, motivo: `acción desconocida: ${accion}` };
}

/**
 * Envuelve el cliente de Meta: `graph()` deja pasar lecturas y pausas, y para todo lo que gaste exige
 * `autorizacion = { item, accion, objetivo, pct }` verificado contra el ítem real (que se trae de
 * /api/max con `obtenerItem`, nunca de lo que diga el agente).
 */
export function conCandado(cliente, { marca, obtenerItem }) {
  async function graph(method, path, params = {}, autorizacion) {
    // Parche D: una tarea de solo lectura nunca escribe en Meta (ni pausar, ni crear en pausa, ni nada que no sea GET).
    if (String(method).toUpperCase() !== "GET") exigirEscritura(`Meta ${method} ${path}`);
    if (!cambiaGasto(method, params, path)) return cliente.graph(method, path, params);
    if (!autorizacion?.item) throw new CandadoError(`${method} ${path} cambia gasto o prende pauta y no trae una aprobación (#id de #max-aprobaciones)`);
    const item = await obtenerItem(autorizacion.item);
    const v = verificarAprobacion(item, { marca, accion: autorizacion.accion, objetivo: autorizacion.objetivo, pct: autorizacion.pct });
    if (!v.ok) throw new CandadoError(v.motivo);
    return cliente.graph(method, path, params);
  }
  return { ...cliente, graph };
}
