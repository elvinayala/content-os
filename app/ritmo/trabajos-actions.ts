"use server";

import { refresh } from "next/cache";

import * as datos from "@/lib/desempeno/datos";
import { fechaPR, puestoPorId } from "@/lib/desempeno/reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { borrarTrabajo, crearTrabajo } from "@/lib/desempeno/trabajos";
import { validarTrabajo, type TrabajoNuevo } from "@/lib/desempeno/trabajos-reglas";

// Trabajos del día del videógrafo (12/oct, Derek). Los anota él; la vista maestra (Yaileen, Carilin…) también puede
// anotarle o borrarle uno desde su ficha en Equipo, por si lo llama por teléfono o se le olvida.

type R = { ok: true } | { ok: false; error: string };

async function envolver(fn: () => Promise<void>): Promise<R> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** A quién se le anota: a uno mismo, o (vista maestra) a otra persona cuyo puesto anota trabajos. */
async function destino(para?: string) {
  const u = await usuarioRitmo();
  if (!u) throw new Error("Tu sesión venció: vuelve a entrar");
  const userId = para && para !== u.id ? para : u.id;
  if (userId !== u.id && !u.maestro) throw new Error("Solo RR.HH. y la dirección pueden anotarle trabajos a otra persona");
  const perfil = await datos.perfilDe(userId);
  if (!perfil?.activo || !puestoPorId(perfil.puesto)?.trabajos) throw new Error(userId === u.id ? "Tu puesto no anota trabajos" : "Esa persona no anota trabajos");
  return { u, userId };
}

export async function agregarTrabajoAction(t: Partial<TrabajoNuevo>, para?: string): Promise<R> {
  return envolver(async () => {
    const { u, userId } = await destino(para);
    const v = validarTrabajo(t, fechaPR(Date.now()));
    if (!v.ok) throw new Error(v.error);
    await crearTrabajo(userId, v.t, u.id);
    refresh();
  });
}

export async function borrarTrabajoAction(id: string, para?: string): Promise<R> {
  return envolver(async () => {
    const { u, userId } = await destino(para);
    await borrarTrabajo(id, userId, u.id, u.maestro);
    refresh();
  });
}
