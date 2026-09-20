import Link from "next/link";

import { fmtCompacto, fmtDelta } from "@/lib/format";
import type { Frescura } from "@/lib/ops";
import type {
  MetricaResumen,
  SituacionCritica,
  UnidadNegocio,
  WinCliente,
} from "@/lib/types";
import { UNIDADES } from "@/lib/ceo";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import { cn } from "@/lib/utils";

// Panel izquierdo del HUD: métricas compactas + pulso + system health.
export function HudMetrics({
  metricas,
  wins,
  criticos,
  fuentes,
  clientesNuevos = [],
}: {
  metricas: Pick<MetricaResumen, "key" | "label" | "valor" | "deltaPct">[];
  wins: WinCliente[];
  criticos: SituacionCritica[];
  fuentes: { nombre: string; frescura: Frescura }[];
  clientesNuevos?: { cliente: string; unidad: UnidadNegocio }[];
}) {
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto">
      <div>
        <h2 className="label-mono mb-2 text-muted-foreground">Métricas</h2>
        <div className="grid grid-cols-2 gap-2">
          {metricas.map((m) => (
            <div
              key={m.key}
              className="rounded-md border border-border bg-card/60 px-3 py-2"
            >
              <div className="label-mono text-muted-foreground">{m.label}</div>
              <div className="font-mono text-lg font-semibold">
                {fmtCompacto(m.valor)}
              </div>
              <div
                className={cn(
                  "text-xs",
                  m.deltaPct >= 0 ? "text-[var(--status-working)]" : "text-destructive",
                )}
              >
                {fmtDelta(m.deltaPct)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="label-mono mb-2 text-muted-foreground">
          Pulso de clientes
        </h2>
        <div className="space-y-1.5 text-sm">
          {clientesNuevos.map((n, i) => (
            <div
              key={`nuevo-${i}`}
              className="rounded-md border border-primary/50 bg-primary/10 px-3 py-2"
            >
              <span className="mr-1 text-primary">🎉</span>
              <span className="font-medium">Nuevo cliente: {n.cliente}</span>{" "}
              <span className="text-muted-foreground">
                — {UNIDADES[n.unidad]?.nombre ?? n.unidad}
              </span>
            </div>
          ))}
          {criticos.map((c) => (
            <div
              key={c.id}
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2"
            >
              <span className="font-medium">{c.cliente}</span>{" "}
              <span className="text-muted-foreground">— {c.resumen}</span>
            </div>
          ))}
          {wins.map((w) => (
            <div
              key={w.id}
              className="rounded-md border border-border bg-card/60 px-3 py-2"
            >
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-[var(--status-working)]" />
              <span className="font-medium">{w.cliente}</span>{" "}
              <span className="text-muted-foreground">— {w.resumen}</span>
            </div>
          ))}
          {wins.length === 0 && criticos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Sin señales — corré /brief-ceo.
            </p>
          ) : null}
        </div>
        <Link
          href="/ceo"
          className="mt-2 inline-block text-xs text-primary underline-offset-4 hover:underline"
        >
          Command Center →
        </Link>
      </div>

      <div className="mt-auto">
        <h2 className="label-mono mb-2 text-muted-foreground">
          System health
        </h2>
        <div className="space-y-1.5">
          {fuentes.map((f) => (
            <div key={f.nombre}>
              <FreshnessBadge frescura={f.frescura} fuente={f.nombre} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
