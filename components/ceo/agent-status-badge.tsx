import type { EstadoAgente } from "@/lib/types";
import { cn } from "@/lib/utils";

const ESTADOS: Record<EstadoAgente, { label: string; varName: string }> = {
  working: { label: "working", varName: "--status-working" },
  waiting: { label: "waiting", varName: "--status-waiting" },
  idle: { label: "idle", varName: "--status-idle" },
};

// Badge de estado estilo "Agentic OS": dot + label mono. El dot pulsa cuando
// el agente está trabajando.
export function AgentStatusBadge({
  estado,
  className,
}: {
  estado: EstadoAgente;
  className?: string;
}) {
  const cfg = ESTADOS[estado];
  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2 py-0.5",
        className,
      )}
      style={{ color: `var(${cfg.varName})` }}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          estado === "working" && "animate-pulse",
        )}
        style={{ backgroundColor: `var(${cfg.varName})` }}
      />
      {cfg.label}
    </span>
  );
}
