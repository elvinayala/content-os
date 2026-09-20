/**
 * Motor de precio de Resuelto Proyectos. El cotizador NO inventa precios: este módulo
 * toma el costo de ejecución (del Cost Book) y devuelve precio recomendado, mínimos,
 * comisión e hitos. Las reglas de margen son las de Elvin (13/sep/2026):
 *   pequeño/mediano → 25% · intermedio → 22.5–25% · grande → 20–22.5% · piso absoluto 20%.
 * El margen se aplica sobre el COSTO DE EJECUCIÓN (lo que recibe el contratista). La contingencia
 * es una RESERVA que sale de la parte de Resuelto y se libera si no hubo desvíos. Así, costo
 * $9,000 al 25% → precio $12,000 → Resuelto $3,000 (de los que $900 quedan en reserva).
 *
 *   npm run cotizar -- --costo 9000 [--categoria banos] [--descuento 500]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RAIZ } from "./almacen.js";

export interface Partida { id: string; nombre: string; cantidad: number; unidad?: string; costoUnitario: number; validado?: boolean }
export interface Tramo { nombre: "pequeno" | "intermedio" | "grande"; hastaPrecio: number; margenRecomendado: number; margenMinimoSinAprobacion: number }

export const PISO_ABSOLUTO = 0.20;
export const COMISION_COTIZADOR = 0.025;
export const COMISION_COTIZADOR_CON_RECOVERY = 0.02;
export const COMISION_RECOVERY = 0.005;
export const TRAMOS: Tramo[] = [
  { nombre: "pequeno", hastaPrecio: 8000, margenRecomendado: 0.25, margenMinimoSinAprobacion: 0.24 },
  { nombre: "intermedio", hastaPrecio: 25000, margenRecomendado: 0.25, margenMinimoSinAprobacion: 0.225 },
  { nombre: "grande", hastaPrecio: Infinity, margenRecomendado: 0.225, margenMinimoSinAprobacion: 0.21 },
];
/** Hitos por defecto: 40% al firmar, 50% al avance, 10% retenido hasta la aceptación. */
export const HITOS_DEFAULT = [
  { id: "deposito", nombre: "Depósito al firmar el contrato", pct: 0.40 },
  { id: "avance", nombre: "Avance (mitad del proyecto, con fotos)", pct: 0.50 },
  { id: "final", nombre: "Aceptación final (inspección con fotos)", pct: 0.10, retencion: true },
];

const costbook = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "costbook.json"), "utf8"));

export function contingenciaDe(categoriaId: string): number {
  return (costbook.categorias?.[categoriaId]?.contingencia_pct ?? 10) / 100;
}

/** Precio = costo / (1 − margen). Elige el tramo por el precio resultante (iterando una vez basta). */
function tramoPara(costoTotal: number): Tramo {
  let t = TRAMOS[0];
  for (const c of TRAMOS) { t = c; if (costoTotal / (1 - c.margenRecomendado) <= c.hastaPrecio) break; }
  return t;
}

export interface Cotizacion {
  categoriaId: string;
  costoEjecucion: number; contingenciaPct: number; reservaContingencia: number;
  tramo: Tramo["nombre"];
  margenRecomendado: number; precioRecomendado: number;
  precioMinimoSinAprobacion: number; precioMinimoAbsoluto: number;
  precioFinal: number; margenFinal: number; ingresoResuelto: number; ingresoResueltoNetoDeReserva: number; pagoContratista: number;
  requiereAprobacion: boolean; bloqueado: boolean; motivo?: string;
  comisionCotizador: number; comisionSiRecovery: { cotizador: number; recovery: number };
  hitos: { id: string; nombre: string; pct: number; monto: number; retencion?: boolean }[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function cotizar(o: { categoriaId: string; partidas?: Partida[]; costoEjecucion?: number; descuento?: number; precioPropuesto?: number }): Cotizacion {
  const costoEjecucion = o.costoEjecucion ?? (o.partidas ?? []).reduce((s, p) => s + p.cantidad * p.costoUnitario, 0);
  if (!(costoEjecucion > 0)) throw new Error("El costo de ejecución tiene que ser mayor que 0 (usa partidas del Cost Book o --costo)");
  const contingenciaPct = contingenciaDe(o.categoriaId);
  const reservaContingencia = r2(costoEjecucion * contingenciaPct);
  const tramo = tramoPara(costoEjecucion);
  const precioRecomendado = r2(costoEjecucion / (1 - tramo.margenRecomendado));
  const precioMinimoSinAprobacion = r2(costoEjecucion / (1 - tramo.margenMinimoSinAprobacion));
  const precioMinimoAbsoluto = r2(costoEjecucion / (1 - PISO_ABSOLUTO));

  let precioFinal = o.precioPropuesto ?? r2(precioRecomendado - (o.descuento ?? 0));
  let requiereAprobacion = false, bloqueado = false, motivo: string | undefined;
  if (precioFinal < precioMinimoAbsoluto) { bloqueado = true; motivo = `Precio por debajo del piso del 20% ($${precioMinimoAbsoluto}). No se puede cerrar ni con aprobación.`; precioFinal = precioMinimoAbsoluto; }
  else if (precioFinal < precioMinimoSinAprobacion) { requiereAprobacion = true; motivo = `Descuento mayor al permitido: requiere aprobación (mínimo sin aprobación $${precioMinimoSinAprobacion}).`; }

  const margenFinal = r2((precioFinal - costoEjecucion) / precioFinal);
  const ingresoResuelto = r2(precioFinal - costoEjecucion);
  return {
    categoriaId: o.categoriaId, costoEjecucion: r2(costoEjecucion), contingenciaPct, reservaContingencia, tramo: tramo.nombre,
    margenRecomendado: tramo.margenRecomendado, precioRecomendado, precioMinimoSinAprobacion, precioMinimoAbsoluto,
    precioFinal, margenFinal, ingresoResuelto, ingresoResueltoNetoDeReserva: r2(ingresoResuelto - reservaContingencia), pagoContratista: r2(costoEjecucion),
    requiereAprobacion, bloqueado, motivo,
    comisionCotizador: r2(precioFinal * COMISION_COTIZADOR),
    comisionSiRecovery: { cotizador: r2(precioFinal * COMISION_COTIZADOR_CON_RECOVERY), recovery: r2(precioFinal * COMISION_RECOVERY) },
    hitos: HITOS_DEFAULT.map((h) => ({ ...h, monto: r2(precioFinal * h.pct) })),
  };
}

// ── CLI de prueba ──
function main() {
  const a = process.argv.slice(2);
  const val = (f: string) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : undefined; };
  const c = cotizar({ categoriaId: val("--categoria") ?? "banos", costoEjecucion: Number(val("--costo") ?? 9000), descuento: val("--descuento") ? Number(val("--descuento")) : undefined, precioPropuesto: val("--precio") ? Number(val("--precio")) : undefined });
  const $ = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  console.log(`\nCategoría ${c.categoriaId} · tramo ${c.tramo}`);
  console.log(`Costo de ejecución (lo que recibe el contratista) ${$(c.costoEjecucion)}`);
  console.log(`Precio recomendado ${$(c.precioRecomendado)} (margen ${c.margenRecomendado * 100}%) · mínimo sin aprobación ${$(c.precioMinimoSinAprobacion)} · piso absoluto ${$(c.precioMinimoAbsoluto)}`);
  console.log(`Precio final ${$(c.precioFinal)} → Resuelto ${$(c.ingresoResuelto)} (${Math.round(c.margenFinal * 1000) / 10}%) · contratista ${$(c.pagoContratista)}`);
  console.log(`Reserva de contingencia ${c.contingenciaPct * 100}% = ${$(c.reservaContingencia)} (sale de la parte de Resuelto; se libera si no hay desvíos) → Resuelto neto ${$(c.ingresoResueltoNetoDeReserva)}`);
  console.log(`Comisión cotizador ${$(c.comisionCotizador)} (o ${$(c.comisionSiRecovery.cotizador)} + Recovery ${$(c.comisionSiRecovery.recovery)})`);
  console.log("Hitos: " + c.hitos.map((h) => `${h.nombre} ${$(h.monto)}`).join(" · "));
  if (c.motivo) console.log((c.bloqueado ? "⛔ " : "⚠️ ") + c.motivo);
  console.log();
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
