"use client";

import { ArchiveRestore, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { restaurarLoteAction } from "@/app/pulse/(app)/papelera/actions";
import { Button } from "@/components/ui/button";

export function BotonRestaurar({ lote, resumen }: { lote: string; resumen: string }) {
  const [cargando, setCargando] = useState(false);
  const restaurar = async () => {
    if (!confirm(`¿Restaurar ${resumen}? Vuelve todo lo que se borró junto, con sus archivos. No pisa nada que exista.`)) return;
    setCargando(true);
    const r = await restaurarLoteAction(lote);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, { className: "pulse" });
    toast.success(`Restaurado: ${r.restauradas} registro${r.restauradas === 1 ? "" : "s"}${r.archivos ? ` y ${r.archivos} archivo${r.archivos === 1 ? "" : "s"}` : ""}${r.fallidas ? ` (${r.fallidas} no se pudieron: ya existen o falta su tablero)` : ""}`, { className: "pulse" });
  };
  return (
    <Button size="sm" variant="outline" onClick={restaurar} disabled={cargando} className="h-8">
      {cargando ? <Loader2 className="animate-spin" /> : <ArchiveRestore />} Restaurar
    </Button>
  );
}
