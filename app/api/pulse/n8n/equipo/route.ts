import { NextRequest, NextResponse } from "next/server";

import { exportarEquipo } from "@/lib/pulse/export-n8n";

// El equipo (tablero Cumpleaños + usuarios de Pulse) para la tabla `equipo` de NocoDB, que los
// agentes usan para saber a quién avisar (ID-slack) y para enlazar admin/estratega de cada cliente.
// Lo consume "A-) Sync Pulse → NocoDB equipo v1" (n8n). Solo con x-pulse-secret.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secreto = process.env.PULSE_N8N_SECRET;
  if (!secreto || req.headers.get("x-pulse-secret") !== secreto) {
    return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  }
  const personas = await exportarEquipo();
  return NextResponse.json(
    { generadoEl: new Date().toISOString(), simulacion: process.env.PULSE_N8N_MODO !== "real", total: personas.length, personas },
    { headers: { "Cache-Control": "no-store" } },
  );
}
