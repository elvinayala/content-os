import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { estaBloqueado } from "./acceso";
import { errorItem, SEMILLAS_EMPRESA, visiblePara, type ItemEmpresa } from "./empresa-reglas";
import { puestoPorId } from "./reglas";
import { desempenoEmpresa, desempenoPerfiles } from "./schema";

// "Empresa" en Ritmo (27/sep): lo que un empleado nuevo necesita para no llegar a una plataforma vacía.
// Lo edita la vista maestra; cada quien ve lo de todos + lo de su empresa (nunca la etiqueta de la otra).

const t = desempenoEmpresa;

export async function empresaDe(userId: string): Promise<string | null> {
  const d = await db();
  const [p] = await d.select({ empresa: desempenoPerfiles.empresa }).from(desempenoPerfiles).where(eq(desempenoPerfiles.userId, userId));
  return p?.empresa ?? null;
}

/** Siembra el contenido inicial una sola vez (por clave); nunca pisa lo que la dirección ya editó. */
export async function sembrarEmpresa() {
  const d = await db();
  const [ya] = await d.select({ id: t.id }).from(t).limit(1);
  if (ya) return;
  await d.insert(t).values(SEMILLAS_EMPRESA).onConflictDoNothing();
}

export async function contenidoEmpresa(v: { empresa: string | null; maestro: boolean }): Promise<ItemEmpresa[]> {
  await sembrarEmpresa();
  const d = await db();
  const filas = await d.select().from(t).orderBy(asc(t.seccion), asc(t.orden), asc(t.createdAt));
  return filas.filter((f) => visiblePara(f, v)).map((f) => ({ id: f.id, seccion: f.seccion, titulo: f.titulo, cuerpo: f.cuerpo, url: f.url, empresa: f.empresa, orden: f.orden, publicado: f.publicado }));
}

export async function guardarItemEmpresa(p: { id?: string; seccion: string; titulo: string; cuerpo: string; url?: string | null; empresa: string; publicado: boolean; orden?: number }, autorId: string) {
  const err = errorItem(p);
  if (err) throw new Error(err);
  const d = await db();
  const datos = { seccion: p.seccion, titulo: p.titulo.trim(), cuerpo: p.cuerpo.trim(), url: p.url?.trim() || null, empresa: p.empresa, publicado: p.publicado, actualizadoPor: autorId, updatedAt: new Date() };
  if (p.id) {
    await d.update(t).set(datos).where(eq(t.id, p.id));
    return;
  }
  const [m] = await d.select({ o: sql<number>`coalesce(max(${t.orden}), 0)` }).from(t).where(eq(t.seccion, p.seccion));
  await d.insert(t).values({ ...datos, orden: p.orden ?? Number(m?.o ?? 0) + 10 });
}

export async function borrarItemEmpresa(id: string) {
  const d = await db();
  await d.delete(t).where(eq(t.id, id));
}

export interface PersonaDirectorio {
  id: string;
  nombre: string;
  puesto: string;
  departamento: string;
  lider: string | null;
  empresa: string;
}

/** El equipo activo en Ritmo. Un empleado ve a los de su empresa; la dirección ve a todos. */
export async function directorio(v: { empresa: string | null; maestro: boolean }): Promise<PersonaDirectorio[]> {
  const d = await db();
  const filas = await d
    .select({ id: pulseUsers.id, nombre: pulseUsers.nombre, email: pulseUsers.email, puesto: desempenoPerfiles.puesto, empresa: desempenoPerfiles.empresa, liderId: desempenoPerfiles.liderId })
    .from(desempenoPerfiles)
    .innerJoin(pulseUsers, eq(pulseUsers.id, desempenoPerfiles.userId))
    .where(and(eq(desempenoPerfiles.activo, true), eq(pulseUsers.activo, true)));
  const nombres = new Map(filas.map((f) => [f.id, f.nombre]));
  return filas
    .filter((f) => !estaBloqueado(f.email) && !/@pulse\.sistema$|demo\.ritmo/i.test(f.email))
    .filter((f) => v.maestro || f.empresa === (v.empresa ?? "level_up"))
    .map((f) => {
      const p = puestoPorId(f.puesto);
      return { id: f.id, nombre: f.nombre, puesto: p?.nombre ?? f.puesto, departamento: p?.departamento ?? "Otros", lider: f.liderId ? (nombres.get(f.liderId) ?? null) : null, empresa: f.empresa };
    })
    .sort((a, b) => a.departamento.localeCompare(b.departamento) || a.nombre.localeCompare(b.nombre));
}
