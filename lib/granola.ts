import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { GranolaSnapshot } from "@/lib/types";

// Lee data/granola-hoy.json — el resumen del día del CEO destilado de sus
// reuniones de Granola (qué hizo, decisiones, pendientes). Lo escribe
// /sync-granola. Es la fuente que recoge el criterio de CEO de Elvin.
const ARCHIVO = path.join(process.cwd(), "data", "granola-hoy.json");

export async function leerGranola(): Promise<GranolaSnapshot | null> {
  try {
    const raw = await fs.readFile(ARCHIVO, "utf-8");
    return JSON.parse(raw) as GranolaSnapshot;
  } catch {
    return null;
  }
}
