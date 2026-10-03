/**
 * Panorama de ventas del portal (3/oct/2026, Elvin: "ver los plomeros, los trabajos realizados, las comisiones, cuánto
 * se ha generado cada venta, quién la hizo, si fue Heileen o en automático"). Pura: el portal le pasa los trabajos.
 * Venta = trabajo terminado (completado o cobrado), sin las garantías. Ganancia de Resuelto = lo que paga el cliente −
 * comisión del plomero − piezas que se le devuelven − equipo que puso Resuelto.
 */
import type { Trabajo } from "./almacen.js";
import { partesDelPago } from "./cuenta-plomero.js";
import { pagadoPorCliente, debe } from "./registro-pago.js";

export type Origen = "agente" | "agente-humano" | "setter" | "web";
export const NOMBRE_ORIGEN: Record<Origen, string> = {
  agente: "Agente (automático)",
  "agente-humano": "Agente + Heileen",
  setter: "Heileen (reservó ella)",
  web: "Página de reservas",
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Quién cerró. Los trabajos de antes del 3/oct no guardaban el origen: se deduce del historial y del contacto. */
export function origenDe(t: Pick<Trabajo, "origen" | "humanoAntes" | "creado">, d: { reservoPorPagina?: boolean; humanoDesde?: string } = {}): Origen {
  if (t.origen === "setter") return "setter";
  if (t.origen === "web") return "web";
  if (t.origen === "agente") return t.humanoAntes ? "agente-humano" : "agente";
  if (d.reservoPorPagina) return "web";
  return d.humanoDesde && d.humanoDesde < t.creado ? "agente-humano" : "agente";
}

/** Lo que le queda a Resuelto de una venta. */
export function ganancia(t: Pick<Trabajo, "totalCliente" | "pagoPlomero" | "piezasPlomero" | "materialesCosto" | "garantiaDe" | "cierre">) {
  const { comision, piezas } = partesDelPago(t);
  const equipo = Math.max(0, (t.materialesCosto ?? 0) - piezas / 1.1);
  return r2(pagadoPorCliente(t) - comision - piezas - equipo - (t.cierre?.otrosGastos ?? 0));
}

export type FilaVenta = { id: string; fecha: string; cliente: string; servicio: string; municipio: string; plomero: string; origen: Origen; canal: string; total: number; comision: number; piezas: number; gastos: number; ganancia: number; cobrado: boolean; debe: number; metodo?: string; registradoPor?: string };

const sumar = <T>(xs: T[], f: (x: T) => number) => r2(xs.reduce((a, x) => a + f(x), 0));
function agrupar(filas: FilaVenta[], clave: (f: FilaVenta) => string) {
  const m = new Map<string, FilaVenta[]>();
  for (const f of filas) m.set(clave(f), [...(m.get(clave(f)) ?? []), f]);
  return [...m.entries()].map(([k, fs]) => ({ clave: k, ventas: fs.length, total: sumar(fs, (f) => f.total), comision: sumar(fs, (f) => f.comision), piezas: sumar(fs, (f) => f.piezas), ganancia: sumar(fs, (f) => f.ganancia) }))
    .sort((a, b) => b.total - a.total);
}

export function panelVentas(trabajos: Trabajo[], rango: { desde: number; hasta: number }, origen: (t: Trabajo) => Origen) {
  const enRango = (iso?: string) => { const x = Date.parse(iso ?? ""); return x >= rango.desde && x < rango.hasta; };
  const filas: FilaVenta[] = trabajos
    .filter((t) => ["completado", "cobrado"].includes(t.estado) && !t.garantiaDe && enRango(t.terminadoEn ?? t.inicio))
    .map((t) => {
      const { comision, piezas } = partesDelPago(t);
      return { id: t.id, fecha: t.terminadoEn ?? t.inicio, cliente: t.nombre, servicio: t.servicio, municipio: t.municipio, plomero: t.plomeroId || "—", origen: origen(t), canal: t.contactoId.split(":")[0], total: r2(pagadoPorCliente(t)), comision: t.pagoPlomero == null ? 0 : comision, piezas, gastos: r2((t.cierre?.otrosGastos ?? 0) + Math.max(0, (t.materialesCosto ?? 0) - piezas / 1.1)), ganancia: t.totalCliente == null ? 0 : ganancia(t), cobrado: t.estado === "cobrado", debe: debe(t), metodo: t.cierre?.metodo ? `${t.cierre.metodo}${(t.cierre.pagos ?? 1) > 1 ? ` (${t.cierre.pagos} pagos)` : ""}` : undefined, registradoPor: t.cierre?.por };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const sinMontos = filas.filter((f) => !f.total).map((f) => f.id);
  const sinCierre = filas.filter((f) => f.total && !f.registradoPor).map((f) => f.id);
  const agendados = trabajos.filter((t) => ["agendado", "en-camino", "en-sitio"].includes(t.estado) && !t.garantiaDe)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .map((t) => ({ id: t.id, inicio: t.inicio, cliente: t.nombre, servicio: t.servicio, municipio: t.municipio, plomero: t.plomeroId || "", origen: origen(t), estimado: r2((t.manoObra ?? t.rango?.[0] ?? 0) + t.fee) }));
  const conMontos = filas.filter((f) => f.total);
  const total = sumar(filas, (f) => f.total);
  return {
    kpis: {
      ventas: filas.length, total, cobrado: sumar(filas.filter((f) => f.cobrado), (f) => f.total), porCobrar: sumar(filas, (f) => f.debe),
      comisiones: sumar(filas, (f) => f.comision), piezas: sumar(filas, (f) => f.piezas), ganancia: sumar(filas, (f) => f.ganancia),
      ticket: conMontos.length ? r2(sumar(conMontos, (f) => f.total) / conMontos.length) : 0,
      agendados: agendados.length, agendadoEstimado: sumar(agendados, (a) => a.estimado), sinPlomero: agendados.filter((a) => !a.plomero).length,
    },
    porOrigen: agrupar(filas, (f) => f.origen),
    porPlomero: agrupar(filas, (f) => f.plomero),
    porZona: agrupar(filas, (f) => f.municipio),
    filas, agendados, sinMontos, sinCierre,
  };
}
