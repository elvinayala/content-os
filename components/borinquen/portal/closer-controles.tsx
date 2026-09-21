"use client";

import { useState, useTransition } from "react";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";

import { cambiarPortalAction, crearPortalDesdeDemoAction, importarHistorialAction } from "@/app/borinquen/portales/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PortalAutoFlow } from "@/lib/portal/types";

// Controles del closer/CEO en /borinquen/portales: crear el portal de un demo y cambiar modo,
// estado y agente de producción.

export function CrearPortalBoton({ slug }: { slug: string }) {
  const [pendiente, start] = useTransition();
  return (
    <Button
      size="sm"
      disabled={pendiente}
      onClick={() =>
        start(async () => {
          const r = await crearPortalDesdeDemoAction(slug);
          if (!r.ok) { toast.error(r.error); return; }
          toast.success(r.agentePreparado === false ? "Portal creado. El agente de Retell no se pudo preparar (revisa RETELL_WEBHOOK_SECRET)." : "Portal creado.");
        })
      }
    >
      <Plus className="size-4" /> {pendiente ? "Creando…" : "Crear portal"}
    </Button>
  );
}

export function PanelPortal({ portal }: { portal: PortalAutoFlow }) {
  const [pendiente, start] = useTransition();
  const [agente, setAgente] = useState(portal.agentIdVoz ?? "");

  const cambiar = (patch: Parameters<typeof cambiarPortalAction>[1], okMsg: string) =>
    start(async () => {
      const r = await cambiarPortalAction(portal.slug, patch);
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(okMsg);
    });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-3 text-sm">
      <span className="label-mono text-muted-foreground">Closer</span>
      <Button
        size="sm"
        variant="outline"
        disabled={pendiente}
        onClick={() => cambiar({ modo: portal.modo === "demo" ? "produccion" : "demo" }, portal.modo === "demo" ? "Portal en producción: se ocultan los ejemplos." : "Portal en modo demo.")}
      >
        {portal.modo === "demo" ? "Pasar a producción" : "Volver a demo"}
      </Button>
      <Button size="sm" variant="outline" disabled={pendiente} onClick={() => cambiar({ activo: !portal.activo }, portal.activo ? "Portal desactivado." : "Portal activo.")}>
        {portal.activo ? "Desactivar" : "Activar"}
      </Button>
      <span className="flex items-center gap-1.5">
        <Input value={agente} onChange={(e) => setAgente(e.target.value)} placeholder="agent_… (Retell)" className="h-8 w-64 font-mono text-xs" />
        <Button size="sm" variant="outline" disabled={pendiente || agente === (portal.agentIdVoz ?? "")} onClick={() => cambiar({ agentIdVoz: agente.trim() || null }, "Agente de voz actualizado y preparado.")}>
          Guardar agente
        </Button>
      </span>
      <Button
        size="sm"
        variant="ghost"
        disabled={pendiente || !portal.agentIdVoz}
        onClick={() =>
          start(async () => {
            const r = await importarHistorialAction(portal.slug);
            if (!r.ok) { toast.error(r.error); return; }
            toast.success(`${r.guardadas} de ${r.total} llamadas importadas de Retell.`);
          })
        }
      >
        <Download className="size-4" /> Importar historial
      </Button>
    </div>
  );
}
