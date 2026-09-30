import "server-only";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";

import { usuarioVerificado } from "../pulse/auth";
import { db } from "../pulse/db";
import { puedeVerBoard } from "../pulse/repo";
import { pulseAppClientes, pulseBoards, pulseItems } from "../pulse/schema";
import type { UsuarioPulse } from "../pulse/types";
import { COOKIE_CLIENTE, verificarCookieCliente } from "./acceso";

// Quién mira la app de clientes:
//  - el CLIENTE, con la cookie que dejó su link (y solo si su acceso sigue activo y en la misma versión);
//  - alguien del EQUIPO con sesión de Pulse que puede ver LEVEL UP MEDIA, en vista previa (/cliente/ver/<itemId> deja
//    la cookie COOKIE_VER con el item; se revalida al usuario en cada página).
// En los dos casos el item TIENE que ser del tablero LEVEL UP MEDIA: nunca se muestra otra cosa.
export const TABLERO_CLIENTES = "level-up-media";
export const COOKIE_VER = "lu-cliente-ver";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type Visor = { itemId: string; boardId: string; modo: "cliente"; version: number } | { itemId: string; boardId: string; modo: "equipo"; usuario: UsuarioPulse };

async function boardDelItem(itemId: string): Promise<string | null> {
  const d = await db();
  const [r] = await d.select({ boardId: pulseItems.boardId, slug: pulseBoards.slug }).from(pulseItems).innerJoin(pulseBoards, eq(pulseBoards.id, pulseItems.boardId)).where(eq(pulseItems.id, itemId));
  return r && r.slug === TABLERO_CLIENTES ? r.boardId : null;
}

/** El acceso del cliente (fila) si sigue vigente. */
export async function accesoVigente(itemId: string, version: number) {
  const d = await db();
  const [a] = await d.select().from(pulseAppClientes).where(eq(pulseAppClientes.itemId, itemId));
  return a && a.activo && a.version === version ? a : null;
}

export const visorActual = cache(async (): Promise<Visor | null> => {
  const jar = await cookies();
  const c = await verificarCookieCliente(jar.get(COOKIE_CLIENTE)?.value);
  if (c) {
    const [a, boardId] = await Promise.all([accesoVigente(c.itemId, c.version), boardDelItem(c.itemId)]);
    if (a && boardId) {
      // Último acceso (para que el equipo sepa si la usa), a lo sumo cada 10 minutos.
      if (!a.ultimoAccesoAt || Date.now() - a.ultimoAccesoAt.getTime() > 10 * 60_000) {
        const d = await db();
        await d.update(pulseAppClientes).set({ ultimoAccesoAt: new Date() }).where(eq(pulseAppClientes.itemId, c.itemId)).catch(() => null);
      }
      return { itemId: c.itemId, boardId, modo: "cliente", version: c.version };
    }
  }
  const ver = jar.get(COOKIE_VER)?.value;
  if (ver && UUID_RE.test(ver)) {
    const u = await usuarioVerificado();
    const boardId = u ? await boardDelItem(ver) : null;
    if (u && boardId && (await puedeVerBoard(u, boardId))) return { itemId: ver, boardId, modo: "equipo", usuario: u };
  }
  return null;
});
