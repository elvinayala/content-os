import { type NextRequest, NextResponse } from "next/server";

import { celebrarWinsNuevos } from "@/lib/celebrar-wins";

export const runtime = "nodejs";
export const maxDuration = 60;
// Vercel Cron: celebra los wins de AI BORINQUEN. Cada 8h (8am, 4pm, 12am PR), sin
// madrugada. Ventana de 12h para cubrir el hueco entre corridas.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const r = await celebrarWinsNuevos(12, ["borinquen"]);
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
