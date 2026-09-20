import "server-only";

import { promises as fs } from "fs";
import path from "path";

import { ganchos as seed } from "@/lib/mock/ganchos";
import type { Gancho } from "@/lib/types";

// Baúl de Ganchos: seed mock + los que agrega el worker (transcribir-perfil)
// en data/ganchos.json. Dedupe por id; los del worker van primero.

const GANCHOS_PATH = path.join(process.cwd(), "data", "ganchos.json");

export async function leerGanchos(): Promise<Gancho[]> {
  let delWorker: Gancho[] = [];
  try {
    const raw = await fs.readFile(GANCHOS_PATH, "utf-8");
    delWorker = JSON.parse(raw) as Gancho[];
  } catch {
    // sin archivo todavía — solo seed
  }
  const ids = new Set(delWorker.map((g) => g.id));
  return [...delWorker, ...seed.filter((g) => !ids.has(g.id))];
}
