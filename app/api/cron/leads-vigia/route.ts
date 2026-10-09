import { NextResponse, type NextRequest } from "next/server";

import { vigilarWhatsapp } from "@/lib/leads/vigia";
import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel Cron cada 30 min: ¿le está llegando el WhatsApp de cada marca a Leads? (lib/leads/vigia.ts)
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && !secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, marcas: await vigilarWhatsapp() });
}
