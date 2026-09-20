import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type {
  InsightsIG,
  OpsUnidad,
  SnapshotAgenda,
  SnapshotDebrief,
  SnapshotLlamadas,
  SnapshotVentasEA,
  UnidadNegocio,
  UnidadOps,
} from "@/lib/types";

// Lectores de los snapshots que escribe /brief-ceo. `null` = no corrió aún
// (o el archivo está corrupto) → la UI cae al mock y lo indica con el badge.

const DATA_DIR = path.join(process.cwd(), "data");

async function leerJson<T>(nombre: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, nombre), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const OPS_FILE: Record<UnidadOps, string> = {
  "level-up": "ops-levelup.json",
  "ai-borinquen": "ops-borinquen.json",
};

export async function leerOps(unidad: UnidadOps): Promise<OpsUnidad | null> {
  return leerJson<OpsUnidad>(OPS_FILE[unidad]);
}

export async function leerAgendaSnapshot(): Promise<SnapshotAgenda | null> {
  return leerJson<SnapshotAgenda>("agenda.json");
}

// Filename por unidad de negocio (los escribe el scraper de Apify).
const IG_FILE: Partial<Record<UnidadNegocio, string>> = {
  "ai-borinquen": "ig-ai-borinquen.json",
  "level-up": "ig-level-up.json",
  "shadow-operator": "ig-shadow-operator.json",
};

export async function leerInsightsIGMarca(
  marca: UnidadNegocio,
): Promise<InsightsIG | null> {
  const file = IG_FILE[marca];
  return file ? leerJson<InsightsIG>(file) : null;
}

// Shadow por defecto (lo usan el Command Center y el HUD).
export async function leerInsightsIG(): Promise<InsightsIG | null> {
  return (
    (await leerJson<InsightsIG>("ig-shadow-operator.json")) ??
    (await leerJson<InsightsIG>("ig-shadow.json"))
  );
}

export async function leerDebriefReal(): Promise<SnapshotDebrief | null> {
  return leerJson<SnapshotDebrief>("debrief.json");
}

export async function leerVentasEA(): Promise<SnapshotVentasEA | null> {
  return leerJson<SnapshotVentasEA>("ventas-ea.json");
}

export async function leerLlamadas(): Promise<SnapshotLlamadas | null> {
  return leerJson<SnapshotLlamadas>("llamadas.json");
}

// Frescura de un snapshot — reexportado desde lib/frescura (client-safe) para
// que server components lo sigan importando desde acá.
export { frescura, type Frescura } from "@/lib/frescura";
