import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// Piezas de los loading.tsx de Bori: la misma forma de PageHeader y de las tarjetas de la plataforma,
// para que al llegar los datos no salte el layout. .carga-tardia evita el parpadeo si carga en < 150 ms.

export function EncabezadoCargando({ conDescripcion = true }: { conDescripcion?: boolean }) {
  return (
    <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-5" />
        <div className="carga-tardia flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-5 w-40" />
          {conDescripcion ? <Skeleton className="h-4 w-72 max-w-full" /> : null}
        </div>
        <Skeleton className="carga-tardia h-7 w-28" />
      </div>
    </header>
  );
}

export function TarjetaCargando({ lineas = 3, className = "" }: { lineas?: number; className?: string }) {
  return (
    <div className={"space-y-3 rounded-xl border border-border/60 bg-card/60 p-5 " + className}>
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-1/2" />
      {Array.from({ length: lineas - 1 }, (_, i) => (
        <Skeleton key={i} className={"h-3 " + (i % 2 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/** Pantalla genérica de Bori cargando: encabezado + rejilla de tarjetas. */
export function PantallaCargando({ tarjetas = 6, columnas = "sm:grid-cols-2 lg:grid-cols-3" }: { tarjetas?: number; columnas?: string }) {
  return (
    <>
      <EncabezadoCargando />
      <main className="carga-tardia flex-1 p-4 sm:p-6" role="status" aria-label="Cargando">
        <div className={"grid gap-4 " + columnas}>
          {Array.from({ length: tarjetas }, (_, i) => (
            <TarjetaCargando key={i} />
          ))}
        </div>
        <span className="sr-only">Cargando…</span>
      </main>
    </>
  );
}
