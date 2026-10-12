import { NextResponse, type NextRequest } from "next/server";

import { revisarEscalar } from "@/lib/clientes-app/avisos";
import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const maxDuration = 120;

// Cron diario (10 AM PR): "Anuncio listo para escalar" a los clientes con la app y avisos activos.
// ?dry=1 = no manda nada, devuelve lo que habría mandado.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && !secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const avisos = await revisarEscalar({ real: req.nextUrl.searchParams.get("dry") !== "1" });
  return NextResponse.json({ ok: true, avisos });
}
