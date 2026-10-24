import { EncabezadoCargando, TarjetaCargando } from "@/components/borinquen/cargando";
import { Skeleton } from "@/components/ui/skeleton";

// Portal del closer cargando: controles del closer, cabecera del negocio, pestañas y "Tus agentes".
export default function CargandoPortalCloser() {
  return (
    <>
      <EncabezadoCargando />
      <main className="carga-tardia flex-1 space-y-4 p-4 sm:p-6" role="status" aria-label="Cargando el portal">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <Skeleton className="h-1.5 w-full rounded-none" />
          <div className="space-y-2 bg-card/60 p-5">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-9 w-full max-w-lg" />
        <div className="grid gap-4 lg:grid-cols-2">
          <TarjetaCargando lineas={4} />
          <TarjetaCargando lineas={4} />
        </div>
        <span className="sr-only">Cargando…</span>
      </main>
    </>
  );
}
