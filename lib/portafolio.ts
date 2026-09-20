import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { CapaPortafolio, Portafolio } from "@/lib/types";

const PORTAFOLIO_PATH = path.join(process.cwd(), "data", "portafolio.json");

// El portafolio del holding (plan de guerra Q4 2026). Se edita a mano en el JSON
// (o lo actualiza el board meeting cuando una compuerta cambia de estado).
export async function leerPortafolio(): Promise<Portafolio> {
  try {
    const raw = await fs.readFile(PORTAFOLIO_PATH, "utf-8");
    return JSON.parse(raw) as Portafolio;
  } catch {
    return {
      actualizadoEl: "",
      trimestre: "",
      reglas: [],
      compuertas: [],
      unidades: [],
    };
  }
}

export const CAPAS: { key: CapaPortafolio; label: string; descripcion: string }[] = [
  { key: "motor", label: "Motores", descripcion: "Hacen el dinero hoy. Se protegen primero." },
  { key: "producto", label: "Productos", descripcion: "Componen solos con poco tiempo de Elvin." },
  { key: "piloto", label: "Piloto", descripcion: "Sigue vivo con compuerta de fecha." },
  { key: "congelado", label: "Congelados", descripcion: "Con trigger escrito de reapertura. Cero horas." },
  { key: "entregado", label: "Entregados", descripcion: "Ya no son nuestros de operar." },
];
