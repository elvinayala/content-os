import { promises as fs } from "node:fs";
import path from "node:path";

import type { EventoCalendario } from "@/lib/types";

const CALENDARIO_PATH = path.join(process.cwd(), "data", "calendario.json");

// Lee las entradas del calendario desde data/calendario.json.
// Es lo que edita el comando /guion: al recargar la página se ven las nuevas.
// (Server-only: usa fs. La página que lo consume es dynamic.)
export async function leerCalendario(): Promise<EventoCalendario[]> {
  try {
    const raw = await fs.readFile(CALENDARIO_PATH, "utf-8");
    const eventos = JSON.parse(raw) as EventoCalendario[];
    return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  } catch {
    return [];
  }
}
