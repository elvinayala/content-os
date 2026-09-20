import { ExternalLink } from "lucide-react";

import type { Frescura } from "@/lib/ops";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Card de un portal externo: siempre link-out; KPIs si hay snapshot (F5).
export function PortalCard({
  nombre,
  url,
  descripcion,
  kpis,
  frescura,
}: {
  nombre: string;
  url: string;
  descripcion: string;
  kpis?: { label: string; valor: string }[];
  frescura?: Frescura;
}) {
  return (
    <Card className="bg-gradient-to-b from-card to-background/60">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{nombre}</CardTitle>
          {frescura ? (
            <FreshnessBadge frescura={frescura} fuente="Portal" />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {kpis && kpis.length > 0 ? (
          <dl className="grid grid-cols-2 gap-3">
            {kpis.map((k) => (
              <div key={k.label}>
                <dt className="label-mono text-muted-foreground">{k.label}</dt>
                <dd className="font-mono text-lg font-semibold">{k.valor}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{descripcion}</p>
        )}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
        >
          Abrir portal <ExternalLink className="size-3" />
        </a>
      </CardContent>
    </Card>
  );
}
