import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

// Estado vacío compartido (skill pulido-ux, 24/oct/2026): ícono sobrio + por qué está vacío + qué hacer.
// Usa solo tokens del tema (muted-foreground, border), así hereda el look de Pulse, Ritmo, la app de LU o Bori.
// `tipo` cambia el tono: "inicio" (primera vez, invita a empezar) · "filtro" (sin resultados) · "error" · "permiso".
export function EstadoVacio({
  icono: Icono,
  titulo,
  children,
  accion,
  tipo = "inicio",
  compacto = false,
  className,
}: {
  icono?: LucideIcon;
  titulo: string;
  children?: React.ReactNode;
  accion?: React.ReactNode;
  tipo?: "inicio" | "filtro" | "error" | "permiso";
  compacto?: boolean;
  className?: string;
}) {
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={cn(
        "entra-suave flex flex-col items-center justify-center text-center",
        compacto ? "gap-1.5 px-4 py-6" : "gap-2 px-6 py-12",
        className,
      )}
    >
      {Icono ? (
        <span
          className={cn(
            "mb-1 flex items-center justify-center rounded-full border border-border",
            compacto ? "size-9" : "size-11",
            tipo === "error" ? "text-destructive" : "text-muted-foreground",
          )}
          aria-hidden
        >
          <Icono className={compacto ? "size-4" : "size-5"} />
        </span>
      ) : null}
      <p className={cn("font-medium text-foreground", compacto ? "text-sm" : "text-[15px]")}>{titulo}</p>
      {children ? <div className="max-w-sm text-sm leading-relaxed text-muted-foreground">{children}</div> : null}
      {accion ? <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{accion}</div> : null}
    </div>
  );
}
