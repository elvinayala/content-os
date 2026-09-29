import "server-only";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";

import { COOKIE_SESION, sesionValida } from "@/lib/auth";

import { desempenoPerfiles } from "../desempeno/schema";

import { db } from "./db";
import { pulseUsers } from "./schema";
import { requiereSegundoPaso, tipoAccesoPulse, type TipoAcceso } from "./acceso-reglas";
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

// Seguridad (26/sep/2026): quien entró por Ritmo (empleado de operaciones, `solo_ritmo`) NO puede usar
// Pulse — ahí están los clientes, Leads y Tesorería. La cuenta es la misma; el permiso no.
export const esSoloRitmo = cache(async (userId: string): Promise<boolean> => {
  try {
    const d = await db();
    const [p] = await d.select({ solo: desempenoPerfiles.soloRitmo }).from(desempenoPerfiles).where(eq(desempenoPerfiles.userId, userId));
    return !!p?.solo;
  } catch {
    return false;
  }
});

// Qué parte de Pulse le toca (28/sep): completo (tableros) · solo_leads (equipo de ventas) · solo_ritmo.
export const tipoAcceso = cache(async (userId: string, rol: string): Promise<TipoAcceso> => {
  if (rol === "admin" || rol === "editor") return "completo";
  try {
    const d = await db();
    const [p] = await d.select({ puesto: desempenoPerfiles.puesto, soloRitmo: desempenoPerfiles.soloRitmo }).from(desempenoPerfiles).where(eq(desempenoPerfiles.userId, userId));
    return tipoAccesoPulse(rol, p ?? null);
  } catch {
    return "completo";
  }
});

/** Segundo candado de Pulse (28/sep, Elvin: "una doble capa para cualquier acceso"): todo el que ve tableros confirma
 *  con el código de su app autenticadora; el navegador queda recordado 30 días (misma verificación que Ritmo). */
export async function segundoPasoPendiente(u: UsuarioPulse): Promise<boolean> {
  const modo = process.env.PULSE_2FA ?? (process.env.NODE_ENV === "production" ? "on" : "off");
  if (!requiereSegundoPaso(await tipoAcceso(u.id, u.rol), modo)) return false;
  const { dispositivoVerificado } = await import("../desempeno/dos-pasos");
  return !(await dispositivoVerificado(u.id));
}

/** Usuario de PULSE (bloquea a los que son solo de Ritmo y exige el segundo paso). Ritmo usa `requiereCuenta`. */
export async function requiereUsuario(): Promise<UsuarioPulse> {
  const u = await usuarioActual();
  if (!u) throw new Error("no-autorizado");
  if (u.rol === "miembro" && (await esSoloRitmo(u.id))) throw new Error("no-autorizado");
  if (await segundoPasoPendiente(u)) throw new Error("Falta la verificación en dos pasos: recarga la página");
  return u;
}

/** Cualquier cuenta activa (la usa Ritmo: también los empleados que son solo de Ritmo). */
export async function requiereCuenta(): Promise<UsuarioPulse> {
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
  if (!(await puedeVerBoard(u, boardId))) throw new Error("No tienes acceso a este tablero");
  return u;
}

// Admin o editor: pueden dar de alta / clave / activar gente.
export async function requiereGestor(): Promise<UsuarioPulse> {
  const u = await requiereUsuario();
  if (u.rol !== "admin" && u.rol !== "editor") throw new Error("solo-admin");
  return u;
}

/** Para route handlers y actions que no pasan por el layout: la sesión SOLO vale con el segundo paso hecho. */
export async function usuarioVerificado(): Promise<UsuarioPulse | null> {
  const u = await usuarioActual();
  if (!u) return null;
  return (await segundoPasoPendiente(u)) ? null : u;
}
