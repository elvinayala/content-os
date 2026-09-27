import "server-only";

import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { errorMensaje, nombreCorto, REACCIONES } from "./bienestar-reglas";
import { desempenoBienestar, desempenoBienestarPosts, desempenoBienestarReacciones, desempenoBienestarSocial, desempenoPerfiles } from "./schema";

// Bienestar: pausa activa, minutos de ejercicio y energía del día. Voluntario, privado y fuera del score.
// Cada quien ve lo suyo; la maestra solo agregados (bienestar-reglas.ts → equipoSemana).

const t = desempenoBienestar;
export const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });

export async function registrarPausa(userId: string, fecha: string, minutos: number) {
  const d = await db();
  await d.insert(t).values({ userId, fecha, tipo: "pausa", minutos }).onConflictDoUpdate({ target: [t.userId, t.fecha, t.tipo], set: { minutos, updatedAt: new Date() } });
}

/** Suma minutos al día (tope 600 min/día para que un error de dedo no dañe el reto del equipo). */
export async function registrarActividad(userId: string, fecha: string, actividad: string, minutos: number) {
  const d = await db();
  await d
    .insert(t)
    .values({ userId, fecha, tipo: "actividad", actividad, minutos })
    .onConflictDoUpdate({ target: [t.userId, t.fecha, t.tipo], set: { actividad, minutos: sql`least(${t.minutos} + ${minutos}, 600)`, updatedAt: new Date() } });
}

export async function registrarAnimo(userId: string, fecha: string, valor: number) {
  const d = await db();
  await d.insert(t).values({ userId, fecha, tipo: "animo", valor }).onConflictDoUpdate({ target: [t.userId, t.fecha, t.tipo], set: { valor, updatedAt: new Date() } });
}

export async function registrosDe(userId: string, dias: string[]) {
  const d = await db();
  return d.select().from(t).where(and(eq(t.userId, userId), inArray(t.fecha, dias)));
}

export async function registrosEquipo(dias: string[]) {
  const d = await db();
  return d.select({ userId: t.userId, fecha: t.fecha, tipo: t.tipo, minutos: t.minutos, valor: t.valor }).from(t).where(inArray(t.fecha, dias));
}

export async function personasActivas(): Promise<number> {
  const d = await db();
  const r = await d.select({ id: desempenoPerfiles.userId }).from(desempenoPerfiles).where(eq(desempenoPerfiles.activo, true));
  return r.length;
}

// ---- Comunidad (solo quienes se unen: visible = true) ----

export async function esVisible(userId: string): Promise<boolean> {
  const d = await db();
  const [f] = await d.select({ v: desempenoBienestarSocial.visible }).from(desempenoBienestarSocial).where(eq(desempenoBienestarSocial.userId, userId));
  return !!f?.v;
}

export async function ponerVisible(userId: string, visible: boolean) {
  const d = await db();
  await d
    .insert(desempenoBienestarSocial)
    .values({ userId, visible })
    .onConflictDoUpdate({ target: desempenoBienestarSocial.userId, set: { visible, updatedAt: new Date() } });
}

/** Quienes se unieron (y siguen activos), con nombre corto. */
export async function miembrosComunidad(): Promise<{ id: string; nombre: string }[]> {
  const d = await db();
  const filas = await d
    .select({ id: pulseUsers.id, nombre: pulseUsers.nombre })
    .from(desempenoBienestarSocial)
    .innerJoin(pulseUsers, eq(pulseUsers.id, desempenoBienestarSocial.userId))
    .where(and(eq(desempenoBienestarSocial.visible, true), eq(pulseUsers.activo, true)));
  return filas.map((f) => ({ id: f.id, nombre: nombreCorto(f.nombre) }));
}

export async function publicarMensaje(userId: string, texto: string) {
  if (!(await esVisible(userId))) throw new Error("Únete a la comunidad para publicar");
  const err = errorMensaje(texto);
  if (err) throw new Error(err);
  const d = await db();
  await d.insert(desempenoBienestarPosts).values({ userId, texto: texto.trim() });
}

export async function borrarMensaje(id: string, actor: { id: string; maestro: boolean }) {
  const d = await db();
  const [p] = await d.select().from(desempenoBienestarPosts).where(eq(desempenoBienestarPosts.id, id));
  if (!p) return;
  if (p.userId !== actor.id && !actor.maestro) throw new Error("Solo quien lo escribió o la dirección pueden borrarlo");
  await d.delete(desempenoBienestarPosts).where(eq(desempenoBienestarPosts.id, id));
}

/** Una reacción por persona y mensaje; tocar la misma la quita. */
export async function reaccionar(postId: string, userId: string, emoji: string) {
  if (!(REACCIONES as readonly string[]).includes(emoji)) throw new Error("Reacción inválida");
  if (!(await esVisible(userId))) throw new Error("Únete a la comunidad para reaccionar");
  const d = await db();
  const r = desempenoBienestarReacciones;
  const [ya] = await d.select().from(r).where(and(eq(r.postId, postId), eq(r.userId, userId)));
  if (ya?.emoji === emoji) await d.delete(r).where(and(eq(r.postId, postId), eq(r.userId, userId)));
  else await d.insert(r).values({ postId, userId, emoji }).onConflictDoUpdate({ target: [r.postId, r.userId], set: { emoji } });
}

export type ItemComunidad =
  | { tipo: "mensaje"; id: string; autorId: string; autor: string; texto: string; at: string; reacciones: Record<string, number>; mia: string | null }
  | { tipo: "actividad"; id: string; autor: string; clase: "pausa" | "actividad"; actividad: string | null; minutos: number; at: string };

/** Lo que pasa en la comunidad (últimos 7 días): mensajes + actividad de los miembros. Nunca la energía. */
export async function feedComunidad(yo: string, miembros: { id: string; nombre: string }[]): Promise<ItemComunidad[]> {
  if (!miembros.length) return [];
  const ids = miembros.map((m) => m.id);
  const nombre = (id: string) => miembros.find((m) => m.id === id)?.nombre ?? "—";
  const desde = new Date(Date.now() - 7 * 86_400_000);
  const d = await db();
  const [posts, acts] = await Promise.all([
    d.select().from(desempenoBienestarPosts).where(and(inArray(desempenoBienestarPosts.userId, ids), gt(desempenoBienestarPosts.createdAt, desde))).orderBy(desc(desempenoBienestarPosts.createdAt)).limit(40),
    d.select().from(t).where(and(inArray(t.userId, ids), inArray(t.tipo, ["pausa", "actividad"]), gt(t.updatedAt, desde))).orderBy(desc(t.updatedAt)).limit(40),
  ]);
  const reacs = posts.length ? await d.select().from(desempenoBienestarReacciones).where(inArray(desempenoBienestarReacciones.postId, posts.map((p) => p.id))) : [];
  const items: ItemComunidad[] = [
    ...posts.map((p) => {
      const mias = reacs.filter((r) => r.postId === p.id);
      const conteo: Record<string, number> = {};
      for (const r of mias) conteo[r.emoji] = (conteo[r.emoji] ?? 0) + 1;
      return { tipo: "mensaje" as const, id: p.id, autorId: p.userId, autor: nombre(p.userId), texto: p.texto, at: p.createdAt.toISOString(), reacciones: conteo, mia: mias.find((r) => r.userId === yo)?.emoji ?? null };
    }),
    ...acts.map((a) => ({ tipo: "actividad" as const, id: a.id, autor: nombre(a.userId), clase: a.tipo as "pausa" | "actividad", actividad: a.actividad, minutos: a.minutos, at: a.updatedAt.toISOString() })),
  ];
  return items.sort((x, y) => y.at.localeCompare(x.at)).slice(0, 40);
}
