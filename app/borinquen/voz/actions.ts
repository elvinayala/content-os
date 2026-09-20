"use server";

import { revalidatePath } from "next/cache";

import type { EstadoAgenteVoz } from "@/lib/types";
import { leerAgenteVoz, upsertAgenteVoz } from "@/lib/voz/store";

// Cambia el estado de un agente de voz (activo ↔ pausado, o publicar un borrador).
export async function cambiarEstadoAgenteAction(
  id: string,
  estado: EstadoAgenteVoz,
) {
  const agente = await leerAgenteVoz(id);
  if (!agente) return { ok: false, error: "Agente no encontrado." };
  await upsertAgenteVoz({
    ...agente,
    estado,
    actualizadoEl: new Date().toISOString(),
  });
  revalidatePath("/borinquen/voz");
  revalidatePath(`/borinquen/voz/${id}`);
  revalidatePath("/borinquen");
  return { ok: true };
}
