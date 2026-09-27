"use server";

import { refresh } from "next/cache";

import { requiereAdmin } from "@/lib/pulse/auth";
import { leerLote, restaurarLote } from "@/lib/pulse/papelera";
import { registrarEvento } from "@/lib/pulse/seguridad";

// Restaurar desde la Papelera: solo el admin (Elvin). La papelera guarda de TODO (también nómina,
// documentos de empleados y el canal ético), por eso no la ve nadie más.
export async function restaurarLoteAction(lote: string): Promise<{ ok: true; restauradas: number; fallidas: number; archivos: number } | { ok: false; error: string }> {
  try {
    const u = await requiereAdmin();
    const l = await leerLote(lote);
    if (!l) return { ok: false, error: "Ese borrado ya no está en la papelera" };
    const r = await restaurarLote(lote, u.id);
    await registrarEvento({ tipo: "papelera_restaurada", email: u.email, actorId: u.id, detalle: `${l.principal} (${r.restauradas} filas, ${r.archivos} archivos)` });
    refresh();
    return { ok: true, ...r };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
