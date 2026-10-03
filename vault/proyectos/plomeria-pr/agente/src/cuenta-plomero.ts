/**
 * Estado de cuenta del plomero en su app (2/oct/2026, Elvin: "que se le vaya acumulando lo que completa… cuánto va
 * ganando en tiempo real… y cuánto va a cobrar ese viernes"). Pura: la usan la app (/api/proveedores/cuenta) y el portal.
 *
 * Regla de pago (la que ya dice la app y el contrato): Resuelto paga los VIERNES lo que el cliente pagó hasta el
 * MIÉRCOLES a las 11:59 PM (hora PR). Lo que el cliente paga jueves o después entra el viernes siguiente. Si el cliente
 * todavía no ha pagado, el trabajo queda "esperando que el cliente pague" (no se le debe hasta que pague).
 * El plomero comisiona SOLO de la mano de obra (65 %). Las piezas que compra se le devuelven aparte, en 48 h, con 10 %
 * encima (Elvin, 30/sep y 2/oct); el costo lo pone él al tocar "Terminé", según el recibo.
 */
import type { Trabajo } from "./almacen.js";

const DIA = 86_400_000;
const PR = 4 * 3600_000; // Puerto Rico = UTC-4 todo el año
const r2 = (n: number) => Math.round(n * 100) / 100;

/** 00:00 hora PR del día de `ms`, más `dias`. */
function medianochePR(ms: number, dias = 0) {
  const d = new Date(ms - PR);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + dias) + PR;
}
const diaSemanaPR = (ms: number) => new Date(ms - PR).getUTCDay(); // 0 dom … 5 vie
const fechaPR = (ms: number) => new Date(ms - PR).toISOString().slice(0, 10);

/** El próximo viernes de pago (hoy si es viernes) y el corte: jueves 00:00 PR de esa semana. */
export function viernesDePago(ahora: number) {
  const viernes = medianochePR(ahora, (5 - diaSemanaPR(ahora) + 7) % 7);
  return { viernes, corte: viernes - DIA };
}

/** Comisión (viernes) y piezas (48 h) de un trabajo. Los cerrados antes del 2/oct guardaban las dos juntas en pagoPlomero. */
export function partesDelPago(t: Pick<Trabajo, "pagoPlomero" | "piezasPlomero" | "materialesCosto" | "garantiaDe">) {
  if (t.piezasPlomero != null) return { comision: r2(t.pagoPlomero ?? 0), piezas: r2(t.piezasPlomero) };
  if (t.garantiaDe) return { comision: 0, piezas: r2(t.pagoPlomero ?? 0) };
  const piezas = r2((t.materialesCosto ?? 0) * 1.1);
  return { comision: r2(Math.max(0, (t.pagoPlomero ?? 0) - piezas)), piezas };
}

/** Piezas ya devueltas. En los trabajos de antes del 2/oct se devolvían junto con el pago del viernes. */
export const piezasDevueltas = (t: Pick<Trabajo, "piezasDevueltas" | "piezasPlomero" | "pagadoAlPlomero">) =>
  !!t.piezasDevueltas || (t.piezasPlomero == null && !!t.pagadoAlPlomero);

/** Montos al cerrar un trabajo: lo que paga el cliente, la comisión del plomero y lo que se le devuelve por piezas. Pura. */
export function montosDeCierre(d: { manoObra: number; fee: number; recargo: number; piezasCosto: number; margenClientePct: number }) {
  const matCliente = r2(d.piezasCosto * (1 + d.margenClientePct / 100));
  return { total: r2(d.manoObra + d.fee + d.recargo + matCliente), matCliente, pago: r2((d.manoObra + d.recargo) * 0.65), piezas: r2(d.piezasCosto * 1.1) };
}

export type Linea = { id: string; servicio: string; municipio: string; fecha: string; pago: number };
type OfertaMin = { referencia: string; aceptadoPor?: string; pagoProveedor: number; estado?: string };

const linea = (t: Trabajo, fecha: string | undefined, pago: number): Linea =>
  ({ id: t.id, servicio: t.servicio, municipio: t.municipio, fecha: fecha ?? t.inicio, pago: r2(pago) });
const suma = (ls: Linea[]) => r2(ls.reduce((a, l) => a + l.pago, 0));
const grupo = (ls: Linea[]) => ({ total: suma(ls), trabajos: ls });

export function cuentaPlomero(trabajos: Trabajo[], ofertas: OfertaMin[], plomeroId: string, ahora = Date.now()) {
  const mios = trabajos.filter((t) => t.plomeroId === plomeroId && t.estado !== "cancelado");
  const cerrados = mios.filter((t) => t.terminadoEn && t.pagoPlomero != null);
  const com = (t: Trabajo) => partesDelPago(t).comision;
  const hechos = cerrados.filter((t) => com(t) > 0);
  const { viernes, corte } = viernesDePago(ahora);
  const lunes = medianochePR(ahora, -((diaSemanaPR(ahora) + 6) % 7));
  const finSemana = lunes + 7 * DIA;

  const cobradoEn = (t: Trabajo) => Date.parse(t.cobradoEn ?? t.terminadoEn!);
  const porPagar = hechos.filter((t) => t.estado === "cobrado" && !t.pagadoAlPlomero);
  const esteViernes = porPagar.filter((t) => cobradoEn(t) < corte).map((t) => linea(t, t.cobradoEn ?? t.terminadoEn, com(t)));
  const siguiente = porPagar.filter((t) => cobradoEn(t) >= corte).map((t) => linea(t, t.cobradoEn ?? t.terminadoEn, com(t)));
  const esperando = hechos.filter((t) => t.estado === "completado").map((t) => linea(t, t.terminadoEn, com(t)));

  const estimado = (t: Trabajo) => ofertas.filter((o) => o.referencia === t.id && o.aceptadoPor === plomeroId).at(-1)?.pagoProveedor
    ?? (t.manoObra ?? 0) * 0.65;
  const porHacer = mios.filter((t) => ["agendado", "en-camino", "en-sitio"].includes(t.estado) && Date.parse(t.inicio) < finSemana)
    .sort((a, b) => a.inicio.localeCompare(b.inicio)).map((t) => linea(t, t.inicio, estimado(t)));

  const deLaSemana = hechos.filter((t) => { const x = Date.parse(t.terminadoEn!); return x >= lunes && x < finSemana; })
    .map((t) => linea(t, t.terminadoEn, com(t)));

  const pagos = new Map<string, Linea[]>();
  for (const t of hechos.filter((x) => x.pagadoAlPlomero)) pagos.set(t.pagadoAlPlomero!, [...(pagos.get(t.pagadoAlPlomero!) ?? []), linea(t, t.terminadoEn, com(t))]);
  const pagados = [...pagos.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6).map(([fecha, ls]) => ({ fecha, total: suma(ls), trabajos: ls.length }));

  const conPiezas = cerrados.filter((t) => partesDelPago(t).piezas > 0);
  const piezaLinea = (t: Trabajo) => linea(t, t.terminadoEn, partesDelPago(t).piezas);
  const piezasPorDevolver = conPiezas.filter((t) => !piezasDevueltas(t)).map(piezaLinea);

  return {
    actualizado: new Date(ahora).toISOString(),
    semana: { desde: fechaPR(lunes), ...grupo(deLaSemana) },
    esteViernes: { fecha: fechaPR(viernes), ...grupo(esteViernes) },
    siguienteViernes: { fecha: fechaPR(viernes + 7 * DIA), ...grupo(siguiente) },
    esperandoCliente: grupo(esperando),
    porHacer: grupo(porHacer),
    pagados,
    piezas: { porDevolver: grupo(piezasPorDevolver), devueltas: suma(conPiezas.filter((t) => piezasDevueltas(t)).map(piezaLinea)) },
    acumulado: suma(hechos.map((t) => linea(t, t.terminadoEn, com(t)))),
    trabajosTotales: hechos.length,
  };
}
export type CuentaPlomero = ReturnType<typeof cuentaPlomero>;
