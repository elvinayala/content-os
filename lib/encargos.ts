import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { ColaEncargos, Encargo, TipoEncargo } from "@/lib/types";

// Cola de trabajos pesados. Backend actual: data/encargos.json vía fs (funciona
// cuando el portal corre local). En Vercel el fs es read-only: crearEncargo
// falla y la tool de Jarvis devuelve la instrucción manual para el worker.
// Backend futuro (F8+): GitHub Contents API — misma interfaz.

const ENCARGOS_PATH = path.join(process.cwd(), "data", "encargos.json");

async function leerCola(): Promise<ColaEncargos> {
  try {
    const raw = await fs.readFile(ENCARGOS_PATH, "utf-8");
    return JSON.parse(raw) as ColaEncargos;
  } catch {
    return { encargos: [] };
  }
}

export async function listarEncargos(
  estado?: Encargo["estado"],
): Promise<Encargo[]> {
  const cola = await leerCola();
  return estado
    ? cola.encargos.filter((e) => e.estado === estado)
    : cola.encargos;
}

export async function crearEncargo(
  tipo: TipoEncargo,
  params: Record<string, string>,
  pedidoPor: Encargo["pedidoPor"] = "jarvis",
): Promise<Encargo> {
  const ahora = new Date().toISOString();
  const encargo: Encargo = {
    id: `enc-${Date.now()}`,
    tipo,
    params,
    estado: "pendiente",
    pedidoPor,
    creadoEl: ahora,
    actualizadoEl: ahora,
  };
  const cola = await leerCola();
  cola.encargos.push(encargo);
  // En Vercel esto tira (fs read-only) — el caller decide el fallback.
  await fs.writeFile(ENCARGOS_PATH, JSON.stringify(cola, null, 2), "utf-8");
  return encargo;
}
