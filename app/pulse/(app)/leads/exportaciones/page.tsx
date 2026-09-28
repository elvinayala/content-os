import { Download } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DecidirExportacion } from "@/components/leads/decidir-exportacion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { listarExportaciones } from "@/lib/leads/exportaciones";
import { descargaVigente, HORAS_DESCARGA, modoExportar } from "@/lib/leads/exportar";
import { slugDeMarca, type Marca } from "@/lib/leads/reglas";
import { usuarioActual } from "@/lib/pulse/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Exportaciones de leads · Pulse" };

const TZ = "America/Puerto_Rico";
const cuando = (d: Date | null) => (d ? d.toLocaleString("es-PR", { timeZone: TZ, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

const ESTADO: Record<string, { t: string; c: string }> = {
  pendiente: { t: "Esperando a Elvin", c: "bg-amber-100 text-amber-800 ring-amber-300/70" },
  aprobada: { t: "Aprobada", c: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rechazada: { t: "No aprobada", c: "bg-muted text-muted-foreground ring-border" },
  descargada: { t: "Descargada", c: "bg-muted text-muted-foreground ring-border" },
};

// Exportaciones con aprobación (28/sep): Elvin ve y decide todas; Nahuel y Aure ven las suyas y bajan las aprobadas.
export default async function ExportacionesLeads() {
  const u = await usuarioActual();
  if (!u) redirect("/pulse/login");
  const modo = modoExportar(u, process.env.LEADS_EXPORTAR || undefined);
  if (!modo) redirect("/pulse/leads");
  const esElvin = modo === "directo";
  const lista = await listarExportaciones(esElvin ? {} : { userId: u.id });
  const pendientes = lista.filter((e) => e.estado === "pendiente");
  const resto = lista.filter((e) => e.estado !== "pendiente");

  const Fila = ({ e }: { e: (typeof lista)[number] }) => {
    const est = ESTADO[e.estado] ?? { t: e.estado, c: "bg-muted" };
    const vencida = e.estado === "aprobada" && !descargaVigente(e);
    return (
      <li className="flex flex-wrap items-center gap-3 px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{e.descripcion}</p>
          <p className="text-xs text-muted-foreground">
            {esElvin ? `${e.persona} · ` : ""}pedida {cuando(e.createdAt)}
            {e.filas != null ? ` · ${e.filas.toLocaleString("en-US")} leads` : ""}
            {e.nota ? ` · Nota: ${e.nota}` : ""}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${vencida ? ESTADO.rechazada.c : est.c}`}>{vencida ? "Venció" : est.t}</span>
        {esElvin && e.estado === "pendiente" ? <DecidirExportacion id={e.id} /> : null}
        {!esElvin && descargaVigente(e) ? (
          <a href={`/pulse/leads/${slugDeMarca(e.marca as Marca)}/exportar?solicitud=${e.id}`} download className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">
            <Download className="size-3.5" /> Bajar Excel
          </a>
        ) : null}
      </li>
    );
  };

  return (
    <div className="fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <Link href="/pulse/leads" className="text-sm text-muted-foreground hover:text-foreground">
          Leads
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <h1 className="text-sm font-medium">{esElvin ? "Solicitudes de exportación" : "Mis exportaciones"}</h1>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8">
        <p className="text-sm text-muted-foreground">
          {esElvin
            ? `Nahuel y Aure pueden pedir exportar leads a Excel; nada sale sin tu OK. Al aprobar, a la persona le llega por Slack el link para bajarlo: sirve una vez y durante ${HORAS_DESCARGA} horas.`
            : `Cada exportación la aprueba Elvin. Cuando la apruebe te llega un aviso por Slack y aquí aparece el botón para bajarla: sirve una vez y durante ${HORAS_DESCARGA} horas.`}
        </p>
        {pendientes.length ? (
          <section className="superficie overflow-hidden">
            <h2 className="px-5 pt-4 pb-2 text-[15px] font-semibold">{esElvin ? "Por aprobar" : "Esperando a Elvin"}</h2>
            <ul className="divide-y">{pendientes.map((e) => <Fila key={e.id} e={e} />)}</ul>
          </section>
        ) : null}
        <section className="superficie overflow-hidden">
          <h2 className="px-5 pt-4 pb-2 text-[15px] font-semibold">Historial</h2>
          {resto.length ? <ul className="divide-y">{resto.map((e) => <Fila key={e.id} e={e} />)}</ul> : <p className="px-5 pb-6 text-sm text-muted-foreground">Todavía no hay exportaciones.</p>}
        </section>
      </main>
    </div>
  );
}
