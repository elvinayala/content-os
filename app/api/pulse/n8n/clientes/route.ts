import { NextRequest, NextResponse } from "next/server";

import { secretoValido } from "@/lib/pulse/seguridad";

import { armarClientes } from "@/lib/pulse/puente-n8n";

// Export para n8n ("A-) Sync Pulse → NocoDB v1", corrida nocturna): todos los clientes del
// tablero LEVEL UP MEDIA con el registro plano que NocoDB necesita. Solo con el secreto
// compartido (x-pulse-secret = PULSE_N8N_SECRET). proxy.ts deja pasar /api/pulse/n8n/* sin
// cookie justamente porque acá se valida el secreto.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!secretoValido(req.headers.get("x-pulse-secret"), process.env.PULSE_N8N_SECRET)) {
    return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  }
  const clientes = await armarClientes();
  const activos = clientes.filter((c) => c.activo).length;
  return NextResponse.json(
    { generadoEl: new Date().toISOString(), simulacion: process.env.PULSE_N8N_MODO !== "real", total: clientes.length, activos, clientes },
    { headers: { "Cache-Control": "no-store" } },
  );
}
