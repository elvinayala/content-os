"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verificarLink } from "@/lib/desempeno/acceso";
import { hashPassword } from "@/lib/pulse/password";
import { actualizarUsuario } from "@/lib/pulse/repo";
import { cerrarSesiones, ipActual, limiteIp, registrarEvento } from "@/lib/pulse/seguridad";
import { COOKIE_PULSE, firmarSesion, TTL_SESION_LARGA } from "@/lib/pulse/session";

export async function activarAction(formData: FormData) {
  const t = String(formData.get("t") ?? "");
  const clave = String(formData.get("clave") ?? "").slice(0, 200);
  const otra = String(formData.get("otra") ?? "").slice(0, 200);
  const volver = (e: string) => redirect(`/ritmo/activar?t=${encodeURIComponent(t)}&error=${e}`);
  const ip = await ipActual();
  if (!limiteIp(`activar:${ip ?? "?"}`, 10, 60_000)) volver("limite");
  const u = await verificarLink(t);
  if (!u) redirect("/ritmo/activar?error=vencido");
  if (clave.length < 8) volver("corta");
  if (clave !== otra) volver("distintas");
  await actualizarUsuario(u!.id, { passwordHash: hashPassword(clave) });
  await cerrarSesiones(u!.id); // el link muere y cualquier sesión vieja también
  await registrarEvento({ tipo: "clave_cambiada", email: u!.email, userId: u!.id, ip, detalle: "Ritmo: link de acceso" });
  await new Promise((r) => setTimeout(r, 1100)); // la sesión nueva debe ser posterior a sesiones_desde
  const jar = await cookies();
  jar.set(COOKIE_PULSE, await firmarSesion(u!.id, undefined, TTL_SESION_LARGA), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: TTL_SESION_LARGA, path: "/" });
  redirect("/ritmo");
}
