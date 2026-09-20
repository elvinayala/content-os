import type { Frescura } from "@/lib/frescura";
import { cn } from "@/lib/utils";

// Badge de frescura de un snapshot: verde = live, ámbar = viejo, gris = mock.
export function FreshnessBadge({
  frescura,
  fuente,
  className,
}: {
  frescura: Frescura;
  fuente: string; // "Slack", "Google Calendar", "Pipedrive"...
  className?: string;
}) {
  const cfg = {
    fresco: {
      varName: "--status-working",
      label:
        frescura.horas === 0
          ? `Live · ${fuente}`
          : `Live · ${fuente} · hace ${frescura.horas} h`,
    },
    stale: {
      varName: "--status-waiting",
      label: `Stale · ${fuente} · hace ${frescura.horas} h`,
    },
    mock: { varName: "--status-idle", label: "Mock" },
  }[frescura.estado];

  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2 py-0.5",
        className,
      )}
      style={{ color: `var(${cfg.varName})` }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: `var(${cfg.varName})` }}
      />
      {cfg.label}
    </span>
  );
}
