"use server";

import { and, eq } from "drizzle-orm";

import { requiereAccesoBoard } from "@/lib/pulse/auth";
import { sumarDias } from "@/lib/pulse/automatizaciones";
import { db } from "@/lib/pulse/db";
import type { TipoPendiente } from "@/lib/pulse/mi-dia";
import { hoyPR } from "@/lib/pulse/motor-reglas";
import * as repo from "@/lib/pulse/repo";
import { pulseActivity, pulseColumns } from "@/lib/pulse/schema";

const TEXTO: Record<TipoPendiente, string> = {
  seguimiento: "✓ Seguimiento de 10 días hecho",
  reporte: "✓ Reporte enviado",
  onboarding: "✓ Onboarding revisado",
  nuevo: "✓ Cliente nuevo revisado",
};

// Marca un pendiente de "Mi día" como hecho: queda en la actividad del cliente (historial) y
// desaparece de la lista. "Reporte enviado" además mueve las fechas de reporte.
export async function marcarHechoAction(p: { itemId: string; tipo: TipoPendiente; fecha: string | null }) {
  try {
    const boardId = await repo.boardDe({ itemId: p.itemId });
    const u = await requiereAccesoBoard(boardId);
    const d = await db();
    if (p.tipo === "reporte" && boardId) {
      const cols = await d.select({ id: pulseColumns.id, title: pulseColumns.title }).from(pulseColumns).where(and(eq(pulseColumns.boardId, boardId), eq(pulseColumns.type, "date")));
      const ultimo = cols.find((c) => /[uú]ltimo reporte/i.test(c.title));
      const proximo = cols.find((c) => /pr[oó]ximo reporte/i.test(c.title));
      const [item] = await repo.leerItems([p.itemId]);
      const hoy = hoyPR();
      // Mantiene la cadencia que traía (próximo − último); si no hay, 15 días.
      const prev = ultimo ? (item?.values[ultimo.id] as string | null) : null;
      const cadencia = prev && p.fecha ? Math.max(7, Math.min(45, Math.round((Date.parse(p.fecha) - Date.parse(prev)) / 86_400_000))) : 15;
      if (ultimo) await repo.actualizarValor({ itemId: p.itemId, columnId: ultimo.id, value: hoy, userId: u.id });
      if (proximo) await repo.actualizarValor({ itemId: p.itemId, columnId: proximo.id, value: sumarDias(hoy, cadencia), userId: u.id });
    }
    await d.insert(pulseActivity).values({ itemId: p.itemId, boardId: boardId!, tipo: "comentario", after: { texto: TEXTO[p.tipo], hecho: { tipo: p.tipo, fecha: p.fecha } }, userId: u.id });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Error" };
  }
}
