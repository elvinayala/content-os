import { NextResponse, type NextRequest } from "next/server";

import { revisarPendientes } from "@/lib/pulse/contratos-slack";
import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const maxDuration = 120;

// Vercel Cron (cada hora de 8 AM a 8 PM PR): fichas nuevas de Level Up sin "Acuerdo firmado" →
// busca el contrato en #office-2-ventas-contrato, lo adjunta, o le avisa a Jessica una sola vez.
// `?avisar=0` revisa y adjunta sin mandar avisos (para la primera pasada).
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && !secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const dias = Number(req.nextUrl.searchParams.get("dias")) || undefined;
  const r = await revisarPendientes({ dias, avisar: req.nextUrl.searchParams.get("avisar") !== "0" });
  return NextResponse.json({ ok: !("error" in r), ...r });
}
