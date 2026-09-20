"use client";

import { useState } from "react";
import { ArrowUpRight, BookmarkPlus, Check } from "lucide-react";
import { toast } from "sonner";

import type { ReelCompetencia } from "@/lib/types";
import { PlatformBadge } from "@/components/platform-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fmtCompacto, fmtFecha, fmtPorcentaje } from "@/lib/format";

export function CompetenciaReels({ reels }: { reels: ReelCompetencia[] }) {
  const [guardados, setGuardados] = useState<Record<string, boolean>>({});

  function guardar(reel: ReelCompetencia) {
    // Demo: en producción esto crea un Gancho en el Baúl con el gancho transcripto.
    setGuardados((prev) => ({ ...prev, [reel.id]: true }));
    toast.success(`"${reel.gancho.slice(0, 40)}…" guardado en el Baúl de Ganchos`);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reels.map((reel) => {
        const ok = guardados[reel.id];
        return (
          <Card key={reel.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{reel.creador}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {fmtCompacto(reel.seguidores)} seguidores
                  </span>
                </div>
                <PlatformBadge plataforma={reel.plataforma} />
              </div>
              <CardTitle className="text-base leading-snug">
                {reel.gancho}
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-auto space-y-3">
              {reel.textoPantalla ? (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Texto en pantalla
                  </span>
                  <p className="rounded-md bg-muted/50 p-2 font-mono text-xs">
                    {reel.textoPantalla}
                  </p>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                {reel.vistas > 0 ? (
                  <span>{fmtCompacto(reel.vistas)} vistas</span>
                ) : (
                  <span className="text-muted-foreground/70">post</span>
                )}
                {reel.engagementPct > 0 ? (
                  <span className="text-primary">
                    {fmtPorcentaje(reel.engagementPct)} engagement
                  </span>
                ) : null}
                <span>{fmtFecha(reel.publicadoEl)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={ok ? "outline" : "default"}
                  className="flex-1"
                  onClick={() => guardar(reel)}
                  disabled={ok}
                >
                  {ok ? <Check className="text-primary" /> : <BookmarkPlus />}
                  {ok ? "En el Baúl" : "Guardar en Baúl"}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={reel.url} target="_blank" rel="noreferrer" aria-label="Abrir reel">
                    <ArrowUpRight />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
