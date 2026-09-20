import { AlertTriangle, TrendingDown, DollarSign, Users, Package, ClipboardList, Target } from "lucide-react";

import type { CategoriaPrioridad, Prioridad } from "@/lib/types";
import { Accionar } from "@/components/ceo/accionar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const ICONO: Record<CategoriaPrioridad, typeof Target> = {
  churn: TrendingDown,
  ventas: Target,
  administrativo: ClipboardList,
  finanzas: DollarSign,
  producto: Package,
  equipo: Users,
};

const SEV: Record<Prioridad["severidad"], string> = {
  alta: "var(--status-waiting)",
  media: "var(--primary)",
  baja: "var(--muted-foreground)",
};

// Prioridades / decisiones estratégicas del CEO — lo importante más allá de la
// salud de clientes: churn, reactivación de ventas, calidad, finanzas, equipo.
export function PrioridadesPanel({ prioridades }: { prioridades: Prioridad[] }) {
  const abiertas = prioridades.filter((p) => p.estado !== "resuelta");
  if (abiertas.length === 0) return null;

  return (
    <section>
      <h2 className="label-mono mb-3 flex items-center gap-2 text-[var(--status-waiting)]">
        <AlertTriangle className="size-3.5" />
        Prioridades del CEO · decisiones a tomar
      </h2>
      <div className="grid gap-3 lg:grid-cols-3">
        {abiertas.map((p) => {
          const Icono = ICONO[p.categoria] ?? Target;
          return (
            <Card
              key={p.id}
              className="bg-gradient-to-b from-card to-background/60"
              style={{
                borderColor: `color-mix(in oklch, ${SEV[p.severidad]} 35%, transparent)`,
              }}
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <Icono className="size-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="label-mono">
                      {p.categoria}
                    </Badge>
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: SEV[p.severidad] }}
                      title={`severidad ${p.severidad}`}
                    />
                  </div>
                </div>

                <h3 className="text-sm font-semibold leading-tight">{p.titulo}</h3>
                {p.metrica ? (
                  <p className="label-mono text-[var(--status-waiting)]">
                    {p.metrica}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">{p.detalle}</p>

                {p.accionSugerida ? (
                  <div className="rounded-md border border-border bg-background/50 p-2">
                    <div className="label-mono mb-0.5 text-muted-foreground">
                      Acción sugerida
                    </div>
                    <p className="text-xs text-foreground/80">{p.accionSugerida}</p>
                  </div>
                ) : null}
                <div>
                  <Accionar item={`${p.titulo}. ${p.detalle}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
