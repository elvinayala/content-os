import { Phone, Flame, TriangleAlert, FileClock } from "lucide-react";

import type { ZoomIntel } from "@/lib/zoom";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import { frescura } from "@/lib/frescura";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Zoom Intelligence en el Command Center: llamadas analizadas (setters/closers),
// oportunidades calientes, objeciones top y alertas administrativas.
export function ZoomIntelCard({ zoom }: { zoom: ZoomIntel }) {
  const m = zoom.metrics;
  const h = zoom.hoy;
  const kpis = [
    { icon: Phone, label: "Setters", valor: m.setterCalls },
    { icon: Phone, label: "Closers", valor: m.closerCalls },
    { icon: Flame, label: "Calientes", valor: m.oportunidadesCalientes },
    { icon: FileClock, label: "Pendientes", valor: m.pendientes },
  ];

  return (
    <Card className="bg-gradient-to-b from-card to-background/60">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Phone className="size-4 text-primary" />
          Zoom Intelligence · llamadas
        </CardTitle>
        {zoom.conectado ? (
          <Badge
            variant="outline"
            className="label-mono border-[color-mix(in_oklch,var(--status-working)_40%,transparent)] text-[var(--status-working)]"
          >
            Live
          </Badge>
        ) : (
          <FreshnessBadge
            frescura={frescura(undefined)}
            fuente="Zoom Intelligence"
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!zoom.conectado ? (
          <p className="text-sm text-muted-foreground">
            No se pudo leer Zoom Intelligence.
            {zoom.error ? (
              <span className="label-mono"> {zoom.error}</span>
            ) : null}
          </p>
        ) : (
          <>
            {/* HOY (tiempo real) */}
            <div className="rounded-md border border-[color-mix(in_oklch,var(--status-working)_30%,transparent)] p-2">
              <div className="label-mono mb-1 text-[var(--status-working)]">
                Hoy · en vivo
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="font-mono text-2xl font-semibold">
                    {h.closerCalls}
                  </div>
                  <div className="label-mono text-muted-foreground">
                    Demos closers
                  </div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold">
                    {h.setterCalls}
                  </div>
                  <div className="label-mono text-muted-foreground">Setters</div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold">
                    {h.oportunidadesCalientes}
                  </div>
                  <div className="label-mono text-muted-foreground">Calientes</div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold">
                    {h.conversaciones}
                  </div>
                  <div className="label-mono text-muted-foreground">Convos</div>
                </div>
              </div>
            </div>

            {/* Acumulado 7 días */}
            <div>
              <div className="label-mono mb-1 text-muted-foreground">
                Últimos 7 días
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {kpis.map((k) => (
                  <div key={k.label}>
                    <div className="font-mono text-lg font-semibold">
                      {k.valor}
                    </div>
                    <div className="label-mono text-muted-foreground">
                      {k.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {zoom.objecionesTop.length > 0 ? (
              <div>
                <div className="label-mono mb-1.5 text-muted-foreground">
                  Objeciones top
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {zoom.objecionesTop.map((o) => (
                    <Badge
                      key={o.texto}
                      variant="outline"
                      className="max-w-full whitespace-normal text-left"
                    >
                      {o.texto}
                      <span className="ml-1 text-muted-foreground">
                        ×{o.veces}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {zoom.alertas.length > 0 ? (
              <div>
                <div className="label-mono mb-1.5 flex items-center gap-1.5 text-[var(--status-waiting)]">
                  <TriangleAlert className="size-3" />
                  Alertas ({zoom.alertas.length})
                </div>
                <div className="space-y-1">
                  {zoom.alertas.slice(0, 3).map((a, i) => (
                    <p
                      key={i}
                      className="line-clamp-2 text-xs text-muted-foreground"
                    >
                      {a.hostName ? (
                        <span className="text-foreground/80">{a.hostName}: </span>
                      ) : null}
                      {a.message}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <a
              href="https://portal.levelupmediapr.net/levelup-clientes/zoom-intelligence/"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs text-primary underline-offset-4 hover:underline"
            >
              Abrir Zoom Intelligence ↗
            </a>
          </>
        )}
      </CardContent>
    </Card>
  );
}
