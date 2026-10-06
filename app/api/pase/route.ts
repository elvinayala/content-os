import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { DESTINOS, firmarPase, type DestinoPase } from "@/lib/pulse/pase";
import { COOKIE_PULSE, verificarSesion } from "@/lib/pulse/session";
import { usuarioActual } from "@/lib/pulse/auth";

export const dynamic = "force-dynamic";

// GET /api/pase?a=ritmo|leads|pulse — lleva a la persona al otro dominio con su misma sesión (ver lib/pulse/pase.ts).
export async function GET(req: NextRequest) {
  const a = (req.nextUrl.searchParams.get("a") ?? "ritmo") as DestinoPase;
  const destino = DESTINOS[a] ?? DESTINOS.ritmo;
  const host = (await headers()).get("host") ?? "";
  const produccion = process.env.NODE_ENV === "production";
  const base = produccion ? (process.env[destino.env] || destino.porDefecto).replace(/\/$/, "") : "";
  const mismoHost = !base || new URL(base).host === host;
  if (mismoHost) return NextResponse.redirect(new URL(destino.ruta, req.url));
  // Solo con una sesión de Pulse de verdad (la del CEO por cookie del Command Center no se transfiere).
  const s = await verificarSesion((await cookies()).get(COOKIE_PULSE)?.value);
  const u = s ? await usuarioActual() : null;
  const secreto = process.env.PULSE_SESSION_SECRET;
  if (!u || u.id !== s?.userId || !secreto) return NextResponse.redirect(`${base}${destino.ruta}`);
  const t = firmarPase(u.id, a in DESTINOS ? a : "ritmo", secreto);
  return NextResponse.redirect(`${base}/api/pase/recibir?t=${encodeURIComponent(t)}`);
}
