import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { InstanciaAutoFlow } from "@/lib/types";
import { instanciasMock } from "@/lib/mock/borinquen";

// Instancias AutoFlow (DFY) por cliente. Patrón leer-con-fallback de lib/negocio.ts.
const FILE = path.join(process.cwd(), "data", "autoflow.json");

export async function leerInstancias(): Promise<InstanciaAutoFlow[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as InstanciaAutoFlow[];
  } catch {
    return instanciasMock;
  }
}

export async function guardarInstancias(
  instancias: InstanciaAutoFlow[],
): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(instancias, null, 2) + "\n", "utf-8");
}

export async function upsertInstancia(inst: InstanciaAutoFlow): Promise<void> {
  const todas = await leerInstancias();
  const i = todas.findIndex((x) => x.id === inst.id);
  if (i >= 0) todas[i] = inst;
  else todas.unshift(inst);
  await guardarInstancias(todas);
}
