import { NextResponse, type NextRequest } from "next/server";

import { secretoValido } from "@/lib/pulse/seguridad";
import { recordarSops } from "@/lib/pulse/sop-recordatorio";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel Cron (9 AM PR, del 28/sep al 2/oct/2026): recordatorio diario de SOPs a Carilin y Aure.
// `?dry=1` arma los mensajes sin mandarlos · `?prueba=1` se los manda solo a Elvin como vista previa.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && !secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams;
  return NextResponse.json({ ok: true, ...(await recordarSops({ dry: q.get("dry") === "1", prueba: q.get("prueba") === "1" })) });
}
