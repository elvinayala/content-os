import Link from "next/link";

import { especialistas, orquestador, type AgenteEjecutivoUI } from "@/lib/ceo";
import { estadoRealAgentes } from "@/lib/agentes-estado";
import { equipo, head } from "@/lib/equipo";
import { AgentCard } from "@/components/ceo/agent-card";
import { OrchestratorCard } from "@/components/ceo/orchestrator-card";
import { AutoRefresh } from "@/components/ceo/auto-refresh";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Agents · CEO Command Center" };
// Estado de los agentes derivado de las fuentes reales conectadas.
export const dynamic = "force-dynamic";

// Tira compacta del squad de contenido (Sofi + pipeline) bajo el CMO.
function ContentSquad() {
  const squad = [head, ...equipo];
  return (
    <div className="rounded-md border border-border bg-background/50 p-2.5">
      <div className="label-mono mb-1.5 text-muted-foreground">
        Content squad
      </div>
      <div className="flex flex-wrap gap-1.5">
        {squad.map((m) => (
          <Link
            key={m.id}
            href="/equipo"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs hover:border-primary/40"
            title={m.rol}
          >
            <m.icon className="size-3 text-primary" />
            {m.nombre}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Mezcla el estado real (estado/tareaActual/stats/fuentes) sobre el roster base.
function conEstadoReal(
  base: AgenteEjecutivoUI,
  real: ReturnType<typeof estadoRealAgentes> extends Promise<infer R> ? R : never,
): AgenteEjecutivoUI {
  const r = real[base.id];
  if (!r) return base;
  return {
    ...base,
    estado: r.estado,
    tareaActual: r.tareaActual,
    stats: r.stats,
    fuentes: r.fuentes,
  };
}

export default async function AgentsPage() {
  const real = await estadoRealAgentes();
  const orq = conEstadoReal(orquestador, real);
  const specs = especialistas.map((a) => conEstadoReal(a, real));

  return (
    <>
      <PageHeader
        titulo="Agent Network"
        descripcion="Estado real de cada agente según las fuentes conectadas."
      >
        <AutoRefresh segundos={60} />
      </PageHeader>

      <main className="flex-1 space-y-0 p-4 sm:p-6">
        <section className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl">
            <OrchestratorCard agente={orq} />
          </div>

          {/* Conectores del organigrama (solo desktop) */}
          <div className="hidden xl:block" aria-hidden>
            <div className="mx-auto h-6 w-px bg-[color-mix(in_oklch,var(--neon)_40%,transparent)]" />
            <div className="mx-[10%] h-px bg-[color-mix(in_oklch,var(--neon)_40%,transparent)]" />
            <div className="grid grid-cols-5">
              {specs.map((a) => (
                <div
                  key={a.id}
                  className="mx-auto h-6 w-px bg-[color-mix(in_oklch,var(--neon)_40%,transparent)]"
                />
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:mt-0 xl:grid-cols-5">
            {specs.map((agente) => (
              <AgentCard key={agente.id} agente={agente}>
                {agente.id === "cmo" ? <ContentSquad /> : null}
              </AgentCard>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
