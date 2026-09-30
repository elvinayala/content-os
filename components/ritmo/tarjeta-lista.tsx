"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { Hora } from "./hora-local";

// Tarjetas del resumen de Equipo que se abren (30/sep, Elvin: "a los que están sin marcar, que le dé clic y me diga
// cuáles son"). Cada nombre lleva a la ficha de la persona.

export type PersonaLista = { id: string; nombre: string; hora?: string | null; nota?: string | null };
export type GrupoLista = { etiqueta?: string; punto?: string; gente: PersonaLista[] };

export function TarjetaLista({ titulo, valor, detalle, tono, grupos, vacio, className, children }: { titulo: string; valor?: React.ReactNode; detalle?: React.ReactNode; tono?: "rojo" | "ambar"; grupos: GrupoLista[]; vacio: string; className?: string; children?: React.ReactNode }) {
  const total = grupos.reduce((s, g) => s + g.gente.length, 0);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn("panel hud-esquinas group cursor-pointer p-4 text-left transition hover:border-primary/40 hover:bg-white/[0.02] focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none", className)}>
          <p className="flex items-center justify-between gap-2 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
            {titulo}
            <ChevronDown className="size-3.5 opacity-50 transition group-hover:opacity-100 group-data-[state=open]:rotate-180" />
          </p>
          {children ?? (
            <>
              <p className={cn("num mt-1.5 text-2xl font-semibold tracking-tight", tono === "rojo" && "text-red-400", tono === "ambar" && "text-amber-300")}>{valor}</p>
              {detalle ? <p className="mt-0.5 text-xs text-muted-foreground">{detalle}</p> : null}
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="ritmo max-h-[60vh] w-72 overflow-y-auto rounded-2xl border-white/10 bg-[#0c111b]/95 p-2 backdrop-blur-xl">
        <p className="px-2 pt-1 pb-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          {titulo} · {total}
        </p>
        {total ? (
          grupos.map((g, i) =>
            g.gente.length ? (
              <div key={i} className="mb-1">
                {g.etiqueta ? (
                  <p className="flex items-center gap-1.5 px-2 pt-1.5 pb-1 text-[11px] font-medium text-muted-foreground">
                    {g.punto ? <span className={cn("size-2 rounded-full", g.punto)} /> : null}
                    {g.etiqueta} · {g.gente.length}
                  </p>
                ) : null}
                {g.gente.map((p) => (
                  <Link key={p.id} href={`/ritmo/equipo/${p.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-white/[0.06]">
                    <span className="truncate">{p.nombre}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {p.hora ? <Hora iso={p.hora} /> : null}
                      {p.hora && p.nota ? " · " : null}
                      {p.nota}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null,
          )
        ) : (
          <p className="px-2 pb-2 text-sm text-muted-foreground">{vacio}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
