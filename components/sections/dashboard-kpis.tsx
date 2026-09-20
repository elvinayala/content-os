import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardAgencia } from "@/lib/types";
import { formatUSD, fmtNumero, fmtPorcentaje } from "@/lib/format";

function Kpi({
  label,
  valor,
  sub,
}: {
  label: string;
  valor: string;
  sub?: string;
}) {
  return (
    <Card className="gap-0 p-4">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 text-2xl font-semibold tabular-nums">{valor}</span>
      {sub ? (
        <span className="mt-1 text-xs text-muted-foreground">{sub}</span>
      ) : null}
    </Card>
  );
}

// Fila de KPIs de una agencia: ventas + las 3 métricas (CAC / LTV / Churn).
export function DashboardKpis({ data }: { data: DashboardAgencia }) {
  const { kpis, metricas } = data;
  const dash = "—";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <Kpi
        label="Facturado"
        valor={formatUSD(kpis.totalFacturado)}
        sub={`${fmtNumero(kpis.cantidadVentas)} ventas`}
      />
      <Kpi
        label="Ticket prom."
        valor={formatUSD(kpis.ticketPromedio)}
        sub={`${fmtNumero(kpis.clientesUnicos)} clientes`}
      />
      <Kpi
        label="CAC"
        valor={metricas.cac != null ? formatUSD(metricas.cac) : dash}
        sub={
          metricas.clientesNuevos != null
            ? `${metricas.clientesNuevos} nuevos`
            : undefined
        }
      />
      <Kpi
        label="LTV prom."
        valor={metricas.ltvPromedio != null ? formatUSD(metricas.ltvPromedio) : dash}
      />
      <Kpi
        label="Churn"
        valor={metricas.churn != null ? fmtPorcentaje(metricas.churn) : dash}
      />
      <Card className="flex flex-col justify-center gap-1 p-4">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Métricas
        </span>
        <Badge variant={metricas.fuente === "hoja" ? "default" : "outline"}>
          {metricas.fuente === "hoja" ? "Hoja tesorera" : "Snapshot xlsx"}
        </Badge>
      </Card>
    </div>
  );
}
