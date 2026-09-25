"use server";

import { requiereUsuario } from "@/lib/pulse/auth";
import { preguntarAlCRM, type RespuestaCRM } from "@/lib/pulse/preguntar-ia";
import { boardsVisibles } from "@/lib/pulse/repo";

// Tope por persona para que nadie queme la API por accidente (por instancia; suficiente acá).
const usos = new Map<string, number[]>();
const POR_MINUTO = 8;

export async function preguntarAction(p: { pregunta: string }): Promise<({ ok: true } & RespuestaCRM) | { ok: false; error: string }> {
  try {
    const u = await requiereUsuario();
    const pregunta = p.pregunta.trim().slice(0, 500);
    if (pregunta.length < 3) return { ok: false, error: "Escribe una pregunta" };
    const ahora = Date.now();
    const recientes = (usos.get(u.id) ?? []).filter((t) => ahora - t < 60_000);
    if (recientes.length >= POR_MINUTO) return { ok: false, error: "Muchas preguntas seguidas. Espera un minuto." };
    usos.set(u.id, [...recientes, ahora]);
    const r = await preguntarAlCRM(pregunta, [...(await boardsVisibles(u))]);
    return { ok: true, ...r };
  } catch (e) {
    console.error("[pulse/preguntar]", e);
    return { ok: false, error: "No pude consultar el CRM ahora. Intenta de nuevo." };
  }
}
