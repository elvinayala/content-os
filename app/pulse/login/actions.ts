"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { usuarioActual } from "@/lib/pulse/auth";
import { hashPassword, verificarPassword } from "@/lib/pulse/password";
import { buscarUsuarioPorEmail } from "@/lib/pulse/repo";
import { ipActual, limiteIp, limpiarFallos, registrarEvento, registrarFallo, vigilarIpNueva } from "@/lib/pulse/seguridad";
import { COOKIE_PULSE, TTL_SESION, TTL_SESION_LARGA, firmarSesion } from "@/lib/pulse/session";

// Hash de sacrificio: cuando el email no existe igual se calcula un scrypt para que el
// tiempo de respuesta no delate si la cuenta existe (anti-enumeración).
const HASH_SACRIFICIO = hashPassword("pulse-sacrificio");

export async function loginPulseAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const desde = String(formData.get("desde") ?? "");
  const recordar = formData.get("recordar") === "1";
  const ttl = recordar ? TTL_SESION_LARGA : TTL_SESION;
  const destinoValido = desde.startsWith("/pulse") && !desde.startsWith("//");
  const volver = (error: string) => redirect(`/pulse/login?error=${error}${desde ? `&desde=${encodeURIComponent(desde)}` : ""}`);
  const ip = await ipActual();

  // Límite por IP: 10 intentos por minuto.
  if (!limiteIp(`login:${ip ?? "?"}`, 10, 60_000)) {
    await registrarEvento({ tipo: "login_limite_ip", email, ip });
    volver("limite");
  }

  const u = email ? await buscarUsuarioPorEmail(email) : null;
  if (u?.bloqueadoHasta && new Date(u.bloqueadoHasta).getTime() > Date.now()) {
    await registrarEvento({ tipo: "login_bloqueado", email, userId: u.id, ip });
    volver("bloqueado");
  }
  const ok = u && u.activo ? verificarPassword(password, u.passwordHash) : verificarPassword(password, HASH_SACRIFICIO) && false;
  if (!ok) {
    if (u) {
      const { bloqueado } = await registrarFallo(u.id);
      await registrarEvento({ tipo: bloqueado ? "login_bloqueado" : "login_fallido", email, userId: u.id, ip, detalle: bloqueado ? `bloqueado 15 min tras 5 intentos` : null });
      if (bloqueado) volver("bloqueado");
    } else {
      await registrarEvento({ tipo: "login_fallido", email, ip, detalle: "email desconocido" });
    }
    volver("1");
  }

  await limpiarFallos(u!.id);
  await vigilarIpNueva({ id: u!.id, email, nombre: u!.nombre, rol: u!.rol }, ip);
  await registrarEvento({ tipo: "login_ok", email, userId: u!.id, ip });
  const jar = await cookies();
  jar.set(COOKIE_PULSE, await firmarSesion(u!.id, undefined, ttl), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ttl,
    path: "/",
  });
  redirect(destinoValido ? desde : "/pulse");
}

export async function logoutPulseAction() {
  const u = await usuarioActual();
  if (u) await registrarEvento({ tipo: "logout", email: u.email, userId: u.id });
  const jar = await cookies();
  jar.delete(COOKIE_PULSE);
  redirect("/pulse/login");
}
