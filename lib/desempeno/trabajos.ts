import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { evento, reemplazarReporte } from "./datos";
import { desempenoReportes } from "./schema";
import { resumenTrabajos, type Trabajo, type TrabajoNuevo } from "./trabajos-reglas";

// Trabajos del videógrafo (12/oct, Derek). Tabla chica en SQL directo (como desempeno_puestos_extra): se crea sola la
// primera vez y queda protegida por la papelera. Cada cambio rehace su reporte del día (desempeno_reportes), así Equipo,
// Ranking, la alerta de las 6:45 PM y el reporte a RR.HH. lo ven igual que el de Lis.

let creada = false;
async function asegurarTabla() {
  if (creada) return;
  const d = await db();
  await d.execute(sql`CREATE TABLE IF NOT EXISTS desempeno_trabajos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    fecha text NOT NULL,
    hora text NOT NULL,
    trabajo text NOT NULL,
    negocio text NOT NULL,
    pueblo text NOT NULL,
    videos integer NOT NULL DEFAULT 0,
    creado_por uuid,
    creado_el timestamptz NOT NULL DEFAULT now()
  )`);
  await d.execute(sql`CREATE INDEX IF NOT EXISTS desempeno_trabajos_user_fecha ON desempeno_trabajos (user_id, fecha)`);
  await d.execute(sql`SELECT pulse_papelera_proteger()`).catch(() => null);
  creada = true;
}

type Fila = { id: string; fecha: string; hora: string; trabajo: string; negocio: string; pueblo: string; videos: number };
const filas = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? [])) as Fila[];

/** Trabajos de una persona entre dos días (incluidos), del más nuevo al más viejo. */
export async function listarTrabajos(userId: string, desde: string, hasta: string): Promise<Trabajo[]> {
  await asegurarTabla();
  const d = await db();
  const r = await d.execute(sql`SELECT id, fecha, hora, trabajo, negocio, pueblo, videos FROM desempeno_trabajos
    WHERE user_id = ${userId} AND fecha >= ${desde} AND fecha <= ${hasta} ORDER BY fecha DESC, hora DESC`);
  return filas(r).map((x) => ({ ...x, videos: Number(x.videos) }));
}

async function recalcular(userId: string, fecha: string, actorId: string) {
  const del = await listarTrabajos(userId, fecha, fecha);
  if (!del.length) {
    const d = await db();
    await d.delete(desempenoReportes).where(and(eq(desempenoReportes.userId, userId), eq(desempenoReportes.fecha, fecha)));
    await evento({ userId, actorId, tipo: "reporte-dia", datos: { fecha, trabajos: 0 } });
    return;
  }
  await reemplazarReporte(userId, fecha, { bloqueos: null, ...resumenTrabajos(del) });
}

export async function crearTrabajo(userId: string, t: TrabajoNuevo, actorId: string) {
  await asegurarTabla();
  const d = await db();
  await d.execute(sql`INSERT INTO desempeno_trabajos (user_id, fecha, hora, trabajo, negocio, pueblo, videos, creado_por)
    VALUES (${userId}, ${t.fecha}, ${t.hora}, ${t.trabajo}, ${t.negocio}, ${t.pueblo}, ${t.videos}, ${actorId})`);
  await recalcular(userId, t.fecha, actorId);
}

/** Borra un trabajo suyo (la vista maestra puede borrar cualquiera). */
export async function borrarTrabajo(id: string, userId: string, actorId: string, maestro: boolean): Promise<void> {
  await asegurarTabla();
  const d = await db();
  const [t] = filas(await d.execute(sql`SELECT id, fecha, hora, trabajo, negocio, pueblo, videos, user_id FROM desempeno_trabajos WHERE id = ${id}`)) as (Fila & { user_id: string })[];
  if (!t) throw new Error("Ese trabajo ya no existe");
  if (t.user_id !== userId && !maestro) throw new Error("Solo puedes borrar tus trabajos");
  await d.execute(sql`DELETE FROM desempeno_trabajos WHERE id = ${id}`);
  await recalcular(t.user_id, t.fecha, actorId);
}
