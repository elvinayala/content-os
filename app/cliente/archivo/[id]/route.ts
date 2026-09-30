import { NextResponse } from "next/server";

import { abrirArchivo } from "@/lib/clientes-app/archivos";
import { fichaCliente } from "@/lib/clientes-app/datos";
import { visorActual } from "@/lib/clientes-app/sesion";

// Abre un archivo de la carpeta de Drive del cliente (solo de SU carpeta: el Apps Script lo verifica también).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await visorActual();
  if (!v) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const { id } = await params;
  if (!/^[\w-]{10,}$/.test(id)) return NextResponse.json({ error: "no-existe" }, { status: 404 });
  const f = await fichaCliente(v.itemId);
  if (!f?.carpetaId) return NextResponse.json({ error: "sin-carpeta" }, { status: 404 });
  try {
    const r = await abrirArchivo(v.itemId, f.carpetaId, id);
    if ("url" in r) return NextResponse.redirect(r.url);
    return new NextResponse(new Uint8Array(r.datos), { headers: { "Content-Type": r.mime, "Content-Disposition": `inline; filename="${encodeURIComponent(r.nombre)}"`, "X-Content-Type-Options": "nosniff" } });
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    const texto = m === "grande" ? "Este archivo es muy grande para abrirlo en la app: pídeselo a tu equipo por Slack." : "No pudimos abrir este archivo ahora mismo. Intenta en un rato.";
    return new NextResponse(texto, { status: m === "no-existe" || m === "fuera" ? 404 : 502, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
