"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";

import type { EventoCalendario } from "@/lib/types";
import { plataformaMeta } from "@/lib/plataforma";
import { PlatformBadge } from "@/components/platform-badge";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fmtFechaLarga } from "@/lib/format";
import { cn } from "@/lib/utils";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function claveFecha(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarMonth({ eventos }: { eventos: EventoCalendario[] }) {
  const [sel, setSel] = useState<string | null>(null);

  // Mes a mostrar: el del primer evento (o el actual si no hay).
  const { year, month } = useMemo(() => {
    const base = eventos[0]?.fecha;
    if (base) {
      const [y, m] = base.split("-").map(Number);
      return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [eventos]);

  // Eventos agrupados por fecha.
  const porFecha = useMemo(() => {
    const map = new Map<string, EventoCalendario[]>();
    for (const ev of eventos) {
      const arr = map.get(ev.fecha) ?? [];
      arr.push(ev);
      map.set(ev.fecha, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.hora.localeCompare(b.hora));
    return map;
  }, [eventos]);

  // Construcción de la grilla (semana empieza el lunes).
  const primero = new Date(year, month, 1);
  const offset = (primero.getDay() + 6) % 7; // lunes = 0
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const seleccionados = sel ? porFecha.get(sel) ?? [] : [];

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium capitalize">
            {MESES[month]} {year}
          </h2>
          <span className="text-xs text-muted-foreground">
            {eventos.length} publicaciones
          </span>
        </div>

        {/* Encabezado de días */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DIAS.map((d, i) => (
            <div
              key={i}
              className="pb-1 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}

          {celdas.map((dia, i) => {
            if (dia === null) return <div key={i} className="aspect-square" />;
            const clave = claveFecha(year, month, dia);
            const evs = porFecha.get(clave) ?? [];
            const tiene = evs.length > 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => tiene && setSel(clave)}
                disabled={!tiene}
                className={cn(
                  "flex aspect-square flex-col rounded-lg border p-1.5 text-left transition-colors sm:p-2",
                  tiene
                    ? "border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer"
                    : "border-border/60 cursor-default",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    tiene ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {dia}
                </span>
                {tiene && (
                  <div className="mt-auto flex flex-wrap gap-1">
                    {evs.slice(0, 3).map((ev) => {
                      const meta = plataformaMeta[ev.plataforma];
                      return (
                        <span
                          key={ev.id}
                          className={cn(
                            "rounded border px-1 text-[10px] font-semibold leading-tight",
                            meta.clase,
                          )}
                        >
                          {meta.abrev}
                        </span>
                      );
                    })}
                    {evs.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{evs.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel lateral con el guion completo */}
      <Sheet open={sel !== null} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="first-letter:uppercase">
              {sel ? fmtFechaLarga(sel) : ""}
            </SheetTitle>
            <SheetDescription>
              {seleccionados.length} publicación(es) programada(s)
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-6">
            {seleccionados.map((ev) => (
              <div key={ev.id} className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <PlatformBadge plataforma={ev.plataforma} />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    <Clock className="size-3.5" />
                    {ev.hora}
                  </span>
                </div>
                <h3 className="font-semibold leading-snug">{ev.titulo}</h3>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Gancho
                  </span>
                  <p className="text-sm leading-snug">{ev.gancho}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Ángulo
                  </span>
                  <p className="text-sm leading-snug text-muted-foreground">
                    {ev.angulo}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Guion completo
                  </span>
                  <p className="text-sm leading-relaxed">{ev.descripcion}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {ev.estado}
                  </Badge>
                  {ev.origen === "guion" && (
                    <Badge variant="outline" className="text-primary">
                      desde /guion
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
