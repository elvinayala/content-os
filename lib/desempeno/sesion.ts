import "server-only";

import { usuarioActual } from "../pulse/auth";
import type { UsuarioPulse } from "../pulse/types";
import { actorRitmo } from "./datos";
import { esMaestro } from "./reglas";

export type UsuarioRitmo = UsuarioPulse & { rrhh: boolean; maestro: boolean };

/** Usuario logueado en Ritmo (cuenta de Pulse) + si ve la vista maestra (admin, editoras o RR.HH.). */
export async function usuarioRitmo(): Promise<UsuarioRitmo | null> {
  const u = await usuarioActual();
  if (!u) return null;
  const a = actorRitmo(u);
  return { ...a, maestro: esMaestro(a) };
}

export async function requiereMaestro(): Promise<UsuarioRitmo> {
  const u = await usuarioRitmo();
  if (!u) throw new Error("no-autorizado");
  if (!u.maestro) throw new Error("solo-admin");
  return u;
}
