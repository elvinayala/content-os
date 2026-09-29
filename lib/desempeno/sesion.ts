import "server-only";

import { cache } from "react";

import { usuarioActual } from "../pulse/auth";
import type { UsuarioPulse } from "../pulse/types";
import { actorRitmo } from "./datos";
import { dispositivoVerificado } from "./dos-pasos";
import { cargarPuestosExtra } from "./puestos-extra";
import { esMaestro } from "./reglas";

/**
 * `maestro` = ve la vista maestra (admin, editoras o RR.HH.) Y ya pasó la verificación en dos pasos en este
 * dispositivo. Sin verificar, se comporta como cualquier empleado en TODO (páginas, acciones, archivos) y
 * `falta2fa` le dice al layout que lo mande a /ritmo/verificar.
 */
export type UsuarioRitmo = UsuarioPulse & { rrhh: boolean; maestro: boolean; falta2fa: boolean };

// cache(): el layout y la página lo piden en el mismo request; así se consulta una sola vez.
export const usuarioRitmo = cache(async (): Promise<UsuarioRitmo | null> => {
  const u = await usuarioActual();
  if (!u) return null;
  const a = actorRitmo(u);
  const puede = esMaestro(a);
  // Los puestos que crea RR.HH. (29/sep) se registran aquí: toda página y acción de Ritmo pasa por esta función.
  const [verificado] = await Promise.all([puede ? dispositivoVerificado(u.id) : Promise.resolve(false), cargarPuestosExtra()]);
  return { ...a, maestro: puede && verificado, falta2fa: puede && !verificado };
});

export async function requiereMaestro(): Promise<UsuarioRitmo> {
  const u = await usuarioRitmo();
  if (!u) throw new Error("no-autorizado");
  if (u.falta2fa) throw new Error("Falta la verificación en dos pasos: recarga la página");
  if (!u.maestro) throw new Error("solo-admin");
  return u;
}
