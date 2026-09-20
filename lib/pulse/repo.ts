import "server-only";

import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";

import { aUsuario } from "./auth";
import { db } from "./db";
import {
  pulseActivity,
  pulseBoards,
  pulseColumns,
  pulseFiles,
  pulseGroups,
  pulseItems,
  pulseUsers,
} from "./schema";
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
  };
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

export async function listarBoards(): Promise<(Board & { items: number })[]> {
  const d = await db();
  const rows = await d
    .select({ board: pulseBoards, items: count(pulseItems.id) })
    .from(pulseBoards)
    .leftJoin(pulseItems, eq(pulseItems.boardId, pulseBoards.id))
    .groupBy(pulseBoards.id)
    .orderBy(asc(pulseBoards.position), asc(pulseBoards.nombre));
  return rows.map((r) => ({ ...aBoard(r.board), items: Number(r.items) }));
}

export async function leerBoardCompleto(slug: string): Promise<BoardCompleto | null> {
  const d = await db();
  const b = await d.query.pulseBoards.findFirst({ where: eq(pulseBoards.slug, slug) });
  if (!b) return null;
  const [columns, groups, items, usuarios, archivos] = await Promise.all([
    d.select().from(pulseColumns).where(eq(pulseColumns.boardId, b.id)).orderBy(asc(pulseColumns.position)),
    d.select().from(pulseGroups).where(eq(pulseGroups.boardId, b.id)).orderBy(asc(pulseGroups.position)),
    d.select().from(pulseItems).where(eq(pulseItems.boardId, b.id)).orderBy(asc(pulseItems.groupId), asc(pulseItems.position)),
    d.select().from(pulseUsers).where(eq(pulseUsers.activo, true)).orderBy(asc(pulseUsers.nombre)),
    d
      .select({ f: pulseFiles })
      .from(pulseFiles)
      .innerJoin(pulseItems, eq(pulseItems.id, pulseFiles.itemId))
      .where(eq(pulseItems.boardId, b.id)),
  ]);
  return {
    board: aBoard(b),
    columns: columns.map(aColumna),
    groups: groups.map(aGrupo),
    items: items.map(aItem),
    usuarios: usuarios.map(aUsuario),
    archivos: archivos.map((r) => aArchivo(r.f)),
  };
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

export async function eliminarBoard(id: string): Promise<void> {
  const d = await db();
  const archivos = await d
    .select({ path: pulseFiles.storagePath })
    .from(pulseFiles)
    .innerJoin(pulseItems, eq(pulseItems.id, pulseFiles.itemId))
    .where(eq(pulseItems.boardId, id));
  // Los grupos tienen FK restrict desde items: borrar items primero, el resto cascadea.
  await d.delete(pulseItems).where(eq(pulseItems.boardId, id));
  await d.delete(pulseBoards).where(eq(pulseBoards.id, id));
  await borrarArchivos(archivos.map((a) => a.path));
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
}): Promise<{ updatedAt: string; before: ValorCelda }> {
  const d = await db();
  return d.transaction(async (tx) => {
    const [fila] = await tx
      .select({ boardId: pulseItems.boardId, before: sql<ValorCelda>`${pulseItems.values} -> ${p.columnId}` })
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
    return { updatedAt: u.updatedAt.toISOString(), before: fila.before ?? null };
  });
}

export async function renombrarItem(p: { itemId: string; name: string; userId: string }): Promise<void> {
  const d = await db();
  const [antes] = await d.select({ name: pulseItems.name, boardId: pulseItems.boardId }).from(pulseItems).where(eq(pulseItems.id, p.itemId));
  if (!antes) throw new Error("El elemento no existe");
  await d.update(pulseItems).set({ name: p.name, updatedAt: new Date() }).where(eq(pulseItems.id, p.itemId));
  await registrarActividad({ itemId: p.itemId, boardId: antes.boardId, tipo: "nombre", before: antes.name, after: p.name, userId: p.userId });
}

export async function moverItems(p: { itemIds: string[]; groupId: string; userId: string }): Promise<void> {
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
      await registrarActividad({ itemId: it.id, boardId: g.boardId, tipo: "mover", before: it.groupId, after: p.groupId, userId: p.userId });
    }
  }
}

export async function eliminarItems(p: { itemIds: string[]; userId: string }): Promise<number> {
  if (!p.itemIds.length) return 0;
  const d = await db();
  const archivos = await d.select({ path: pulseFiles.storagePath }).from(pulseFiles).where(inArray(pulseFiles.itemId, p.itemIds));
  const borrados = await d.delete(pulseItems).where(inArray(pulseItems.id, p.itemIds)).returning({ id: pulseItems.id });
  await borrarArchivos(archivos.map((a) => a.path));
  return borrados.length;
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

export async function actualizarColumna(columnId: string, patch: { title?: string; settings?: SettingsColumna; width?: number }): Promise<Columna> {
  const d = await db();
  const [c] = await d.update(pulseColumns).set(patch).where(eq(pulseColumns.id, columnId)).returning();
  if (!c) throw new Error("La columna no existe");
  return aColumna(c);
}

export async function eliminarColumna(columnId: string): Promise<void> {
  const d = await db();
  const [c] = await d.select().from(pulseColumns).where(eq(pulseColumns.id, columnId));
  if (!c) return;
  const archivos = await d.select({ path: pulseFiles.storagePath }).from(pulseFiles).where(eq(pulseFiles.columnId, columnId));
  await d.update(pulseItems).set({ values: sql`${pulseItems.values} - ${columnId}` }).where(eq(pulseItems.boardId, c.boardId));
  await d.delete(pulseColumns).where(eq(pulseColumns.id, columnId));
  await borrarArchivos(archivos.map((a) => a.path));
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

export async function eliminarArchivo(id: string): Promise<void> {
  const d = await db();
  const [f] = await d.delete(pulseFiles).where(eq(pulseFiles.id, id)).returning();
  if (f) await borrarArchivos([f.storagePath]);
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

export async function crearUsuario(p: { email: string; nombre: string; rol: "admin" | "miembro"; passwordHash: string | null; color?: ColorPulse }): Promise<UsuarioPulse> {
  const d = await db();
  const [u] = await d
    .insert(pulseUsers)
    .values({ email: p.email.toLowerCase().trim(), nombre: p.nombre, rol: p.rol, passwordHash: p.passwordHash, color: p.color ?? null })
    .returning();
  return aUsuario(u);
}

export async function actualizarUsuario(id: string, patch: { nombre?: string; rol?: "admin" | "miembro"; activo?: boolean; passwordHash?: string; color?: ColorPulse }): Promise<void> {
  const d = await db();
  await d.update(pulseUsers).set(patch).where(eq(pulseUsers.id, id));
}
