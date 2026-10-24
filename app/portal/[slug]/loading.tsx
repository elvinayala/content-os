import { Skeleton } from "@/components/ui/skeleton";

// Portal AutoFlow cargando: cabecera del negocio, pestañas y las dos tarjetas de "Tus agentes".
// .carga-tardia lo esconde los primeros 150 ms para que no parpadee si el portal llega rápido.
export default function CargandoPortal() {
  return (
    <main className="carga-tardia mx-auto w-full max-w-6xl p-4 sm:p-6" role="status" aria-label="Cargando tu portal">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <Skeleton className="h-1.5 w-full rounded-none" />
          <div className="flex flex-wrap items-start justify-between gap-3 bg-card/60 p-5">
            <div className="space-y-2">
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <Skeleton className="h-6 w-36 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-9 w-full max-w-lg" />
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-9 w-44" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
    </main>
  );
}
