"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import type { MetricaResumen, RangoDias } from "@/lib/types";
import { Sparkline } from "@/components/sparkline";
import { Card } from "@/components/ui/card";
import { fmtDelta, fmtNumero } from "@/lib/format";
import { cn } from "@/lib/utils";

const rangos: RangoDias[] = ["7", "30", "90"];

// Guardados va en verde (como en el diseño); el resto en terracota.
function colorDe(key: string) {
  return key === "guardados" ? "var(--color-emerald-400, #34d399)" : "var(--primary)";
}

export function MetricasStats({ metricas }: { metricas: MetricaResumen[] }) {
  const [rango, setRango] = useState<RangoDias>("7");

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Resumen</h2>
        {/* Toggle 7 / 30 / 90 días */}
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {rangos.map((r) => (
            <button
              key={r}
              onClick={() => setRango(r)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                rango === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricas.map((m) => {
          const positivo = m.deltaPct >= 0;
          return (
            <Card key={m.key} className="gap-0 p-4">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {m.label}
              </span>
              <div className="mt-1 flex items-end justify-between gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {m.prefijo ?? ""}
                  {fmtNumero(m.valor)}
                </span>
              </div>
              <div className="mt-3">
                <Sparkline
                  data={m.series[rango]}
                  stroke={colorDe(m.key)}
                  width={220}
                  height={40}
                  className="w-full"
                />
              </div>
              <span
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                  positivo ? "text-primary" : "text-destructive",
                )}
              >
                {positivo ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                {fmtDelta(m.deltaPct)} · {rango}d
              </span>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
