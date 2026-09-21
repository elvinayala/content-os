import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ETAPAS_LEAD, type LeadCliente } from "@/lib/portal/types";

import { MoverLead } from "./controles";

const CANAL: Record<string, string> = {
  voz: "Llamada",
  chat: "Chat",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  ejemplo: "Ejemplo",
  manual: "Manual",
};

// El embudo DEL NEGOCIO del prospecto (no el de AIB): 5 etapas fijas, tarjetas de ejemplo
// marcadas como tal y leads reales que dejan el chat y la voz de prueba.
export function CrmKanban({ slug, leads, mostrarEjemplos }: { slug: string; leads: LeadCliente[]; mostrarEjemplos: boolean }) {
  const visibles = mostrarEjemplos ? leads : leads.filter((l) => !l.esEjemplo);
  const reales = leads.filter((l) => !l.esEjemplo).length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {reales > 0 ? (
          <Badge variant="outline" className="label-mono text-[var(--status-working)]">
            {reales} {reales === 1 ? "lead real" : "leads reales"}
          </Badge>
        ) : null}
        {mostrarEjemplos && visibles.some((l) => l.esEjemplo) ? (
          <Badge variant="outline" className="label-mono">
            Datos de ejemplo
          </Badge>
        ) : null}
        <span>Los leads que dejes probando el chat o la voz aparecen aquí solos.</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {ETAPAS_LEAD.map((col) => {
          const items = visibles.filter((l) => l.etapa === col.etapa);
          return (
            <div key={col.etapa} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="label-mono text-muted-foreground">{col.titulo}</span>
                <span className="label-mono text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">Vacío</div>
                ) : (
                  items.map((l) => (
                    <Card key={l.id} className="bg-gradient-to-b from-card to-background/40">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium leading-tight">{l.nombre}</p>
                        {l.interes ? <p className="text-xs text-muted-foreground">{l.interes}</p> : null}
                        {l.telefono || l.email ? <p className="font-mono text-xs text-muted-foreground">{l.telefono ?? l.email}</p> : null}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Badge variant="outline" className={"label-mono " + (l.esEjemplo ? "" : "text-[var(--status-working)]")}>
                            {l.esEjemplo ? "Ejemplo" : (CANAL[l.canal] ?? l.canal)}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{l.hora ?? ""}</span>
                        </div>
                        <div className="mt-2">
                          <MoverLead slug={slug} leadId={l.id} etapa={l.etapa} />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
