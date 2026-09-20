import { cssColor, TEXTO_OSCURO } from "@/lib/pulse/colores";
import type { ColorPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

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
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-0 items-center justify-center rounded px-2 text-xs font-medium",
        llena && "pill-brillo",
        llena ? (TEXTO_OSCURO.has(color) ? "text-[#323338]" : "text-white") : "text-foreground",
        className,
      )}
      style={llena ? { background: cssColor(color) } : { background: `color-mix(in srgb, ${cssColor(color)} 22%, transparent)` }}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
