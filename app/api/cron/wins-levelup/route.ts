import { type NextRequest, NextResponse } from "next/server";

import { celebrarWinsNuevos } from "@/lib/celebrar-wins";

export const runtime = "nodejs";
export const maxDuration = 60;
// Vercel Cron: celebra los wins de LEVEL UP. Cada 3h, de 8am a 11pm PR (sin
// madrugada). Ventana de 12h para que la corrida de las 8am agarre wins de la noche.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const r = await celebrarWinsNuevos(12, ["levelup"]);
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
