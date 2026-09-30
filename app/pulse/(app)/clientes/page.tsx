import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { tipoAcceso, usuarioActual } from "@/lib/pulse/auth";
import { esVistaInicio, VISTAS, type VistaInicio } from "@/lib/pulse/inicio-clientes";
import { boardsVisibles, clientesInicio } from "@/lib/pulse/repo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes · Pulse" };

const TZ = "America/Puerto_Rico";

const normal = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// La lista completa detrás de cada número del Inicio.
export default async function ClientesInicio({ searchParams }: { searchParams: Promise<{ vista?: string; q?: string }> }) {
  const usuario = await usuarioActual();
  if (!usuario) return null;
  if ((await tipoAcceso(usuario.id, usuario.rol)) === "solo_leads") redirect("/pulse/leads");
  const { vista: v, q } = await searchParams;
  const vista: VistaInicio = esVistaInicio(v) ? v : "activos";
  const listas = await clientesInicio([...(await boardsVisibles(usuario))]);
  const todas = listas?.[vista] ?? [];
  const busca = q?.trim() ? normal(q.trim()) : "";
  const fichas = busca ? todas.filter((f) => normal(`${f.nombre} ${f.empresa ?? ""} ${f.grupo}`).includes(busca)) : todas;
  const info = VISTAS.find((x) => x.id === vista)!;

  return (
    <div className="fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <Link href="/pulse" className="flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Inicio
        </Link>
        <span className="text-sm text-muted-foreground/60">/</span>
        <span className="text-sm font-medium">{info.titulo}</span>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
        <div>
          <h1 className="text-2xl font-semibold sm:text-[28px]">{info.titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {todas.length.toLocaleString("en-US")} · {info.nota}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex gap-1 overflow-x-auto rounded-xl bg-muted/70 p-1">
            {VISTAS.map((x) => (
              <Link
                key={x.id}
                href={`/pulse/clientes?vista=${x.id}`}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition ${x.id === vista ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {x.titulo} <span className="ml-0.5 text-muted-foreground tabular-nums">{listas?.[x.id].length ?? 0}</span>
              </Link>
            ))}
          </nav>
          <form className="relative sm:w-64">
            <input type="hidden" name="vista" value={vista} />
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input name="q" defaultValue={q ?? ""} placeholder="Buscar nombre o empresa" className="h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/25" />
          </form>
        </div>

        <section className="superficie overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_90px_90px] gap-4 border-b px-5 py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:grid">
            <span>Cliente</span>
            <span>Etapa</span>
            <span>Marca</span>
            <span className="text-right">Entró</span>
          </div>
          {fichas.length ? (
            <ul className="divide-y">
              {fichas.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/pulse/${f.boardSlug}?item=${f.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 px-5 py-3 transition hover:bg-[var(--pulse-hover)] sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_90px_90px]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{f.nombre}</span>
                      {f.empresa ? <span className="block truncate text-xs text-muted-foreground">{f.empresa}</span> : null}
                    </span>
                    <span className="truncate text-xs text-muted-foreground sm:text-[13px]">{f.grupo}</span>
                    <span className="hidden text-xs text-muted-foreground sm:block">{f.marca}</span>
                    <span className="hidden text-right text-xs text-muted-foreground tabular-nums sm:block">
                      {new Date(f.creadoEl).toLocaleDateString("es-PR", { timeZone: TZ, day: "numeric", month: "short", year: "2-digit" }).replace(".", "")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">{busca ? "Nadie coincide con esa búsqueda." : "No hay clientes aquí todavía."}</p>
          )}
        </section>
      </main>
    </div>
  );
}
