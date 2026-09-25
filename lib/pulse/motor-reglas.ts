import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { type Accion, type Cuando, type Evento, planDeAcciones, type Regla, reglasDisparadas, requisitosFaltantes } from "./automatizaciones";
import { db } from "./db";
import * as repo from "./repo";
import { pulseBoards, pulseColumns, pulseReglas, pulseUsers } from "./schema";
import { dmSlack } from "./slack-dm";
import type { Item, SettingsColumna, TipoColumna, ValorCelda } from "./types";
import { validarValor } from "./valores";

// Ejecuta las automatizaciones de un tablero (tabla pulse_reglas) cuando alguien cambia una
// etiqueta o mueve elementos. La lógica es la pura de lib/pulse/automatizaciones.ts; aquí solo
// se lee, se escribe y se avisa. Sin cascadas: lo que hace una regla no dispara otras.

export class RequisitoError extends Error {
  constructor(
    public columnId: string,
    public itemIds: string[],
    titulo: string,
  ) {
    super(`Antes de hacer este cambio hay que llenar «${titulo}».`);
  }
}

const fila = (r: typeof pulseReglas.$inferSelect): Regla & { veces: number; ultimaVez: string | null } => ({
  id: r.id,
  boardId: r.boardId,
  nombre: r.nombre,
  activa: r.activa,
  cuando: r.cuando as Cuando,
  entonces: r.entonces as Accion[],
  veces: r.veces,
  ultimaVez: r.ultimaVez ? new Date(r.ultimaVez).toISOString() : null,
});

export async function leerReglas(boardId: string) {
  const d = await db();
  return (await d.select().from(pulseReglas).where(eq(pulseReglas.boardId, boardId)).orderBy(asc(pulseReglas.createdAt))).map(fila);
}

export const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });

/** Falla con RequisitoError si alguna regla exige una columna vacía en alguno de los items. */
export async function verificarRequisitos(boardId: string, casos: { item: Item; evento: Evento; valoresTrasCambio?: Record<string, ValorCelda> }[]): Promise<void> {
  const reglas = (await leerReglas(boardId)).filter((r) => r.activa);
  if (!reglas.length) return;
  const faltantes = new Map<string, string[]>();
  for (const c of casos) {
    for (const col of requisitosFaltantes(reglasDisparadas(reglas, c.evento), c.valoresTrasCambio ?? c.item.values)) {
      faltantes.set(col, [...(faltantes.get(col) ?? []), c.item.id]);
    }
  }
  const [col] = faltantes.keys();
  if (!col) return;
  const d = await db();
  const [c] = await d.select({ title: pulseColumns.title }).from(pulseColumns).where(eq(pulseColumns.id, col));
  throw new RequisitoError(col, faltantes.get(col)!, c?.title ?? "un campo");
}

/** Aplica las reglas que dispara el evento sobre un item ya actualizado. Devuelve qué hizo. */
export async function aplicarReglas(boardId: string, item: Item, evento: Evento, userId: string): Promise<{ reglas: string[]; movidoA: string | null }> {
  const reglas = (await leerReglas(boardId)).filter((r) => r.activa);
  const disparadas = reglasDisparadas(reglas, evento);
  if (!disparadas.length) return { reglas: [], movidoA: null };
  const plan = planDeAcciones(disparadas, item, hoyPR());
  const d = await db();
  if (Object.keys(plan.valores).length) {
    const cols = await d.select().from(pulseColumns).where(eq(pulseColumns.boardId, boardId));
    for (const [columnId, crudo] of Object.entries(plan.valores)) {
      const c = cols.find((x) => x.id === columnId);
      if (!c) continue;
      try {
        const value = validarValor(c.type as TipoColumna, crudo, (c.settings ?? {}) as SettingsColumna);
        await repo.actualizarValor({ itemId: item.id, columnId, value, userId });
      } catch (e) {
        console.error("[pulse regla] valor", columnId, e);
      }
    }
  }
  let movidoA: string | null = null;
  if (plan.moverA) {
    const porColumna = evento.tipo === "valor" ? evento.columnId : undefined;
    await repo.moverItems({ itemIds: [item.id], groupId: plan.moverA, userId, porColumna });
    movidoA = plan.moverA;
  }
  if (plan.avisar.length) {
    const [b] = await d.select({ nombre: pulseBoards.nombre, slug: pulseBoards.slug }).from(pulseBoards).where(eq(pulseBoards.id, boardId));
    const base = process.env.PULSE_URL ?? "https://pulse-eamarket.vercel.app";
    for (const uid of plan.avisar) {
      const [u] = await d.select({ email: pulseUsers.email }).from(pulseUsers).where(eq(pulseUsers.id, uid));
      if (u) await dmSlack(u.email, `⚡ Pulse · ${plan.reglas.join(" · ")}\n${item.name} (${b?.nombre ?? ""})\n${base}/pulse/${b?.slug}?item=${item.id}`);
    }
  }
  const usadas = disparadas.filter((r) => plan.reglas.includes(r.nombre)).map((r) => r.id);
  for (const id of usadas) await d.update(pulseReglas).set({ veces: sql`${pulseReglas.veces} + 1`, ultimaVez: new Date() }).where(eq(pulseReglas.id, id));
  return { reglas: plan.reglas, movidoA };
}
