import { notFound, redirect } from "next/navigation";

import { DetalleLead } from "@/components/leads/detalle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { contextoLeads } from "@/lib/leads/pagina";
import { etapasDe, obtenerTrato } from "@/lib/leads/repo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = /^[0-9a-f-]{36}$/.test(id) ? await obtenerTrato(id) : null;
  return { title: `${d?.trato.nombre ?? "Lead"} · Pulse` };
}

export default async function LeadDetalle({ params }: { params: Promise<{ marca: string; id: string }> }) {
  const { marca, id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const c = await contextoLeads(marca, {});
  const d = await obtenerTrato(id);
  if (!d || d.trato.marca !== c.m.marca) notFound();
  if (c.alcance === "mios" && d.trato.duenoId !== c.u.id) redirect(`/pulse/leads/${c.m.slug}`);
  // Etapas de todos los embudos (para "mover de embudo" sin otra consulta desde el cliente).
  const etapasDeOtros = Object.fromEntries(await Promise.all(d.embudos.map(async (e) => [e.id, (await etapasDe(e.id)).map((x) => ({ id: x.id, nombre: x.nombre }))] as const)));
  const iso = (v: Date | string | null) => (v ? new Date(v).toISOString() : "");
  return (
    <div className="pulse min-h-svh bg-muted/20">
      <header className="flex h-12 items-center gap-3 border-b bg-background px-4">
        <SidebarTrigger />
        <span className="text-sm font-semibold">Leads</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{c.m.nombre}</span>
      </header>
      <DetalleLead
        marcaSlug={c.m.slug}
        usuarios={c.usuarios}
        puedeBorrar={c.puedeEditar}
        etapasDeOtros={etapasDeOtros}
        d={{
          trato: {
            id: d.trato.id,
            nombre: d.trato.nombre,
            negocio: d.trato.negocio,
            telefono: d.trato.telefono,
            email: d.trato.email,
            valor: d.trato.valor,
            duenoId: d.trato.duenoId,
            estado: d.trato.estado,
            motivoPerdida: d.trato.motivoPerdida,
            origen: d.trato.origen,
            agendoPor: d.trato.agendoPor,
            etapaId: d.trato.etapaId,
            embudoId: d.trato.embudoId,
            etapaDesde: iso(d.trato.etapaDesde),
            createdAt: iso(d.trato.createdAt),
            noLeidos: d.trato.noLeidos,
            datos: d.trato.datos ?? {},
            tieneChat: Boolean(d.trato.chatId),
          },
          etapas: d.etapas.map((e) => ({ id: e.id, nombre: e.nombre })),
          embudos: d.embudos.map((e) => ({ id: e.id, nombre: e.nombre })),
          historial: d.historial.map((h) => ({ id: h.id, tipo: h.tipo, texto: h.texto, createdAt: iso(h.createdAt), autor: h.autor })),
          actividades: d.actividades.map((a) => ({ id: a.id, tipo: a.tipo, asunto: a.asunto, venceAt: iso(a.venceAt), hecha: a.hecha, asignado: a.asignado })),
        }}
      />
    </div>
  );
}
