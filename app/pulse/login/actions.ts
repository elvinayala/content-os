"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verificarPassword } from "@/lib/pulse/password";
import { buscarUsuarioPorEmail } from "@/lib/pulse/repo";
import { COOKIE_PULSE, TTL_SESION, firmarSesion } from "@/lib/pulse/session";

export async function loginPulseAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const desde = String(formData.get("desde") ?? "");
  const destinoValido = desde.startsWith("/pulse") && !desde.startsWith("//");

  const u = email ? await buscarUsuarioPorEmail(email) : null;
  if (!u || !u.activo || !verificarPassword(password, u.passwordHash)) {
    redirect(`/pulse/login?error=1${desde ? `&desde=${encodeURIComponent(desde)}` : ""}`);
  }

  const jar = await cookies();
  jar.set(COOKIE_PULSE, await firmarSesion(u.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TTL_SESION,
    path: "/",
  });
  redirect(destinoValido ? desde : "/pulse");
}

export async function logoutPulseAction() {
  const jar = await cookies();
  jar.delete(COOKIE_PULSE);
  redirect("/pulse/login");
}
