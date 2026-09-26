import Link from "next/link";

import { BarraLeads } from "@/components/leads/tablero";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { contextoLeads } from "@/lib/leads/pagina";
import { estadoActividad, telefonoLegible } from "@/lib/leads/reglas";
import { listaTratos } from "@/lib/leads/repo";
import type { ColorPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads · Lista · Pulse" };

const ESTADOS = [
  { v: "abierto", t: "Abiertos" },
  { v: "ganado", t: "Ganados" },
  { v: "perdido", t: "Perdidos" },
  { v: "todos", t: "Todos" },
];
const fecha = (d: Date | string | null) => (d ? new Date(d).toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short" }) : "—");

export default async function LeadsLista({ params, searchParams }: { params: Promise<{ marca: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { marca } = await params;
  const sp = await searchParams;
  const c = await contextoLeads(marca, sp);
  const estado = typeof sp.estado === "string" ? sp.estado : "abierto";
  const filas = await listaTratos(c.m.marca, { embudoId: c.embudo?.id, estado, duenoId: c.dueno, q: c.q });
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return `?${p.toString()}`;
  };
  return (
    <div className="pulse flex h-svh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-semibold">Leads</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{c.m.nombre}</span>
      </header>
      <BarraLeads marca={c.m.marca} marcaSlug={c.m.slug} marcaNombre={c.m.nombre} marcas={c.marcas} embudos={c.embudos} embudoId={c.embudo?.id ?? ""} vista="lista" usuarios={c.usuarios} yoId={c.u.id} puedeEditar={c.puedeEditar} etapas={c.etapas} />
      <div className="flex gap-1 px-4 py-2">
        {ESTADOS.map((e) => (
          <Link key={e.v} href={qs({ estado: e.v })} className={cn("rounded-full px-3 py-1 text-xs font-medium", estado === e.v ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground")}>
            {e.t}
          </Link>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">
          {filas.length}
          {filas.length === 500 ? "+" : ""} leads
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-8">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="sticky top-0 bg-background text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-3 font-medium">Lead</th>
              <th className="py-2 pr-3 font-medium">Negocio</th>
              <th className="py-2 pr-3 font-medium">Teléfono</th>
              <th className="py-2 pr-3 font-medium">Etapa</th>
              <th className="py-2 pr-3 font-medium">Valor</th>
              <th className="py-2 pr-3 font-medium">Dueño</th>
              <th className="py-2 pr-3 font-medium">Seguimiento</th>
              <th className="py-2 pr-3 font-medium">Origen</th>
              <th className="py-2 font-medium">Creado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const act = estadoActividad(f.proximaActividad);
              return (
                <tr key={f.id} className="border-b hover:bg-muted/40">
                  <td className="py-2 pr-3">
                    <Link href={`/pulse/leads/${c.m.slug}/${f.id}`} className="font-medium hover:underline">
                      {f.nombre}
                    </Link>
                    {f.estado !== "abierto" && <span className={cn("ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", f.estado === "ganado" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{f.estado}</span>}
                    {f.noLeidos > 0 && <span className="ml-2 rounded-full bg-[#25d366] px-1.5 text-[10px] font-bold text-white">{f.noLeidos}</span>}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{f.negocio ?? "—"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{telefonoLegible(f.telefono) || "—"}</td>
                  <td className="py-2 pr-3">{f.etapaNombre}</td>
                  <td className="py-2 pr-3">${f.valor.toLocaleString("en-US")}</td>
                  <td className="py-2 pr-3">
                    {f.duenoNombre ? (
                      <span className="flex items-center gap-1.5">
                        <UserAvatar nombre={f.duenoNombre} color={f.duenoColor as ColorPulse | null} className="size-5 text-[9px] ring-0" />
                        {f.duenoNombre.split(" ")[0]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={cn("py-2 pr-3 whitespace-nowrap", act === "vencida" && "font-medium text-red-600", act === "hoy" && "font-medium text-green-700")}>{f.proximaActividad ? fecha(f.proximaActividad) : "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{f.origen}</td>
                  <td className="py-2 text-muted-foreground">{fecha(f.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filas.length && <p className="py-16 text-center text-sm text-muted-foreground">Nada por aquí con estos filtros.</p>}
      </div>
    </div>
  );
}
