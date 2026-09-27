import { createElement } from "react";
import { BookOpenCheck, Building2, Cake, FlaskConical, IdCard, Inbox, Landmark, LayoutGrid, LineChart, Target, type LucideIcon } from "lucide-react";

import { cssColor } from "@/lib/pulse/colores";
import type { ColorPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

// Ícono por tipo de tablero (por su nombre): se reconoce de un vistazo, como en Notion/Linear.
export function iconoDeTablero(nombre: string): LucideIcon {
  const n = nombre.toLowerCase();
  if (/sop/.test(n)) return BookOpenCheck;
  if (/cumple/.test(n)) return Cake;
  if (/m[eé]trica/.test(n)) return LineChart;
  if (/tesor|cobro|pago|finanz/.test(n)) return Landmark;
  if (/solicitud/.test(n)) return Inbox;
  if (/\bhr\b|recursos humanos|rr\.?hh/.test(n)) return IdCard;
  if (/estrateg/.test(n)) return Target;
  if (/demo|prueba/.test(n)) return FlaskConical;
  if (/level up|borinquen|cliente/.test(n)) return Building2;
  return LayoutGrid;
}

export function IconoTablero({ nombre, color, className, tam = "sm" }: { nombre: string; color: ColorPulse | null; className?: string; tam?: "sm" | "md" }) {
  const c = cssColor(color ?? "grey");
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-md ring-1 ring-inset", tam === "md" ? "size-8 rounded-lg" : "size-5", className)}
      style={{ background: `color-mix(in srgb, ${c} 13%, white)`, color: `color-mix(in srgb, ${c} 70%, #16171a)`, ["--tw-ring-color" as string]: `color-mix(in srgb, ${c} 22%, transparent)` }}
    >
      {createElement(iconoDeTablero(nombre), { className: tam === "md" ? "size-4" : "size-3", strokeWidth: 2.2 })}
    </span>
  );
}
