import { NextResponse, type NextRequest } from "next/server";

import { llamadasPendientesDeSync } from "@/lib/portal/repo";
import { sincronizarLlamada } from "@/lib/portal/retell";
import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const maxDuration = 60;
// Vercel Cron (cada 15 min): red de seguridad del Portal AutoFlow. Si el webhook de Retell no
// llegó (o el agente no lo tenía configurado), re-sincroniza las llamadas de las últimas 24 h
// que todavía no están analizadas.

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && !secretoValido(auth, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  if (!process.env.RETELL_API_KEY) return NextResponse.json({ ok: true, omitido: "sin RETELL_API_KEY" });
  const pendientes = await llamadasPendientesDeSync(24);
  const resultado: Record<string, number> = {};
  for (const p of pendientes) {
    try {
      const r = await sincronizarLlamada(p.callId);
      resultado[r] = (resultado[r] ?? 0) + 1;
    } catch (e) {
      resultado.error = (resultado.error ?? 0) + 1;
      console.error("[cron autoflow-llamadas]", p.callId, e);
    }
  }
  return NextResponse.json({ ok: true, pendientes: pendientes.length, resultado });
}
