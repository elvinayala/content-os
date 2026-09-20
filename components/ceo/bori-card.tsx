import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

import type { NegocioBori } from "@/lib/bori";
import { formatUSD } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Bori (heybori.ai) en el Command Center: el SaaS de anuncios AI.
// MRR, ventas del día y embudo en vivo, para no depender de entrar a Stripe.
// El detalle completo vive en el panel "Negocio" dentro de la propia app.

const ETIQUETA_VENTA: Record<string, string> = {
  nueva_suscripcion: "nueva",
  renovacion: "renovó",
  paquete_creditos: "créditos",
  cancelacion: "canceló",
};

export function BoriCard({ negocio }: { negocio: NegocioBori }) {
  const { conectado, hoy, mes, mrr, embudo, ultimasVentas, error } = negocio;
  const planes = Object.entries(mrr.porPlan);

  return (
    <Card className="bg-gradient-to-b from-card to-background/60">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Bori · SaaS de anuncios AI
        </CardTitle>
        {conectado ? (
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
        {!conectado ? (
          <p className="text-sm text-muted-foreground">
            No se pudo leer Bori{error ? ` — ${error}` : ""}.
          </p>
        ) : (
          <>
            {/* MRR: el número que importa */}
            <div>
              <div className="label-mono mb-1 text-muted-foreground">
                Ingreso recurrente mensual
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-mono text-lg font-semibold text-[var(--status-working)]">
                    {formatUSD(mrr.mrr)}
                  </div>
                  <div className="label-mono text-muted-foreground">MRR</div>
                </div>
                <div>
                  <div className="font-mono text-lg font-semibold">{embudo.pagando}</div>
                  <div className="label-mono text-muted-foreground">pagando</div>
                </div>
                <div>
                  <div className="font-mono text-lg font-semibold">{embudo.conversion}%</div>
                  <div className="label-mono text-muted-foreground">conversión</div>
                </div>
              </div>
              {planes.length ? (
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {planes.map(([plan, n]) => (
                    <Badge key={plan} variant="outline" className="label-mono text-muted-foreground">
                      {plan} × {n}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Hoy vs mes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border p-2">
                <div className="label-mono text-muted-foreground">Hoy</div>
                <div className="font-mono text-base font-semibold">{formatUSD(hoy.ingreso)}</div>
                <div className="text-xs text-muted-foreground">
                  {hoy.nuevas} {hoy.nuevas === 1 ? "venta" : "ventas"} · {hoy.registros}{" "}
                  {hoy.registros === 1 ? "alta" : "altas"}
                </div>
              </div>
              <div className="rounded-md border p-2">
                <div className="label-mono text-muted-foreground">Últimos 30 días</div>
                <div className="font-mono text-base font-semibold">{formatUSD(mes.ingreso)}</div>
                <div className="text-xs text-muted-foreground">
                  {mes.nuevas} nuevas · {mes.cancelaciones} bajas
                </div>
              </div>
            </div>

            {/* Embudo: dónde está el cuello de botella */}
            <div className="rounded-md border p-2">
              <div className="label-mono mb-1 text-muted-foreground">
                Embudo · {embudo.total} cuentas
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{embudo.gratis} gratis</span>
                <span>{embudo.cortesia} cortesía</span>
                <span className="text-[var(--status-working)]">{embudo.pagando} pagando</span>
                {embudo.morosos > 0 ? (
                  <span className="text-[var(--status-waiting)]">{embudo.morosos} morosos</span>
                ) : null}
                {embudo.cancelados > 0 ? <span>{embudo.cancelados} cancelados</span> : null}
              </div>
            </div>

            {/* Últimas ventas */}
            {ultimasVentas.length ? (
              <div>
                <div className="label-mono mb-1 text-muted-foreground">Últimas ventas</div>
                <ul className="space-y-1">
                  {ultimasVentas.slice(0, 3).map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-muted-foreground">
                        {v.email ?? "—"}
                      </span>
                      <span className="shrink-0 font-mono">
                        {ETIQUETA_VENTA[v.eventType] ?? v.eventType}
                        {v.amountUsd > 0 ? ` · ${formatUSD(v.amountUsd)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sin ventas registradas todavía.
              </p>
            )}
          </>
        )}

        <Link
          href="https://www.heybori.ai/app"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Abrir Bori <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
