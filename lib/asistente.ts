import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { AsistentePersonal } from "@/lib/types";
import { asistentesMock } from "@/lib/mock/borinquen";

// Asistentes personales (Telegram/WhatsApp). Patrón leer-con-fallback.
const FILE = path.join(process.cwd(), "data", "asistentes.json");

export async function leerAsistentes(): Promise<AsistentePersonal[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as AsistentePersonal[];
  } catch {
    return asistentesMock;
  }
}

export async function guardarAsistentes(
  asistentes: AsistentePersonal[],
): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(asistentes, null, 2) + "\n", "utf-8");
}

export async function upsertAsistente(a: AsistentePersonal): Promise<void> {
  const todos = await leerAsistentes();
  const i = todos.findIndex((x) => x.id === a.id);
  if (i >= 0) todos[i] = a;
  else todos.unshift(a);
  await guardarAsistentes(todos);
}
