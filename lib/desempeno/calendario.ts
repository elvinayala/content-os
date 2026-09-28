import "server-only";

import { and, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { avisoPendientes, choques, mensajeChoque, type Tramo } from "./calendario-reglas";
import { desempenoAusencias, desempenoPerfiles, desempenoSolicitudes } from "./schema";

// Calendario de ausencias: lo aprobado (ausencias registradas) + lo pedido en curso (solicitudes con fechas).
// Una solicitud firmada crea su ausencia, así que de solicitudes solo se toman las que siguen en curso.

const CON_FECHAS = ["vacaciones", "dia_libre", "permiso"];

export async function tramosEntre(desde: string, hasta: string): Promise<Tramo[]> {
  const d = await db();
  const [aus, sol] = await Promise.all([
    d
      .select({ id: desempenoAusencias.id, userId: desempenoAusencias.userId, tipo: desempenoAusencias.tipo, desde: desempenoAusencias.desde, hasta: desempenoAusencias.hasta, nombre: pulseUsers.nombre, puesto: desempenoPerfiles.puesto, empresa: desempenoPerfiles.empresa })
      .from(desempenoAusencias)
      .innerJoin(pulseUsers, eq(pulseUsers.id, desempenoAusencias.userId))
      .leftJoin(desempenoPerfiles, eq(desempenoPerfiles.userId, desempenoAusencias.userId))
      .where(and(lte(desempenoAusencias.desde, hasta), gte(desempenoAusencias.hasta, desde))),
    d
      .select({ id: desempenoSolicitudes.id, userId: desempenoSolicitudes.userId, tipo: desempenoSolicitudes.tipo, desde: desempenoSolicitudes.desde, hasta: desempenoSolicitudes.hasta, nombre: pulseUsers.nombre, puesto: desempenoPerfiles.puesto, empresa: desempenoPerfiles.empresa })
      .from(desempenoSolicitudes)
      .innerJoin(pulseUsers, eq(pulseUsers.id, desempenoSolicitudes.userId))
      .leftJoin(desempenoPerfiles, eq(desempenoPerfiles.userId, desempenoSolicitudes.userId))
      .where(and(inArray(desempenoSolicitudes.estado, ["supervisor", "rrhh"]), inArray(desempenoSolicitudes.tipo, CON_FECHAS), isNotNull(desempenoSolicitudes.desde), lte(desempenoSolicitudes.desde, hasta), gte(desempenoSolicitudes.hasta, desde))),
  ]);
  const fila = (x: (typeof aus)[number], estado: Tramo["estado"]): Tramo => ({ id: x.id, userId: x.userId, nombre: x.nombre, puesto: x.puesto ?? "", empresa: x.empresa ?? "level_up", tipo: x.tipo, desde: x.desde!, hasta: x.hasta ?? x.desde!, estado });
  return [...aus.map((x) => fila(x, "aprobada")), ...sol.map((x) => fila(x as (typeof aus)[number], "pendiente"))].sort((a, b) => a.desde.localeCompare(b.desde));
}

/** Revisa unas fechas para una persona: `error` si ya hay otro del mismo puesto aprobado (bloquea), `aviso` si solo hay pedidos en curso. */
export async function revisarFechas(p: { id?: string; userId: string; desde: string; hasta: string }): Promise<{ error: string | null; aviso: string | null }> {
  const d = await db();
  const [perfil] = await d.select({ puesto: desempenoPerfiles.puesto, empresa: desempenoPerfiles.empresa }).from(desempenoPerfiles).where(eq(desempenoPerfiles.userId, p.userId));
  if (!perfil) return { error: null, aviso: null };
  const c = choques({ ...p, puesto: perfil.puesto, empresa: perfil.empresa }, await tramosEntre(p.desde, p.hasta));
  return { error: mensajeChoque(c, perfil.puesto), aviso: avisoPendientes(c) };
}
