import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { avisarPersona, esc } from "./avisar";
import { evento } from "./datos";
import { noticiaVisible } from "./noticias-tipos";
import { desempenoNoticias, desempenoPerfiles } from "./schema";

// Noticias de la empresa en Ritmo: logros del equipo, noticias, comunicados, causas benéficas.
// Publica la vista maestra. Cada noticia es para todo el equipo o para una empresa (17/oct): cada empleado ve las de todos y
// las de su empresa (`noticiaVisible`). Un logro con persona le avisa a esa persona por Slack.

const base = () => process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app";

/** Lo que le toca ver a quien mira (sin visor = todo, para usos internos). */
export async function noticiasPara(userId: string, maestro: boolean, limite = 30) {
  const d = await db();
  const [p] = await d.select({ empresa: desempenoPerfiles.empresa, tambienEn: desempenoPerfiles.tambienEn }).from(desempenoPerfiles).where(eq(desempenoPerfiles.userId, userId));
  return listarNoticias(limite, { empresa: p?.empresa ?? null, tambienEn: p?.tambienEn ?? null, maestro });
}

export async function listarNoticias(limite = 30, visor?: { empresa: string | null; tambienEn: string | null; maestro: boolean }) {
  const d = await db();
  const todas = await d.select().from(desempenoNoticias).orderBy(desc(desempenoNoticias.fijada), desc(desempenoNoticias.createdAt)).limit(visor ? 300 : limite);
  const filas = (visor ? todas.filter((n) => noticiaVisible(n, visor)) : todas).slice(0, limite);
  const ids = [...new Set(filas.map((f) => f.personaId).filter((x): x is string => !!x))];
  const nombres = ids.length ? await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre }).from(pulseUsers).where(inArray(pulseUsers.id, ids)) : [];
  return filas.map((f) => ({ ...f, persona: nombres.find((n) => n.id === f.personaId)?.nombre ?? null }));
}

/** Personas activas en Ritmo (para destacar un logro). */
export async function personasParaLogro() {
  const d = await db();
  return d
    .select({ id: pulseUsers.id, nombre: pulseUsers.nombre })
    .from(desempenoPerfiles)
    .innerJoin(pulseUsers, eq(pulseUsers.id, desempenoPerfiles.userId))
    .where(and(eq(desempenoPerfiles.activo, true), eq(pulseUsers.activo, true)))
    .orderBy(pulseUsers.nombre);
}

export async function publicarNoticia(n: { categoria: string; titulo: string; cuerpo: string; personaId: string | null; enlace: string | null; fijada: boolean; empresa?: string }, autor: { id: string; nombre: string }) {
  const d = await db();
  n = { ...n, empresa: n.empresa ?? "todas" };
  // Un logro de alguien puesto "para todos" queda solo para su empresa: nunca se ve un nombre de la otra empresa.
  if (n.personaId && n.empresa === "todas") {
    const [p] = await d.select({ empresa: desempenoPerfiles.empresa }).from(desempenoPerfiles).where(eq(desempenoPerfiles.userId, n.personaId));
    if (p?.empresa) n = { ...n, empresa: p.empresa };
  }
  const [fila] = await d.insert(desempenoNoticias).values({ ...n, autorId: autor.id }).returning();
  await evento({ actorId: autor.id, tipo: "noticia_publicada", datos: { id: fila.id, categoria: n.categoria } });
  if (n.categoria === "logro" && n.personaId) await avisarPersona(n.personaId, `🏆 ¡Te destacaron en Ritmo! *${esc(n.titulo)}* <${base()}/ritmo/noticias|Ver>`).catch(() => false);
  return fila;
}

export async function fijarNoticia(id: string, fijada: boolean) {
  const d = await db();
  await d.update(desempenoNoticias).set({ fijada }).where(eq(desempenoNoticias.id, id));
}

export async function borrarNoticia(id: string, actorId: string) {
  const d = await db();
  const [f] = await d.delete(desempenoNoticias).where(eq(desempenoNoticias.id, id)).returning();
  if (f) await evento({ actorId, tipo: "noticia_borrada", datos: { id, titulo: f.titulo } });
}
