import { NextResponse, type NextRequest } from "next/server";

import { decidirPorCodigo, pendientesParaNico } from "@/lib/leads/exportaciones";
import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";

// Elvin aprueba exportaciones de leads con Nico (9/oct): el puente de Nico (Railway) recibe "ok exp <código>"
// en Telegram y lo manda aquí con CRON_SECRET. GET = las que esperan su OK (para /solicitudes).
const autorizado = (req: NextRequest) =>
  Boolean(process.env.CRON_SECRET) && (secretoValido(req.headers.get("x-cron-secret"), process.env.CRON_SECRET) || secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`));

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  return NextResponse.json({ ok: true, pendientes: await pendientesParaNico() });
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { codigo?: string; aprobar?: boolean; nota?: string };
  if (!b.codigo || typeof b.aprobar !== "boolean") return NextResponse.json({ ok: false, mensaje: "Falta el código o la decisión." }, { status: 400 });
  return NextResponse.json(await decidirPorCodigo(b.codigo, b.aprobar, b.nota));
}
