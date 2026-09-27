import { cssColor } from "@/lib/pulse/colores";
import type { ColorPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

// Pastilla de estado "suave" (estilo Linear/Attio): fondo teñido, texto del mismo color más oscuro y un
// punto. Más legible y más sobria que el bloque saturado de Monday. `llena = false` = aún más tenue.
export function StatusPill({
  label,
  color,
  className,
  llena = true,
}: {
  label: string;
  color: ColorPulse;
  className?: string;
  llena?: boolean;
}) {
  const c = cssColor(color);
  const neutro = color === "grey" || color === "dark_grey";
  return (
    <span
      className={cn("inline-flex h-7 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium ring-1 ring-inset", className)}
      style={{
        background: `color-mix(in srgb, ${c} ${llena ? 14 : 9}%, white)`,
        color: neutro ? "#55575e" : `color-mix(in srgb, ${c} 62%, #16171a)`,
        ["--tw-ring-color" as string]: `color-mix(in srgb, ${c} ${llena ? 28 : 18}%, transparent)`,
      }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: c }} />
      <span className="truncate">{label}</span>
    </span>
  );
}
