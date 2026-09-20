import { colorPorTexto, cssColor, TEXTO_OSCURO } from "@/lib/pulse/colores";
import type { ColorPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function UserAvatar({
  nombre,
  color,
  className,
  title,
}: {
  nombre: string;
  color?: ColorPulse | null;
  className?: string;
  title?: string;
}) {
  const c = color ?? colorPorTexto(nombre);
  return (
    <span
      title={title ?? nombre}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-background",
        TEXTO_OSCURO.has(c) ? "text-[#323338]" : "text-white",
        className,
      )}
      style={{ background: cssColor(c) }}
    >
      {iniciales(nombre)}
    </span>
  );
}
