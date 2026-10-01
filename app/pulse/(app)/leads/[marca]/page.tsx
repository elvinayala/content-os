import { BarraLeads, TableroLeads } from "@/components/leads/tablero";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { contextoLeads } from "@/lib/leads/pagina";
import { OtrosResultados } from "@/components/leads/otros-resultados";
import { buscarEnMarca, tratosAbiertos } from "@/lib/leads/repo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads · Pulse" };

export default async function LeadsEmbudo({ params, searchParams }: { params: Promise<{ marca: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { marca } = await params;
  const c = await contextoLeads(marca, await searchParams);
  const [tratos, otros] = await Promise.all([
    c.embudo ? tratosAbiertos(c.embudo.id, { duenoId: c.dueno, q: c.q, fecha: c.fecha }) : Promise.resolve([]),
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
      />
      <OtrosResultados marcaSlug={c.m.slug} q={c.q} resultados={otros} />
      {c.embudo ? (
        <TableroLeads marca={c.m.marca} marcaSlug={c.m.slug} embudo={c.embudo} etapas={c.etapas} tratos={tratos} usuarios={c.usuarios} yoId={c.u.id} />
      ) : (
        <p className="p-8 text-sm text-muted-foreground">No hay embudos todavía.</p>
      )}
    </div>
  );
}
