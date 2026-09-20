import { AlertTriangle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { DashboardKpis } from "@/components/sections/dashboard-kpis";
import { MetricasNegocioSection } from "@/components/sections/metricas-negocio";
import { VentasTable } from "@/components/sections/ventas-table";
import { DashboardEmbed } from "@/components/sections/dashboard-embed";
import { agenciasActivas } from "@/lib/agencias";
import { armarDashboardAgencia } from "@/lib/metricas";

export const metadata = { title: "Dashboard de Agencias · @tenfoldmarc" };
// La data vive en Google Sheets; se lee fresca en cada request.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const agencias = agenciasActivas();
  const datos = await Promise.all(agencias.map((a) => armarDashboardAgencia(a)));

  return (
    <>
      <PageHeader
        titulo="Dashboard de Agencias"
        descripcion="Ventas y métricas (CAC · LTV · Churn) en vivo desde Google Sheets."
      >
        <Badge variant="outline">{agencias.length} agencia(s)</Badge>
      </PageHeader>

      <main className="flex-1 space-y-10 p-4 sm:p-6">
        {datos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay agencias activas. Prendé una en{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              lib/agencias.ts
            </code>
            .
          </p>
        ) : null}

        {datos.map((data) => (
          <section key={data.agencia.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                {data.agencia.nombre}
              </h2>
              <Badge variant="secondary">{data.filas.length} ventas</Badge>
            </div>

            {data.error ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-foreground">
                    No se pudo leer la hoja de {data.agencia.nombre}.
                  </p>
                  <p className="text-muted-foreground">{data.error}</p>
                  <p className="mt-1 text-muted-foreground">
                    Verificá que el Google Sheet esté compartido como “cualquiera
                    con el link”.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <DashboardKpis data={data} />
                {data.negocio ? (
                  <MetricasNegocioSection m={data.negocio} />
                ) : null}
                <VentasTable
                  headers={data.headers}
                  filas={data.filas}
                  locale={data.agencia.locale}
                  columnaTransaccion={data.agencia.columnas.transaccion}
                />
              </>
            )}
          </section>
        ))}

        <DashboardEmbed />
      </main>
    </>
  );
}
