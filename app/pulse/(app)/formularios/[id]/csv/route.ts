import { NextResponse } from "next/server";

import { formularioPorId, respuestasDe } from "@/lib/formularios/repo";
import { celdaCsv, puedeFormularios, slugDe, texto } from "@/lib/formularios/reglas";
import { usuarioActual } from "@/lib/pulse/auth";

export const dynamic = "force-dynamic";

// Todas las respuestas de un formulario en CSV (abre directo en Excel: ; como separador y BOM).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioActual();
  if (!u || !puedeFormularios(u, process.env.FORMULARIOS_ACCESO || undefined)) return NextResponse.json({ error: "sin permiso" }, { status: 403 });
  const { id } = await params;
  const f = await formularioPorId(id);
  if (!f) return NextResponse.json({ error: "no existe" }, { status: 404 });
  const rs = await respuestasDe(id, 100_000);
  // Columnas: las preguntas de hoy + las que ya no existen pero tienen respuestas viejas.
  const cols = new Map(f.config.preguntas.map((p) => [p.id, p.titulo]));
  for (const r of rs) for (const p of r.preguntas) if (!cols.has(p.id)) cols.set(p.id, p.titulo);
  const lineas = [
    ["Fecha (PR)", ...cols.values(), "Origen", "Resultado"].map(celdaCsv).join(";"),
    ...rs.map((r) =>
      [r.createdAt.toLocaleString("es-PR", { timeZone: "America/Puerto_Rico" }), ...[...cols.keys()].map((k) => texto(r.respuestas[k])), r.origen ?? "", r.resultado ?? ""].map(celdaCsv).join(";"),
    ),
  ];
  const nombre = `${slugDe(f.titulo) || "formulario"}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(`﻿${lineas.join("\r\n")}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nombre}"`, "Cache-Control": "no-store" },
  });
}
