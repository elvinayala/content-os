"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PuntoSemana } from "@/lib/types";

const chartConfig = {
  vistas: { label: "Vistas", color: "var(--chart-1)" },
  guardados: { label: "Guardados", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function MetricasChart({ data }: { data: PuntoSemana[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="fillVistas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-vistas)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--color-vistas)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillGuardados" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-guardados)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--color-guardados)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeOpacity={0.15} />
        <XAxis
          dataKey="dia"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        {/* Ejes independientes: vistas (~95k) y guardados (~3k) usan toda la altura */}
        <YAxis yAxisId="vistas" hide domain={[0, "dataMax"]} />
        <YAxis yAxisId="guardados" hide domain={[0, "dataMax"]} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area
          yAxisId="guardados"
          dataKey="guardados"
          type="natural"
          fill="url(#fillGuardados)"
          stroke="var(--color-guardados)"
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Area
          yAxisId="vistas"
          dataKey="vistas"
          type="natural"
          fill="url(#fillVistas)"
          stroke="var(--color-vistas)"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
