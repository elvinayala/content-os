import "server-only";

import { and, eq, gt, inArray, like, notInArray, sql } from "drizzle-orm";

import { db } from "./db";
import { resumenVenta, type DetalleVenta } from "./contratos";
import { calcularPendientes, clave, respuestaDelResumen, type InfoCliente, type Pendiente, type TableroMiDia, type TipoPendiente } from "./mi-dia";
import { hoyPR } from "./motor-reglas";
import { pulseActivity, pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "./schema";
import { formatearNumero } from "./valores";
import type { SettingsColumna, ValorCelda } from "./types";

// Carga lo necesario para "Mi día" de los tableros indicados (los que el usuario puede ver).
export async function pendientesDe(boardIds: string[]): Promise<{ pendientes: Pendiente[]; hoy: string }> {
  const hoy = hoyPR();
  if (!boardIds.length) return { pendientes: [], hoy };
  const d = await db();
  const [boards, columns, groups, sistema] = await Promise.all([
    d.select().from(pulseBoards).where(inArray(pulseBoards.id, boardIds)),
    d.select({ id: pulseColumns.id, boardId: pulseColumns.boardId, title: pulseColumns.title, type: pulseColumns.type, settings: pulseColumns.settings }).from(pulseColumns).where(inArray(pulseColumns.boardId, boardIds)),
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
  const pendientes = calcularPendientes({ tableros, hechos, hoy });
  await agregarInfo(pendientes, items, columns);
  return { pendientes, hoy };
}

// A los clientes nuevos y a los onboardings detenidos les suma cuánto pagaron y qué venden.
async function agregarInfo(
  pendientes: Pendiente[],
  items: { id: string; boardId: string; values: unknown }[],
  columns: { id: string; boardId: string; title: string; type: string; settings: unknown }[],
) {
  const objetivo = pendientes.filter((p) => p.tipo === "nuevo" || p.tipo === "onboarding");
  if (!objetivo.length) return;
  const ids = [...new Set(objetivo.map((p) => p.itemId))];
  const d = await db();
  const notas = await d
    .select({ itemId: pulseActivity.itemId, after: pulseActivity.after })
    .from(pulseActivity)
    .where(and(inArray(pulseActivity.itemId, ids), sql`(${pulseActivity.after} ? 'venta' or ${pulseActivity.after} ? 'typeform')`))
    .orderBy(sql`${pulseActivity.at} desc`);
  const porItem = new Map<string, InfoCliente>();
  for (const id of ids) {
    const it = items.find((i) => i.id === id);
    if (!it) continue;
    const values = it.values as Record<string, ValorCelda>;
    const cols = columns.filter((c) => c.boardId === it.boardId);
    const cInd = cols.find((c) => /^industria$/i.test(c.title) && (c.type === "status" || c.type === "dropdown"));
    const cAds = cols.find((c) => /^presupuesto mensual/i.test(c.title) && c.type === "number");
    const venta = notas.find((n) => n.itemId === id && (n.after as { venta?: DetalleVenta })?.venta)?.after as { venta?: DetalleVenta } | undefined;
    const form = notas.find((n) => n.itemId === id && (n.after as { typeform?: string })?.typeform)?.after as { texto?: string } | undefined;
    const labelInd = cInd ? ((cInd.settings ?? {}) as SettingsColumna).labels?.find((l) => l.id === (Array.isArray(values[cInd.id]) ? (values[cInd.id] as string[])[0] : values[cInd.id]))?.label : undefined;
    const ads = cAds && typeof values[cAds.id] === "number" ? `Ads ${formatearNumero(values[cAds.id] as number, "moneda")}/mes` : undefined;
    const vende = form?.texto ? respuestaDelResumen(form.texto, /qu[eé] vendes|producto|servicio/i) : undefined;
    const info: InfoCliente = {
      pago: resumenVenta(venta?.venta) ?? undefined,
      vende: vende ? (vende.length > 90 ? vende.slice(0, 88) + "…" : vende) : undefined,
      industria: labelInd ?? (form?.texto ? respuestaDelResumen(form.texto, /industria/i) : undefined),
      ads,
    };
    if (Object.values(info).some(Boolean)) porItem.set(id, info);
  }
  for (const p of objetivo) {
    const info = porItem.get(p.itemId);
    if (info) p.info = info;
  }
}

export async function todosLosTableros(): Promise<string[]> {
  const d = await db();
  return (await d.select({ id: pulseBoards.id }).from(pulseBoards).where(eq(pulseBoards.privado, false))).map((b) => b.id);
}
