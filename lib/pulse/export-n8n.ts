import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "./db";
import { pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "./schema";
import type { EtiquetaStatus, ValorCelda, ValorLink } from "./types";

// Export de tableros de Pulse con la MISMA forma que devolvía la API de Monday, para que los
// workflows de n8n que leían Monday directo (Agente Cobros, Recordatorio 60-90, Agente supervisor)
// cambien solo la URL: `items[].{ id, name, group, column_values[].{ id, column.title, text, value,
// display_value } }`. `id` es el monday_id del item (o `pulse:<uuid>` si nació en Pulse); las
// columnas llevan su monday id y su título; los índices siguen el orden de las columnas del tablero.
//
// Mirrors: Monday tenía columnas "espejo" (p. ej. TESORERÍA.finaliza acuerdo ← cliente →
// LEVEL UP MEDIA."Finalización de acuerdo") que Pulse no migra; se recalculan acá.

export interface ColumnValueN8n {
  id: string;
  type: string;
  column: { title: string };
  text: string;
  value: ValorCelda;
  display_value: string;
}
export interface ItemN8n {
  id: string;
  pulseId: string;
  name: string;
  group: { id: string; title: string };
  column_values: ColumnValueN8n[];
  updated_at: string;
}

const MIRRORS: Record<string, { id: string; title: string; via: string; campo: string }[]> = {
  tesoreria: [{ id: "lookup_mkpqyfk5", title: "finaliza acuerdo", via: "cliente", campo: "Finalización de acuerdo" }],
};

type ColumnaFila = typeof pulseColumns.$inferSelect;

function textoDe(col: ColumnaFila, v: ValorCelda | undefined, usuarios: Map<string, { nombre: string; email: string }>, nombresRel: Map<string, string>): string {
  if (v === undefined || v === null) return "";
  switch (col.type) {
    case "status":
    case "dropdown": {
      const labels = (col.settings?.labels ?? []) as EtiquetaStatus[];
      const ids = Array.isArray(v) ? v : [String(v)];
      return ids.map((id) => labels.find((l) => l.id === id)?.label ?? String(id)).join(", ");
    }
    case "people":
      return (Array.isArray(v) ? v : []).map((id) => usuarios.get(String(id))?.nombre ?? "").filter(Boolean).join(", ");
    case "relation":
      return (Array.isArray(v) ? v : []).map((id) => nombresRel.get(String(id)) ?? "").filter(Boolean).join(", ");
    case "checkbox":
      return v ? "v" : "";
    case "link":
      return typeof v === "object" && !Array.isArray(v) ? ((v as ValorLink).text || (v as ValorLink).url || "") : String(v);
    case "file":
      return Array.isArray(v) ? `${v.length} archivo(s)` : "";
    default:
      return Array.isArray(v) ? v.join(", ") : String(v);
  }
}

export async function exportarTablero(slug: string, filtro: { idMonday?: string } = {}): Promise<{ board: { id: string; slug: string; nombre: string; mondayId: string | null }; items: ItemN8n[] } | null> {
  const d = await db();
  const board = await d.query.pulseBoards.findFirst({ where: eq(pulseBoards.slug, slug) });
  if (!board) return null;
  const [cols, grupos, items] = await Promise.all([
    d.select().from(pulseColumns).where(eq(pulseColumns.boardId, board.id)).orderBy(asc(pulseColumns.position)),
    d.select().from(pulseGroups).where(eq(pulseGroups.boardId, board.id)),
    filtro.idMonday
      ? filtro.idMonday.startsWith("pulse:")
        ? d.select().from(pulseItems).where(and(eq(pulseItems.boardId, board.id), eq(pulseItems.id, filtro.idMonday.slice(6))))
        : d.select().from(pulseItems).where(and(eq(pulseItems.boardId, board.id), eq(pulseItems.mondayId, filtro.idMonday)))
      : d.select().from(pulseItems).where(eq(pulseItems.boardId, board.id)).orderBy(asc(pulseItems.groupId), asc(pulseItems.position)),
  ]);
  const grupoDe = new Map(grupos.map((g) => [g.id, g]));

  // Usuarios (people) y nombres de items relacionados (relation).
  const userIds = new Set<string>();
  const relIds = new Set<string>();
  const colsPeople = cols.filter((c) => c.type === "people");
  const colsRel = cols.filter((c) => c.type === "relation");
  for (const i of items) {
    for (const c of colsPeople) for (const u of (Array.isArray(i.values?.[c.id]) ? (i.values[c.id] as string[]) : [])) userIds.add(u);
    for (const c of colsRel) for (const r of (Array.isArray(i.values?.[c.id]) ? (i.values[c.id] as string[]) : [])) relIds.add(r);
  }
  const usuarios = new Map(
    (userIds.size ? await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre, email: pulseUsers.email }).from(pulseUsers).where(inArray(pulseUsers.id, [...userIds])) : []).map((u) => [u.id, u]),
  );
  const relacionados = relIds.size ? await d.select({ id: pulseItems.id, name: pulseItems.name, boardId: pulseItems.boardId, values: pulseItems.values }).from(pulseItems).where(inArray(pulseItems.id, [...relIds])) : [];
  const nombresRel = new Map(relacionados.map((r) => [r.id, r.name]));

  // Mirrors: columna del item relacionado, resuelta por título en el tablero destino.
  const mirrors = MIRRORS[slug] ?? [];
  const colMirrorDestino = new Map<string, ColumnaFila | undefined>();
  if (mirrors.length && relacionados.length) {
    const boardsDestino = [...new Set(relacionados.map((r) => r.boardId))];
    const colsDestino = await d.select().from(pulseColumns).where(inArray(pulseColumns.boardId, boardsDestino));
    for (const m of mirrors) colMirrorDestino.set(m.id, colsDestino.find((c) => c.title.trim().toLowerCase() === m.campo.toLowerCase()));
  }
  const relPorId = new Map(relacionados.map((r) => [r.id, r]));

  const salida: ItemN8n[] = items.map((i) => {
    const v = i.values ?? {};
    const column_values: ColumnValueN8n[] = cols.map((c) => {
      const val = v[c.id] ?? null;
      const text = textoDe(c, val, usuarios, nombresRel);
      return { id: c.mondayId ?? c.id, type: c.type, column: { title: c.title }, text, value: val, display_value: text };
    });
    for (const m of mirrors) {
      const colVia = cols.find((c) => c.title.trim().toLowerCase() === m.via.toLowerCase());
      const destino = colMirrorDestino.get(m.id);
      const ids = colVia && Array.isArray(v[colVia.id]) ? (v[colVia.id] as string[]) : [];
      const textos = destino ? ids.map((id) => relPorId.get(id)?.values?.[destino.id]).filter((x) => x !== undefined && x !== null && x !== "").map(String) : [];
      const text = textos.join(", ");
      // Monday ponía los mirrors en su posición original; acá va al final pero se busca por título.
      column_values.push({ id: m.id, type: "mirror", column: { title: m.title }, text, value: text, display_value: text });
    }
    const g = grupoDe.get(i.groupId);
    return { id: i.mondayId ?? `pulse:${i.id}`, pulseId: i.id, name: i.name, group: { id: g?.mondayId ?? g?.id ?? "", title: g?.title ?? "" }, column_values, updated_at: i.updatedAt.toISOString() };
  });
  return { board: { id: board.id, slug: board.slug, nombre: board.nombre, mondayId: board.mondayId }, items: salida };
}

// Equipo para la tabla `equipo` de NocoDB: tablero Cumpleaños (persona, ID-slack, email, rol, fecha)
// + cualquier usuario de Pulse que aparezca como admin/estratega (para que los links de clientes
// siempre encuentren a la persona). Llave: ID-monday del usuario; respaldo: email.
export interface PersonaEquipo {
  idMonday: string | null;
  nombre: string;
  email: string | null;
  idSlack: string | null;
  idColumnaCumpleanos: string | null; // monday id del item de Cumpleaños (llave vieja de NocoDB)
  fecha: string | null;
  rol: string | null;
  activo: boolean;
}

export async function exportarEquipo(): Promise<PersonaEquipo[]> {
  const d = await db();
  const porClave = new Map<string, PersonaEquipo>();
  const clave = (p: { idMonday: string | null; email: string | null; nombre: string }) => p.idMonday ?? p.email?.toLowerCase() ?? p.nombre.toLowerCase();

  const cumple = await exportarTablero("cumpleanos");
  if (cumple) {
    const buscar = (cv: ColumnValueN8n[], titulo: string) => cv.find((c) => c.column.title.trim().toLowerCase() === titulo.toLowerCase());
    const usuariosIds = new Set<string>();
    for (const it of cumple.items) for (const id of (buscar(it.column_values, "Personas")?.value as string[] | null) ?? []) usuariosIds.add(id);
    const us = new Map((usuariosIds.size ? await d.select().from(pulseUsers).where(inArray(pulseUsers.id, [...usuariosIds])) : []).map((u) => [u.id, u]));
    for (const it of cumple.items) {
      if (it.group.title.trim().toLowerCase() !== "cumpleañeros") continue; // "Aniversario" no es gente
      const uid = ((buscar(it.column_values, "Personas")?.value as string[] | null) ?? [])[0];
      const u = uid ? us.get(uid) : undefined;
      const p: PersonaEquipo = {
        idMonday: u?.mondayId ?? null,
        nombre: it.name,
        email: (buscar(it.column_values, "Email")?.text || u?.email || null)?.trim().toLowerCase() ?? null,
        idSlack: buscar(it.column_values, "ID-slack")?.text?.trim() || null,
        idColumnaCumpleanos: it.id.startsWith("pulse:") ? null : it.id,
        fecha: buscar(it.column_values, "Fecha")?.text || null,
        rol: buscar(it.column_values, "Rol")?.text || null,
        activo: u ? u.activo : true,
      };
      porClave.set(clave(p), p);
    }
  }
  // Usuarios de Pulse con monday_id que no estén ya (admins/estrategas asignados a clientes).
  const todos = await d.select().from(pulseUsers);
  for (const u of todos) {
    if (!u.mondayId) continue;
    const k = u.mondayId;
    const norm = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
    const existente =
      porClave.get(k) ??
      [...porClave.values()].find((p) => (p.email && p.email === u.email.toLowerCase()) || norm(p.nombre) === norm(u.nombre));
    if (existente && !existente.email) existente.email = u.email.toLowerCase();
    if (existente) {
      if (!existente.idMonday) existente.idMonday = u.mondayId;
      continue;
    }
    porClave.set(k, { idMonday: u.mondayId, nombre: u.nombre, email: u.email.toLowerCase(), idSlack: null, idColumnaCumpleanos: null, fecha: null, rol: null, activo: u.activo });
  }
  return [...porClave.values()];
}
