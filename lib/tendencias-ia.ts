import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { CompetenciaSnapshot } from "@/lib/types";

const TENDENCIAS_PATH = path.join(process.cwd(), "data", "tendencias.json");

// Feed de "último momento de IA": posts recientes de cuentas de noticias
// (OpenAI, Claude, ElevenLabs, etc.). Sin snapshot → null (la UI muestra hint).
export async function leerTendenciasIA(): Promise<CompetenciaSnapshot | null> {
  try {
    const raw = await fs.readFile(TENDENCIAS_PATH, "utf-8");
    return JSON.parse(raw) as CompetenciaSnapshot;
  } catch {
    return null;
  }
}
