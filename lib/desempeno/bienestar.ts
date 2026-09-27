import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { desempenoBienestar, desempenoPerfiles } from "./schema";

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
