import "server-only";

import { promises as fs } from "fs";
import path from "path";

import {
  actualizadoEl as mockFecha,
  cuentas as mockCuentas,
  reelsCompetencia as mockReels,
} from "@/lib/mock/competencia";
import type { CompetenciaSnapshot } from "@/lib/types";

const COMPETENCIA_PATH = path.join(process.cwd(), "data", "competencia.json");

// Lee el snapshot real (Apify) o cae al mock si no existe.
export async function leerCompetencia(): Promise<CompetenciaSnapshot> {
  try {
    const raw = await fs.readFile(COMPETENCIA_PATH, "utf-8");
    return JSON.parse(raw) as CompetenciaSnapshot;
  } catch {
    return {
      actualizadoEl: mockFecha,
      fuente: "mock",
      cuentas: mockCuentas,
      reels: mockReels,
    };
  }
}
