import { NextResponse, type NextRequest } from "next/server";

import { estadoEncuestas, revisarOnboardingsTerminados } from "@/lib/onboarding/encuesta";
import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const maxDuration = 120;

// Vercel Cron (cada 10 min): ¿terminó algún onboarding de Level Up hace 15 min – 4 h (Calendly)? → le manda al cliente la
// encuesta por WhatsApp (n8n → Evolution). Sin ENCUESTA_ONBOARDING_MODO=real solo simula y dice a quién le tocaría.
// `?dry=1` fuerza simulación; `?estado=1` lista lo enviado/respondido de los últimos 14 días.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && !secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  if (req.nextUrl.searchParams.get("estado") === "1") return NextResponse.json({ ok: true, encuestas: await estadoEncuestas() });
  const r = await revisarOnboardingsTerminados({ real: req.nextUrl.searchParams.get("dry") === "1" ? false : undefined });
  return NextResponse.json({ ok: !r.error, ...r });
}
