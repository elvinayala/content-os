"use client";

import { useState, useTransition } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { moverLeadAction, resincronizarLlamadasAction } from "@/app/portal/[slug]/actions";
import { Button } from "@/components/ui/button";
import { ETAPAS_LEAD, type EtapaLeadCliente } from "@/lib/portal/types";

// Piezas client chicas del portal: copiar el link, actualizar llamadas, mover un lead.

export function CopiarLink({ url, etiqueta = "Copiar link del portal" }: { url: string; etiqueta?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setOk(true);
          toast.success("Link copiado. Mándalo por WhatsApp antes de la llamada.");
          setTimeout(() => setOk(false), 1800);
        } catch {
          toast.error("No pude copiar. Selecciónalo a mano.");
        }
      }}
    >
      {ok ? <Check className="size-4" /> : <Copy className="size-4" />} {etiqueta}
    </Button>
  );
}

export function BotonActualizarLlamadas({ slug }: { slug: string }) {
  const [pendiente, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pendiente}
      onClick={() =>
        start(async () => {
          const r = await resincronizarLlamadasAction(slug);
          if (!r.ok) { toast.error(r.error); return; }
          toast.success(r.pendientes === 0 ? "Todo al día." : `${r.actualizadas} de ${r.pendientes} llamadas actualizadas.`);
        })
      }
    >
      <RefreshCw className={"size-4" + (pendiente ? " animate-spin" : "")} /> Actualizar
    </Button>
  );
}

export function MoverLead({ slug, leadId, etapa }: { slug: string; leadId: string; etapa: EtapaLeadCliente }) {
  const [pendiente, start] = useTransition();
  return (
    <select
      value={etapa}
      disabled={pendiente}
      onChange={(e) =>
        start(async () => {
          const r = await moverLeadAction(slug, leadId, e.target.value as EtapaLeadCliente);
          if (!r.ok) toast.error(r.error);
        })
      }
      aria-label="Mover de etapa"
      className="h-6 max-w-full rounded border border-border bg-background px-1 text-[11px] text-muted-foreground"
    >
      {ETAPAS_LEAD.map((e) => (
        <option key={e.etapa} value={e.etapa}>
          {e.titulo}
        </option>
      ))}
    </select>
  );
}
