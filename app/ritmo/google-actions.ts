"use server";

import { refresh } from "next/cache";

import { anotar, desconectar } from "@/lib/desempeno/google-cal";
import { errorAnotacion } from "@/lib/desempeno/google-cal-reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

type R = { ok: true } | { ok: false; error: string };

/** Anota algo en el Google Calendar de la persona (solo el suyo). */
export async function anotarCalendarioAction(p: { titulo: string; fecha: string; hora: string; minutos: number | null; nota: string }): Promise<R> {
  try {
    const u = await usuarioRitmo();
    if (!u) throw new Error("Tu sesión venció: vuelve a entrar");
    const a = { titulo: p.titulo?.trim() ?? "", fecha: p.fecha, hora: p.hora || null, minutos: p.hora ? (p.minutos ?? 30) : null, nota: p.nota?.trim() || null };
    const err = errorAnotacion(a);
    if (err) throw new Error(err);
    await anotar(u.id, a);
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function desconectarGoogleAction(): Promise<R> {
  try {
    const u = await usuarioRitmo();
    if (!u) throw new Error("Tu sesión venció: vuelve a entrar");
    await desconectar(u.id);
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
