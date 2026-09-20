import Link from "next/link";
import { ExternalLink, Snowflake } from "lucide-react";

import { fmtFecha } from "@/lib/format";
import { CAPAS, leerPortafolio } from "@/lib/portafolio";
import type { CapaPortafolio, UnidadPortafolio } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { StatChip } from "@/components/ceo/stat-chip";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Portafolio · CEO Command Center" };
// El JSON lo edita el plan / el board meeting: leer fresco.
export const dynamic = "force-dynamic";

const CAPA_BADGE: Record<CapaPortafolio, string> = {
  motor: "bg-primary/20 text-primary border-primary/40",
  producto: "bg-[color-mix(in_oklch,var(--neon)_18%,transparent)] text-foreground border-[color-mix(in_oklch,var(--neon)_40%,transparent)]",
  piloto: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  congelado: "bg-muted text-muted-foreground border-border",
  entregado: "bg-muted text-muted-foreground border-border",
};

function esExterno(href: string) {
  return href.startsWith("http");
}

function UnidadCard({ u }: { u: UnidadPortafolio }) {
  const apagada = u.capa === "congelado" || u.capa === "entregado";
  return (
    <Card
      className={
        apagada
          ? "bg-card/40 opacity-80"
          : "bg-gradient-to-b from-card to-background/60"
      }
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{u.nombre}</CardTitle>
          <Badge
            variant="outline"
            className={`label-mono uppercase ${CAPA_BADGE[u.capa]}`}
          >
            {u.capa === "congelado" ? (
              <Snowflake className="mr-1 size-3" />
            ) : null}
            {u.capa}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{u.resumen}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {u.numeros.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {u.numeros.map((n) => (
              <StatChip key={n.label} label={n.label} valor={n.valor} />
            ))}
          </div>
        ) : null}

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {u.meta ? (
            <div className="sm:col-span-2">
              <dt className="label-mono text-muted-foreground">Meta 12/dic</dt>
              <dd>{u.meta}</dd>
            </div>
          ) : null}
          {u.jugada ? (
            <div className="sm:col-span-2">
              <dt className="label-mono text-muted-foreground">Jugada</dt>
              <dd>{u.jugada}</dd>
            </div>
          ) : null}
          {u.horasElvin ? (
            <div>
              <dt className="label-mono text-muted-foreground">Horas de Elvin</dt>
              <dd className="font-mono">{u.horasElvin}</dd>
            </div>
          ) : null}
          {u.compuerta ? (
            <div>
              <dt className="label-mono text-muted-foreground">
                Compuerta {fmtFecha(u.compuerta.fecha)}
              </dt>
              <dd>{u.compuerta.condicion}</dd>
            </div>
          ) : null}
          {u.trigger && u.trigger !== "—" ? (
            <div className="sm:col-span-2">
              <dt className="label-mono text-muted-foreground">
                {u.capa === "congelado" ? "Se reabre cuando" : "Trigger"}
              </dt>
              <dd>{u.trigger}</dd>
            </div>
          ) : null}
        </dl>

        {u.enlaces.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {u.enlaces.map((e) =>
              esExterno(e.href) ? (
                <a
                  key={e.href}
                  href={e.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                >
                  {e.label} <ExternalLink className="size-3" />
                </a>
              ) : (
                <Link
                  key={e.href}
                  href={e.href}
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  {e.label}
                </Link>
              ),
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function PortafolioPage() {
  const p = await leerPortafolio();
  const porCapa = (capa: CapaPortafolio) =>
    p.unidades.filter((u) => u.capa === capa);
  const vivas = p.unidades.filter(
    (u) => u.capa === "motor" || u.capa === "producto" || u.capa === "piloto",
  ).length;
  const congeladas = porCapa("congelado").length;

  return (
    <>
      <PageHeader
        titulo="Portafolio"
        descripcion={`El holding en una pantalla · ${p.trimestre}`}
      >
        <Badge className="label-mono">{vivas} vivas</Badge>
        <Badge variant="outline" className="label-mono">
          {congeladas} congeladas
        </Badge>
      </PageHeader>

      <main className="flex-1 space-y-8 p-4 sm:p-6">
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reglas del trimestre</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {p.reglas.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Compuertas</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {p.compuertas.map((c) => (
                  <li key={c.fecha} className="flex gap-3">
                    <span className="label-mono shrink-0 text-primary">
                      {fmtFecha(c.fecha)}
                    </span>
                    <span>{c.que}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                Plan completo:{" "}
                <Link
                  href="/ceo/vault/ceo/plan-de-guerra-2026Q4"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  plan-de-guerra-2026Q4
                </Link>{" "}
                · actualizado {fmtFecha(p.actualizadoEl)}
              </p>
            </CardContent>
          </Card>
        </section>

        {CAPAS.map((capa) => {
          const unidades = porCapa(capa.key);
          if (unidades.length === 0) return null;
          return (
            <section key={capa.key} className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                  {capa.label}
                </h2>
                <p className="text-xs text-muted-foreground">{capa.descripcion}</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {unidades.map((u) => (
                  <UnidadCard key={u.id} u={u} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
