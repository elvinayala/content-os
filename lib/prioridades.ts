import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { PrioridadesSnapshot } from "@/lib/types";

// Lee data/prioridades.json — las decisiones estratégicas del CEO. Las edita
// /brief-ceo (que puede agregar prioridades detectadas) o Elvin a mano. Si no
// existe, devuelve vacío (la UI muestra "sin prioridades cargadas").
const ARCHIVO = path.join(process.cwd(), "data", "prioridades.json");

export async function leerPrioridades(): Promise<PrioridadesSnapshot> {
  try {
    const raw = await fs.readFile(ARCHIVO, "utf-8");
    const snap = JSON.parse(raw) as PrioridadesSnapshot;
    // Abiertas/en-curso primero, luego por severidad.
    const orden = { alta: 0, media: 1, baja: 2 } as const;
    snap.prioridades.sort((a, b) => {
      const resuelta = (p: { estado: string }) => (p.estado === "resuelta" ? 1 : 0);
      return (
        resuelta(a) - resuelta(b) ||
        orden[a.severidad] - orden[b.severidad] ||
        b.creadoEl.localeCompare(a.creadoEl)
      );
    });
    return snap;
  } catch {
    return { actualizadoEl: new Date().toISOString(), prioridades: [] };
  }
}
