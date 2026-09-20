import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { AgenteVoz } from "@/lib/types";
import { agentesVozMock } from "@/lib/mock/borinquen";

// Persistencia de los agentes de voz — mismo patrón que lib/negocio.ts:
// leer con fallback al mock; la primera escritura materializa el archivo
// (mock + nuevos) y a partir de ahí manda el JSON.

const FILE = path.join(process.cwd(), "data", "agentes-voz.json");

export async function leerAgentesVoz(): Promise<AgenteVoz[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as AgenteVoz[];
  } catch {
    return agentesVozMock;
  }
}

export async function leerAgenteVoz(id: string): Promise<AgenteVoz | null> {
  return (await leerAgentesVoz()).find((a) => a.id === id) ?? null;
}

export async function guardarAgentesVoz(agentes: AgenteVoz[]): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(agentes, null, 2) + "\n", "utf-8");
}

// Agrega o reemplaza un agente y persiste toda la lista.
export async function upsertAgenteVoz(agente: AgenteVoz): Promise<void> {
  const todos = await leerAgentesVoz();
  const i = todos.findIndex((a) => a.id === agente.id);
  if (i >= 0) todos[i] = agente;
  else todos.unshift(agente);
  await guardarAgentesVoz(todos);
}
