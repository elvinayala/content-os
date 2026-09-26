import "server-only";

import { usuarioActual } from "../pulse/auth";
import type { UsuarioPulse } from "../pulse/types";
import { actorRitmo } from "./datos";
import { dispositivoVerificado } from "./dos-pasos";
import { esMaestro } from "./reglas";

/**
 * `maestro` = ve la vista maestra (admin, editoras o RR.HH.) Y ya pasó la verificación en dos pasos en este
 * dispositivo. Sin verificar, se comporta como cualquier empleado en TODO (páginas, acciones, archivos) y
 * `falta2fa` le dice al layout que lo mande a /ritmo/verificar.
 */
export type UsuarioRitmo = UsuarioPulse & { rrhh: boolean; maestro: boolean; falta2fa: boolean };

export async function usuarioRitmo(): Promise<UsuarioRitmo | null> {
  const u = await usuarioActual();
  if (!u) return null;
  const a = actorRitmo(u);
  const puede = esMaestro(a);
  const verificado = puede ? await dispositivoVerificado(u.id) : false;
  return { ...a, maestro: puede && verificado, falta2fa: puede && !verificado };
}

export async function requiereMaestro(): Promise<UsuarioRitmo> {
  const u = await usuarioRitmo();
  if (!u) throw new Error("no-autorizado");
  if (u.falta2fa) throw new Error("Falta la verificación en dos pasos: recarga la página");
  if (!u.maestro) throw new Error("solo-admin");
  return u;
}
