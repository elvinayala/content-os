import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/pulse/db";

import { aibOnboardingClientes, type RespuestasAib, type TurnoAib } from "./schema";

export type ClienteAib = typeof aibOnboardingClientes.$inferSelect;

/** Máximo de turnos que se guardan (el agente ve los últimos; la conversación completa vive en Zernio). */
const MAX_TURNOS = 40;

export async function clientePorTelefono(telefono: string): Promise<ClienteAib | null> {
  const d = await db();
  const [c] = await d.select().from(aibOnboardingClientes).where(eq(aibOnboardingClientes.telefono, telefono));
  return c ?? null;
}

export async function todosLosClientes(): Promise<ClienteAib[]> {
  const d = await db();
  return d.select().from(aibOnboardingClientes);
}

export async function crearCliente(v: typeof aibOnboardingClientes.$inferInsert): Promise<ClienteAib> {
  const d = await db();
  const [c] = await d.insert(aibOnboardingClientes).values(v).onConflictDoNothing({ target: aibOnboardingClientes.telefono }).returning();
  return c ?? (await clientePorTelefono(v.telefono))!;
}

export async function actualizarCliente(id: string, patch: Partial<typeof aibOnboardingClientes.$inferInsert>): Promise<void> {
  const d = await db();
  await d.update(aibOnboardingClientes).set({ ...patch, updatedAt: new Date() }).where(eq(aibOnboardingClientes.id, id));
}

export async function agregarTurnos(c: ClienteAib, turnos: Omit<TurnoAib, "at">[]): Promise<TurnoAib[]> {
  const at = new Date().toISOString();
  const historial = [...(c.historial ?? []), ...turnos.map((t) => ({ ...t, at }))].slice(-MAX_TURNOS);
  await actualizarCliente(c.id, { historial, ultimoMensajeAt: new Date() });
  c.historial = historial;
  return historial;
}

export async function guardarRespuesta(c: ClienteAib, encuesta: string, pregunta: string, respuesta: string): Promise<void> {
  const respuestas: RespuestasAib = { ...(c.respuestas ?? {}) };
  respuestas[encuesta] = { ...(respuestas[encuesta] ?? {}), [pregunta]: respuesta };
  await actualizarCliente(c.id, { respuestas });
  c.respuestas = respuestas;
}
