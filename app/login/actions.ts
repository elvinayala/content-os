"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_CONTENIDO, COOKIE_SESION, tokenEsperado } from "@/lib/auth";

const TREINTA_DIAS = 60 * 60 * 24 * 30;

export async function loginAction(formData: FormData) {
  const passCeo = process.env.CEO_PORTAL_PASSWORD;
  const passContenido = process.env.CONTENIDO_PORTAL_PASSWORD;
  const intento = String(formData.get("password") ?? "");
  const desde = String(formData.get("desde") ?? "");
  const destinoValido = desde.startsWith("/") && !desde.startsWith("//");

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: TREINTA_DIAS,
    path: "/",
  };
  const jar = await cookies();

  // CEO: acceso total.
  if (passCeo && intento === passCeo) {
    jar.set(COOKIE_SESION, await tokenEsperado(passCeo), cookieOpts);
    redirect(destinoValido ? desde : "/ceo");
  }

  // Equipo de contenido: acceso a /pedir.
  if (passContenido && intento === passContenido) {
    jar.set(COOKIE_CONTENIDO, await tokenEsperado(passContenido), cookieOpts);
    redirect("/pedir");
  }

  redirect(
    `/login?error=1${desde ? `&desde=${encodeURIComponent(desde)}` : ""}`,
  );
}
