"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

const URL = "https://dashboard-ea-market.netlify.app";

// Bloque discreto y colapsable con el "Dashboard de Ventas Unificado" externo
// (Netlify) embebido. Cerrado por defecto; el iframe recién se monta al abrir.
export function DashboardEmbed() {
  const [abierto, setAbierto] = useState(false);

  return (
    <section className="border-t border-border/60 pt-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform",
              abierto && "rotate-90",
            )}
          />
          Dashboard de Ventas Unificado (externo)
        </button>
        <a
          href={URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          <ExternalLink className="size-3" />
          abrir
        </a>
      </div>

      {abierto ? (
        <div className="mt-3 space-y-2">
          <div className="overflow-hidden rounded-lg border border-border">
            <iframe
              src={URL}
              title="Dashboard de Ventas Unificado"
              className="h-[720px] w-full bg-background"
              loading="lazy"
            />
          </div>
          <p className="text-xs text-muted-foreground/70">
            Si el recuadro queda en blanco (por login o restricciones del sitio),
            usá{" "}
            <a
              href={URL}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              abrir en pestaña
            </a>
            .
          </p>
        </div>
      ) : null}
    </section>
  );
}
