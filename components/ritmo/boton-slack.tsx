"use client";

import { MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EspacioSlack {
  nombre: string; // "Slack" o "Slack AIB"
  equipo: string; // T07V7MUDA9H
  web: string; // https://levelupmediaespacio.slack.com
}

// Puente Ritmo → Slack (Elvin, 28/sep): abre la app de Slack en el espacio de su empresa; si no la tiene instalada,
// a los 1.5 s abre Slack en el navegador.
export function abrirSlack(e: EspacioSlack) {
  let salio = false;
  const marcar = () => {
    salio = true;
  };
  window.addEventListener("blur", marcar, { once: true });
  window.location.href = `slack://open?team=${e.equipo}`;
  setTimeout(() => {
    window.removeEventListener("blur", marcar);
    if (!salio && document.visibilityState === "visible") window.open(`https://app.slack.com/client/${e.equipo}`, "_blank", "noopener");
  }, 1500);
}

export function BotonSlack({ espacios, className }: { espacios: EspacioSlack[]; className?: string }) {
  if (!espacios.length) return null;
  return (
    <span className={cn("hidden items-center gap-1 sm:flex", className)}>
      {espacios.map((e) => (
        <button
          key={e.equipo}
          type="button"
          onClick={() => abrirSlack(e)}
          title={`Abrir ${e.nombre}`}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <MessageSquare className="size-3.5" /> {e.nombre}
        </button>
      ))}
    </span>
  );
}
