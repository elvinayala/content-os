"use client";

import { useState } from "react";
import { ChevronRight, Target, TrendingUp, UserMinus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MetricasNegocio } from "@/lib/types";
import { formatUSD, fmtNumero, fmtPorcentaje } from "@/lib/format";
import { cn } from "@/lib/utils";

function MetricaCard({
  icon,
  label,
  valor,
  detalle,
  acento,
}: {
  icon: React.ReactNode;
  label: string;
  valor: string;
  detalle: React.ReactNode;
  acento?: "danger";
}) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="font-mono text-xs uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span
        className={cn(
          "mt-2 text-4xl font-semibold tabular-nums",
          acento === "danger" && "text-destructive",
        )}
      >
        {valor}
      </span>
      <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
        {detalle}
      </div>
    </Card>
  );
}

// Sección PROMINENTE con las 3 métricas de negocio (CAC · LTV · Churn) que
// calcula la tesorera, más la tabla de LTV por cliente (colapsable).
export function MetricasNegocioSection({ m }: { m: MetricasNegocio }) {
  const [verLtv, setVerLtv] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Métricas de negocio
        </h3>
        <Badge variant="outline">{m.periodo}</Badge>
        <Badge variant="secondary">{m.fuente}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricaCard
          icon={<Target className="size-4" />}
          label="CAC"
          valor={m.cac != null ? formatUSD(m.cac) : "—"}
          detalle={
            <>
              <p>Costo total: {formatUSD(m.cacDetalle.costoTotal)}</p>
              <p>{m.cacDetalle.clientesNuevos} clientes nuevos cerrados</p>
              <p className="text-muted-foreground/70">
                Ads {formatUSD(m.cacDetalle.ads)} · Comis.{" "}
                {formatUSD(m.cacDetalle.comisiones)} · Herr.{" "}
                {formatUSD(m.cacDetalle.herramientas)}
              </p>
            </>
          }
        />
        <MetricaCard
          icon={<TrendingUp className="size-4" />}
          label="LTV promedio"
          valor={m.ltvPromedio != null ? formatUSD(m.ltvPromedio) : "—"}
          detalle={
            <>
              <p>
                {m.ltvPorCliente.length} clientes ·{" "}
                {m.ltvTotal != null ? formatUSD(m.ltvTotal) : "—"} total
              </p>
              <button
                type="button"
                onClick={() => setVerLtv((v) => !v)}
                className="mt-1 inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <ChevronRight
                  className={cn(
                    "size-3.5 transition-transform",
                    verLtv && "rotate-90",
                  )}
                />
                {verLtv ? "Ocultar" : "Ver"} LTV por cliente
              </button>
            </>
          }
        />
        <MetricaCard
          icon={<UserMinus className="size-4" />}
          label="Churn"
          valor={m.churn != null ? fmtPorcentaje(m.churn) : "—"}
          acento="danger"
          detalle={
            <>
              <p>{m.churnDetalle.clientesSeFueron} clientes se fueron</p>
              <p>{m.churnDetalle.clientesInicio} al inicio de mes</p>
              <p className="text-muted-foreground/70">
                Se fueron más de los que había al inicio.
              </p>
            </>
          }
        />
      </div>

      {verLtv ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-right">#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Negocio</TableHead>
                <TableHead className="text-right">LTV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.ltvPorCliente.map((c, i) => (
                <TableRow key={`${c.cliente}-${i}`}>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{c.cliente}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.negocio || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUSD(c.total)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell />
                <TableCell>Total</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {fmtNumero(m.ltvPorCliente.length)} clientes
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {m.ltvTotal != null ? formatUSD(m.ltvTotal) : "—"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
