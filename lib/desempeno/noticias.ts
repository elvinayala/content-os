import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { avisarPersona, esc } from "./avisar";
import { evento } from "./datos";
import { desempenoNoticias, desempenoPerfiles } from "./schema";

// Noticias de la empresa en Ritmo: logros del equipo, noticias, comunicados, causas benéficas.
// Publica la vista maestra; lo ve todo el equipo. Un logro con persona le avisa a esa persona por Slack.

const base = () => process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app";

export async function listarNoticias(limite = 30) {
  const d = await db();
  const filas = await d.select().from(desempenoNoticias).orderBy(desc(desempenoNoticias.fijada), desc(desempenoNoticias.createdAt)).limit(limite);
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

export async function publicarNoticia(n: { categoria: string; titulo: string; cuerpo: string; personaId: string | null; enlace: string | null; fijada: boolean }, autor: { id: string; nombre: string }) {
  const d = await db();
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
