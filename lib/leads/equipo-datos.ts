import "server-only";

import { and, asc, eq, isNotNull } from "drizzle-orm";

import { estaBloqueado } from "@/lib/desempeno/acceso";
import { leerPerfiles } from "@/lib/desempeno/datos";
import { puestoPorId } from "@/lib/desempeno/reglas";
import { db } from "@/lib/pulse/db";
import { pulseUsers } from "@/lib/pulse/schema";
import type { UsuarioPulse } from "@/lib/pulse/types";

import { manejaEquipoLeads, type Alcance } from "./equipo";
import type { Marca } from "./reglas";
import { accesoLeads } from "./repo";
import { leadsAcceso } from "./schema";

export interface MiembroLeads {
  id: string;
  nombre: string;
  email: string;
  puesto: string | null;
  alcance: Alcance | null; // null = no tiene acceso (candidato)
  soloRitmo: boolean;
  implicito: boolean; // admin / editoras: entran sin fila
  sinClave: boolean; // todavía no creó su clave: necesita su link de acceso (Carilin/Aure en Ritmo → Ajustes)
}

export async function manejaEquipo(u: UsuarioPulse, marca: Marca): Promise<boolean> {
  const perfil = (await leerPerfiles(false).catch(() => [])).find((p) => p.userId === u.id) ?? null;
  const ve = (await accesoLeads(u, marca)).puede;
  return manejaEquipoLeads(u, perfil, marca, ve);
}

/** Quién tiene acceso a Leads de la marca y a quién se le puede dar (cuentas activas de Pulse). */
export async function equipoLeads(marca: Marca): Promise<{ conAcceso: MiembroLeads[]; candidatos: MiembroLeads[] }> {
  const d = await db();
  const [usuarios, filas, perfiles] = await Promise.all([
    d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre, email: pulseUsers.email, rol: pulseUsers.rol, activo: pulseUsers.activo, clave: isNotNull(pulseUsers.passwordHash) }).from(pulseUsers).orderBy(asc(pulseUsers.nombre)),
    d.select().from(leadsAcceso).where(eq(leadsAcceso.marca, marca)),
    leerPerfiles(false).catch(() => []),
  ]);
  const conAcceso: MiembroLeads[] = [];
  const candidatos: MiembroLeads[] = [];
  for (const u of usuarios) {
    if (!u.activo || u.email.endsWith("@pulse.sistema") || estaBloqueado(u.email)) continue;
    const p = perfiles.find((x) => x.userId === u.id);
    const fila = filas.find((f) => f.userId === u.id);
    const implicito = u.rol === "admin" || (u.rol === "editor" && marca === "level_up");
    const m: MiembroLeads = { id: u.id, nombre: u.nombre, email: u.email, puesto: p ? (puestoPorId(p.puesto)?.nombre ?? p.puesto) : null, alcance: fila ? (fila.alcance === "mios" ? "mios" : "todos") : implicito ? "todos" : null, soloRitmo: !!p?.soloRitmo, implicito, sinClave: !u.clave };
    (m.alcance ? conAcceso : candidatos).push(m);
  }
  return { conAcceso, candidatos };
}

export async function darAccesoLeads(userId: string, marca: Marca, alcance: Alcance): Promise<void> {
  const d = await db();
  await d.insert(leadsAcceso).values({ userId, marca, alcance }).onConflictDoUpdate({ target: [leadsAcceso.userId, leadsAcceso.marca], set: { alcance } });
}

export async function quitarAccesoLeads(userId: string, marca: Marca): Promise<void> {
  const d = await db();
  await d.delete(leadsAcceso).where(and(eq(leadsAcceso.userId, userId), eq(leadsAcceso.marca, marca)));
}
