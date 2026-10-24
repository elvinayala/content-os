import { Skeleton } from "@/components/ui/skeleton";

// Inicio cargando: la misma forma de la pantalla (saludo, en qué vamos, la semana, reporte + equipo, Slack).
// .carga-tardia lo esconde los primeros 150 ms para que no parpadee si los datos llegan rápido.
export default function CargandoInicio() {
  return (
    <div className="carga-tardia flex flex-col gap-5" role="status" aria-label="Cargando tu app">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </header>
      <div className="panel flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-1.5 rounded-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
      <div className="panel h-32 animate-pulse" />
      <section className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="panel flex items-center gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}
      </section>
      <Skeleton className="h-12 rounded-full" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
