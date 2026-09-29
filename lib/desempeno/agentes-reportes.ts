import "server-only";

import { and, asc, gte, lte, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { limpiarReporte } from "./agentes-ia";
import { desempenoAgentesReportes, desempenoFichas, desempenoPresencia } from "./schema";

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
  // sumar: trabajo del agente hecho fuera de su bot (p. ej. desde la Mac): se AÑADE a lo que ya reportó, no lo pisa.
  if (r?.resumen) set.resumen = p.sumar ? sql`case when coalesce(${t.resumen}, '') = '' then ${r.resumen} else ${t.resumen} || ${"\n"} || ${r.resumen} end` : r.resumen;
  if (r?.entregables.length) set.entregables = p.sumar ? sql`coalesce(${t.entregables}, '[]'::jsonb) || ${JSON.stringify(r.entregables)}::jsonb` : r.entregables;
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

/** Oficina virtual: lo último que dijo cada agente en el buzón (48 h). Tabla agentes_mensajes (SQL crudo, como /api/agentes). */
export async function ultimosMensajes(agentes: string[]): Promise<Record<string, { para: string; texto: string; creado: string }>> {
  const out: Record<string, { para: string; texto: string; creado: string }> = {};
  try {
    const d = await db();
    const lista = sql.join(agentes.map((a) => sql`${a}`), sql`, `);
    // Lo que el agente escribió (de = agente) o contestó (para = agente, con respuesta): lo más reciente de cada uno.
    const r = await d.execute(sql`
      SELECT DISTINCT ON (quien) quien AS de, a AS para, dicho AS texto, cuando AS creado FROM (
        SELECT de AS quien, para AS a, texto AS dicho, creado_el AS cuando FROM agentes_mensajes
          WHERE creado_el > now() - interval '48 hours' AND de IN (${lista})
        UNION ALL
        SELECT para AS quien, de AS a, respuesta AS dicho, atendido_el AS cuando FROM agentes_mensajes
          WHERE atendido_el > now() - interval '48 hours' AND para IN (${lista}) AND coalesce(respuesta, '') <> ''
      ) x ORDER BY quien, cuando DESC`);
    const filas = (Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? [])) as { de: string; para: string; texto: string; creado: string | Date }[];
    for (const f of filas) out[f.de] = { para: f.para, texto: f.texto, creado: new Date(f.creado).toISOString() };
  } catch (e) {
    console.error("[oficina] mensajes", e);
  }
  return out;
}

// ─── Ala ejecutiva de la oficina virtual (28/sep, Elvin) ─────────────────────────────────────────
// Elvin aprueba; Carilin y Aure le piden a los agentes. Aparece en su oficina quien está viendo la página (< 2 min).
export const DIRECCION = { ceo: "elvin@levelupmediapr.net", carilin: "carilin@levelupmediapr.net", aure: "aure@levelupmediapr.net" } as const;

export async function marcarPresencia(userId: string) {
  const d = await db();
  await d.insert(desempenoPresencia).values({ userId, lugar: "oficina", vistoAt: new Date() }).onConflictDoUpdate({ target: desempenoPresencia.userId, set: { vistoAt: new Date() } });
}

export interface Ejecutivos {
  ceo: { presente: boolean; porAprobar: number };
  carilin: { presente: boolean; pedidos: number };
  aure: { presente: boolean; pedidos: number };
}

export async function ejecutivos(viendo: string): Promise<Ejecutivos> {
  const d = await db();
  const filas = (x: unknown) => (Array.isArray(x) ? x : ((x as { rows?: unknown[] }).rows ?? [])) as Record<string, unknown>[];
  const presentes = new Set<string>([viendo.toLowerCase()]);
  let porAprobar = 0;
  const pedidos: Record<string, number> = {};
  try {
    const r = filas(await d.execute(sql`SELECT lower(u.email) AS email FROM desempeno_presencia p JOIN pulse_users u ON u.id = p.user_id WHERE p.visto_at > now() - interval '2 minutes'`));
    for (const f of r) presentes.add(String(f.email));
  } catch (e) {
    console.error("[oficina] presencia", e);
  }
  try {
    const [a] = filas(await d.execute(sql`SELECT (SELECT count(*) FROM agentes_mensajes WHERE estado = 'esperando-ok') + (SELECT count(*) FROM desempeno_cambios WHERE estado = 'pendiente') AS n`));
    porAprobar = Number(a?.n ?? 0);
    for (const f of filas(await d.execute(sql`SELECT de, count(*) AS n FROM agentes_mensajes WHERE de IN ('carilin', 'aure') AND creado_el > now() - interval '24 hours' GROUP BY de`))) pedidos[String(f.de)] = Number(f.n);
  } catch (e) {
    console.error("[oficina] conteos", e);
  }
  return {
    ceo: { presente: presentes.has(DIRECCION.ceo), porAprobar },
    carilin: { presente: presentes.has(DIRECCION.carilin), pedidos: pedidos.carilin ?? 0 },
    aure: { presente: presentes.has(DIRECCION.aure), pedidos: pedidos.aure ?? 0 },
  };
}

