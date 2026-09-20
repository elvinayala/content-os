import { leerPipeline } from "@/lib/pipedrive";
import { formatUSD } from "@/lib/format";
import type { EtapaLead, LeadPipeline } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "CRM · Bori" };
export const dynamic = "force-dynamic";

const COLUMNAS: { etapa: EtapaLead; titulo: string }[] = [
  { etapa: "nuevo", titulo: "Nuevos" },
  { etapa: "contactado", titulo: "Contactados" },
  { etapa: "calificado", titulo: "Calificados" },
  { etapa: "propuesta", titulo: "Propuesta" },
  { etapa: "cerrado", titulo: "Cerrados" },
];

export default async function CrmPage() {
  const res = await leerPipeline();
  const leads = res.leads.filter((l) => l.unidad === "ai-borinquen");
  const abiertos = leads.filter((l) => l.etapa !== "perdido" && l.etapa !== "cerrado");
  const valorAbierto = abiertos.reduce((a, l) => a + l.valorMensual, 0);

  const porEtapa = (etapa: EtapaLead): LeadPipeline[] =>
    leads.filter((l) => l.etapa === etapa);

  return (
    <>
      <PageHeader
        titulo="CRM"
        descripcion="Tus leads de AI Borinquen — lo que capturan los agentes."
      >
        <Badge
          variant="outline"
          className="label-mono"
        >
          {res.fuente === "pipedrive" ? "Pipedrive · live" : "Datos demo"}
        </Badge>
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap gap-4">
          <Resumen label="Leads abiertos" valor={String(abiertos.length)} />
          <Resumen label="Pipeline /mes" valor={formatUSD(valorAbierto)} />
          <Resumen label="Total en board" valor={String(leads.length)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {COLUMNAS.map((col) => {
            const items = porEtapa(col.etapa);
            const valor = items.reduce((a, l) => a + l.valorMensual, 0);
            return (
              <div key={col.etapa} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="label-mono text-muted-foreground">
                    {col.titulo}
                  </span>
                  <span className="label-mono text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
                      Vacío
                    </div>
                  ) : (
                    items.map((l) => (
                      <Card
                        key={l.id}
                        className="bg-gradient-to-b from-card to-background/40"
                      >
                        <CardContent className="p-3">
                          <p className="text-sm font-medium leading-tight">
                            {l.nombre}
                          </p>
                          {l.negocio ? (
                            <p className="text-xs text-muted-foreground">
                              {l.negocio}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-mono text-xs">
                              {formatUSD(l.valorMensual)}
                            </span>
                            <Badge variant="outline" className="label-mono">
                              {l.origen}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                {valor > 0 ? (
                  <p className="text-right font-mono text-xs text-muted-foreground">
                    {formatUSD(valor)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

function Resumen({ label, valor }: { label: string; valor: string }) {
  return (
    <Card className="bg-gradient-to-b from-card to-background/40">
      <CardContent className="px-5 py-3">
        <p className="label-mono text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-mono text-xl font-semibold">{valor}</p>
      </CardContent>
    </Card>
  );
}
