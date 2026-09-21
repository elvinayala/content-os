import { NextResponse, type NextRequest } from "next/server";

import { respaldarPulse } from "@/lib/pulse/respaldo";
import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const maxDuration = 120;
// Vercel Cron: respaldo diario de Pulse (usuarios, tableros, columnas, grupos, items,
// actividad) a Supabase Storage `pulse/respaldos/YYYY-MM-DD.json`. Guarda los últimos 30.

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && !secretoValido(auth, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const r = await respaldarPulse();
  return NextResponse.json(r, { status: r.ok ? 200 : 500 });
}
