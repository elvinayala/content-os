import { NextRequest, NextResponse } from "next/server";

import { secretoValido } from "@/lib/pulse/seguridad";

import { armarClientes } from "@/lib/pulse/puente-n8n";

// Para Cortex (editor de video, Elvin 12/oct: «que escojan qué negocio le están editando; la lista de clientes está en
// Pulse… cada cliente es una carpeta»): SOLO los datos para escoger el negocio — sin correo, teléfono, cuenta ni equipo.
// Mismo secreto que el puente de n8n (x-pulse-secret = PULSE_N8N_SECRET); proxy.ts deja pasar /api/pulse/n8n/*.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!secretoValido(req.headers.get("x-pulse-secret"), process.env.PULSE_N8N_SECRET)) {
    return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  }
  const negocios = (await armarClientes())
    .filter((c) => (c.empresa || c.nombre).trim())
    .map((c) => ({ pulseId: c.pulseId, negocio: (c.empresa || c.nombre).trim(), contacto: c.nombre.trim(), industria: c.industria, activo: c.activo, grupo: c.grupo }));
  return NextResponse.json({ generadoEl: new Date().toISOString(), negocios }, { headers: { "Cache-Control": "no-store" } });
}
