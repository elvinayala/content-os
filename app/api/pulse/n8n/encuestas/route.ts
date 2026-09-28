import { NextRequest, NextResponse } from "next/server";

import { confirmar, listos, registrarEvento } from "@/lib/encuestas/reportes";
import { secretoValido } from "@/lib/pulse/seguridad";

// Reportes del agente de encuestas (n8n "D-) Tools encuestador v1", Carilin 28/sep/2026). Solo con x-pulse-secret.
//  POST ?accion=evento     {tipo: alerta|asesor|finalizar, telefono, destinatario?, mensaje?, nombre?} → se junta
//  GET                     → [{id, version, texto, thread_ts}] lo que ya terminó (n8n lo publica en Slack)
//  POST ?accion=confirmar  {id, version, ts} → n8n lo publicó
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const autorizado = (req: NextRequest) => secretoValido(req.headers.get("x-pulse-secret"), process.env.PULSE_N8N_SECRET);

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const items = await listos();
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const accion = req.nextUrl.searchParams.get("accion");
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const txt = (v: unknown) => (typeof v === "string" ? v : v == null ? null : String(v));
  if (accion === "confirmar") {
    const id = Number(b.id);
    const version = Number(b.version);
    if (!Number.isInteger(id) || !Number.isInteger(version)) return NextResponse.json({ error: "id/version" }, { status: 400 });
    return NextResponse.json({ ok: await confirmar({ id, version, ts: txt(b.ts) }) });
  }
  const tipo = txt(b.tipo);
  if (tipo !== "alerta" && tipo !== "asesor" && tipo !== "finalizar") return NextResponse.json({ error: "tipo" }, { status: 400 });
  const r = await registrarEvento({ tipo, telefono: txt(b.telefono), destinatario: txt(b.destinatario ?? b.Destinatario), mensaje: txt(b.mensaje ?? b.Mensaje), nombre: txt(b.nombre) });
  return NextResponse.json({ ok: true, ...r });
}
