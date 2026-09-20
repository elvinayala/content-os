import { TrendingUp } from "lucide-react";

import type { SnapshotVentasEA } from "@/lib/types";
import { formatUSD } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// EA Market en el Command Center: CASH COLLECTED (dinero que entró) consolidado
// Level Up + AI Borinquen, en vivo desde los Google Sheets. Muestra el acumulado
// del año (YTD) y el detalle por mes.
export function EaMarketCard({
  ventas,
  url,
}: {
  ventas: SnapshotVentasEA | null;
  url: string;
}) {
  const meses = ventas?.meses ?? [];
  const ytd = ventas?.ytd;
  const umbral = ventas?.umbralRoas ?? 4;
  // ROAS del último mes CON gasto de anuncios (el mes en curso no tiene gid aún).
  const conRoas = [...meses].reverse().find((m) => m.roas != null);
  const roasBajo = conRoas?.roas != null && conRoas.roas < umbral;

  return (
    <Card className="bg-gradient-to-b from-card to-background/60">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-primary" />
          EA Market · cash collected
        </CardTitle>
        {ventas ? (
          <Badge
            variant="outline"
            className="label-mono border-[color-mix(in_oklch,var(--status-working)_40%,transparent)] text-[var(--status-working)]"
          >
            Live
          </Badge>
        ) : (
          <Badge variant="outline" className="label-mono text-muted-foreground">
            sin conectar
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!ventas ? (
          <p className="text-sm text-muted-foreground">
            No se pudieron leer las hojas de EA Market.
          </p>
        ) : (
          <>
            {ytd ? (
              <div>
                <div className="label-mono mb-1 text-muted-foreground">
                  Cash collected {ytd.anio} (acumulado)
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-mono text-lg font-semibold text-[var(--lu,var(--primary))]">
                      {formatUSD(ytd.levelUp)}
                    </div>
                    <div className="label-mono text-muted-foreground">Level Up</div>
                  </div>
                  <div>
                    <div className="font-mono text-lg font-semibold text-[var(--status-working)]">
                      {formatUSD(ytd.aiBorinquen)}
                    </div>
                    <div className="label-mono text-muted-foreground">Borinquen</div>
                  </div>
                  <div>
                    <div className="font-mono text-lg font-semibold">
                      {formatUSD(ytd.total)}
                    </div>
                    <div className="label-mono text-muted-foreground">Total</div>
                  </div>
                </div>
              </div>
            ) : null}

            {conRoas ? (
              <div
                className="rounded-md border p-2"
                style={{
                  borderColor: roasBajo
                    ? "color-mix(in oklch, var(--status-waiting) 45%, transparent)"
                    : "color-mix(in oklch, var(--status-working) 35%, transparent)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="label-mono text-muted-foreground">
                    ROAS {conRoas.mes}
                  </span>
                  <span
                    className="font-mono text-lg font-semibold"
                    style={{
                      color: roasBajo
                        ? "var(--status-waiting)"
                        : "var(--status-working)",
                    }}
                  >
                    {conRoas.roas?.toFixed(1)}×
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Anuncios {formatUSD(conRoas.adSpend ?? 0)}</span>
                  <span>
                    {roasBajo
                      ? `⚠ por debajo de ${umbral}× — revisar marketing`
                      : `sano (≥ ${umbral}×)`}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="space-y-1">
              <div className="label-mono text-muted-foreground">
                Últimos meses
              </div>
              {meses.map((m) => (
                <div
                  key={m.mes}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">{m.mes}</span>
                  <span className="font-mono">
                    {formatUSD(m.total)}
                    {m.roas != null ? (
                      <span className="ml-1.5 text-muted-foreground">
                        · {m.roas.toFixed(1)}×
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs text-primary underline-offset-4 hover:underline"
            >
              Abrir EA Market ↗
            </a>
          </>
        )}
      </CardContent>
    </Card>
  );
}
