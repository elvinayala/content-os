import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { AsistenteChat } from "@/lib/types";
import { asistentesChatMock } from "@/lib/mock/borinquen";

// Persistencia de los asistentes de chat — mismo patrón que lib/voz/store.ts.
const FILE = path.join(process.cwd(), "data", "asistentes-chat.json");

export async function leerAsistentesChat(): Promise<AsistenteChat[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as AsistenteChat[];
  } catch {
    return asistentesChatMock;
  }
}

export async function leerAsistenteChat(
  id: string,
): Promise<AsistenteChat | null> {
  return (await leerAsistentesChat()).find((a) => a.id === id) ?? null;
}

export async function guardarAsistentesChat(
  asistentes: AsistenteChat[],
): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(asistentes, null, 2) + "\n", "utf-8");
}

export async function upsertAsistenteChat(a: AsistenteChat): Promise<void> {
  const todos = await leerAsistentesChat();
  const i = todos.findIndex((x) => x.id === a.id);
  if (i >= 0) todos[i] = a;
  else todos.unshift(a);
  await guardarAsistentesChat(todos);
}
