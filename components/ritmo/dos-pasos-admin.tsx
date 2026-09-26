"use client";

import { Loader2, RotateCcw, ShieldCheck, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { reiniciarDosPasosAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";

// Solo Elvin: estado de la verificación en dos pasos de la vista maestra y reinicio (teléfono perdido).
export function DosPasosAdmin({ gente }: { gente: { id: string; nombre: string; activada: boolean }[] }) {
  const [cargando, setCargando] = useState<string | null>(null);
  const reiniciar = async (id: string, nombre: string) => {
    if (!confirm(`¿Reiniciar la verificación de ${nombre}? Tendrá que escanear un QR nuevo al entrar.`)) return;
    setCargando(id);
    const r = await reiniciarDosPasosAction(id);
    setCargando(null);
    if (!r.ok) return toast.error(r.error, { className: "ritmo" });
    toast.success(`Listo: ${nombre} configura de nuevo al entrar`, { className: "ritmo" });
  };
  return (
    <div className="panel p-4">
      <p className="font-medium">Verificación en dos pasos</p>
      <p className="mb-3 text-sm text-muted-foreground">Obligatoria para la vista maestra. Si alguien pierde el teléfono, reiníciala aquí.</p>
      <ul className="divide-y divide-border">
        {gente.map((g) => (
          <li key={g.id} className="flex items-center gap-3 py-2 text-sm">
            {g.activada ? <ShieldCheck className="size-4 text-primary" /> : <ShieldAlert className="size-4 text-amber-300" />}
            <span className="flex-1">{g.nombre}</span>
            <span className="text-xs text-muted-foreground">{g.activada ? "activada" : "pendiente"}</span>
            {g.activada ? (
              <Button size="sm" variant="outline" disabled={cargando === g.id} onClick={() => reiniciar(g.id, g.nombre)} className="rounded-full">
                {cargando === g.id ? <Loader2 className="animate-spin" /> : <RotateCcw />} Reiniciar
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
