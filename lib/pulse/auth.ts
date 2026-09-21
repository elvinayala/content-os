import "server-only";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";

import { COOKIE_SESION, sesionValida } from "@/lib/auth";

import { db } from "./db";
import { pulseUsers } from "./schema";
import { COOKIE_PULSE, verificarSesion } from "./session";
import type { RolUsuario, UsuarioPulse } from "./types";

type FilaUsuario = typeof pulseUsers.$inferSelect;

export function aUsuario(u: FilaUsuario): UsuarioPulse {
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    rol: u.rol as RolUsuario,
    activo: u.activo,
    color: (u.color as UsuarioPulse["color"]) ?? null,
    tieneClave: !!u.passwordHash,
  };
}

// Usuario logueado en Pulse. Con cookie pulse válida → ese usuario (si sigue activo).
// Sin ella pero con la cookie CEO válida (o portal abierto en dev) → el admin semilla
// (PULSE_ADMIN_EMAIL), para que Elvin entre desde el Command Center sin segundo login.
export const usuarioActual = cache(async (): Promise<UsuarioPulse | null> => {
  const jar = await cookies();
  const d = await db();
  const s = await verificarSesion(jar.get(COOKIE_PULSE)?.value);
  if (s) {
    const u = await d.query.pulseUsers.findFirst({
      where: and(eq(pulseUsers.id, s.userId), eq(pulseUsers.activo, true)),
    });
    // Sesión emitida antes del último cambio de clave/rol → no vale.
    if (u && s.iat * 1000 >= new Date(u.sesionesDesde).getTime() - 1000) return aUsuario(u);
  }
  if (await sesionValida(jar.get(COOKIE_SESION)?.value)) {
    const email = process.env.PULSE_ADMIN_EMAIL?.toLowerCase();
    if (!email) return null;
    const u = await d.query.pulseUsers.findFirst({
      where: and(eq(pulseUsers.email, email), eq(pulseUsers.activo, true)),
    });
    if (u) return aUsuario(u);
  }
  return null;
});

export async function requiereUsuario(): Promise<UsuarioPulse> {
  const u = await usuarioActual();
  if (!u) throw new Error("no-autorizado");
  return u;
}

export async function requiereAdmin(): Promise<UsuarioPulse> {
  const u = await requiereUsuario();
  if (u.rol !== "admin") throw new Error("solo-admin");
  return u;
}

// Usuario con acceso al tablero (público, o privado y es admin/miembro).
export async function requiereAccesoBoard(boardId: string | null): Promise<UsuarioPulse> {
  const u = await requiereUsuario();
  if (!boardId) throw new Error("No existe");
  const { puedeVerBoard } = await import("./repo");
  if (!(await puedeVerBoard(u, boardId))) throw new Error("No tenés acceso a este tablero");
  return u;
}

// Admin o editor: pueden dar de alta / clave / activar gente.
export async function requiereGestor(): Promise<UsuarioPulse> {
  const u = await requiereUsuario();
  if (u.rol !== "admin" && u.rol !== "editor") throw new Error("solo-admin");
  return u;
}
