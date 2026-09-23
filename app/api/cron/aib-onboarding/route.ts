import { NextResponse, type NextRequest } from "next/server";

import { corridaDiaria } from "@/lib/aib-onboarding/proceso";
import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const maxDuration = 120;

// Vercel Cron (10 AM PR): onboarding de AI Borinquen. Relee las citas de onboarding del Calendly de AIB
// (red por si se perdió un webhook), registra a los clientes nuevos y manda la plantilla que toque hoy
// (bienvenida día 0-3 si no salió al agendar, encuesta 10 y 30 días).
// Sin AIB_ONBOARDING_MODO=real (o sin el número en Zernio) solo simula y devuelve qué habría mandado.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && !secretoValido(auth, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const resumen = await corridaDiaria();
  return NextResponse.json({ ok: true, ...resumen });
}
