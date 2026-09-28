"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { decidirExportacionAction } from "@/app/pulse/(app)/leads/actions";
import { Button } from "@/components/ui/button";

export function DecidirExportacion({ id }: { id: string }) {
  const [cargando, setCargando] = useState<boolean | null>(null);
  const decidir = async (aprobar: boolean) => {
    const nota = aprobar ? undefined : (prompt("¿Por qué no? (opcional, le llega por Slack)") ?? undefined);
    setCargando(aprobar);
    const r = await decidirExportacionAction({ id, aprobar, nota });
    setCargando(null);
    if (!r.ok) return toast.error(r.error ?? "Error", { className: "pulse" });
    toast.success(aprobar ? "Aprobada: le llegó el link por Slack" : "No aprobada", { className: "pulse" });
  };
  return (
    <div className="flex shrink-0 gap-1.5">
      <Button size="sm" className="h-8" onClick={() => decidir(true)} disabled={cargando !== null}>
        {cargando === true ? <Loader2 className="animate-spin" /> : <Check className="size-3.5" />} Aprobar
      </Button>
      <Button size="sm" variant="ghost" className="h-8" onClick={() => decidir(false)} disabled={cargando !== null}>
        {cargando === false ? <Loader2 className="animate-spin" /> : <X className="size-3.5" />} No
      </Button>
    </div>
  );
}
