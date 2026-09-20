import { cn } from "@/lib/utils";

// Chip mono estilo "MODEL / ROUTES / READS" de la referencia: label arriba,
// valor grande abajo, borde cyan translúcido.
export function StatChip({
  label,
  valor,
  className,
}: {
  label: string;
  valor: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-[color-mix(in_oklch,var(--neon)_25%,transparent)] bg-primary/5 px-2.5 py-1.5",
        className,
      )}
    >
      <div className="label-mono text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold text-foreground">
        {valor}
      </div>
    </div>
  );
}
