import { NextResponse, type NextRequest } from "next/server";

import { csvLeads, nombreArchivo, puedeExportarLeads } from "@/lib/leads/exportar";
import { MARCAS } from "@/lib/leads/reglas";
import { accesoLeads, listarEmbudos, tratosParaExportar } from "@/lib/leads/repo";
import { usuarioActual } from "@/lib/pulse/auth";
import { alertarElvin, registrarEvento } from "@/lib/pulse/seguridad";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Exportar leads a Excel como Pipedrive: ?embudo=<id|todos>&estado=abierto|ganado|perdido|todos&dueno=&q=
// Solo Elvin y los correos de LEADS_EXPORTAR; cada exportación queda en el registro de seguridad.
export async function GET(req: NextRequest, { params }: { params: Promise<{ marca: string }> }) {
  const u = await usuarioActual();
  if (!u) return NextResponse.json({ error: "sin sesión" }, { status: 401 });
  const { marca: slug } = await params;
  const m = MARCAS[slug];
  if (!m) return NextResponse.json({ error: "marca" }, { status: 404 });
  if (!puedeExportarLeads(u, process.env.LEADS_EXPORTAR ?? "")) return NextResponse.json({ error: "Exportar leads es solo de Elvin" }, { status: 403 });
  const acceso = await accesoLeads(u, m.marca);
  if (!acceso.puede) return NextResponse.json({ error: "sin acceso a esta marca" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const embudos = await listarEmbudos(m.marca);
  const pedido = sp.get("embudo");
  const embudo = pedido && pedido !== "todos" ? (embudos.find((e) => e.id === pedido) ?? null) : null;
  const estado = ["abierto", "ganado", "perdido", "todos"].includes(sp.get("estado") ?? "") ? sp.get("estado")! : "todos";
  const duenoId = acceso.alcance === "mios" ? u.id : sp.get("dueno") || null;
  const filas = await tratosParaExportar(m.marca, { embudoId: embudo?.id ?? null, estado, duenoId, q: sp.get("q") ?? "" });

  const detalle = `${filas.length} leads · ${m.nombre} · ${embudo?.nombre ?? "todos los embudos"} · ${estado}`;
  await registrarEvento({ tipo: "leads_exportados", email: u.email, actorId: u.id, detalle }).catch(() => {});
  if (u.rol !== "admin") await alertarElvin(`leads-export:${u.id}:${Date.now()}`, `${u.nombre} exportó ${detalle}.`).catch(() => {});

  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
  return new NextResponse(csvLeads(filas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo(m.slug, embudo?.nombre ?? null, estado, hoy)}"`,
      "Cache-Control": "no-store",
    },
  });
}
