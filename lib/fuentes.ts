import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { FuentesConfig } from "@/lib/types";

const FUENTES_PATH = path.join(process.cwd(), "data", "fuentes.json");

// Config por defecto: todo desconectado. Se usa si data/fuentes.json falta.
const DEFAULT: FuentesConfig = {
  slack: {
    "level-up": {
      workspace: "Level Up",
      conectado: false,
      canales: { wins: null, criticos: null },
    },
    "ai-borinquen": {
      workspace: "AI Borinquen",
      conectado: false,
      canales: { wins: null, criticos: null },
    },
  },
  calendar: {
    cuenta: "",
    calendarios: ["primary"],
    timezone: "America/Puerto_Rico",
    ventanaDias: 7,
    prefijoAgente: "[CEO-AGENT]",
    crearEventos: false,
  },
  instagram: {},
  pipedrive: {
    "level-up": { valorEs: "mensual", stageMap: {} },
    "ai-borinquen": { valorEs: "mensual", stageMap: {} },
  },
  portales: {},
};

export async function leerFuentes(): Promise<FuentesConfig> {
  try {
    const raw = await fs.readFile(FUENTES_PATH, "utf-8");
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}
