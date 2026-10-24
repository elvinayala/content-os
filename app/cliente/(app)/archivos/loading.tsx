import { Skeleton } from "@/components/ui/skeleton";

// Archivos cargando (la carpeta se lee de Drive y puede tardar): misma forma que la lista final.
export default function CargandoArchivos() {
  return (
    <div className="carga-tardia flex flex-col gap-5" role="status" aria-label="Cargando tus archivos">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </header>
      <Skeleton className="h-12 rounded-full" />
      {[3, 2].map((filas, g) => (
        <section key={g} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <div className="panel divide-y divide-border/60">
            {Array.from({ length: filas }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-5 shrink-0" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
