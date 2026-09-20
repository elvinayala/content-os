"use server";

import { revalidatePath } from "next/cache";

import type { EstadoAgenteVoz } from "@/lib/types";
import { leerAsistenteChat, upsertAsistenteChat } from "@/lib/chat/store";

// Cambia el estado de un asistente de chat (activo ↔ pausado, o publicar).
export async function cambiarEstadoChatAction(
  id: string,
  estado: EstadoAgenteVoz,
) {
  const a = await leerAsistenteChat(id);
  if (!a) return { ok: false, error: "Asistente no encontrado." };
  await upsertAsistenteChat({
    ...a,
    estado,
    actualizadoEl: new Date().toISOString(),
  });
  revalidatePath("/borinquen/chat");
  revalidatePath(`/borinquen/chat/${id}`);
  revalidatePath("/borinquen");
  return { ok: true };
}
