"use server";

import { refresh } from "next/cache";

import { DIRECCION, invitarCafe, puedeCafe } from "@/lib/desempeno/agentes-reportes";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

// Rincón del café: la dirección invita a un agente a un café (un mensaje a su buzón) y la respuesta sale en Ritmo.
export async function cafeAction(para: string, texto: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const u = await usuarioRitmo();
    if (!u?.maestro || (u.rol !== "admin" && u.rol !== "editor")) throw new Error("Solo la dirección");
    const email = u.email.toLowerCase();
    const de = email === DIRECCION.ceo ? "elvin" : email === DIRECCION.carilin ? "carilin" : email === DIRECCION.aure ? "aure" : null;
    if (!de) throw new Error("Solo Elvin, Carilin o Aure");
    if (!puedeCafe(de, para)) throw new Error(de === "elvin" ? "Ese agente no tiene buzón todavía" : "Por ahora el café es con Nico (lo demás pasa por Elvin)");
    const t = texto.trim();
    if (t.length < 2 || t.length > 2000) throw new Error("Escribe tu mensaje (máx. 2000 caracteres)");
    await invitarCafe(de, para, t);
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
