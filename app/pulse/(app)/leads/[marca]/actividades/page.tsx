import { ListaActividades } from "@/components/leads/actividades";
import { BarraLeads } from "@/components/leads/tablero";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { contextoLeads } from "@/lib/leads/pagina";
import { actividadesPendientes } from "@/lib/leads/repo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads · Actividades · Pulse" };

export default async function LeadsActividades({ params, searchParams }: { params: Promise<{ marca: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { marca } = await params;
  const c = await contextoLeads(marca, await searchParams);
  // Por defecto, las de la persona; "Todos" en el filtro de dueño muestra las del equipo.
  const filas = await actividadesPendientes(c.m.marca, c.dueno === null ? null : c.dueno || c.u.id);
  return (
    <div className="pulse flex h-svh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-semibold">Leads</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{c.m.nombre}</span>
      </header>
      <BarraLeads marca={c.m.marca} marcaSlug={c.m.slug} marcaNombre={c.m.nombre} marcas={c.marcas} embudos={c.embudos} embudoId={c.embudo?.id ?? ""} vista="actividades" usuarios={c.usuarios} yoId={c.u.id} puedeEditar={c.puedeEditar} etapas={c.etapas} />
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
        <ListaActividades filas={filas.map((f) => ({ ...f, venceAt: new Date(f.venceAt).toISOString() }))} marcaSlug={c.m.slug} />
      </div>
    </div>
  );
}
