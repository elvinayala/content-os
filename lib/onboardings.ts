import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { OnboardingsSnapshot } from "@/lib/types";

const PATH = path.join(process.cwd(), "data", "onboardings.json");

// Clientes nuevos que empezaron — los escribe /brief-ceo desde el canal de
// Slack #office-3-onboarding (Jessica = Level Up, Ana = AI Borinquen).
export async function leerOnboardings(): Promise<OnboardingsSnapshot> {
  try {
    const raw = await fs.readFile(PATH, "utf-8");
    return JSON.parse(raw) as OnboardingsSnapshot;
  } catch {
    return { actualizadoEl: "", onboardings: [] };
  }
}
