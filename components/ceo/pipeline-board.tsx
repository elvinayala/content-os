import { unidadInfo } from "@/lib/ceo";
import { fmtFecha, formatUSD } from "@/lib/format";
import type { EtapaLead, LeadPipeline } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const ETAPAS: { key: EtapaLead; label: string }[] = [
  { key: "nuevo", label: "Nuevo" },
  { key: "contactado", label: "Contactado" },
  { key: "calificado", label: "Calificado" },
  { key: "propuesta", label: "Propuesta" },
  { key: "cerrado", label: "Cerrado" },
  { key: "perdido", label: "Perdido" },
];

// Board por etapa (sin drag & drop en PASO 01 — el CRM real lo maneja el Sales Rep).
export function PipelineBoard({ leads }: { leads: LeadPipeline[] }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[64rem] grid-cols-6 gap-3">
        {ETAPAS.map(({ key, label }) => {
          const deEtapa = leads.filter((l) => l.etapa === key);
          const total = deEtapa.reduce((acc, l) => acc + l.valorMensual, 0);
          const cerrada = key === "cerrado" || key === "perdido";
          return (
            <div key={key} className="flex flex-col gap-2">
              <div className="rounded-md border border-border bg-card/60 px-2.5 py-2">
                <div className="flex items-center justify-between">
                  <span className="label-mono text-muted-foreground">
                    {label}
                  </span>
                  <span className="label-mono text-primary">
                    {deEtapa.length}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-sm font-semibold">
                  {formatUSD(total)}
                  <span className="text-xs font-normal text-muted-foreground">
                    /mes
                  </span>
                </div>
              </div>

              {deEtapa.map((lead) => (
                <Card
                  key={lead.id}
                  className={`bg-gradient-to-b from-card to-background/60 ${
                    cerrada ? "opacity-70" : ""
                  }`}
                >
                  <CardContent className="space-y-1.5 p-3">
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="text-sm font-medium leading-tight">
                        {lead.nombre}
                      </p>
                      <Badge variant="outline" className="label-mono shrink-0">
                        {unidadInfo(lead.unidad).abrev}
                      </Badge>
                    </div>
                    {lead.negocio ? (
                      <p className="text-xs text-muted-foreground">
                        {lead.negocio}
                      </p>
                    ) : null}
                    <p className="font-mono text-sm text-primary">
                      {formatUSD(lead.valorMensual)}/mes
                    </p>
                    <p className="label-mono text-muted-foreground">
                      {lead.origen} · {fmtFecha(lead.ultimoContacto)}
                    </p>
                    {lead.nota ? (
                      <p className="text-xs text-muted-foreground">
                        {lead.nota}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
