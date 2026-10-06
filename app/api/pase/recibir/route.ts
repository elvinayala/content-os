import { and, eq, gte, like } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { estaBloqueado } from "@/lib/desempeno/acceso";
import { db } from "@/lib/pulse/db";
import { DESTINOS, leerPase } from "@/lib/pulse/pase";
import { pulseSecurityLog, pulseUsers } from "@/lib/pulse/schema";
import { ipActual, registrarEvento } from "@/lib/pulse/seguridad";
import { COOKIE_PULSE, firmarSesion, TTL_SESION } from "@/lib/pulse/session";

export const dynamic = "force-dynamic";

// Canjea el pase de /api/pase por la cookie de sesión de este dominio (60 s, un solo uso).
export async function GET(req: NextRequest) {
  const p = leerPase(req.nextUrl.searchParams.get("t"), process.env.PULSE_SESSION_SECRET);
  const destino = p ? DESTINOS[p.destino] : DESTINOS.ritmo;
  const fallo = () => NextResponse.redirect(new URL(destino.ruta, req.url));
  if (!p) return fallo();
  const d = await db();
  const marca = `pase:${p.nonce}`;
  const [usado] = await d
    .select({ id: pulseSecurityLog.id })
    .from(pulseSecurityLog)
    .where(and(eq(pulseSecurityLog.userId, p.userId), like(pulseSecurityLog.detalle, `${marca}%`), gte(pulseSecurityLog.at, new Date(Date.now() - 10 * 60_000))))
    .limit(1);
  if (usado) return fallo();
  const u = await d.query.pulseUsers.findFirst({ where: and(eq(pulseUsers.id, p.userId), eq(pulseUsers.activo, true)) });
  if (!u || estaBloqueado(u.email)) return fallo();
  await registrarEvento({ tipo: "login_ok", email: u.email, userId: u.id, ip: await ipActual(), detalle: `${marca} → ${p.destino}` });
  (await cookies()).set(COOKIE_PULSE, await firmarSesion(u.id, undefined, TTL_SESION), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TTL_SESION,
    path: "/",
  });
  return NextResponse.redirect(new URL(destino.ruta, req.url));
}
