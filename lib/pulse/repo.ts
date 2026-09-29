import "server-only";

import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";

import { aUsuario } from "./auth";
import { db } from "./db";
import {
  pulseActivity,
  pulseBoardBloqueos,
  pulseBoardMembers,
  pulseBoards,
  pulseColumns,
  pulseFiles,
  pulseGroups,
  pulseItems,
  pulseReglas,
  pulseUsers,
  pulseVistas,
} from "./schema";
import { esCalculada, recalcular } from "./formulas";
import { borrarComo } from "./papelera";
import { respuestaDelResumen } from "./mi-dia";
import { cuentaComoNuevo, detalleDePago, diaDeSlack, diaPR, montoDePago, nichoDe, type ClienteReciente } from "./ultimos-clientes";
import { borrarArchivos } from "./storage";
import type {
  Actividad,
  ArchivoPulse,
  Board,
  BoardCompleto,
  ColorPulse,
  Columna,
  Grupo,
  Item,
  RolUsuario,
  SettingsColumna,
  TipoActividad,
  TipoColumna,
  UsuarioPulse,
  ValorCelda,
} from "./types";

// Data access de Pulse. Cada función hace pocas queries fijas (nunca N+1): un tablero
// completo son 6 SELECTs sin importar cuántas filas tenga.

const GAP = 1024;

function aBoard(b: typeof pulseBoards.$inferSelect): Board {
  return {
    id: b.id,
    slug: b.slug,
    nombre: b.nombre,
    descripcion: b.descripcion,
    color: (b.color as ColorPulse) ?? null,
    position: b.position,
    privado: b.privado,
  };
}

// ---------- Acceso a tableros ----------
// Un tablero privado lo ven los admins y los usuarios en pulse_board_members. Todo lo
// demás (lectura y escritura) pasa por acá: la UI solo esconde, esto es lo que protege.

export async function boardsVisibles(u: UsuarioPulse): Promise<Set<string>> {
  const { esSoloRitmo } = await import("./auth");
  if (u.rol === "miembro" && (await esSoloRitmo(u.id))) return new Set(); // empleado solo de Ritmo: ningún tablero
  const { tipoAcceso } = await import("./auth");
  if ((await tipoAcceso(u.id, u.rol)) === "solo_leads") return new Set(); // equipo de ventas: solo Leads, nunca clientes
  const d = await db();
  const rows = await d.select({ id: pulseBoards.id, privado: pulseBoards.privado }).from(pulseBoards);
  const visibles = new Set(rows.filter((b) => !b.privado).map((b) => b.id));
  if (u.rol === "admin") return new Set(rows.map((b) => b.id));
  const [m, bloqueos] = await Promise.all([
    d.select({ boardId: pulseBoardMembers.boardId }).from(pulseBoardMembers).where(eq(pulseBoardMembers.userId, u.id)),
    d.select({ boardId: pulseBoardBloqueos.boardId }).from(pulseBoardBloqueos).where(eq(pulseBoardBloqueos.userId, u.id)),
  ]);
  for (const r of m) visibles.add(r.boardId);
  for (const r of bloqueos) visibles.delete(r.boardId);
  return visibles;
}

export async function puedeVerBoard(u: UsuarioPulse, boardId: string): Promise<boolean> {
  const { esSoloRitmo, tipoAcceso } = await import("./auth");
  if (u.rol === "miembro" && (await esSoloRitmo(u.id))) return false;
  if ((await tipoAcceso(u.id, u.rol)) === "solo_leads") return false; // equipo de ventas: nunca tableros de clientes
  const d = await db();
  const [b] = await d.select({ privado: pulseBoards.privado }).from(pulseBoards).where(eq(pulseBoards.id, boardId));
  if (!b) return false;
  if (u.rol === "admin") return true;
  const [bloqueo] = await d.select({ userId: pulseBoardBloqueos.userId }).from(pulseBoardBloqueos).where(and(eq(pulseBoardBloqueos.boardId, boardId), eq(pulseBoardBloqueos.userId, u.id)));
  if (bloqueo) return false;
  if (!b.privado) return true;
  const [m] = await d.select({ userId: pulseBoardMembers.userId }).from(pulseBoardMembers).where(and(eq(pulseBoardMembers.boardId, boardId), eq(pulseBoardMembers.userId, u.id)));
  return !!m;
}

// Resuelve el tablero al que pertenece cada tipo de cosa (para verificar acceso en actions).
export async function boardDe(ref: { itemId?: string; groupId?: string; columnId?: string; fileId?: string }): Promise<string | null> {
  const d = await db();
  if (ref.itemId) return (await d.select({ b: pulseItems.boardId }).from(pulseItems).where(eq(pulseItems.id, ref.itemId)))[0]?.b ?? null;
  if (ref.groupId) return (await d.select({ b: pulseGroups.boardId }).from(pulseGroups).where(eq(pulseGroups.id, ref.groupId)))[0]?.b ?? null;
  if (ref.columnId) return (await d.select({ b: pulseColumns.boardId }).from(pulseColumns).where(eq(pulseColumns.id, ref.columnId)))[0]?.b ?? null;
  if (ref.fileId) {
    const [r] = await d.select({ b: pulseItems.boardId }).from(pulseFiles).innerJoin(pulseItems, eq(pulseItems.id, pulseFiles.itemId)).where(eq(pulseFiles.id, ref.fileId));
    return r?.b ?? null;
  }
  return null;
}

export async function leerMiembrosBoard(boardId: string): Promise<string[]> {
  const d = await db();
  return (await d.select({ userId: pulseBoardMembers.userId }).from(pulseBoardMembers).where(eq(pulseBoardMembers.boardId, boardId))).map((r) => r.userId);
}

export async function guardarAccesoBoard(boardId: string, p: { privado: boolean; miembros: string[] }): Promise<void> {
  const d = await db();
  await d.update(pulseBoards).set({ privado: p.privado }).where(eq(pulseBoards.id, boardId));
  await d.delete(pulseBoardMembers).where(eq(pulseBoardMembers.boardId, boardId));
  if (p.miembros.length) await d.insert(pulseBoardMembers).values(p.miembros.map((userId) => ({ boardId, userId })));
}
function aColumna(c: typeof pulseColumns.$inferSelect): Columna {
  return { id: c.id, boardId: c.boardId, title: c.title, type: c.type as TipoColumna, settings: c.settings ?? {}, position: c.position, width: c.width };
}
function aGrupo(g: typeof pulseGroups.$inferSelect): Grupo {
  return { id: g.id, boardId: g.boardId, title: g.title, color: g.color as ColorPulse, position: g.position, colapsadoDefault: g.colapsadoDefault };
}
function aItem(i: typeof pulseItems.$inferSelect): Item {
  return { id: i.id, boardId: i.boardId, groupId: i.groupId, name: i.name, position: i.position, values: i.values ?? {}, updatedAt: i.updatedAt.toISOString() };
}
function aArchivo(f: typeof pulseFiles.$inferSelect): ArchivoPulse {
  return { id: f.id, itemId: f.itemId, columnId: f.columnId, nombre: f.nombre, mime: f.mime, bytes: f.bytes };
}

// ---------- Tableros ----------

export type BoardResumen = Board & { items: number; grupos: { id: string; title: string; color: ColorPulse; items: number }[]; actualizadoEl: string | null };

export async function listarBoards(u?: UsuarioPulse): Promise<BoardResumen[]> {
  const d = await db();
  const visibles = u ? await boardsVisibles(u) : null;
  const [todos, porGrupo, ultimos] = await Promise.all([
    d.select().from(pulseBoards).orderBy(asc(pulseBoards.position), asc(pulseBoards.nombre)),
    d
      .select({ g: pulseGroups, items: count(pulseItems.id) })
      .from(pulseGroups)
      .leftJoin(pulseItems, eq(pulseItems.groupId, pulseGroups.id))
      .groupBy(pulseGroups.id)
      .orderBy(asc(pulseGroups.position)),
    d.select({ boardId: pulseItems.boardId, max: sql<Date>`max(${pulseItems.updatedAt})` }).from(pulseItems).groupBy(pulseItems.boardId),
  ]);
  const boards = visibles ? todos.filter((b) => visibles.has(b.id)) : todos;
  return boards.map((b) => {
    const grupos = porGrupo.filter((r) => r.g.boardId === b.id).map((r) => ({ id: r.g.id, title: r.g.title, color: r.g.color as ColorPulse, items: Number(r.items) }));
    const u = ultimos.find((r) => r.boardId === b.id)?.max;
    return { ...aBoard(b), items: grupos.reduce((a, g) => a + g.items, 0), grupos, actualizadoEl: u ? new Date(u).toISOString() : null };
  });
}

// Los items de los grupos que arrancan colapsados (`colapsadoDefault`, p. ej. OFFBOARDED con
// 700+ filas) viajan SIN `values` (parcial: true) para que el tablero abra rápido; el cliente
// los pide con leerItemsGrupo al expandir el grupo o al buscar/filtrar.
export async function leerBoardCompleto(slug: string, opciones: { liviano?: boolean; usuario?: UsuarioPulse } = {}): Promise<BoardCompleto | null> {
  const d = await db();
  const b = await d.query.pulseBoards.findFirst({ where: eq(pulseBoards.slug, slug) });
  if (!b) return null;
  if (opciones.usuario && !(await puedeVerBoard(opciones.usuario, b.id))) return null;
  const miembros = opciones.usuario?.rol === "admin" ? await leerMiembrosBoard(b.id) : undefined;
  const groups = await d.select().from(pulseGroups).where(eq(pulseGroups.boardId, b.id)).orderBy(asc(pulseGroups.position));
  const livianos = opciones.liviano === false ? [] : groups.filter((g) => g.colapsadoDefault).map((g) => g.id);
  const valuesExpr = livianos.length
    ? sql<Record<string, ValorCelda>>`case when ${pulseItems.groupId} in ${livianos} then '{}'::jsonb else ${pulseItems.values} end`
    : pulseItems.values;
  const [columns, items, usuarios, archivos] = await Promise.all([
    d.select().from(pulseColumns).where(eq(pulseColumns.boardId, b.id)).orderBy(asc(pulseColumns.position)),
    d
      .select({ id: pulseItems.id, boardId: pulseItems.boardId, groupId: pulseItems.groupId, name: pulseItems.name, position: pulseItems.position, values: valuesExpr, updatedAt: pulseItems.updatedAt })
      .from(pulseItems)
      .where(eq(pulseItems.boardId, b.id))
      .orderBy(asc(pulseItems.groupId), asc(pulseItems.position)),
    d.select().from(pulseUsers).where(eq(pulseUsers.activo, true)).orderBy(asc(pulseUsers.nombre)),
    d
      .select({ f: pulseFiles })
      .from(pulseFiles)
      .innerJoin(pulseItems, eq(pulseItems.id, pulseFiles.itemId))
      .where(eq(pulseItems.boardId, b.id)),
  ]);
  const parciales = new Set(livianos);
  return {
    board: { ...aBoard(b), ...(miembros ? { miembros } : {}) },
    columns: columns.map(aColumna),
    groups: groups.map(aGrupo),
    items: items.map((i) => ({ ...aItem({ ...i, mondayId: null, createdBy: null, createdAt: i.updatedAt }), ...(parciales.has(i.groupId) ? { parcial: true } : {}) })),
    usuarios: usuarios.map(aUsuario),
    archivos: archivos.map((r) => aArchivo(r.f)),
  };
}

export async function leerItemsGrupo(groupId: string): Promise<Item[]> {
  const d = await db();
  const rows = await d.select().from(pulseItems).where(eq(pulseItems.groupId, groupId)).orderBy(asc(pulseItems.position));
  return rows.map(aItem);
}

export async function crearBoard(p: { nombre: string; slug: string; color?: ColorPulse }): Promise<Board> {
  const d = await db();
  const [{ max }] = await d.select({ max: sql<number>`coalesce(max(${pulseBoards.position}), 0)` }).from(pulseBoards);
  const [b] = await d
    .insert(pulseBoards)
    .values({ nombre: p.nombre, slug: p.slug, color: p.color ?? "bright_blue", position: Number(max) + 1 })
    .returning();
  await d.insert(pulseGroups).values({ boardId: b.id, title: "Nuevo grupo", color: "bright_blue", position: 0 });
  await d.insert(pulseColumns).values([
    { boardId: b.id, title: "Personas", type: "people", settings: { multiple: true }, position: 0, width: 120 },
    {
      boardId: b.id,
      title: "Estado",
      type: "status",
      settings: {
        labels: [
          { id: "listo", label: "Listo", color: "green", esDone: true },
          { id: "proceso", label: "En proceso", color: "orange" },
          { id: "detenido", label: "Detenido", color: "red" },
        ],
      },
      position: 1,
      width: 150,
    },
    { boardId: b.id, title: "Fecha", type: "date", settings: {}, position: 2, width: 140 },
  ]);
  return aBoard(b);
}

export async function actualizarBoard(id: string, patch: { nombre?: string; descripcion?: string | null; color?: ColorPulse }): Promise<void> {
  const d = await db();
  await d.update(pulseBoards).set(patch).where(eq(pulseBoards.id, id));
}

export async function eliminarBoard(id: string, userId?: string): Promise<string | null> {
  const d = await db();
  const archivos = await d
    .select({ path: pulseFiles.storagePath })
    .from(pulseFiles)
    .innerJoin(pulseItems, eq(pulseItems.id, pulseFiles.itemId))
    .where(eq(pulseItems.boardId, id));
  // Los grupos tienen FK restrict desde items: borrar items primero, el resto cascadea. Todo en una
  // transacción = un solo lote en la papelera (se restaura completo).
  const { lote } = await borrarComo(userId ?? "", async (tx) => {
    await tx.delete(pulseItems).where(eq(pulseItems.boardId, id));
    await tx.delete(pulseBoards).where(eq(pulseBoards.id, id));
  });
  await borrarArchivos(archivos.map((a) => a.path));
  return lote;
}

// ---------- Items ----------

export async function crearItem(p: {
  boardId: string;
  groupId: string;
  name: string;
  userId: string;
  values?: Record<string, ValorCelda>;
  alInicio?: boolean;
}): Promise<Item> {
  const d = await db();
  const [{ pos }] = await d
    .select({ pos: p.alInicio ? sql<number>`coalesce(min(${pulseItems.position}), ${GAP})` : sql<number>`coalesce(max(${pulseItems.position}), 0)` })
    .from(pulseItems)
    .where(eq(pulseItems.groupId, p.groupId));
  const position = p.alInicio ? Number(pos) - GAP : Number(pos) + GAP;
  const [i] = await d
    .insert(pulseItems)
    .values({ boardId: p.boardId, groupId: p.groupId, name: p.name, position, values: p.values ?? {}, createdBy: p.userId })
    .returning();
  await registrarActividad({ itemId: i.id, boardId: p.boardId, tipo: "crear", after: { name: p.name }, userId: p.userId });
  return aItem(i);
}

export async function actualizarValor(p: {
  itemId: string;
  columnId: string;
  value: ValorCelda;
  userId: string;
}): Promise<{ updatedAt: string; before: ValorCelda; boardId: string; groupId: string }> {
  const d = await db();
  return d.transaction(async (tx) => {
    const [fila] = await tx
      .select({ boardId: pulseItems.boardId, groupId: pulseItems.groupId, before: sql<ValorCelda>`${pulseItems.values} -> ${p.columnId}` })
      .from(pulseItems)
      .where(eq(pulseItems.id, p.itemId))
      .for("update");
    if (!fila) throw new Error("El elemento no existe");
    const nuevo =
      p.value === null
        ? sql`${pulseItems.values} - ${p.columnId}`
        : sql`${pulseItems.values} || ${JSON.stringify({ [p.columnId]: p.value })}::jsonb`;
    const [u] = await tx
      .update(pulseItems)
      .set({ values: nuevo, updatedAt: new Date() })
      .where(eq(pulseItems.id, p.itemId))
      .returning({ updatedAt: pulseItems.updatedAt });
    await tx.insert(pulseActivity).values({
      itemId: p.itemId,
      boardId: fila.boardId,
      columnId: p.columnId,
      tipo: "valor",
      before: fila.before ?? null,
      after: p.value,
      userId: p.userId,
    });
    return { updatedAt: u.updatedAt.toISOString(), before: fila.before ?? null, boardId: fila.boardId, groupId: fila.groupId };
  });
}

export async function renombrarItem(p: { itemId: string; name: string; userId: string }): Promise<void> {
  const d = await db();
  const [antes] = await d.select({ name: pulseItems.name, boardId: pulseItems.boardId }).from(pulseItems).where(eq(pulseItems.id, p.itemId));
  if (!antes) throw new Error("El elemento no existe");
  await d.update(pulseItems).set({ name: p.name, updatedAt: new Date() }).where(eq(pulseItems.id, p.itemId));
  await registrarActividad({ itemId: p.itemId, boardId: antes.boardId, tipo: "nombre", before: antes.name, after: p.name, userId: p.userId });
}

// `porColumna`: la movió una automatización disparada por esa columna (queda en la actividad).
export async function moverItems(p: { itemIds: string[]; groupId: string; userId: string; porColumna?: string }): Promise<void> {
  if (!p.itemIds.length) return;
  const d = await db();
  const [g] = await d.select().from(pulseGroups).where(eq(pulseGroups.id, p.groupId));
  if (!g) throw new Error("El grupo no existe");
  const [{ max }] = await d.select({ max: sql<number>`coalesce(max(${pulseItems.position}), 0)` }).from(pulseItems).where(eq(pulseItems.groupId, p.groupId));
  const antes = await d.select({ id: pulseItems.id, groupId: pulseItems.groupId }).from(pulseItems).where(inArray(pulseItems.id, p.itemIds));
  let pos = Number(max);
  for (const it of antes) {
    pos += GAP;
    await d.update(pulseItems).set({ groupId: p.groupId, position: pos, updatedAt: new Date() }).where(eq(pulseItems.id, it.id));
    if (it.groupId !== p.groupId) {
      await registrarActividad({ itemId: it.id, boardId: g.boardId, columnId: p.porColumna, tipo: "mover", before: it.groupId, after: p.groupId, userId: p.userId });
    }
  }
}

// Borrado = papelera: las filas quedan en pulse_papelera (trigger) y los archivos en papelera/ de
// Storage. Devuelve el lote para "Deshacer".
export async function eliminarItems(p: { itemIds: string[]; userId: string }): Promise<{ n: number; lote: string | null }> {
  if (!p.itemIds.length) return { n: 0, lote: null };
  const d = await db();
  const archivos = await d.select({ path: pulseFiles.storagePath }).from(pulseFiles).where(inArray(pulseFiles.itemId, p.itemIds));
  const { resultado: borrados, lote } = await borrarComo(p.userId, (tx) => tx.delete(pulseItems).where(inArray(pulseItems.id, p.itemIds)).returning({ id: pulseItems.id }));
  await borrarArchivos(archivos.map((a) => a.path));
  return { n: borrados.length, lote };
}

export async function leerItems(ids: string[]): Promise<Item[]> {
  if (!ids.length) return [];
  const d = await db();
  return (await d.select().from(pulseItems).where(inArray(pulseItems.id, ids))).map(aItem);
}

// Columnas calculadas (settings.formula): recalcula el elemento y guarda solo lo que cambió, sin
// actividad (no es un cambio de una persona). Devuelve el elemento al día si hubo cambios.
export async function recalcularItem(itemId: string): Promise<Item | null> {
  const [item] = await leerItems([itemId]);
  if (!item) return null;
  const d = await db();
  const cols = (await d.select().from(pulseColumns).where(eq(pulseColumns.boardId, item.boardId))).map(aColumna);
  if (!cols.some(esCalculada)) return null;
  const cambios = recalcular(cols, item.values);
  if (!Object.keys(cambios).length) return null;
  const [r] = await d
    .update(pulseItems)
    .set({ values: sql`${pulseItems.values} || ${JSON.stringify(cambios)}::jsonb` })
    .where(eq(pulseItems.id, itemId))
    .returning();
  return aItem(r);
}

export async function leerNombresItems(boardId: string): Promise<{ id: string; name: string }[]> {
  const d = await db();
  return d.select({ id: pulseItems.id, name: pulseItems.name }).from(pulseItems).where(eq(pulseItems.boardId, boardId)).orderBy(asc(pulseItems.name));
}

// ---------- Columnas ----------

export async function crearColumna(p: { boardId: string; title: string; type: TipoColumna; settings?: SettingsColumna; width?: number }): Promise<Columna> {
  const d = await db();
  const [{ max }] = await d.select({ max: sql<number>`coalesce(max(${pulseColumns.position}), -1)` }).from(pulseColumns).where(eq(pulseColumns.boardId, p.boardId));
  const [c] = await d
    .insert(pulseColumns)
    .values({ boardId: p.boardId, title: p.title, type: p.type, settings: p.settings ?? {}, position: Number(max) + 1, width: p.width ?? anchoPorTipo(p.type) })
    .returning();
  return aColumna(c);
}

function anchoPorTipo(t: TipoColumna): number {
  return { text: 180, long_text: 260, number: 130, status: 160, dropdown: 200, date: 140, people: 120, checkbox: 90, link: 160, email: 220, phone: 150, file: 160, relation: 200 }[t];
}

export async function leerColumna(columnId: string): Promise<Columna | null> {
  const d = await db();
  const [c] = await d.select().from(pulseColumns).where(eq(pulseColumns.id, columnId));
  return c ? aColumna(c) : null;
}

// Valores distintos que tiene hoy una columna en sus items (para no dejar huérfanas etiquetas).
export async function valoresEnUso(columnId: string): Promise<Set<string>> {
  const d = await db();
  const rows = await d.execute(sql`select distinct values->>${columnId} as v from pulse_items where values ? ${columnId}`);
  const lista = (Array.isArray(rows) ? rows : ((rows as { rows?: unknown[] }).rows ?? [])) as { v: string | null }[];
  const out = new Set<string>();
  for (const r of lista) {
    if (!r.v) continue;
    // dropdown guarda un array JSON de ids; status guarda el id directo
    if (r.v.startsWith("[")) for (const id of JSON.parse(r.v) as string[]) out.add(id);
    else out.add(r.v);
  }
  return out;
}

export async function actualizarColumna(columnId: string, patch: { title?: string; settings?: SettingsColumna; width?: number }): Promise<Columna> {
  const d = await db();
  const [c] = await d.update(pulseColumns).set(patch).where(eq(pulseColumns.id, columnId)).returning();
  if (!c) throw new Error("La columna no existe");
  return aColumna(c);
}

// Los valores de la columna se QUEDAN en cada ficha (nada los lee sin su columna): si se restaura
// la columna desde la papelera, vuelve con todos sus datos.
export async function eliminarColumna(columnId: string, userId?: string): Promise<string | null> {
  const d = await db();
  const [c] = await d.select().from(pulseColumns).where(eq(pulseColumns.id, columnId));
  if (!c) return null;
  const archivos = await d.select({ path: pulseFiles.storagePath }).from(pulseFiles).where(eq(pulseFiles.columnId, columnId));
  const { lote } = await borrarComo(userId ?? "", (tx) => tx.delete(pulseColumns).where(eq(pulseColumns.id, columnId)));
  await borrarArchivos(archivos.map((a) => a.path));
  return lote;
}

export async function reordenarColumnas(boardId: string, ids: string[]): Promise<void> {
  const d = await db();
  await d.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.update(pulseColumns).set({ position: i }).where(and(eq(pulseColumns.id, ids[i]), eq(pulseColumns.boardId, boardId)));
    }
  });
}

// ---------- Grupos ----------

export async function crearGrupo(p: { boardId: string; title: string; color: ColorPulse; despuesDe?: string }): Promise<Grupo> {
  const d = await db();
  const grupos = await d.select().from(pulseGroups).where(eq(pulseGroups.boardId, p.boardId)).orderBy(asc(pulseGroups.position));
  const idx = p.despuesDe ? grupos.findIndex((g) => g.id === p.despuesDe) : grupos.length - 1;
  const orden = [...grupos];
  const [g] = await d.insert(pulseGroups).values({ boardId: p.boardId, title: p.title, color: p.color, position: 0 }).returning();
  orden.splice(idx + 1, 0, g);
  await d.transaction(async (tx) => {
    for (let i = 0; i < orden.length; i++) await tx.update(pulseGroups).set({ position: i }).where(eq(pulseGroups.id, orden[i].id));
  });
  return aGrupo({ ...g, position: idx + 1 });
}

export async function actualizarGrupo(groupId: string, patch: { title?: string; color?: ColorPulse; colapsadoDefault?: boolean }): Promise<void> {
  const d = await db();
  await d.update(pulseGroups).set(patch).where(eq(pulseGroups.id, groupId));
}

export async function reordenarGrupos(boardId: string, ids: string[]): Promise<void> {
  const d = await db();
  await d.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) await tx.update(pulseGroups).set({ position: i }).where(and(eq(pulseGroups.id, ids[i]), eq(pulseGroups.boardId, boardId)));
  });
}

export async function eliminarGrupo(groupId: string): Promise<void> {
  const d = await db();
  const [{ n }] = await d.select({ n: count() }).from(pulseItems).where(eq(pulseItems.groupId, groupId));
  if (Number(n) > 0) throw new Error("El grupo tiene elementos: movelos antes de eliminarlo");
  await d.delete(pulseGroups).where(eq(pulseGroups.id, groupId));
}

// ---------- Actividad ----------

export async function registrarActividad(p: {
  itemId: string;
  boardId: string;
  columnId?: string;
  tipo: TipoActividad;
  before?: unknown;
  after?: unknown;
  userId: string;
}): Promise<void> {
  const d = await db();
  await d.insert(pulseActivity).values({
    itemId: p.itemId,
    boardId: p.boardId,
    columnId: p.columnId ?? null,
    tipo: p.tipo,
    before: p.before ?? null,
    after: p.after ?? null,
    userId: p.userId,
  });
}

export async function leerActividad(itemId: string, limit = 100): Promise<Actividad[]> {
  const d = await db();
  const rows = await d
    .select({ a: pulseActivity, u: { id: pulseUsers.id, nombre: pulseUsers.nombre, color: pulseUsers.color } })
    .from(pulseActivity)
    .leftJoin(pulseUsers, eq(pulseUsers.id, pulseActivity.userId))
    .where(eq(pulseActivity.itemId, itemId))
    .orderBy(desc(pulseActivity.at))
    .limit(limit);
  return rows.map((r) => ({
    id: r.a.id,
    itemId: r.a.itemId,
    columnId: r.a.columnId,
    tipo: r.a.tipo as TipoActividad,
    before: r.a.before,
    after: r.a.after,
    at: r.a.at.toISOString(),
    usuario: r.u?.id ? { id: r.u.id, nombre: r.u.nombre!, color: (r.u.color as ColorPulse) ?? null } : null,
  }));
}

export async function comentar(p: { itemId: string; boardId: string; texto: string; userId: string }): Promise<Actividad> {
  const d = await db();
  const [a] = await d
    .insert(pulseActivity)
    .values({ itemId: p.itemId, boardId: p.boardId, tipo: "comentario", after: { texto: p.texto }, userId: p.userId })
    .returning();
  const [u] = await d.select().from(pulseUsers).where(eq(pulseUsers.id, p.userId));
  return {
    id: a.id,
    itemId: a.itemId,
    columnId: null,
    tipo: "comentario",
    before: null,
    after: a.after,
    at: a.at.toISOString(),
    usuario: u ? { id: u.id, nombre: u.nombre, color: (u.color as ColorPulse) ?? null } : null,
  };
}

// ---------- Archivos ----------

export async function registrarArchivo(p: {
  itemId: string;
  columnId: string;
  nombre: string;
  storagePath: string;
  mime: string | null;
  bytes: number | null;
  userId: string;
}): Promise<ArchivoPulse> {
  const d = await db();
  const [f] = await d.insert(pulseFiles).values({ ...p, uploadedBy: p.userId }).returning();
  return aArchivo(f);
}

export async function leerArchivo(id: string): Promise<(ArchivoPulse & { storagePath: string }) | null> {
  const d = await db();
  const [f] = await d.select().from(pulseFiles).where(eq(pulseFiles.id, id));
  return f ? { ...aArchivo(f), storagePath: f.storagePath } : null;
}

export async function eliminarArchivo(id: string, userId?: string): Promise<string | null> {
  const { resultado, lote } = await borrarComo(userId ?? "", (tx) => tx.delete(pulseFiles).where(eq(pulseFiles.id, id)).returning());
  const [f] = resultado;
  if (f) await borrarArchivos([f.storagePath]);
  return f ? lote : null;
}

// ---------- Usuarios ----------

export async function listarUsuarios(): Promise<UsuarioPulse[]> {
  const d = await db();
  const rows = await d.select().from(pulseUsers).orderBy(asc(pulseUsers.nombre));
  return rows.map(aUsuario);
}

export async function buscarUsuarioPorEmail(email: string) {
  const d = await db();
  return d.query.pulseUsers.findFirst({ where: eq(pulseUsers.email, email.toLowerCase().trim()) });
}

export async function crearUsuario(p: { email: string; nombre: string; rol: RolUsuario; passwordHash: string | null; color?: ColorPulse }): Promise<UsuarioPulse> {
  const d = await db();
  const [u] = await d
    .insert(pulseUsers)
    .values({ email: p.email.toLowerCase().trim(), nombre: p.nombre, rol: p.rol, passwordHash: p.passwordHash, color: p.color ?? null })
    .returning();
  await avisarCuentaFuera(u.email, u.nombre, "Pulse → Configuración");
  return aUsuario(u);
}

/** Cuenta nueva con un correo que no es de la empresa (gmail, etc.): puede ser legítima, pero Elvin se entera (28/sep). */
export async function avisarCuentaFuera(email: string, nombre: string, donde: string): Promise<void> {
  const { esCorreoEmpresa } = await import("./acceso-reglas");
  if (esCorreoEmpresa(email)) return;
  const { alertarElvin } = await import("./seguridad");
  await alertarElvin(`cuenta-fuera:${email}`, `Se creó una cuenta con un correo que no es de la empresa: ${nombre} (${email}), desde ${donde}. Si no la reconoces, desactívala.`).catch(() => {});
}

export async function actualizarUsuario(id: string, patch: { nombre?: string; rol?: RolUsuario; activo?: boolean; passwordHash?: string; color?: ColorPulse }): Promise<void> {
  const d = await db();
  await d.update(pulseUsers).set(patch).where(eq(pulseUsers.id, id));
}

export async function leerUsuario(id: string): Promise<UsuarioPulse | null> {
  const d = await db();
  const [u] = await d.select().from(pulseUsers).where(eq(pulseUsers.id, id));
  return u ? aUsuario(u) : null;
}

// ---------- Automatizaciones ----------

export async function leerEstructura(boardId: string): Promise<{ columns: Columna[]; groups: Grupo[] }> {
  const d = await db();
  const [columns, groups] = await Promise.all([
    d.select().from(pulseColumns).where(eq(pulseColumns.boardId, boardId)),
    d.select().from(pulseGroups).where(eq(pulseGroups.boardId, boardId)),
  ]);
  return { columns: columns.map(aColumna), groups: groups.map(aGrupo) };
}

export async function guardarRegla(p: { id?: string; boardId: string; nombre: string; activa: boolean; cuando: unknown; entonces: unknown; userId: string }) {
  const d = await db();
  if (p.id) {
    const [r] = await d.update(pulseReglas).set({ nombre: p.nombre, activa: p.activa, cuando: p.cuando, entonces: p.entonces }).where(and(eq(pulseReglas.id, p.id), eq(pulseReglas.boardId, p.boardId))).returning();
    if (!r) throw new Error("La automatización no existe");
    return r;
  }
  const [r] = await d.insert(pulseReglas).values({ boardId: p.boardId, nombre: p.nombre, activa: p.activa, cuando: p.cuando, entonces: p.entonces, creadaPor: p.userId }).returning();
  return r;
}

export async function boardDeRegla(id: string): Promise<string | null> {
  const d = await db();
  const [r] = await d.select({ b: pulseReglas.boardId }).from(pulseReglas).where(eq(pulseReglas.id, id));
  return r?.b ?? null;
}

export async function activarRegla(id: string, activa: boolean): Promise<void> {
  const d = await db();
  await d.update(pulseReglas).set({ activa }).where(eq(pulseReglas.id, id));
}

export async function eliminarRegla(id: string): Promise<string> {
  const d = await db();
  const [r] = await d.delete(pulseReglas).where(eq(pulseReglas.id, id)).returning({ nombre: pulseReglas.nombre });
  return r?.nombre ?? "";
}

// ---------- Búsqueda global (⌘K) ----------

export interface ResultadoBusqueda {
  itemId: string;
  nombre: string;
  boardSlug: string;
  boardNombre: string;
  grupo: string;
  detalle: string | null; // dónde coincidió (p. ej. "Empresa: Solar PR")
}

export async function buscarItems(boardIds: string[], q: string, limite = 25): Promise<ResultadoBusqueda[]> {
  const texto = q.trim();
  if (!texto || !boardIds.length) return [];
  const d = await db();
  const digitos = /^[\d\s()+.-]+$/.test(texto) ? texto.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "") : "";
  const patron = `%${texto.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  const rows = await d
    .select({ id: pulseItems.id, name: pulseItems.name, values: pulseItems.values, boardId: pulseItems.boardId, groupTitle: pulseGroups.title, slug: pulseBoards.slug, boardNombre: pulseBoards.nombre })
    .from(pulseItems)
    .innerJoin(pulseGroups, eq(pulseGroups.id, pulseItems.groupId))
    .innerJoin(pulseBoards, eq(pulseBoards.id, pulseItems.boardId))
    .where(
      and(
        inArray(pulseItems.boardId, boardIds),
        // Si buscan un teléfono ("7876401068", "787-640-1068"), se compara solo con los dígitos.
        digitos.length >= 4
          ? sql`(${pulseItems.name} ilike ${patron} or ${pulseItems.values}::text ilike ${patron} or regexp_replace(${pulseItems.values}::text, '[^0-9]', '', 'g') like ${"%" + digitos + "%"})`
          : sql`(${pulseItems.name} ilike ${patron} or ${pulseItems.values}::text ilike ${patron})`,
      ),
    )
    .orderBy(sql`case when ${pulseItems.name} ilike ${texto + "%"} then 0 when ${pulseItems.name} ilike ${patron} then 1 else 2 end`, asc(pulseItems.name))
    .limit(limite);
  if (!rows.length) return [];
  const cols = await d
    .select({ id: pulseColumns.id, title: pulseColumns.title, type: pulseColumns.type })
    .from(pulseColumns)
    .where(inArray(pulseColumns.boardId, [...new Set(rows.map((r) => r.boardId))]));
  const bajo = texto.toLowerCase();
  return rows.map((r) => {
    let detalle: string | null = null;
    if (!r.name.toLowerCase().includes(bajo)) {
      for (const c of cols) {
        if (!["text", "long_text", "email", "phone"].includes(c.type)) continue;
        const v = (r.values as Record<string, unknown>)[c.id];
        if (typeof v === "string" && (v.toLowerCase().includes(bajo) || (digitos && v.replace(/\D/g, "").includes(digitos)))) {
          detalle = `${c.title}: ${v.length > 60 ? v.slice(0, 60) + "…" : v}`;
          break;
        }
      }
    }
    return { itemId: r.id, nombre: r.name, boardSlug: r.slug, boardNombre: r.boardNombre, grupo: r.groupTitle, detalle };
  });
}

// ---------- Vistas guardadas (por persona) ----------

export interface VistaGuardada {
  id: string;
  nombre: string;
  estado: Record<string, unknown>;
}

export async function listarVistas(userId: string, boardId: string): Promise<VistaGuardada[]> {
  const d = await db();
  const rows = await d.select().from(pulseVistas).where(and(eq(pulseVistas.userId, userId), eq(pulseVistas.boardId, boardId))).orderBy(asc(pulseVistas.createdAt));
  return rows.map((r) => ({ id: r.id, nombre: r.nombre, estado: r.estado as Record<string, unknown> }));
}

export async function guardarVista(p: { userId: string; boardId: string; nombre: string; estado: Record<string, unknown> }): Promise<VistaGuardada> {
  const d = await db();
  const [r] = await d.insert(pulseVistas).values(p).returning();
  return { id: r.id, nombre: r.nombre, estado: r.estado as Record<string, unknown> };
}

export async function eliminarVista(userId: string, id: string): Promise<void> {
  const d = await db();
  await d.delete(pulseVistas).where(and(eq(pulseVistas.id, id), eq(pulseVistas.userId, userId)));
}

// ---- Inicio: lo que pasó en la empresa (solo tableros visibles) ----

export interface EventoInicio {
  id: string;
  tipo: string; // crear | valor | mover | comentario | nombre
  at: string;
  usuario: { nombre: string; color: string | null } | null;
  item: { id: string; nombre: string };
  board: { slug: string; nombre: string };
  columna: string | null;
  grupo: string | null; // "mover": grupo destino
  texto: string | null; // "comentario"
}

export async function actividadReciente(boardIds: string[], limite = 14): Promise<EventoInicio[]> {
  if (!boardIds.length) return [];
  const d = await db();
  const filas = await d
    .select({ a: pulseActivity, itemNombre: pulseItems.name, slug: pulseBoards.slug, boardNombre: pulseBoards.nombre, uNombre: pulseUsers.nombre, uColor: pulseUsers.color, uEmail: pulseUsers.email })
    .from(pulseActivity)
    .innerJoin(pulseItems, eq(pulseItems.id, pulseActivity.itemId))
    .innerJoin(pulseBoards, eq(pulseBoards.id, pulseActivity.boardId))
    .leftJoin(pulseUsers, eq(pulseUsers.id, pulseActivity.userId))
    .where(
      and(
        inArray(pulseActivity.boardId, boardIds),
        inArray(pulseActivity.tipo, ["crear", "valor", "mover", "comentario"]),
        // Lo que hace el equipo: los usuarios de sistema (contratos, formularios…) son ruido aquí.
        sql`coalesce(${pulseUsers.email}, '') not like '%@pulse.sistema'`,
      ),
    )
    .orderBy(desc(pulseActivity.at))
    .limit(limite * 3);
  // Una línea por persona+cliente+tipo seguidos (editar 5 celdas del mismo cliente = 1 evento).
  const vistos = new Set<string>();
  const unicas = filas.filter((f) => {
    const k = `${f.a.userId}|${f.a.itemId}|${f.a.tipo}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  }).slice(0, limite);
  const colIds = [...new Set(unicas.map((f) => f.a.columnId).filter((x): x is string => !!x))];
  const grupoIds = [...new Set(unicas.filter((f) => f.a.tipo === "mover" && typeof f.a.after === "string").map((f) => f.a.after as string))];
  const [cols, grupos] = await Promise.all([
    colIds.length ? d.select({ id: pulseColumns.id, title: pulseColumns.title }).from(pulseColumns).where(inArray(pulseColumns.id, colIds)) : Promise.resolve([]),
    grupoIds.length ? d.select({ id: pulseGroups.id, title: pulseGroups.title }).from(pulseGroups).where(inArray(pulseGroups.id, grupoIds)) : Promise.resolve([]),
  ]);
  return unicas.map((f) => ({
    id: f.a.id,
    tipo: f.a.tipo,
    at: new Date(f.a.at).toISOString(),
    usuario: f.uNombre ? { nombre: f.uEmail?.endsWith("@pulse.sistema") ? f.uNombre.replace(/\s*\(automático\)/i, "") : f.uNombre, color: f.uColor } : null,
    item: { id: f.a.itemId, nombre: f.itemNombre },
    board: { slug: f.slug, nombre: f.boardNombre },
    columna: cols.find((c) => c.id === f.a.columnId)?.title ?? null,
    grupo: f.a.tipo === "mover" ? (grupos.find((g) => g.id === f.a.after)?.title ?? null) : null,
    texto: f.a.tipo === "comentario" ? String((f.a.after as { texto?: string } | null)?.texto ?? "").slice(0, 140) : null,
  }));
}

/** Números del Inicio: clientes activos, onboardings en curso y altas del mes (tableros de clientes visibles). */
export async function numerosInicio(boardIds: string[]): Promise<{ activos: number; onboarding: number; nuevosMes: number; totalClientes: number } | null> {
  if (!boardIds.length) return null;
  const d = await db();
  const clientes = await d.select({ id: pulseBoards.id }).from(pulseBoards).where(and(inArray(pulseBoards.id, boardIds), inArray(pulseBoards.slug, ["level-up-media", "ai-borinquen"])));
  if (!clientes.length) return null;
  const ids = clientes.map((c) => c.id);
  const inicioMes = `${new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" }).slice(0, 7)}-01T00:00:00-04:00`;
  const filas = await d
    .select({ grupo: pulseGroups.title, n: sql<number>`count(*)::int`, nuevos: sql<number>`count(*) filter (where ${pulseItems.createdAt} >= ${inicioMes}::timestamptz)::int` })
    .from(pulseItems)
    .innerJoin(pulseGroups, eq(pulseGroups.id, pulseItems.groupId))
    .where(inArray(pulseItems.boardId, ids))
    .groupBy(pulseGroups.title);
  const suma = (re: RegExp) => filas.filter((f) => re.test(f.grupo)).reduce((a, f) => a + Number(f.n), 0);
  return {
    activos: suma(/cliente activo|inner circle|accelerator|marketing|recurrente/i),
    onboarding: suma(/onboarding|an[aá]lisis/i),
    nuevosMes: filas.filter((f) => !/offboard/i.test(f.grupo)).reduce((a, f) => a + Number(f.nuevos), 0),
    totalClientes: filas.filter((f) => !/offboard|baja|inactiv/i.test(f.grupo)).reduce((a, f) => a + Number(f.n), 0),
  };
}

// Últimos clientes que entraron (Level Up y AI Borinquen visibles): cuánto pagaron, nicho, cuándo pagaron y el
// onboarding. Lo que no está en la ficha se toma de la venta en Slack (comentario de Contratos) y del formulario.
export async function ultimosClientes(boardIds: string[], limite = 6): Promise<ClienteReciente[]> {
  if (!boardIds.length) return [];
  const d = await db();
  const boards = await d
    .select({ id: pulseBoards.id, slug: pulseBoards.slug })
    .from(pulseBoards)
    .where(and(inArray(pulseBoards.id, boardIds), inArray(pulseBoards.slug, ["level-up-media", "ai-borinquen"])));
  if (!boards.length) return [];
  const ids = boards.map((b) => b.id);
  const [columnas, filas] = await Promise.all([
    d.select({ id: pulseColumns.id, boardId: pulseColumns.boardId, title: pulseColumns.title, type: pulseColumns.type, settings: pulseColumns.settings }).from(pulseColumns).where(inArray(pulseColumns.boardId, ids)),
    d
      .select({ id: pulseItems.id, boardId: pulseItems.boardId, name: pulseItems.name, values: pulseItems.values, createdAt: pulseItems.createdAt, grupo: pulseGroups.title })
      .from(pulseItems)
      .innerJoin(pulseGroups, eq(pulseGroups.id, pulseItems.groupId))
      .where(inArray(pulseItems.boardId, ids))
      .orderBy(desc(pulseItems.createdAt))
      .limit(limite * 3),
  ]);
  const items = filas.filter((f) => cuentaComoNuevo(f.name, f.grupo)).slice(0, limite);
  if (!items.length) return [];
  const notas = await d
    .select({ itemId: pulseActivity.itemId, after: pulseActivity.after })
    .from(pulseActivity)
    .where(and(inArray(pulseActivity.itemId, items.map((i) => i.id)), sql`(${pulseActivity.after} ? 'venta' or ${pulseActivity.after} ? 'typeform')`))
    .orderBy(desc(pulseActivity.at));

  return items.map((it) => {
    const slug = boards.find((b) => b.id === it.boardId)!.slug;
    const values = (it.values ?? {}) as Record<string, ValorCelda>;
    const cols = columnas.filter((c) => c.boardId === it.boardId);
    const col = (re: RegExp, tipo?: string) => cols.find((c) => re.test(c.title) && (!tipo || c.type === tipo));
    const valor = (re: RegExp, tipo?: string) => {
      const c = col(re, tipo);
      return c ? values[c.id] : undefined;
    };
    const etiqueta = (re: RegExp) => {
      const c = col(re);
      if (!c) return undefined;
      const v = values[c.id];
      const id = Array.isArray(v) ? v[0] : v;
      return ((c.settings ?? {}) as SettingsColumna).labels?.find((l) => l.id === id)?.label || undefined;
    };
    const texto = (re: RegExp) => {
      const v = valor(re);
      return typeof v === "string" && v.trim() ? v.trim() : undefined;
    };
    const venta = notas.find((n) => n.itemId === it.id && (n.after as { venta?: unknown })?.venta)?.after as
      | { venta?: { pago?: string; plan?: string }; ventaTs?: string; texto?: string }
      | undefined;
    const form = notas.find((n) => n.itemId === it.id && (n.after as { typeform?: unknown })?.typeform)?.after as { texto?: string } | undefined;
    const pagoInicial = valor(/^pago inicial/i, "number");
    const acuerdo = texto(/^acuerdo de pago/i);
    const monto = typeof pagoInicial === "number" && pagoInicial > 0 ? pagoInicial : (montoDePago(venta?.venta?.pago) ?? montoDePago(acuerdo));
    const fechaPago = valor(/^fecha del pago inicial/i, "date");
    return {
      itemId: it.id,
      boardSlug: slug,
      marca: slug === "ai-borinquen" ? "AI Borinquen" : "Level Up",
      nombre: it.name,
      empresa: texto(/^empresa$/i),
      nicho: nichoDe(etiqueta(/^industria$/i), form?.texto ? respuestaDelResumen(form.texto, /industria|nicho/i) : undefined),
      monto,
      detallePago: detalleDePago(venta?.venta?.pago, venta?.venta?.plan) ?? (acuerdo && acuerdo.length <= 60 ? acuerdo : undefined) ?? etiqueta(/^tipo de servicio$/i),
      pagoEl: typeof fechaPago === "string" && fechaPago ? fechaPago : (diaDeSlack(venta?.ventaTs) ?? diaDeSlack(venta?.texto)),
      onboardingEl: diaPR(new Date(it.createdAt)),
      grupo: it.grupo,
    };
  });
}
