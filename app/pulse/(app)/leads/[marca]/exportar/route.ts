import { NextResponse, type NextRequest } from "next/server";

import { anotarFilas, tomarDescarga } from "@/lib/leads/exportaciones";
import { csvLeads, describirFiltro, modoExportar, nombreArchivo, type FiltroExport } from "@/lib/leads/exportar";
import { MARCAS, slugDeMarca } from "@/lib/leads/reglas";
import { accesoLeads, listarEmbudos, tratosParaExportar } from "@/lib/leads/repo";
import { usuarioActual } from "@/lib/pulse/auth";
import { registrarEvento } from "@/lib/pulse/seguridad";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Exportar leads a Excel como Pipedrive.
//  · Elvin: directo con ?embudo=<id|todos>&estado=abierto|ganado|perdido|todos&dueno=&q=
//  · Nahuel y Aure: solo con ?solicitud=<id> que Elvin aprobó (una vez, dentro de 24 h). Pedirla = pedirExportacionAction.
// Cada exportación queda en el registro de seguridad.
export async function GET(req: NextRequest, { params }: { params: Promise<{ marca: string }> }) {
  const u = await usuarioActual();
  if (!u) return NextResponse.json({ error: "sin sesión" }, { status: 401 });
  const { marca: slug } = await params;
  const sp = req.nextUrl.searchParams;
  const modo = modoExportar(u, process.env.LEADS_EXPORTAR || undefined);
  if (!modo) return NextResponse.json({ error: "No tienes permiso para exportar leads" }, { status: 403 });

  let m = MARCAS[slug];
  let filtro: FiltroExport;
  const solicitud = sp.get("solicitud");
  if (solicitud) {
    const s = await tomarDescarga(solicitud, u);
    if (!s) return NextResponse.json({ error: "Esta exportación no está aprobada, ya se bajó o venció (24 h). Pide otra." }, { status: 403 });
    m = MARCAS[slugDeMarca(s.marca)];
    filtro = s.filtro;
  } else {
    if (modo !== "directo") return NextResponse.json({ error: "Tu exportación necesita la aprobación de Elvin: pídela desde el botón Exportar." }, { status: 403 });
    if (!m) return NextResponse.json({ error: "marca" }, { status: 404 });
    const embudos = await listarEmbudos(m.marca);
    const pedido = sp.get("embudo");
    const embudo = pedido && pedido !== "todos" ? (embudos.find((e) => e.id === pedido) ?? null) : null;
    const estado = ["abierto", "ganado", "perdido", "todos"].includes(sp.get("estado") ?? "") ? sp.get("estado")! : "todos";
    filtro = { embudoId: embudo?.id ?? null, embudoNombre: embudo?.nombre ?? null, estado, dueno: sp.get("dueno") || null, duenoNombre: null, q: sp.get("q") ?? "" };
  }
  if (!m) return NextResponse.json({ error: "marca" }, { status: 404 });
  const acceso = await accesoLeads(u, m.marca);
  if (!acceso.puede) return NextResponse.json({ error: "sin acceso a esta marca" }, { status: 403 });
  const duenoId = acceso.alcance === "mios" ? u.id : filtro.dueno;

  const filas = await tratosParaExportar(m.marca, { embudoId: filtro.embudoId, estado: filtro.estado, duenoId, q: filtro.q });
  if (solicitud) await anotarFilas(solicitud, filas.length).catch(() => {});
  await registrarEvento({ tipo: "leads_exportados", email: u.email, actorId: u.id, detalle: `${filas.length} leads · ${describirFiltro(filtro, m.nombre)}${solicitud ? " · aprobada por Elvin" : ""}` }).catch(() => {});

  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
  return new NextResponse(csvLeads(filas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo(m.slug, filtro.embudoNombre, filtro.estado, hoy)}"`,
      "Cache-Control": "no-store",
    },
  });
}
