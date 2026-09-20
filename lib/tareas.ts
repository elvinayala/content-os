import "server-only";

import { promises as fs } from "fs";
import path from "path";

import { tareas as mockTareas } from "@/lib/mock/ceo";
import type { TareasSnapshot } from "@/lib/types";

const TAREAS_PATH = path.join(process.cwd(), "data", "tareas.json");

// Compromisos reales de Elvin (los escribe /brief-ceo desde Granola + Slack).
// Sin snapshot → cae al mock.
export async function leerTareas(): Promise<TareasSnapshot> {
  try {
    const raw = await fs.readFile(TAREAS_PATH, "utf-8");
    return JSON.parse(raw) as TareasSnapshot;
  } catch {
    return { actualizadoEl: "", tareas: mockTareas };
  }
}
