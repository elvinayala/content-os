import Link from "next/link";
import { Check, Circle, MessageCircle, Phone } from "lucide-react";

import { leerInstancias } from "@/lib/autoflow";
import { leerAgentesVoz } from "@/lib/voz/store";
import type { EstadoInstancia } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "AutoFlow · Bori" };
export const dynamic = "force-dynamic";

const ESTADO: Record<EstadoInstancia, { dot: string; label: string }> = {
  activo: { dot: "var(--status-working)", label: "Activo" },
  onboarding: { dot: "var(--status-waiting)", label: "Onboarding" },
  pausado: { dot: "var(--status-idle)", label: "Pausado" },
};

export default async function AutoFlowPage() {
  const [instancias, agentes] = await Promise.all([
    leerInstancias(),
    leerAgentesVoz(),
  ]);
  const nombreAgente = (id: string) =>
    agentes.find((a) => a.id === id)?.nombre ?? id;

  return (
    <>
      <PageHeader
        titulo="AutoFlow"
        descripcion="El producto DFY de cada cliente: chat + voz + CRM en un lugar."
      >
        <Badge variant="outline" className="label-mono">
          {instancias.length} instancias
        </Badge>
      </PageHeader>

      <main className="flex-1 space-y-4 p-4 sm:p-6">
        {instancias.map((inst) => {
          const est = ESTADO[inst.estado];
          const hechos = inst.pasosOnboarding.filter((p) => p.hecho).length;
          return (
            <Card
              key={inst.id}
              className="bg-gradient-to-b from-card to-background/40"
            >
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{inst.cliente}</h3>
                      <Badge variant="outline" className="label-mono">
                        <span
                          className="mr-1 size-1.5 rounded-full"
                          style={{ backgroundColor: est.dot }}
                        />
                        {est.label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {inst.negocio ?? "—"} · CRM {inst.crm} ·{" "}
                      {inst.numero ?? "sin número"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-semibold text-primary">
                      {inst.tier}
                    </p>
                    <p className="label-mono text-muted-foreground">/ implementación</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                  {/* Canales + agentes */}
                  <div className="space-y-3">
                    <div>
                      <p className="label-mono mb-1.5 text-muted-foreground">
                        Canales
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {inst.canales.map((c) => (
                          <Badge key={c} variant="outline" className="capitalize">
                            {c === "whatsapp" ? (
                              <MessageCircle className="mr-1 size-3" />
                            ) : (
                              <Phone className="mr-1 size-3" />
                            )}
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="label-mono mb-1.5 text-muted-foreground">
                        Agentes de voz
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {inst.agentesVoz.map((id) => (
                          <Link key={id} href={`/borinquen/voz/${id}`}>
                            <Badge
                              variant="outline"
                              className="hover:border-primary/60"
                            >
                              {nombreAgente(id)}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pipeline de implementación */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="label-mono text-muted-foreground">
                        Implementación
                      </p>
                      <span className="label-mono text-muted-foreground">
                        {hechos}/{inst.pasosOnboarding.length}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {inst.pasosOnboarding.map((p) => (
                        <li
                          key={p.paso}
                          className="flex items-center gap-2 text-sm"
                        >
                          {p.hecho ? (
                            <Check className="size-4 text-[var(--status-working)]" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground" />
                          )}
                          <span
                            className={
                              p.hecho ? "" : "text-muted-foreground"
                            }
                          >
                            {p.paso}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </main>
    </>
  );
}
