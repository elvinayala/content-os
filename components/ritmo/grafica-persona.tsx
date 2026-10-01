"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { Hora } from "./hora-local";

// Gráfica sencilla de los KPIs de una persona (30/sep, Elvin: "que yo pueda cliquear y se abre una gráfica de su data,
// simple"). Barras por día de lo que reportó al marcar salida + su entrada, almuerzo y salida (sin horas trabajadas).

export type DiaGrafica = {
  fecha: string;
  estado: string;
  entrada: string | null;
  salida: string | null;
  almuerzo: { salida: string; vuelta: string | null } | null;
  datos: Record<string, number>;
  detalles: Record<string, string>;
};

const dia = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { weekday: "short", day: "numeric" });
const ESTADO: Record<string, string> = { libre: "Libre", ausente: "Sin marcar", pendiente: "Aún no entra" };

export function GraficaPersona({ userId, nombre, puesto, kpis, dias }: { userId: string; nombre: string; puesto: string; kpis: { id: string; nombre: string }[]; dias: DiaGrafica[] }) {
  const [abierto, setAbierto] = useState(false);
  const abrir = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAbierto(true);
  };
  const reportados = dias.filter((d) => Object.keys(d.datos).length).length;
  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={abrir}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? abrir(e) : null)}
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.06] px-2.5 py-1 text-xs text-primary transition hover:bg-primary/15"
      >
        <BarChart3 className="size-3.5" /> {kpis.length ? `KPIs · ${reportados}/${dias.filter((d) => d.estado !== "libre").length} días` : "Ver semana"}
      </span>
      {/* La fila de Equipo es un link: los clics dentro del panel (portal) no deben llegarle. */}
      <span className="contents" onClick={(e) => e.stopPropagation()}>
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent side="right" className="ritmo w-full overflow-y-auto border-white/10 bg-[#0c111b] sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{nombre}</SheetTitle>
            <SheetDescription>{puesto} · últimos 7 días</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-5 px-4 pb-6">
            {kpis.length ? (
              kpis.map((k) => {
                const vals = dias.map((d) => d.datos[k.id] ?? null);
                const max = Math.max(1, ...vals.map((v) => v ?? 0));
                const total = vals.reduce<number>((s, v) => s + (v ?? 0), 0);
                const ultimo = [...dias].reverse().find((d) => d.detalles[k.id])?.detalles[k.id];
                return (
                  <section key={k.id} className="panel p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-medium">{k.nombre}</h3>
                      <span className="text-xs text-muted-foreground">
                        <b className="num text-base text-foreground">{total}</b> en la semana
                      </span>
                    </div>
                    <div className="mt-3 flex items-end gap-1.5">
                      {dias.map((d, i) => {
                        const v = vals[i];
                        return (
                          <div key={d.fecha} className="flex flex-1 flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground tabular-nums">{v ?? ""}</span>
                            <div className="flex h-20 w-full items-end">
                              <div
                                className={cn("w-full rounded-t-md", v === null ? "h-0.5 bg-white/10" : v === 0 ? "h-0.5 bg-white/25" : "bg-gradient-to-t from-primary/50 to-primary")}
                                style={v ? { height: `${Math.max(8, (v / max) * 100)}%` } : undefined}
                                title={d.detalles[k.id] ?? undefined}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground capitalize">{dia(d.fecha)}</span>
                          </div>
                        );
                      })}
                    </div>
                    {ultimo ? <p className="mt-2 text-xs text-muted-foreground">Último: “{ultimo}”</p> : null}
                  </section>
                );
              })
            ) : (
              <p className="panel p-4 text-sm text-muted-foreground">Este puesto todavía no tiene KPIs que reportar. Abajo, su asistencia.</p>
            )}

            <section className="panel p-4">
              <h3 className="mb-2 text-sm font-medium">Entrada · almuerzo · salida</h3>
              <ul className="flex flex-col divide-y divide-border/40 text-xs">
                {[...dias].reverse().map((d) => (
                  <li key={d.fecha} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="w-14 capitalize">{dia(d.fecha)}</span>
                    {d.entrada ? (
                      <span className="flex-1 text-right text-muted-foreground tabular-nums">
                        <Hora iso={d.entrada} />
                        {d.almuerzo ? (
                          <>
                            {" · almuerzo "}
                            <Hora iso={d.almuerzo.salida} />
                            {d.almuerzo.vuelta ? (
                              <>
                                –<Hora iso={d.almuerzo.vuelta} />
                              </>
                            ) : null}
                          </>
                        ) : null}
                        {" · "}
                        {d.estado === "trabajando" ? "sigue trabajando" : d.salida ? <Hora iso={d.salida} /> : "sin salida"}
                      </span>
                    ) : (
                      <span className={cn("flex-1 text-right", d.estado === "ausente" ? "text-red-300" : "text-muted-foreground")}>{ESTADO[d.estado] ?? "—"}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
            <Link href={`/ritmo/equipo/${userId}`} className="text-center text-sm text-primary hover:underline">
              Ver su ficha completa →
            </Link>
          </div>
        </SheetContent>
      </Sheet>
      </span>
    </>
  );
}
