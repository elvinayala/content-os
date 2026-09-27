import { NextResponse, type NextRequest } from "next/server";

import { notificarCEO } from "@/lib/notificar-ceo";
import { secretoValido } from "@/lib/pulse/seguridad";
import { diaPR, textoResumen } from "@/lib/resumen-dia";
import { resumenDelDia } from "@/lib/resumen-dia-datos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Resumen del día para Elvin (27/sep/2026): llamadas agendadas hoy, ventas nuevas y renovaciones/cuotas,
// Level Up y AI Borinquen por separado. Cron diario 8:30 PM PR (00:30 UTC) → Telegram + espejo en Slack.
// `?dry=1` devuelve el texto sin mandar; `?dia=YYYY-MM-DD` para otro día.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && !secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams;
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(q.get("dia") ?? "") ? q.get("dia")! : diaPR(new Date());
  const marcas = await resumenDelDia(dia);
  const texto = textoResumen(dia, marcas);
  if (q.get("dry") === "1") return NextResponse.json({ ok: true, dia, texto, marcas });
  const enviado = await notificarCEO(texto);
  return NextResponse.json({ ok: true, dia, enviado });
}
