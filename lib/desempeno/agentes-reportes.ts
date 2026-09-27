import "server-only";

import { and, asc, gte, lte, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { limpiarReporte } from "./agentes-ia";
import { desempenoAgentesReportes, desempenoFichas } from "./schema";

// Reportes del equipo digital (una fila por agente y día). Lo escriben:
//  - el puente de cada agente (métricas: corridas, minutos, costo) y el agente mismo al cierre (resumen…),
//  - Leo desde /api/slack-eventos (suma 1 revisión por pieza).
// Entra por /api/ritmo/agentes (CRON_SECRET) o directo desde el servidor.

export type ReporteAgenteFila = typeof desempenoAgentesReportes.$inferSelect;
const t = desempenoAgentesReportes;
export const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });

export async function guardarReporteAgente(p: {
  agente: string;
  fecha?: string;
  reporte?: { resumen?: unknown; tareas?: unknown; entregables?: unknown; bloqueos?: unknown };
  metricas?: { corridas?: number; minutos?: number; costoUsd?: number };
  sumar?: boolean; // true: las métricas (y tareas) se suman a lo que ya hay ese día
}) {
  const fecha = p.fecha && /^\d{4}-\d{2}-\d{2}$/.test(p.fecha) ? p.fecha : hoyPR();
  const r = p.reporte ? limpiarReporte(p.reporte) : null;
  const num = (x: unknown, max: number) => (Number.isFinite(Number(x)) ? Math.max(0, Math.min(max, Number(x))) : 0);
  const m = p.metricas ? { corridas: Math.round(num(p.metricas.corridas, 10_000)), minutos: num(p.metricas.minutos, 1440), costoUsd: num(p.metricas.costoUsd, 10_000) } : null;

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (r?.resumen) set.resumen = r.resumen;
  if (r?.entregables.length) set.entregables = r.entregables;
  if (r?.bloqueos) set.bloqueos = r.bloqueos;
  if (r && r.tareas !== null) set.tareas = p.sumar ? sql`coalesce(${t.tareas}, 0) + ${r.tareas}` : r.tareas;
  if (m) {
    set.corridas = p.sumar ? sql`${t.corridas} + ${m.corridas}` : m.corridas;
    set.minutos = p.sumar ? sql`${t.minutos} + ${m.minutos}` : m.minutos;
    set.costoUsd = p.sumar ? sql`${t.costoUsd} + ${m.costoUsd}` : m.costoUsd;
  }
  const d = await db();
  await d
    .insert(t)
    .values({ agente: p.agente, fecha, resumen: r?.resumen ?? null, tareas: r?.tareas ?? null, entregables: r?.entregables.length ? r.entregables : null, bloqueos: r?.bloqueos ?? null, corridas: m?.corridas ?? 0, minutos: m?.minutos ?? 0, costoUsd: m?.costoUsd ?? 0 })
    .onConflictDoUpdate({ target: [t.agente, t.fecha], set });
  return { fecha };
}

export async function reportesAgentesEntre(desde: string, hasta: string): Promise<ReporteAgenteFila[]> {
  const d = await db();
  return d.select().from(t).where(and(gte(t.fecha, desde), lte(t.fecha, hasta))).orderBy(asc(t.fecha));
}

/** Salario mensual (USD) por persona, de las fichas de RR.HH. (para el costo por día del humano). */
export async function salariosPorPersona(): Promise<Map<string, number>> {
  const d = await db();
  const filas = await d.select({ userId: desempenoFichas.userId, salario: desempenoFichas.salarioMensual }).from(desempenoFichas);
  return new Map(filas.filter((f) => f.salario && f.salario > 0).map((f) => [f.userId, f.salario!]));
}
