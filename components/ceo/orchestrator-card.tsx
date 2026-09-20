import type { AgenteEjecutivoUI } from "@/lib/ceo";
import { AgentStatusBadge } from "@/components/ceo/agent-status-badge";
import { StatChip } from "@/components/ceo/stat-chip";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Card grande del CEO/Orquestador (command layer), con glow cyan.
export function OrchestratorCard({
  agente,
  children,
  className,
}: {
  agente: AgenteEjecutivoUI;
  children?: React.ReactNode; // contenido extra (ej. el debrief en /ceo)
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "glow border-primary/30 bg-gradient-to-b from-card to-background/60",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <agente.icon className="size-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <AgentStatusBadge estado={agente.estado} />
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {agente.nombre} / {agente.rol}
            </h2>
            <p className="label-mono mt-0.5 text-primary">{agente.subtitulo}</p>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              {agente.descripcion}
            </p>
            {agente.fuentes && agente.fuentes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {agente.fuentes.map((f) => (
                  <span
                    key={f.label}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        f.vivo
                          ? "bg-[var(--status-working)]"
                          : "bg-muted-foreground/40",
                      )}
                    />
                    <span
                      className={
                        f.vivo ? "text-foreground/80" : "text-muted-foreground"
                      }
                    >
                      {f.label}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3">
            {agente.stats.map((s) => (
              <StatChip key={s.label} label={s.label} valor={s.valor} />
            ))}
            <StatChip
              label="Model"
              valor={agente.modelo}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
