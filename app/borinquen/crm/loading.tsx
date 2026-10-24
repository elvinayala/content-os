import { EncabezadoCargando } from "@/components/borinquen/cargando";
import { Skeleton } from "@/components/ui/skeleton";

// CRM cargando (Pipedrive puede tardar): resumen + las 5 columnas del embudo.
export default function CargandoCrm() {
  return (
    <>
      <EncabezadoCargando />
      <main className="carga-tardia flex-1 space-y-6 p-4 sm:p-6" role="status" aria-label="Cargando el CRM">
        <div className="flex flex-wrap gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5 rounded-xl border border-border/60 bg-card/60 px-5 py-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[3, 2, 2, 1, 1].map((n, c) => (
            <div key={c} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-4" />
              </div>
              {Array.from({ length: n }, (_, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-border/60 bg-card/60 p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <span className="sr-only">Cargando…</span>
      </main>
    </>
  );
}
