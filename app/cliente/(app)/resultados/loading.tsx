import { Skeleton } from "@/components/ui/skeleton";

// Resultados cargando (los números vienen de Meta y pueden tardar): misma forma que la pantalla final.
export default function CargandoResultados() {
  return (
    <div className="carga-tardia flex flex-col gap-5" role="status" aria-label="Cargando tus resultados">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-7 w-36" />
        </div>
        <Skeleton className="h-9 w-48 rounded-full" />
      </header>
      <section className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="panel flex flex-col gap-2 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </section>
      <div className="panel flex flex-col gap-3 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-32 w-full" />
      </div>
      <section className="flex flex-col gap-2">
        <Skeleton className="h-5 w-52" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel flex items-center gap-3 p-3">
            <Skeleton className="size-16 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </section>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
