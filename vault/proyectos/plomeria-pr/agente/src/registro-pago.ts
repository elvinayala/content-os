/**
 * Cierre y pago registrado por el equipo (3/oct/2026, Elvin: "que Heileen, cada vez que cobre un trabajo, suba el costo,
 * los gastos, todo; y yo poder poner a mano el total que pagó el cliente, los gastos, las piezas, la mano de obra y el fee
 * de $19, detallado"). Lo que le correspondía pagar al cliente sale de las reglas (montosDeCierre); lo que pagó DE VERDAD
 * se guarda aparte (descuentos, redondeos, ATH en dos pagos). Pura.
 */
import type { Trabajo } from "./almacen.js";
import { montosDeCierre } from "./cuenta-plomero.js";

export const METODOS = ["ATH Móvil", "Tarjeta (link)", "Efectivo", "Transferencia", "Otro"] as const;
export type Cierre = {
  por: string; registrado: string;
  manoObra: number; fee: number; recargo: number; piezasPlomero: number; equipoResuelto: number;
  otrosGastos: number; gastosNota?: string;
  /** pagado = pagó TODO. Si pagó una parte: pagado false, totalPagado = lo acordado y abonado = lo que lleva (ATH personal tope $500). */
  pagado: boolean; abonado?: number; totalPagado?: number; metodo?: string; pagos?: number; fechaPago?: string;
  nota: string;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown, def = 0) => (v === "" || v == null ? def : Number(v));
const MAX = 50_000;

export function validarCierre(b: any, def: { fee: number; recargo: number }): { ok: true; datos: Omit<Cierre, "por" | "registrado"> } | { ok: false; motivo: string } {
  const d = {
    manoObra: num(b?.mano_obra, NaN), fee: num(b?.fee, def.fee), recargo: num(b?.recargo, def.recargo),
    piezasPlomero: num(b?.piezas), equipoResuelto: num(b?.equipo), otrosGastos: num(b?.otros_gastos),
  };
  for (const [k, v] of Object.entries(d)) if (!Number.isFinite(v) || v < 0 || v > MAX) return { ok: false, motivo: `Revisa el monto de ${NOMBRES[k] ?? k}.` };
  if (d.manoObra <= 0) return { ok: false, motivo: "Falta la mano de obra." };
  const gastosNota = String(b?.gastos_nota ?? "").trim().slice(0, 200) || undefined;
  if (d.otrosGastos > 0 && !gastosNota) return { ok: false, motivo: "Explica cuáles fueron los otros gastos." };
  const nota = String(b?.nota ?? "").trim().slice(0, 400);
  if (!nota) return { ok: false, motivo: "Escribe una nota (qué pasó, cómo se cobró)." };
  const pagado = b?.pagado === true || b?.pagado === "si", parcial = b?.pagado === "parcial";
  if (!pagado && !parcial) return { ok: true, datos: { ...d, gastosNota, pagado, nota } };
  const totalPagado = num(b?.total_pagado, NaN);
  if (!Number.isFinite(totalPagado) || totalPagado <= 0 || totalPagado > MAX) return { ok: false, motivo: parcial ? "Pon el total acordado con el cliente." : "Pon el total que pagó el cliente." };
  const abonado = parcial ? num(b?.abonado, NaN) : undefined;
  if (parcial && (!Number.isFinite(abonado!) || abonado! <= 0 || abonado! >= totalPagado)) return { ok: false, motivo: "Pon cuánto lleva pagado (menos que el total)." };
  const metodo = METODOS.find((m) => m === b?.metodo); if (!metodo) return { ok: false, motivo: "Escoge cómo pagó." };
  const pagos = Math.max(1, Math.min(10, Math.round(num(b?.pagos, 1))));
  const fechaPago = /^\d{4}-\d{2}-\d{2}$/.test(String(b?.fecha_pago ?? "")) ? String(b.fecha_pago) : undefined;
  return { ok: true, datos: { ...d, gastosNota, pagado, abonado: abonado == null ? undefined : r2(abonado), totalPagado: r2(totalPagado), metodo, pagos, fechaPago, nota } };
}
const NOMBRES: Record<string, string> = { manoObra: "la mano de obra", fee: "la coordinación", recargo: "el recargo", piezasPlomero: "las piezas del plomero", equipoResuelto: "el equipo de Resuelto", otrosGastos: "otros gastos" };

/** Los campos del trabajo que cambian al registrar el cierre. `ahora` en ISO. */
export function aplicarCierre(t: Trabajo, c: Cierre, margenClientePct: number, ahora: string): Partial<Trabajo> {
  const m = montosDeCierre({ manoObra: c.manoObra, fee: c.fee, recargo: c.recargo, piezasCosto: c.piezasPlomero, equipoResuelto: c.equipoResuelto, margenClientePct });
  const cobrado = c.pagado || t.estado === "cobrado";
  return {
    estado: cobrado ? "cobrado" : "completado",
    terminadoEn: t.terminadoEn ?? ahora,
    cobradoEn: cobrado ? t.cobradoEn ?? (c.fechaPago ? `${c.fechaPago}T16:00:00.000Z` : ahora) : t.cobradoEn,
    manoObraFinal: c.manoObra, fee: c.fee, materialesCosto: r2(c.piezasPlomero + c.equipoResuelto),
    totalCliente: m.total, pagoPlomero: m.pago, piezasPlomero: m.piezas, cierre: c,
  };
}

/** Lo que pagó (o acordó pagar) el cliente de verdad, si se registró; si no, lo que le correspondía. */
/** Lo que el cliente todavía debe. */
export const debe = (t: Pick<Trabajo, "cierre" | "totalCliente" | "estado">) => (t.estado === "cobrado" ? 0 : r2(pagadoPorCliente(t) - (t.cierre?.abonado ?? 0)));
export const pagadoPorCliente = (t: Pick<Trabajo, "cierre" | "totalCliente">) => t.cierre?.totalPagado ?? t.totalCliente ?? 0;
