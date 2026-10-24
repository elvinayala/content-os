import { Skeleton } from "@/components/ui/skeleton";

// Mi cuenta cargando: datos del negocio, tu equipo y la app en el teléfono.
export default function CargandoCuenta() {
  return (
    <div className="carga-tardia flex flex-col gap-5" role="status" aria-label="Cargando tu cuenta">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-48" />
      </header>
      <div className="panel divide-y divide-border/60">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-28" />
        <div className="panel flex flex-col gap-4 p-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-12 rounded-full" />
      </section>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
