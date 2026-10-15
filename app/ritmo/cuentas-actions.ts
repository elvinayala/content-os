"use server";

import { refresh } from "next/cache";

import { accesoCuentas, casoPorId, cerrarCaso, marcarAccion, pedirOptimizacion } from "@/lib/desempeno/optimizaciones";
import { puedeMarcar } from "@/lib/desempeno/optimizaciones-reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

// Cuentas por optimizar (15/oct): el estratega marca cada punto de la revisión de Max (ejecutado, o no + por qué); la
// dirección de tráfico (María del Carmen, Juan Diego, Carilin) cierra el caso cuando la cuenta ya está bien o le pide más.

type R = { ok: true } | { ok: false; error: string };

async function envolver(fn: () => Promise<void>): Promise<R> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

async function quien() {
  const u = await usuarioRitmo();
  if (!u) throw new Error("Tu sesión venció: vuelve a entrar");
  const rol = await accesoCuentas(u);
  if (!rol) throw new Error("No tienes cuentas asignadas");
  return { u, rol };
}

export async function marcarAccionAction(casoId: number, accionId: string, estado: string, motivo?: string): Promise<R> {
  return envolver(async () => {
    const { u, rol } = await quien();
    const caso = await casoPorId(Number(casoId));
    if (!caso) throw new Error("Ese caso ya no existe");
    if (!puedeMarcar(caso, u, rol)) throw new Error(caso.estado !== "abierta" ? "Ese caso ya está cerrado" : "Ese caso no es tuyo");
    await marcarAccion(caso.id, String(accionId), String(estado), motivo ?? null, u);
    refresh();
  });
}

export async function cerrarCasoAction(casoId: number, nota?: string): Promise<R> {
  return envolver(async () => {
    const { u, rol } = await quien();
    if (rol !== "direccion") throw new Error("Solo la dirección de tráfico marca una cuenta como bien");
    await cerrarCaso(Number(casoId), u, nota ?? null);
    refresh();
  });
}

export async function pedirOptimizacionAction(casoId: number, texto: string): Promise<R> {
  return envolver(async () => {
    const { u, rol } = await quien();
    if (rol !== "direccion") throw new Error("Solo la dirección de tráfico pide optimizaciones");
    await pedirOptimizacion(Number(casoId), u, String(texto ?? ""));
    refresh();
  });
}
