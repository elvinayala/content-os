import "server-only";

import { and, asc, desc, eq, gt, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";

import { db } from "@/lib/pulse/db";
import { pulseUsers } from "@/lib/pulse/schema";
import type { UsuarioPulse } from "@/lib/pulse/types";

import { clave, normalizarTelefono, ordenEntre, SEMILLA, type EventoWhatsapp, type Marca } from "./reglas";
import { leadsAcceso, leadsActividades, leadsEmbudos, leadsEtapas, leadsHistorial, leadsTratos, leadsWebhookLog, leadsWhatsapp } from "./schema";

export type Embudo = typeof leadsEmbudos.$inferSelect;
export type Etapa = typeof leadsEtapas.$inferSelect;
export type Trato = typeof leadsTratos.$inferSelect;
export type Actividad = typeof leadsActividades.$inferSelect;
export type EntradaHistorial = typeof leadsHistorial.$inferSelect;

export interface TratoTarjeta {
  id: string;
  nombre: string;
  negocio: string | null;
  telefono: string | null;
  valor: number;
  etapaId: string;
  orden: number;
  duenoId: string | null;
  duenoNombre: string | null;
  duenoColor: string | null;
  proximaActividad: string | null;
  etapaDesde: string;
  noLeidos: number;
  origen: string;
  ultimoMensaje: string | null;
}

// ---------- Acceso ------------------------------------------------------------------------------

/** admin/editor de Pulse: todo. El resto, lo que diga leads_acceso (todos | solo sus leads). */
export async function accesoLeads(u: UsuarioPulse, marca: Marca): Promise<{ puede: boolean; alcance: "todos" | "mios" }> {
  if (u.rol === "admin" || u.rol === "editor") return { puede: true, alcance: "todos" };
  const { esSoloRitmo } = await import("../pulse/auth");
  if (await esSoloRitmo(u.id)) return { puede: false, alcance: "mios" }; // empleado solo de Ritmo
  const d = await db();
  const fila = await d.query.leadsAcceso.findFirst({ where: and(eq(leadsAcceso.userId, u.id), eq(leadsAcceso.marca, marca)) });
  return fila ? { puede: true, alcance: fila.alcance === "mios" ? "mios" : "todos" } : { puede: false, alcance: "mios" };
}

export async function marcasConAcceso(u: UsuarioPulse): Promise<Marca[]> {
  if (u.rol === "admin" || u.rol === "editor") return ["level_up", "ai_borinquen"];
  const { esSoloRitmo } = await import("../pulse/auth");
  if (await esSoloRitmo(u.id)) return [];
  const d = await db();
  const filas = await d.select().from(leadsAcceso).where(eq(leadsAcceso.userId, u.id));
  return filas.map((f) => f.marca as Marca);
}

export async function usuariosActivos() {
  const d = await db();
  return d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre, color: pulseUsers.color }).from(pulseUsers).where(eq(pulseUsers.activo, true)).orderBy(asc(pulseUsers.nombre));
}

// ---------- Embudos y etapas --------------------------------------------------------------------

/** Crea los embudos de la marca la primera vez (los que se usaban en Pipedrive). Idempotente. */
export async function asegurarSemilla(marca: Marca): Promise<void> {
  const d = await db();
  const ya = await d.select({ id: leadsEmbudos.id }).from(leadsEmbudos).where(eq(leadsEmbudos.marca, marca)).limit(1);
  if (ya.length) return;
  for (const [i, e] of SEMILLA[marca].entries()) {
    const [emb] = await d.insert(leadsEmbudos).values({ marca, nombre: e.nombre, orden: i, diasEstancado: e.diasEstancado ?? 7 }).returning();
    await d.insert(leadsEtapas).values(e.etapas.map((nombre, j) => ({ embudoId: emb.id, nombre, orden: j })));
  }
}

export async function listarEmbudos(marca: Marca): Promise<Embudo[]> {
  const d = await db();
  return d.select().from(leadsEmbudos).where(and(eq(leadsEmbudos.marca, marca), eq(leadsEmbudos.archivado, false))).orderBy(asc(leadsEmbudos.orden), asc(leadsEmbudos.createdAt));
}

export async function etapasDe(embudoId: string): Promise<Etapa[]> {
  const d = await db();
  return d.select().from(leadsEtapas).where(eq(leadsEtapas.embudoId, embudoId)).orderBy(asc(leadsEtapas.orden));
}

export async function crearEmbudo(marca: Marca, nombre: string, etapas: string[]): Promise<Embudo> {
  const d = await db();
  const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(leadsEmbudos).where(eq(leadsEmbudos.marca, marca));
  const [emb] = await d.insert(leadsEmbudos).values({ marca, nombre, orden: n }).returning();
  const lista = etapas.length ? etapas : ["Nuevo lead", "Contactado", "Cita agendada", "Seguimiento"];
  await d.insert(leadsEtapas).values(lista.map((x, j) => ({ embudoId: emb.id, nombre: x, orden: j })));
  return emb;
}

/** Guarda nombre, días de estancado y la lista de etapas (renombrar, agregar, reordenar, borrar vacías). */
export async function guardarEmbudo(embudoId: string, datos: { nombre: string; diasEstancado: number; etapas: { id?: string; nombre: string }[] }): Promise<{ ok: boolean; error?: string }> {
  const d = await db();
  const actuales = await etapasDe(embudoId);
  const quedan = new Set(datos.etapas.map((e) => e.id).filter(Boolean) as string[]);
  const borrar = actuales.filter((e) => !quedan.has(e.id));
  if (borrar.length) {
    const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(leadsTratos).where(inArray(leadsTratos.etapaId, borrar.map((e) => e.id)));
    if (n > 0) return { ok: false, error: `No puedo borrar una etapa con leads (${n}). Muévelos primero.` };
  }
  if (!datos.etapas.length) return { ok: false, error: "El embudo necesita al menos una etapa." };
  await d.update(leadsEmbudos).set({ nombre: datos.nombre.trim() || "Embudo", diasEstancado: Math.max(0, Math.min(90, datos.diasEstancado)) }).where(eq(leadsEmbudos.id, embudoId));
  for (const e of borrar) await d.delete(leadsEtapas).where(eq(leadsEtapas.id, e.id));
  for (const [i, e] of datos.etapas.entries()) {
    if (e.id) await d.update(leadsEtapas).set({ nombre: e.nombre.trim() || "Etapa", orden: i }).where(eq(leadsEtapas.id, e.id));
    else await d.insert(leadsEtapas).values({ embudoId, nombre: e.nombre.trim() || "Etapa", orden: i });
  }
  return { ok: true };
}

// ---------- Tablero ----------------------------------------------------------------------------

const camposTarjeta = {
  id: leadsTratos.id,
  nombre: leadsTratos.nombre,
  negocio: leadsTratos.negocio,
  telefono: leadsTratos.telefono,
  valor: leadsTratos.valor,
  etapaId: leadsTratos.etapaId,
  orden: leadsTratos.orden,
  duenoId: leadsTratos.duenoId,
  duenoNombre: pulseUsers.nombre,
  duenoColor: pulseUsers.color,
  proximaActividad: leadsTratos.proximaActividad,
  etapaDesde: leadsTratos.etapaDesde,
  noLeidos: leadsTratos.noLeidos,
  origen: leadsTratos.origen,
  ultimoMensaje: leadsTratos.ultimoMensaje,
};

function aTarjeta(r: Record<string, unknown>): TratoTarjeta {
  const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
  return { ...(r as unknown as TratoTarjeta), proximaActividad: iso(r.proximaActividad), etapaDesde: iso(r.etapaDesde)!, ultimoMensaje: iso(r.ultimoMensaje) };
}

export async function tratosAbiertos(embudoId: string, f: { duenoId?: string | null; q?: string } = {}): Promise<TratoTarjeta[]> {
  const d = await db();
  const conds = [eq(leadsTratos.embudoId, embudoId), eq(leadsTratos.estado, "abierto")];
  if (f.duenoId === "__sin") conds.push(isNull(leadsTratos.duenoId));
  else if (f.duenoId) conds.push(eq(leadsTratos.duenoId, f.duenoId));
  if (f.q?.trim()) {
    const q = `%${f.q.trim()}%`;
    const dig = f.q.replace(/\D/g, "");
    conds.push(or(ilike(leadsTratos.nombre, q), ilike(leadsTratos.negocio, q), ilike(leadsTratos.email, q), ...(dig.length >= 4 ? [ilike(leadsTratos.telefono, `%${dig}%`)] : []))!);
  }
  const filas = await d.select(camposTarjeta).from(leadsTratos).leftJoin(pulseUsers, eq(pulseUsers.id, leadsTratos.duenoId)).where(and(...conds)).orderBy(asc(leadsTratos.orden)).limit(3000);
  return filas.map(aTarjeta);
}

/** Vista de lista: todos los estados, filtrable. */
export async function listaTratos(marca: Marca, f: { embudoId?: string; estado?: string; duenoId?: string | null; q?: string }) {
  const d = await db();
  const conds = [eq(leadsTratos.marca, marca)];
  if (f.embudoId) conds.push(eq(leadsTratos.embudoId, f.embudoId));
  if (f.estado && f.estado !== "todos") conds.push(eq(leadsTratos.estado, f.estado));
  if (f.duenoId === "__sin") conds.push(isNull(leadsTratos.duenoId));
  else if (f.duenoId) conds.push(eq(leadsTratos.duenoId, f.duenoId));
  if (f.q?.trim()) {
    const q = `%${f.q.trim()}%`;
    conds.push(or(ilike(leadsTratos.nombre, q), ilike(leadsTratos.negocio, q), ilike(leadsTratos.email, q), ilike(leadsTratos.telefono, `%${f.q.replace(/\D/g, "") || "~"}%`))!);
  }
  return d
    .select({ ...camposTarjeta, estado: leadsTratos.estado, email: leadsTratos.email, etapaNombre: leadsEtapas.nombre, createdAt: leadsTratos.createdAt })
    .from(leadsTratos)
    .leftJoin(pulseUsers, eq(pulseUsers.id, leadsTratos.duenoId))
    .leftJoin(leadsEtapas, eq(leadsEtapas.id, leadsTratos.etapaId))
    .where(and(...conds))
    .orderBy(desc(leadsTratos.updatedAt))
    .limit(500);
}

// ---------- Un trato ----------------------------------------------------------------------------

export async function obtenerTrato(id: string) {
  const d = await db();
  const [t] = await d.select().from(leadsTratos).where(eq(leadsTratos.id, id)).limit(1);
  if (!t) return null;
  const [historial, actividades, etapas, embudos] = await Promise.all([
    d
      .select({ id: leadsHistorial.id, tipo: leadsHistorial.tipo, texto: leadsHistorial.texto, createdAt: leadsHistorial.createdAt, meta: leadsHistorial.meta, autor: pulseUsers.nombre })
      .from(leadsHistorial)
      .leftJoin(pulseUsers, eq(pulseUsers.id, leadsHistorial.autorId))
      .where(eq(leadsHistorial.tratoId, id))
      .orderBy(desc(leadsHistorial.createdAt))
      .limit(400),
    d
      .select({ id: leadsActividades.id, tipo: leadsActividades.tipo, asunto: leadsActividades.asunto, venceAt: leadsActividades.venceAt, hecha: leadsActividades.hecha, asignado: pulseUsers.nombre })
      .from(leadsActividades)
      .leftJoin(pulseUsers, eq(pulseUsers.id, leadsActividades.asignadoId))
      .where(eq(leadsActividades.tratoId, id))
      .orderBy(asc(leadsActividades.hecha), asc(leadsActividades.venceAt)),
    etapasDe(t.embudoId),
    listarEmbudos(t.marca as Marca),
  ]);
  return { trato: t, historial, actividades, etapas, embudos };
}

async function historial(tratoId: string, tipo: string, texto: string, autorId?: string | null, extra: { externoId?: string | null; meta?: Record<string, unknown> } = {}) {
  const d = await db();
  await d
    .insert(leadsHistorial)
    .values({ tratoId, tipo, texto: texto.slice(0, 8000), autorId: autorId ?? null, externoId: extra.externoId ?? null, meta: extra.meta ?? {} })
    .onConflictDoNothing();
}

async function ultimoOrden(etapaId: string): Promise<number | null> {
  const d = await db();
  const [r] = await d.select({ o: sql<number | null>`max(${leadsTratos.orden})` }).from(leadsTratos).where(and(eq(leadsTratos.etapaId, etapaId), eq(leadsTratos.estado, "abierto")));
  return r?.o ?? null;
}

export async function crearTrato(v: {
  marca: Marca;
  embudoId: string;
  etapaId?: string;
  nombre: string;
  negocio?: string | null;
  telefono?: string | null;
  email?: string | null;
  valor?: number;
  duenoId?: string | null;
  origen?: string;
  agendoPor?: string | null;
  datos?: Record<string, unknown>;
  autorId?: string | null;
}): Promise<Trato & { yaExistia?: boolean }> {
  const d = await db();
  const etapaId = v.etapaId ?? (await etapasDe(v.embudoId))[0]?.id;
  if (!etapaId) throw new Error("embudo-sin-etapas");
  const [t] = await d
    .insert(leadsTratos)
    .values({
      marca: v.marca,
      embudoId: v.embudoId,
      etapaId,
      nombre: v.nombre.trim().slice(0, 160) || "Sin nombre",
      negocio: v.negocio?.trim() || null,
      telefono: normalizarTelefono(v.telefono),
      email: v.email?.trim().toLowerCase() || null,
      valor: Math.max(0, Math.round(v.valor ?? 0)),
      duenoId: v.duenoId ?? null,
      origen: v.origen ?? "manual",
      agendoPor: v.agendoPor ?? null,
      datos: v.datos ?? {},
      orden: ordenEntre(await ultimoOrden(etapaId), null),
    })
    // Índice único parcial: un solo lead abierto por teléfono y marca. Si ya existe (p. ej. dos
    // mensajes de WhatsApp llegaron a la vez), se devuelve el que ya estaba.
    .onConflictDoNothing()
    .returning();
  if (!t) {
    const ya = await buscarAbierto(v.marca, normalizarTelefono(v.telefono), null);
    if (!ya) throw new Error("no-se-pudo-crear");
    return { ...ya, yaExistia: true };
  }
  await historial(t.id, "sistema", `Lead creado (${t.origen})`, v.autorId);
  return t;
}

export async function actualizarTrato(id: string, cambios: Partial<Pick<Trato, "nombre" | "negocio" | "telefono" | "email" | "valor" | "duenoId">>, autorId?: string | null): Promise<{ ok: boolean; error?: string }> {
  const d = await db();
  const limpio: Record<string, unknown> = { updatedAt: new Date() };
  if (cambios.nombre !== undefined) limpio.nombre = cambios.nombre.trim().slice(0, 160) || "Sin nombre";
  if (cambios.negocio !== undefined) limpio.negocio = cambios.negocio?.trim() || null;
  if (cambios.telefono !== undefined) limpio.telefono = normalizarTelefono(cambios.telefono);
  if (cambios.email !== undefined) limpio.email = cambios.email?.trim().toLowerCase() || null;
  if (cambios.valor !== undefined) limpio.valor = Math.max(0, Math.round(Number(cambios.valor) || 0));
  if (cambios.duenoId !== undefined) limpio.duenoId = cambios.duenoId || null;
  try {
    await d.update(leadsTratos).set(limpio).where(eq(leadsTratos.id, id));
  } catch (e) {
    if (esDuplicado(e)) return { ok: false, error: ERROR_DUPLICADO };
    throw e;
  }
  if (cambios.duenoId !== undefined) {
    const u = cambios.duenoId ? await d.query.pulseUsers.findFirst({ where: eq(pulseUsers.id, cambios.duenoId) }) : null;
    await historial(id, "sistema", `Dueño: ${u?.nombre ?? "sin asignar"}`, autorId);
  }
  return { ok: true };
}

/** Mover a otra etapa (y posición). Cambiar de embudo si la etapa es de otro. */
export async function moverTrato(id: string, etapaId: string, antesId: string | null, despuesId: string | null, autorId?: string | null) {
  const d = await db();
  const [t] = await d.select().from(leadsTratos).where(eq(leadsTratos.id, id)).limit(1);
  const [etapa] = await d.select().from(leadsEtapas).where(eq(leadsEtapas.id, etapaId)).limit(1);
  if (!t || !etapa) return;
  const ord = async (x: string | null) => (x ? ((await d.select({ o: leadsTratos.orden }).from(leadsTratos).where(eq(leadsTratos.id, x)).limit(1))[0]?.o ?? null) : null);
  const orden = antesId || despuesId ? ordenEntre(await ord(antesId), await ord(despuesId)) : ordenEntre(await ultimoOrden(etapaId), null);
  const cambioEtapa = t.etapaId !== etapaId;
  await d
    .update(leadsTratos)
    .set({ etapaId, embudoId: etapa.embudoId, orden, updatedAt: new Date(), ...(cambioEtapa ? { etapaDesde: new Date() } : {}) })
    .where(eq(leadsTratos.id, id));
  if (cambioEtapa) await historial(id, "sistema", `Etapa → ${etapa.nombre}`, autorId);
}

const esDuplicado = (e: unknown) => /leads_tratos_tel_abierto|duplicate key/i.test(String((e as { message?: string })?.message ?? e));
export const ERROR_DUPLICADO = "Ya hay otro lead abierto con ese teléfono";

export async function cerrarTrato(id: string, estado: "ganado" | "perdido" | "abierto", motivo: string | null, autorId?: string | null): Promise<{ ok: boolean; error?: string }> {
  const d = await db();
  try {
    await d
      .update(leadsTratos)
      .set({ estado, motivoPerdida: estado === "perdido" ? motivo : null, cerradoAt: estado === "abierto" ? null : new Date(), updatedAt: new Date() })
      .where(eq(leadsTratos.id, id));
  } catch (e) {
    if (esDuplicado(e)) return { ok: false, error: ERROR_DUPLICADO };
    throw e;
  }
  const txt = estado === "ganado" ? "🏆 Ganado" : estado === "perdido" ? `Perdido${motivo ? `: ${motivo}` : ""}` : "Reabierto";
  await historial(id, "sistema", txt, autorId);
  return { ok: true };
}

export async function eliminarTrato(id: string) {
  const d = await db();
  await d.delete(leadsTratos).where(eq(leadsTratos.id, id));
}

export async function agregarNota(id: string, texto: string, autorId: string) {
  await historial(id, "nota", texto, autorId);
  const d = await db();
  await d.update(leadsTratos).set({ updatedAt: new Date() }).where(eq(leadsTratos.id, id));
}

export async function marcarLeido(id: string) {
  const d = await db();
  await d.update(leadsTratos).set({ noLeidos: 0 }).where(and(eq(leadsTratos.id, id), gt(leadsTratos.noLeidos, 0)));
}

// ---------- Actividades -------------------------------------------------------------------------

async function recalcularProxima(tratoId: string) {
  const d = await db();
  const [p] = await d
    .select({ v: leadsActividades.venceAt })
    .from(leadsActividades)
    .where(and(eq(leadsActividades.tratoId, tratoId), eq(leadsActividades.hecha, false)))
    .orderBy(asc(leadsActividades.venceAt))
    .limit(1);
  await d.update(leadsTratos).set({ proximaActividad: p?.v ?? null }).where(eq(leadsTratos.id, tratoId));
}

export async function crearActividad(tratoId: string, v: { tipo: string; asunto: string; venceAt: Date; asignadoId?: string | null }, autorId: string) {
  const d = await db();
  await d.insert(leadsActividades).values({ tratoId, tipo: v.tipo, asunto: v.asunto.trim().slice(0, 200) || "Seguimiento", venceAt: v.venceAt, asignadoId: v.asignadoId ?? autorId, creadaPor: autorId });
  await recalcularProxima(tratoId);
}

export async function completarActividad(actividadId: string, hecha: boolean) {
  const d = await db();
  const [a] = await d.update(leadsActividades).set({ hecha, hechaAt: hecha ? new Date() : null }).where(eq(leadsActividades.id, actividadId)).returning();
  if (a) {
    if (hecha) await historial(a.tratoId, "sistema", `✓ ${a.asunto}`);
    await recalcularProxima(a.tratoId);
  }
  return a;
}

/** Seguimientos pendientes (vencidos + hoy + próximos 7 días) para la pantalla de Actividades. */
export async function actividadesPendientes(marca: Marca, asignadoId?: string | null) {
  const d = await db();
  const hasta = new Date(Date.now() + 7 * 86_400_000);
  const conds = [eq(leadsTratos.marca, marca), eq(leadsActividades.hecha, false), lt(leadsActividades.venceAt, hasta)];
  if (asignadoId) conds.push(eq(leadsActividades.asignadoId, asignadoId));
  return d
    .select({ id: leadsActividades.id, tipo: leadsActividades.tipo, asunto: leadsActividades.asunto, venceAt: leadsActividades.venceAt, tratoId: leadsTratos.id, trato: leadsTratos.nombre, negocio: leadsTratos.negocio, telefono: leadsTratos.telefono, asignado: pulseUsers.nombre })
    .from(leadsActividades)
    .innerJoin(leadsTratos, eq(leadsTratos.id, leadsActividades.tratoId))
    .leftJoin(pulseUsers, eq(pulseUsers.id, leadsActividades.asignadoId))
    .where(and(...conds))
    .orderBy(asc(leadsActividades.venceAt))
    .limit(300);
}

// ---------- Entrada de leads de otras fuentes (Calendly, quiz, WhatsApp) ---------------------

async function buscarAbierto(marca: Marca, telefono: string | null, email: string | null): Promise<Trato | null> {
  const d = await db();
  const conds = [];
  if (telefono) conds.push(eq(leadsTratos.telefono, telefono));
  if (email) conds.push(eq(leadsTratos.email, email));
  if (!conds.length) return null;
  const [t] = await d
    .select()
    .from(leadsTratos)
    .where(and(eq(leadsTratos.marca, marca), eq(leadsTratos.estado, "abierto"), or(...conds)))
    .orderBy(desc(leadsTratos.updatedAt))
    .limit(1);
  return t ?? null;
}

async function embudoPorNombre(marca: Marca, nombre: string): Promise<Embudo | null> {
  await asegurarSemilla(marca);
  const lista = await listarEmbudos(marca);
  return lista.find((e) => clave(e.nombre) === clave(nombre)) ?? null;
}

/**
 * Crea el lead o actualiza el que ya está abierto (mismo teléfono o email en la misma marca).
 * `etapa` por nombre dentro del embudo; si el lead ya existe en otro embudo, se mueve.
 */
export async function ingestarLead(v: {
  marca: Marca;
  embudo: string;
  etapa?: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  negocio?: string | null;
  origen: string;
  agendoPor?: string | null;
  duenoNombre?: string | null;
  nota?: string | null;
  datos?: Record<string, unknown>;
  /** false = si el lead ya existe, no lo mueve de embudo/etapa (p. ej. el quiz no "devuelve" a quien ya agendó). */
  moverSiExiste?: boolean;
}): Promise<{ id: string; nuevo: boolean }> {
  const emb = await embudoPorNombre(v.marca, v.embudo);
  if (!emb) throw new Error("sin-embudos");
  const etapas = await etapasDe(emb.id);
  const etapa = (v.etapa && etapas.find((e) => clave(e.nombre) === clave(v.etapa!))) || etapas[0];
  const d = await db();
  let duenoId: string | null = null;
  if (v.duenoNombre) {
    const primero = v.duenoNombre.trim().split(/\s+/)[0];
    const u = primero ? await d.query.pulseUsers.findFirst({ where: and(eq(pulseUsers.activo, true), ilike(pulseUsers.nombre, `${primero}%`)) }) : null;
    duenoId = u?.id ?? null;
  }
  const telefono = normalizarTelefono(v.telefono);
  const email = v.email?.trim().toLowerCase() || null;
  const ya = await buscarAbierto(v.marca, telefono, email);
  if (ya) {
    const cambios: Record<string, unknown> = { updatedAt: new Date(), datos: { ...(ya.datos ?? {}), ...(v.datos ?? {}) } };
    if (!ya.negocio && v.negocio) cambios.negocio = v.negocio;
    if (!ya.email && email) cambios.email = email;
    if (!ya.telefono && telefono) cambios.telefono = telefono;
    if (!ya.duenoId && duenoId) cambios.duenoId = duenoId;
    if (v.agendoPor) cambios.agendoPor = v.agendoPor;
    await d.update(leadsTratos).set(cambios).where(eq(leadsTratos.id, ya.id));
    if (v.moverSiExiste !== false && etapa && ya.etapaId !== etapa.id) await moverTrato(ya.id, etapa.id, null, null);
    if (v.nota) await historial(ya.id, "sistema", v.nota);
    return { id: ya.id, nuevo: false };
  }
  const t = await crearTrato({ marca: v.marca, embudoId: emb.id, etapaId: etapa?.id, nombre: v.nombre, telefono, email, negocio: v.negocio, origen: v.origen, agendoPor: v.agendoPor, duenoId, datos: v.datos });
  if (v.nota) await historial(t.id, "sistema", v.nota);
  return { id: t.id, nuevo: true };
}

// ---------- WhatsApp (Timelines) --------------------------------------------------------------

export async function registrarWebhook(fuente: string, marca: string | null, evento: string | null, resultado: string, cuerpo: unknown) {
  const d = await db();
  await d.insert(leadsWebhookLog).values({ fuente, marca, evento, resultado, cuerpo: cuerpo as object });
  // Solo se guardan 14 días.
  await d.delete(leadsWebhookLog).where(lt(leadsWebhookLog.createdAt, new Date(Date.now() - 14 * 86_400_000)));
}

export async function cuentasWhatsapp(marca: Marca) {
  const d = await db();
  return d.select().from(leadsWhatsapp).where(eq(leadsWhatsapp.marca, marca));
}

/** Guarda el mensaje en la línea de tiempo del lead (lo crea si es un contacto nuevo que escribe). */
export async function registrarMensaje(marca: Marca, ev: EventoWhatsapp): Promise<string> {
  if (ev.esGrupo) return "ignorado:grupo";
  if (!ev.telefono) return "ignorado:sin-telefono";
  if (!ev.texto && !ev.adjunto) return "ignorado:vacio";
  const d = await db();
  const cuenta = ev.cuenta ? await d.query.leadsWhatsapp.findFirst({ where: eq(leadsWhatsapp.cuenta, ev.cuenta) }) : null;
  if (cuenta && cuenta.marca !== marca) return "ignorado:otra-marca";
  if (cuenta && !cuenta.activo) return "ignorado:cuenta-apagada";

  let t = await buscarAbierto(marca, ev.telefono, null);
  let nuevo = false;
  if (!t) {
    // Un saliente a alguien que no está en el CRM (p. ej. un chat personal) no crea lead.
    if (ev.direccion !== "entrante") return "ignorado:saliente-sin-lead";
    let embudoId = cuenta?.embudoId ?? null;
    if (!embudoId) embudoId = (await embudoPorNombre(marca, "WhatsApp"))?.id ?? (await listarEmbudos(marca))[0]?.id ?? null;
    if (!embudoId) return "error:sin-embudo";
    const creado = await crearTrato({ marca, embudoId, nombre: ev.nombre || `WhatsApp ${ev.telefono}`, telefono: ev.telefono, origen: "whatsapp", duenoId: cuenta?.duenoId ?? null, datos: { cuentaWhatsapp: ev.cuenta } });
    nuevo = !creado.yaExistia;
    t = creado;
  }
  const antes = await d.select({ id: leadsHistorial.id }).from(leadsHistorial).where(ev.mensajeId ? eq(leadsHistorial.externoId, ev.mensajeId) : sql`false`).limit(1);
  if (antes.length) return "duplicado";
  await historial(t.id, ev.direccion === "saliente" ? "saliente" : "entrante", ev.texto, null, { externoId: ev.mensajeId, meta: { chatId: ev.chatId, cuenta: ev.cuenta, adjunto: ev.adjunto } });
  await d
    .update(leadsTratos)
    .set({
      ultimoMensaje: new Date(),
      updatedAt: new Date(),
      ...(ev.direccion === "entrante" ? { noLeidos: sql`${leadsTratos.noLeidos} + 1` } : { noLeidos: 0 }),
      ...(ev.chatId ? { chatId: ev.chatId } : {}),
      ...(ev.cuenta ? { cuentaWhatsapp: ev.cuenta } : {}),
    })
    .where(eq(leadsTratos.id, t.id));
  return nuevo ? `lead-nuevo:${t.id}` : `mensaje:${t.id}`;
}

export async function registrarSaliente(tratoId: string, texto: string, autorId: string, mensajeId: string | null) {
  await historial(tratoId, "saliente", texto, autorId, { externoId: mensajeId });
  const d = await db();
  await d.update(leadsTratos).set({ ultimoMensaje: new Date(), noLeidos: 0, updatedAt: new Date() }).where(eq(leadsTratos.id, tratoId));
}
