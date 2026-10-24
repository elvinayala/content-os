import { Kanban, SearchX } from "lucide-react";
import Link from "next/link";

import { BarraLeads, TableroLeads } from "@/components/leads/tablero";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { contextoLeads } from "@/lib/leads/pagina";
import { OtrosResultados } from "@/components/leads/otros-resultados";
import { buscarEnMarca, tratosAbiertos } from "@/lib/leads/repo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads · Pulse" };

export default async function LeadsEmbudo({ params, searchParams }: { params: Promise<{ marca: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { marca } = await params;
  const sp = await searchParams;
  const c = await contextoLeads(marca, sp);
  // Hay filtros puestos (además del embudo): si no sale nada, el vacío es "sin resultados", no "embudo vacío".
  const hayFiltros = !!(c.q || c.fecha || c.creadoEn || c.ultimaActividadEn || c.rubro || c.closer || c.servicio || (typeof sp.dueno === "string" && sp.dueno));
  const [tratos, otros] = await Promise.all([
    c.embudo ? tratosAbiertos(c.embudo.id, { duenoId: c.dueno, q: c.q, fecha: c.fecha, creadoEn: c.creadoEn, ultimaActividadEn: c.ultimaActividadEn, rubro: c.rubro, closer: c.closer, servicio: c.servicio }) : Promise.resolve([]),
    c.q ? buscarEnMarca(c.m.marca, c.q, c.embudo?.id).catch(() => []) : Promise.resolve([]),
  ]);
  return (
    <div className="pulse flex h-svh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-semibold">Leads</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{c.m.nombre}</span>
      </header>
      <BarraLeads
        marca={c.m.marca}
        marcaSlug={c.m.slug}
        marcaNombre={c.m.nombre}
        marcas={c.marcas}
        embudos={c.embudos}
        embudoId={c.embudo?.id ?? ""}
        vista="embudo"
        usuarios={c.usuarios}
        yoId={c.u.id}
        puedeEditar={c.puedeEditar}
        exportar={c.exportar} manejaEquipo={c.manejaEquipo}
        etapas={c.etapas} equipoReparto={c.equipoReparto}
        fecha={c.fecha}
        rubros={c.rubros}
        rubro={c.rubro}
        closers={c.closers}
        closer={c.closer}
        servicios={c.servicios}
        servicio={c.servicio}
      />
      <OtrosResultados marcaSlug={c.m.slug} q={c.q} resultados={otros} />
      {c.embudo && hayFiltros && !tratos.length ? (
        <EstadoVacio
          compacto
          tipo="filtro"
          icono={SearchX}
          titulo={c.q ? `Ningún lead abierto coincide con «${c.q}»` : "Ningún lead abierto con estos filtros"}
          className="border-b"
          accion={
            <Button asChild size="sm" variant="outline">
              <Link href={`/pulse/leads/${c.m.slug}?embudo=${c.embudo.id}`}>Limpiar filtros</Link>
            </Button>
          }
        >
          Prueba con otra búsqueda o quita algún filtro.
        </EstadoVacio>
      ) : null}
      {c.embudo ? (
        <TableroLeads marca={c.m.marca} marcaSlug={c.m.slug} embudo={c.embudo} etapas={c.etapas} tratos={tratos} usuarios={c.usuarios} yoId={c.u.id} puedeOrdenar={c.puedeEditar || c.manejaEquipo} />
      ) : (
        <EstadoVacio icono={Kanban} titulo={`Todavía no hay embudos en ${c.m.nombre}`}>
          {c.puedeEditar ? "Crea el primero desde el menú del embudo, aquí arriba (Nuevo embudo)." : "Pídele a quien administra Leads de esta marca que cree el primero."}
        </EstadoVacio>
      )}
    </div>
  );
}
