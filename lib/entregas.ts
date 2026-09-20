import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { EntregasSnapshot, PlanProduccion } from "@/lib/types";

const ENTREGAS_PATH = path.join(process.cwd(), "data", "entregas.json");
const PRODUCCION_PATH = path.join(process.cwd(), "data", "produccion.json");

// Bandeja de entregas del equipo (la escribe /fabrica-contenido). Sin archivo
// → bandeja vacía.
export async function leerEntregas(): Promise<EntregasSnapshot> {
  try {
    const raw = await fs.readFile(ENTREGAS_PATH, "utf-8");
    return JSON.parse(raw) as EntregasSnapshot;
  } catch {
    return { actualizadoEl: "", entregas: [] };
  }
}

export async function leerPlanProduccion(): Promise<PlanProduccion> {
  try {
    const raw = await fs.readFile(PRODUCCION_PATH, "utf-8");
    return JSON.parse(raw) as PlanProduccion;
  } catch {
    return {};
  }
}
