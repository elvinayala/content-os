"use server";

import { headers } from "next/headers";

import { comprobarCodigo } from "@/lib/desempeno/dos-pasos";
import { usuarioActual } from "@/lib/pulse/auth";
import { limiteIp, registrarEvento } from "@/lib/pulse/seguridad";

// Segundo paso de Pulse: el mismo código de la app autenticadora que usa Ritmo.
export async function verificarPulseAction(codigo: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await usuarioActual();
  if (!u) return { ok: false, error: "Tu sesión venció: vuelve a entrar" };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  if (!limiteIp(`2fa-pulse:${u.id}:${ip ?? "?"}`, 10, 60_000)) return { ok: false, error: "Demasiados intentos seguidos. Espera un minuto." };
  const r = await comprobarCodigo(u.id, String(codigo ?? "").replace(/\D/g, "").slice(0, 6), ip);
  if (!r.ok) {
    await registrarEvento({ tipo: "login_fallido", email: u.email, userId: u.id, ip, detalle: "código de verificación incorrecto (Pulse)" }).catch(() => {});
    return r;
  }
  await registrarEvento({ tipo: "login_ok", email: u.email, userId: u.id, ip, detalle: "segundo paso de Pulse" }).catch(() => {});
  return { ok: true };
}
