import { NextResponse, type NextRequest } from "next/server";

import { revisarCuentasMeta } from "@/lib/pulse/cuentas-meta";
import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const maxDuration = 300;

// Vercel Cron: cuentas publicitarias de los clientes de Level Up que Bori debe poder leer.
//   cada hora (8 AM–8 PM PR): fichas nuevas (14 días) o con problema
//   `?completo=1` 7 AM PR: todas las fichas activas (el lunes, además, recordatorio a Jessica con todo lo pendiente)
//   `?avisar=0` revisa y deja la nota en las fichas sin mandar el DM (primera pasada)
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && !secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams;
  const r = await revisarCuentasMeta({ completo: q.get("completo") === "1", avisar: q.get("avisar") !== "0" });
  return NextResponse.json({ ok: !r.error, ...r });
}
