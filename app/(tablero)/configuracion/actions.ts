"use server";

import { revalidatePath } from "next/cache";

import { guardarNegocio } from "@/lib/negocio";
import type { Negocio } from "@/lib/types";

// Guarda la configuración del negocio en data/negocio.json y refresca las
// páginas que la consumen (Equipo, Tendencias, etc.).
export async function guardarNegocioAction(negocio: Negocio) {
  await guardarNegocio(negocio);
  revalidatePath("/equipo");
  revalidatePath("/configuracion");
  revalidatePath("/tendencias");
  return { ok: true };
}
