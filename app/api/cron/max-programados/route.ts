import { NextRequest, NextResponse } from "next/server";

import { enviarProgramados } from "@/lib/max/flujo";
import { secretoValido } from "@/lib/pulse/seguridad";

// Publica los mensajes programados de Max con su nombre y su foto (cada 5 min, vercel.json).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && !secretoValido(auth, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...(await enviarProgramados()) });
}
