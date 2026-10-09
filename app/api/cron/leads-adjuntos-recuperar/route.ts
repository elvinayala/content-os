import { NextResponse, type NextRequest } from "next/server";

import { recuperarAdjuntos } from "@/lib/leads/adjuntos";
import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const maxDuration = 300;

// Una sola vez (9/oct) o cuando haga falta: mete en Leads los audios/fotos de los últimos ?dias=14 que se
// descartaban antes del arreglo. No está en vercel.json: se corre a mano con CRON_SECRET.
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || !secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const dias = Math.min(14, Number(req.nextUrl.searchParams.get("dias")) || 14);
  return NextResponse.json({ ok: true, ...(await recuperarAdjuntos(dias)) });
}
