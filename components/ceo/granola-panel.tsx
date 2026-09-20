import { Mic, CircleCheck, ListTodo, Clock } from "lucide-react";

import type { GranolaSnapshot } from "@/lib/types";
import { frescura } from "@/lib/frescura";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mi día según Granola: reuniones, decisiones de CEO y pendientes. Es la fuente
// que recoge el criterio de Elvin en crudo — se actualiza con /sync-granola.
export function GranolaPanel({ snap }: { snap: GranolaSnapshot | null }) {
  if (!snap || snap.reuniones.length === 0) return null;

  return (
    <section>
      <h2 className="label-mono mb-3 flex items-center gap-2 text-primary">
        <Mic className="size-3.5" />
        Mi día · reuniones de Granola
        <span className="ml-1">
          <FreshnessBadge frescura={frescura(snap.actualizadoEl)} fuente="Granola" />
        </span>
      </h2>

      <Card className="glow border-primary/30 bg-gradient-to-b from-card to-background/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium leading-snug text-foreground/90">
            {snap.resumenDia}
          </CardTitle>
          <p className="label-mono text-muted-foreground">
            {snap.reuniones.length} reuniones hoy
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reuniones del día */}
          <div className="space-y-2">
            {snap.reuniones.map((r) => (
              <div key={r.id} className="flex gap-3">
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <span className="label-mono flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" />
                    {r.hora}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    {r.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.resumen}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Decisiones de CEO */}
          {snap.decisiones.length > 0 ? (
            <div>
              <div className="label-mono mb-1.5 flex items-center gap-1.5 text-[var(--status-working)]">
                <CircleCheck className="size-3.5" />
                Decisiones de hoy
              </div>
              <ul className="space-y-1">
                {snap.decisiones.map((d, i) => (
                  <li key={i} className="text-xs text-foreground/85">
                    • {d}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Pendientes / action items */}
          {snap.pendientes.length > 0 ? (
            <div>
              <div className="label-mono mb-1.5 flex items-center gap-1.5 text-[var(--status-waiting)]">
                <ListTodo className="size-3.5" />
                Pendientes ({snap.pendientes.length})
              </div>
              <div className="space-y-1">
                {snap.pendientes.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Badge variant="outline" className="label-mono shrink-0">
                      {p.quien}
                    </Badge>
                    <span className="text-foreground/85">{p.que}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
