import { CheckCircle2, Cloud, HardDrive, Laptop, ShieldCheck, TriangleAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { BotonRestaurar } from "@/components/pulse/boton-restaurar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usuarioActual } from "@/lib/pulse/auth";
import { listarLotes } from "@/lib/pulse/papelera";
import { DIAS_PAPELERA } from "@/lib/pulse/papelera-reglas";
import { listarUsuarios } from "@/lib/pulse/repo";
import { NOMBRE_APP } from "@/lib/pulse/types";
import { leerEstados } from "@/lib/respaldo/respaldo";

export const dynamic = "force-dynamic";
export const metadata = { title: `Papelera y respaldos · ${NOMBRE_APP}` };

const TZ = "America/Puerto_Rico";
const cuando = (iso: string) => new Date(iso).toLocaleString("es-PR", { timeZone: TZ, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const diasDesde = (fecha: string) => Math.floor((Date.now() - new Date(`${fecha}T12:00:00Z`).getTime()) / 86_400_000);

export default async function PapeleraPage() {
  const u = await usuarioActual();
  if (!u || u.rol !== "admin") redirect("/pulse");
  const [lotes, usuarios, estados] = await Promise.all([listarLotes(), listarUsuarios(), leerEstados().catch(() => ({ nube: null, mac: null }))]);
  const nombre = (id: string | null) => (id ? (usuarios.find((x) => x.id === id)?.nombre ?? "Sistema") : "Sistema o agente");
  const { nube, mac } = estados;
  const viejo = (f?: string) => !f || diasDesde(f) > 1;

  return (
    <div className="fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <h1 className="text-sm font-medium">Papelera y respaldos</h1>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
        <section>
          <p className="ceja-pulse">Protección de datos</p>
          <h2 className="mt-2 text-2xl font-semibold">Nada se pierde de un clic</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Todo lo que se borra en Pulse, Leads, Ritmo o Formularios (por una persona, un agente o un script) queda aquí {DIAS_PAPELERA} días, con sus archivos. Y
            toda la base se copia cifrada, todos los días, en tres lugares distintos.
          </p>
        </section>

        {/* Respaldos */}
        <section className="grid gap-3 md:grid-cols-3">
          {(
            [
              { titulo: "Supabase", sub: "Donde vive la base · 30 días", icono: HardDrive, d: nube?.destinos.find((x) => x.nombre === "Supabase"), fecha: nube?.fecha },
              { titulo: "Vercel (otro proveedor)", sub: "Base + archivos · 60 días", icono: Cloud, d: nube?.destinos.find((x) => x.nombre === "Vercel Blob"), fecha: nube?.fecha },
              { titulo: "Tu Mac", sub: "~/Respaldos EA Market · 90 días", icono: Laptop, d: mac ? { ok: mac.ok, detalle: mac.detalle } : undefined, fecha: mac?.fecha },
            ] as const
          ).map((x) => {
            const bien = !!x.d?.ok && !viejo(x.fecha);
            return (
              <div key={x.titulo} className="superficie flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <x.icono className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{x.titulo}</span>
                  {bien ? <CheckCircle2 className="ml-auto size-4 text-emerald-600" /> : <TriangleAlert className="ml-auto size-4 text-amber-600" />}
                </div>
                <p className="text-xs text-muted-foreground">{x.sub}</p>
                <p className={`text-xs ${bien ? "text-foreground" : "text-amber-700"}`}>
                  {x.fecha ? `Último: ${x.fecha}${viejo(x.fecha) ? " (atrasado)" : ""}` : "Todavía no hay respaldo"}
                </p>
                {x.d && !x.d.ok ? <p className="text-[11px] text-amber-700">{x.d.detalle}</p> : null}
              </div>
            );
          })}
        </section>
        {nube ? (
          <p className="-mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            {nube.tablas} tablas · {nube.filas.toLocaleString("en-US")} filas · cifrado AES-256 ·{" "}
            {nube.verificado.ok ? "copia abierta y contada ✓" : `verificación: ${nube.verificado.detalle}`} · archivos: {nube.archivos.yaEstaban + nube.archivos.copiados} copiados
            {nube.archivos.pendientes ? ` (${nube.archivos.pendientes} en cola)` : ""}
          </p>
        ) : null}

        {/* Papelera */}
        <section className="superficie overflow-hidden">
          <header className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="text-[15px] font-semibold">Papelera</h2>
            <span className="text-xs text-muted-foreground">Últimos {DIAS_PAPELERA} días</span>
          </header>
          {lotes.length ? (
            <ul className="divide-y">
              {lotes.map((l) => (
                <li key={l.clave} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {l.principal}
                      {l.ejemplos.length ? <span className="font-normal text-muted-foreground"> · {l.ejemplos.join(", ")}</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {nombre(l.borradoPor)} · {cuando(l.borradoAt)}
                      {l.porTabla.length > 1 ? ` · incluye ${l.porTabla.slice(1).map((t) => `${t.n} ${t.nombre}`).join(", ")}` : ""}
                    </p>
                  </div>
                  {l.restaurado ? <span className="text-xs font-medium text-emerald-700">Restaurado</span> : <BotonRestaurar lote={l.clave} resumen={l.principal} />}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 pb-8 text-center text-sm text-muted-foreground">La papelera está vacía.</p>
          )}
        </section>
      </main>
    </div>
  );
}
