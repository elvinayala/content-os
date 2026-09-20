import Link from "next/link";

import { UNIDADES } from "@/lib/ceo";
import { fmtFecha, formatUSD, hoyISO } from "@/lib/format";
import { leerPipeline } from "@/lib/pipedrive";
import type { LeadPipeline, UnidadNegocio } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PipelineBoard } from "@/components/ceo/pipeline-board";
import { AutoRefresh } from "@/components/ceo/auto-refresh";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Lead Pipeline · CEO Command Center" };
// Pipedrive en vivo (o mock si no hay tokens).
export const dynamic = "force-dynamic";

const ABIERTAS: string[] = ["nuevo", "contactado", "calificado", "propuesta"];
const UNIDADES_PD: UnidadNegocio[] = ["level-up", "ai-borinquen"];

function diasAtras(n: number): string {
  return hoyISO(-n);
}

// Cuenta leads cuyo creadoEl cae en un rango de días atrás [desde, hasta].
function contar(leads: LeadPipeline[], desde: string, hasta: string): number {
  return leads.filter(
    (l) => l.creadoEl && l.creadoEl >= desde && l.creadoEl <= hasta,
  ).length;
}

type Seleccion = UnidadNegocio | "todas";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const { u } = await searchParams;
  const sel: Seleccion =
    u === "level-up" || u === "ai-borinquen" ? u : "todas";

  const { leads: todosLeads, fuente, onboardings: todosOnb, errores } =
    await leerPipeline();

  // Filtro por agencia seleccionada.
  const leads =
    sel === "todas" ? todosLeads : todosLeads.filter((l) => l.unidad === sel);
  const onboardings =
    sel === "todas" ? todosOnb : todosOnb.filter((o) => o.unidad === sel);
  const unidadesVisibles: UnidadNegocio[] =
    sel === "todas" ? UNIDADES_PD : [sel];

  const tabs: { key: Seleccion; label: string }[] = [
    { key: "todas", label: "Ambas" },
    { key: "level-up", label: UNIDADES["level-up"].nombre },
    { key: "ai-borinquen", label: UNIDADES["ai-borinquen"].nombre },
  ];

  const abiertos = leads.filter((l) => ABIERTAS.includes(l.etapa));
  const cerrados = leads.filter(
    (l) => l.etapa === "cerrado" || l.etapa === "perdido",
  );
  const valorAbierto = abiertos.reduce((acc, l) => acc + l.valorMensual, 0);

  const hoy = hoyISO();
  const ayer = diasAtras(1);

  const rangos = [
    { label: "Hoy", n: (ls: LeadPipeline[]) => contar(ls, hoy, hoy) },
    { label: "Ayer", n: (ls: LeadPipeline[]) => contar(ls, ayer, ayer) },
    { label: "7 días", n: (ls: LeadPipeline[]) => contar(ls, diasAtras(7), hoy) },
    { label: "15 días", n: (ls: LeadPipeline[]) => contar(ls, diasAtras(15), hoy) },
    { label: "30 días", n: (ls: LeadPipeline[]) => contar(ls, diasAtras(30), hoy) },
  ];

  return (
    <>
      <PageHeader
        titulo="Lead Pipeline"
        descripcion="Leads de las agencias en vivo desde Pipedrive: nuevos por día, etapa y retainer."
      >
        {fuente === "pipedrive" ? (
          <Badge
            variant="outline"
            className="label-mono border-[color-mix(in_oklch,var(--status-working)_40%,transparent)] text-[var(--status-working)]"
          >
            Live · Pipedrive
          </Badge>
        ) : (
          <FreshnessBadge frescura={{ estado: "mock", horas: null }} fuente="Pipedrive" />
        )}
        <Badge className="label-mono">{formatUSD(valorAbierto)}/mes</Badge>
        {fuente === "pipedrive" ? <AutoRefresh segundos={30} /> : null}
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Selector de agencia */}
        <nav className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const activo = t.key === sel;
            const href = t.key === "todas" ? "?" : `?u=${t.key}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={
                  "label-mono rounded-md border px-3 py-1.5 transition-colors " +
                  (activo
                    ? "border-[color-mix(in_oklch,var(--status-working)_45%,transparent)] bg-[color-mix(in_oklch,var(--status-working)_15%,transparent)] text-[var(--status-working)]"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {fuente === "mock" ? (
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardContent className="p-4 text-sm text-muted-foreground">
              Mostrando datos de ejemplo. Conectá Pipedrive poniendo{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                PIPEDRIVE_LEVELUP_DOMAIN/TOKEN
              </code>{" "}
              y{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                PIPEDRIVE_AIB_DOMAIN/TOKEN
              </code>{" "}
              en el entorno.
            </CardContent>
          </Card>
        ) : null}

        {/* Contadores de leads nuevos por día, por agencia */}
        <section className="grid gap-4 lg:grid-cols-2">
          {unidadesVisibles.map((u) => {
            const deU = leads.filter((l) => l.unidad === u);
            return (
              <Card key={u} className="bg-gradient-to-b from-card to-background/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {UNIDADES[u].nombre} · leads nuevos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {rangos.map((r) => (
                      <div key={r.label}>
                        <div className="font-mono text-2xl font-semibold">
                          {r.n(deU)}
                        </div>
                        <div className="label-mono text-muted-foreground">
                          {r.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Onboardings nuevos (deals ganados) */}
        {onboardings.length > 0 ? (
          <section>
            <h2 className="label-mono mb-3 text-[var(--status-working)]">
              🎉 Onboardings nuevos
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {onboardings.slice(0, 6).map((o) => (
                <Card
                  key={o.id}
                  className="border-[color-mix(in_oklch,var(--status-working)_35%,transparent)] bg-gradient-to-b from-card to-background/60"
                >
                  <CardContent className="space-y-1.5 p-4">
                    <p className="font-semibold">{o.cliente}</p>
                    {o.negocio ? (
                      <p className="text-sm text-muted-foreground">{o.negocio}</p>
                    ) : null}
                    <p className="font-mono text-sm text-primary">
                      {formatUSD(o.valorMensual)}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="label-mono">
                        {UNIDADES[o.unidad].abrev}
                      </Badge>
                      {o.dueno ? (
                        <span className="label-mono text-muted-foreground">
                          con {o.dueno}
                        </span>
                      ) : null}
                      <span className="label-mono text-muted-foreground">
                        {fmtFecha(o.ganadoEl)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {/* Board de leads abiertos */}
        <section>
          <h2 className="label-mono mb-3 text-muted-foreground">
            En el pipeline · {abiertos.length} abiertos
          </h2>
          <PipelineBoard leads={abiertos} />
        </section>

        {/* Baúl: cerrados / perdidos */}
        {cerrados.length > 0 ? (
          <section>
            <h2 className="label-mono mb-3 text-muted-foreground">
              Baúl · cerrados y perdidos ({cerrados.length})
            </h2>
            <Card className="bg-gradient-to-b from-card to-background/60">
              <CardContent className="divide-y divide-border p-0">
                {cerrados.slice(0, 20).map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {l.nombre}
                      {l.negocio ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {l.negocio}
                        </span>
                      ) : null}
                    </span>
                    <Badge
                      variant="outline"
                      className="label-mono shrink-0"
                    >
                      {l.etapa}
                    </Badge>
                    <span className="label-mono shrink-0 text-muted-foreground">
                      {UNIDADES[l.unidad].abrev}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        ) : null}

        {errores.length > 0 ? (
          <p className="text-xs text-destructive">
            {errores.join(" · ")}
          </p>
        ) : null}
      </main>
    </>
  );
}
