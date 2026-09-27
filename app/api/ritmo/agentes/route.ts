import { NextResponse, type NextRequest } from "next/server";

import { agenteIA } from "@/lib/desempeno/agentes-ia";
import { guardarReporteAgente } from "@/lib/desempeno/agentes-reportes";
import { secretoValido } from "@/lib/pulse/seguridad";

// Reporte del día del equipo digital → Ritmo (/ritmo/agentes).
//   POST { agente, fecha?, reporte?: { resumen, tareas, entregables, bloqueos }, metricas?: { corridas, minutos, costoUsd }, sumar? }
// Lo llaman el puente de cada agente (métricas + cierre del día vía scripts/agentes.mjs reporte).
// Auth: header x-cron-secret = CRON_SECRET (igual que /api/agentes).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET || !secretoValido(req.headers.get("x-cron-secret"), process.env.CRON_SECRET)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const agente = String(b?.agente ?? "").toLowerCase();
  if (!b || !agenteIA(agente)) return NextResponse.json({ ok: false, error: "agente-desconocido" }, { status: 400 });
  const r = await guardarReporteAgente({
    agente,
    fecha: typeof b.fecha === "string" ? b.fecha : undefined,
    reporte: b.reporte && typeof b.reporte === "object" ? (b.reporte as Record<string, unknown>) : undefined,
    metricas: b.metricas && typeof b.metricas === "object" ? (b.metricas as Record<string, number>) : undefined,
    sumar: b.sumar === true,
  });
  return NextResponse.json({ ok: true, ...r });
}
