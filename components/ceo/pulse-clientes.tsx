import { ExternalLink } from "lucide-react";

import { UNIDADES, unidadInfo } from "@/lib/ceo";
import { frescura, type Frescura } from "@/lib/ops";
import type { OpsUnidad, UnidadOps } from "@/lib/types";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Widget "Pulso de clientes": wins y situaciones críticas por unidad,
// detectados por /brief-ceo en Slack.
export function PulseClientes({
  unidades,
}: {
  unidades: { unidad: UnidadOps; ops: OpsUnidad | null; conectado: boolean }[];
}) {
  return (
    <section>
      <h2 className="label-mono mb-3 text-muted-foreground">
        Pulso de clientes
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {unidades.map(({ unidad, ops, conectado }) => {
          const f: Frescura = frescura(ops?.actualizadoEl);
          return (
            <Card
              key={unidad}
              className="bg-gradient-to-b from-card to-background/60"
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {unidadInfo(unidad).nombre}
                  </CardTitle>
                  {conectado ? (
                    <FreshnessBadge frescura={f} fuente="Slack" />
                  ) : (
                    <span className="label-mono text-muted-foreground">
                      Sin conexión · Standby
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!conectado ? (
                  <p className="text-sm text-muted-foreground">
                    Se activa al conectar el Slack de{" "}
                    {unidadInfo(unidad).nombre}.
                  </p>
                ) : !ops ? (
                  <p className="text-sm text-muted-foreground">
                    Sin snapshot todavía — corré{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                      /brief-ceo
                    </code>{" "}
                    para llenar este widget.
                  </p>
                ) : (
                  <>
                    <div>
                      <h4 className="label-mono mb-1.5 text-muted-foreground">
                        Wins · {ops.wins.length}
                      </h4>
                      {ops.wins.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Sin wins en las últimas {ops.ventanaHoras} h.
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {ops.wins.map((w) => (
                            <li key={w.id} className="flex items-start gap-2.5">
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--status-working)]" />
                              <div className="min-w-0 text-sm">
                                <span className="font-medium">{w.cliente}</span>{" "}
                                — {w.resumen}
                                <span className="ml-1.5 inline-flex items-center gap-1.5">
                                  {w.estratega ? (
                                    <span className="label-mono text-muted-foreground">
                                      {w.estratega}
                                    </span>
                                  ) : null}
                                  {w.permalink ? (
                                    <a
                                      href={w.permalink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                                    >
                                      Slack <ExternalLink className="size-3" />
                                    </a>
                                  ) : null}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h4 className="label-mono mb-1.5 text-muted-foreground">
                        Críticos · {ops.criticos.length}
                      </h4>
                      {ops.criticos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Ningún cliente en riesgo detectado. Respirá.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {ops.criticos.map((c) => (
                            <li key={c.id} className="flex items-start gap-2.5">
                              <span
                                className="mt-1.5 size-1.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    c.severidad === "alta"
                                      ? "var(--destructive)"
                                      : "var(--status-waiting)",
                                }}
                              />
                              <div className="min-w-0 text-sm">
                                <div>
                                  <span className="font-medium">
                                    {c.cliente}
                                  </span>{" "}
                                  — {c.resumen}
                                  {c.permalink ? (
                                    <a
                                      href={c.permalink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                                    >
                                      Slack <ExternalLink className="size-3" />
                                    </a>
                                  ) : null}
                                </div>
                                {c.accionSugerida ? (
                                  <p className="mt-0.5 text-xs italic text-muted-foreground">
                                    → {c.accionSugerida}
                                  </p>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
