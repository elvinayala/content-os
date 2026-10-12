import { NextResponse } from "next/server";

import { abrirEntrega } from "@/lib/clientes-app/entregas";
import { visorActual } from "@/lib/clientes-app/sesion";

// Abre un entregable (plan, creativo o video) del cliente: solo los de SU ficha.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await visorActual();
  if (!v) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "no-existe" }, { status: 404 });
  const r = await abrirEntrega(v.itemId, id).catch(() => null);
  if (!r) return NextResponse.json({ error: "no-existe" }, { status: 404 });
  if ("url" in r) return NextResponse.redirect(r.url);
  return new NextResponse(new Uint8Array(r.datos), { headers: { "Content-Type": r.mime, "Content-Disposition": `inline; filename="${encodeURIComponent(r.nombre)}"`, "X-Content-Type-Options": "nosniff" } });
}
