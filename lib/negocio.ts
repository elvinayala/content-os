import { promises as fs } from "node:fs";
import path from "node:path";

import type { Negocio } from "@/lib/types";

const NEGOCIO_PATH = path.join(process.cwd(), "data", "negocio.json");

// Configuración por defecto si el archivo no existe.
const DEFAULT: Negocio = {
  marca: {
    handle: "@tenfoldmarc",
    nombre: "",
    nicho: "",
    tono: "",
    audiencia: "",
    oferta: "",
    cta: "",
  },
  cuentas: [
    { plataforma: "Instagram", handle: "", conectada: false },
    { plataforma: "TikTok", handle: "", conectada: false },
    { plataforma: "YouTube", handle: "", conectada: false },
  ],
  competidores: [],
  fuentes: [],
  reglas: {
    mixSemanal: { reels: 3, carruseles: 2, youtube: 1 },
    horariosPublicacion: ["18:00"],
    umbralBombazo: 2,
    resumenSlackHora: "07:00",
    ideasPorSemana: 7,
  },
};

// Lee la configuración del negocio (server-only).
export async function leerNegocio(): Promise<Negocio> {
  try {
    const raw = await fs.readFile(NEGOCIO_PATH, "utf-8");
    return { ...DEFAULT, ...(JSON.parse(raw) as Negocio) };
  } catch {
    return DEFAULT;
  }
}

// Escribe la configuración (la usa la server action de /configuracion).
export async function guardarNegocio(negocio: Negocio): Promise<void> {
  await fs.writeFile(NEGOCIO_PATH, JSON.stringify(negocio, null, 2) + "\n", "utf-8");
}
