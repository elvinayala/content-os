import "server-only";

import { and, eq, gt, inArray, like, notInArray, sql } from "drizzle-orm";

import { db } from "./db";
import { calcularPendientes, clave, type Pendiente, type TableroMiDia, type TipoPendiente } from "./mi-dia";
import { hoyPR } from "./motor-reglas";
import { pulseActivity, pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "./schema";
import type { ValorCelda } from "./types";

// Carga lo necesario para "Mi día" de los tableros indicados (los que el usuario puede ver).
export async function pendientesDe(boardIds: string[]): Promise<{ pendientes: Pendiente[]; hoy: string }> {
  const hoy = hoyPR();
  if (!boardIds.length) return { pendientes: [], hoy };
  const d = await db();
  const [boards, columns, groups, sistema] = await Promise.all([
    d.select().from(pulseBoards).where(inArray(pulseBoards.id, boardIds)),
    d.select({ id: pulseColumns.id, boardId: pulseColumns.boardId, title: pulseColumns.title, type: pulseColumns.type }).from(pulseColumns).where(inArray(pulseColumns.boardId, boardIds)),
    d.select({ id: pulseGroups.id, boardId: pulseGroups.boardId, title: pulseGroups.title }).from(pulseGroups).where(inArray(pulseGroups.boardId, boardIds)),
    d.select({ id: pulseUsers.id }).from(pulseUsers).where(like(pulseUsers.email, "%@pulse.sistema")),
  ]);
  const bajas = groups.filter((g) => /offboard|baja|inactiv/i.test(g.title)).map((g) => g.id);
  const items = await d
    .select({ id: pulseItems.id, boardId: pulseItems.boardId, name: pulseItems.name, groupId: pulseItems.groupId, values: pulseItems.values, createdAt: pulseItems.createdAt, createdBy: pulseItems.createdBy })
    .from(pulseItems)
    .where(and(inArray(pulseItems.boardId, boardIds), bajas.length ? notInArray(pulseItems.groupId, bajas) : undefined));
  const deSistema = new Set(sistema.map((u) => u.id));
  const hechosRows = await d
    .select({ itemId: pulseActivity.itemId, hecho: sql<{ tipo: TipoPendiente; fecha: string | null }>`${pulseActivity.after}->'hecho'` })
    .from(pulseActivity)
    .where(and(inArray(pulseActivity.boardId, boardIds), sql`${pulseActivity.after} ? 'hecho'`, gt(pulseActivity.at, sql`now() - interval '45 days'`)));
  const hechos = new Set(hechosRows.map((h) => clave(h.itemId, h.hecho.tipo, h.hecho.fecha)));
  const tableros: TableroMiDia[] = boards.map((b) => ({
    slug: b.slug,
    nombre: b.nombre,
    columns: columns.filter((c) => c.boardId === b.id),
    groups: groups.filter((g) => g.boardId === b.id),
    items: items
      .filter((i) => i.boardId === b.id)
      .map((i) => ({ id: i.id, name: i.name, groupId: i.groupId, values: i.values as Record<string, ValorCelda>, createdAt: new Date(i.createdAt).toISOString(), creadoPorSistema: !!i.createdBy && deSistema.has(i.createdBy) })),
  }));
  return { pendientes: calcularPendientes({ tableros, hechos, hoy }), hoy };
}

export async function todosLosTableros(): Promise<string[]> {
  const d = await db();
  return (await d.select({ id: pulseBoards.id }).from(pulseBoards).where(eq(pulseBoards.privado, false))).map((b) => b.id);
}
