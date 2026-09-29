import { NextResponse } from "next/server";

import { baseRitmo } from "@/lib/desempeno/google-base";
import { googleListo, urlConectar } from "@/lib/desempeno/google-cal";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

// Conectar el Google Calendar del empleado: manda a Google con el permiso de calendario (y vuelve a /ritmo/google/volver).
// Un solo dominio de regreso (RITMO_URL) para que la app de Google tenga un único redirect URI registrado.
export async function GET() {
  const u = await usuarioRitmo();
  const base = await baseRitmo();
  if (!u) return NextResponse.redirect(`${base}/ritmo/entrar`);
  if (!googleListo()) return NextResponse.redirect(`${base}/ritmo?google=sin-configurar`);
  return NextResponse.redirect(urlConectar(u.id, base, u.email));
}

