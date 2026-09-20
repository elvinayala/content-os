"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookmarkPlus,
  Check,
  ChevronDown,
  Eye,
  Flame,
  Heart,
  MessageCircle,
  Repeat,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import type { CuentaCompetencia, ReelCompetencia } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fmtCompacto, fmtFecha, fmtPorcentaje } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ReferentesAnalisis({
  cuentas,
  reels,
}: {
  cuentas: CuentaCompetencia[];
  reels: ReelCompetencia[];
}) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const [guardados, setGuardados] = useState<Record<string, boolean>>({});

  // Reels agrupados por creador, ordenados por vistas.
  const porCreador = useMemo(() => {
    const map = new Map<string, ReelCompetencia[]>();
    for (const r of reels) {
      const k = r.creador;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    for (const arr of map.values()) arr.sort((a, b) => b.vistas - a.vistas);
    return map;
  }, [reels]);

  // Orden de referentes por promedio de vistas (o top vistas) desc.
  const ranking = useMemo(
    () =>
      [...cuentas].sort(
        (a, b) =>
          (b.vistasPromedio ?? b.topVistas) - (a.vistasPromedio ?? a.topVistas),
      ),
    [cuentas],
  );

  function guardar(reel: ReelCompetencia) {
    setGuardados((prev) => ({ ...prev, [reel.id]: true }));
    toast.success(`"${reel.gancho.slice(0, 40)}…" guardado en el Baúl de Ganchos`);
  }

  return (
    <div className="space-y-3">
      {ranking.map((c, i) => {
        const sus = porCreador.get(c.creador) ?? [];
        const open = abierto === c.id;
        return (
          <Card key={c.id} className="overflow-hidden">
            {/* Cabecera del referente */}
            <button
              onClick={() => setAbierto(open ? null : c.id)}
              className="flex w-full items-start gap-3 p-4 text-left"
            >
              <span className="mt-1 w-6 shrink-0 text-center font-mono text-sm text-primary tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Avatar className="size-11 shrink-0">
                <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                  {c.iniciales}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{c.creador}</span>
                  {c.nombre ? (
                    <span className="text-xs text-muted-foreground">
                      {c.nombre}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    · {fmtCompacto(c.seguidores)} seg.
                  </span>
                </div>

                {/* Métricas agregadas (60d) */}
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {c.vistasPromedio != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3" /> {fmtCompacto(c.vistasPromedio)} prom.
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Flame className="size-3 text-primary" />
                    {fmtCompacto(c.topVistas)} top
                  </span>
                  {c.engagementProm != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3" /> {fmtPorcentaje(c.engagementProm)} eng.
                    </span>
                  ) : null}
                  {c.postsPorSemana != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Repeat className="size-3" /> {c.postsPorSemana}/sem
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    {sus.length} reels (60d)
                  </span>
                </div>

                {/* Qué le rinde */}
                {(c.mejorFormato || c.mejorAngulo || c.queAprender) && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {c.mejorFormato ? (
                      <Badge variant="secondary" className="text-xs">
                        Formato: {c.mejorFormato}
                      </Badge>
                    ) : null}
                    {c.mejorAngulo ? (
                      <Badge variant="secondary" className="text-xs">
                        Ángulo: {c.mejorAngulo}
                      </Badge>
                    ) : null}
                  </div>
                )}
                {c.queAprender ? (
                  <p className="mt-1.5 text-xs text-foreground/80">
                    <Sparkles className="mr-1 inline size-3 text-primary" />
                    {c.queAprender}
                  </p>
                ) : null}
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>

            {/* Reels del referente (expandido) */}
            {open ? (
              <CardContent className="border-t border-border p-0">
                {sus.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Sin reels analizados en los últimos 60 días.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {sus.map((r) => {
                      const ok = guardados[r.id];
                      return (
                        <div key={r.id} className="space-y-2 p-4">
                          <p className="text-sm font-medium leading-snug">
                            {r.gancho}
                          </p>
                          {r.textoPantalla ? (
                            <p className="rounded-md bg-muted/50 p-2 font-mono text-xs">
                              {r.textoPantalla}
                            </p>
                          ) : null}

                          {/* Ángulo + formato */}
                          <div className="flex flex-wrap gap-1.5">
                            {r.angulo ? (
                              <Badge variant="outline" className="label-mono">
                                {r.angulo}
                              </Badge>
                            ) : null}
                            {r.formato ? (
                              <Badge variant="outline" className="label-mono">
                                {r.formato}
                              </Badge>
                            ) : null}
                          </div>

                          {/* Métricas del reel */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="size-3" /> {fmtCompacto(r.vistas)}
                            </span>
                            {r.likes != null ? (
                              <span className="inline-flex items-center gap-1">
                                <Heart className="size-3" /> {fmtCompacto(r.likes)}
                              </span>
                            ) : null}
                            {r.comentarios != null ? (
                              <span className="inline-flex items-center gap-1">
                                <MessageCircle className="size-3" />{" "}
                                {fmtCompacto(r.comentarios)}
                              </span>
                            ) : null}
                            {r.engagementPct > 0 ? (
                              <span className="text-primary">
                                {fmtPorcentaje(r.engagementPct)} eng.
                              </span>
                            ) : null}
                            <span>{fmtFecha(r.publicadoEl)}</span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              variant={ok ? "outline" : "default"}
                              onClick={() => guardar(r)}
                              disabled={ok}
                            >
                              {ok ? (
                                <Check className="text-primary" />
                              ) : (
                                <BookmarkPlus />
                              )}
                              {ok ? "En el Baúl" : "Guardar en Baúl"}
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Abrir reel"
                              >
                                <ArrowUpRight />
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
