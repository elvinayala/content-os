import * as React from "react";

import { cn } from "@/lib/utils";

// Esqueletos de los loading.tsx de Ritmo (skill pulido-ux, 24/oct/2026): la misma forma del contenido final para
// que no salte el layout. `carga-tardia` va en el wrapper EXTERNO (invisible los primeros 150 ms, sin parpadeo) y
// el pulso adentro, apagado para quien pide menos movimiento.
export function Esqueleto({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="carga-tardia" aria-busy="true" aria-label="Cargando">
      <div className={cn("flex animate-pulse flex-col gap-6 motion-reduce:animate-none", className)}>{children}</div>
    </div>
  );
}

// Un "hueso": bloque gris del tamaño del texto o elemento que va a llegar.
export function Hueso({ className }: { className?: string }) {
  return <div className={cn("rounded-full bg-white/[0.06]", className)} />;
}

// Ceja + título + bajada, como el encabezado de cada pestaña.
export function EsqueletoEncabezado({ derecha }: { derecha?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-2">
        <Hueso className="h-3 w-36" />
        <Hueso className="h-8 w-56 rounded-lg bg-white/[0.08]" />
        <Hueso className="h-3 w-80 max-w-full bg-white/[0.05]" />
      </div>
      {derecha}
    </div>
  );
}

// Fila de lista: avatar + nombre/detalle + un dato a la derecha.
export function EsqueletoFila({ avatar = true }: { avatar?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {avatar ? <div className="size-9 shrink-0 rounded-full bg-white/[0.07]" /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Hueso className="h-3.5 w-40 max-w-full bg-white/[0.08]" />
        <Hueso className="h-2.5 w-24 bg-white/[0.05]" />
      </div>
      <Hueso className="h-3 w-16" />
    </div>
  );
}

// Tarjetas de indicadores (TarjetaLista) en grilla.
export function EsqueletoTarjetas({ n = 4, className }: { n?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-4", className)}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="panel flex h-24 flex-col justify-between p-4">
          <Hueso className="h-2.5 w-20 bg-white/[0.05]" />
          <Hueso className="h-6 w-14 rounded-md bg-white/[0.08]" />
        </div>
      ))}
    </div>
  );
}
