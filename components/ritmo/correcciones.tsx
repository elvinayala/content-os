"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { decidirCorreccionAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";

import { diaCorto, horaPR } from "./piezas";

export interface Correccion {
  id: string;
  nombre: string;
  fecha: string;
  entradaAt: string;
  salidaAt: string | null;
  nota: string | null;
}

// Salidas olvidadas que la persona corrigió: su líder (o Carilin/admin) las confirma o rechaza.
export function Correcciones({ lista }: { lista: Correccion[] }) {
  const [hechas, setHechas] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState<string | null>(null);
  const visibles = lista.filter((c) => !hechas.has(c.id));
  if (!visibles.length) return null;

  const decidir = async (id: string, aprobar: boolean) => {
    setCargando(id);
    const r = await decidirCorreccionAction({ poncheId: id, aprobar });
    setCargando(null);
    if (!r.ok) return toast.error(r.error, { className: "ritmo" });
    setHechas((h) => new Set(h).add(id));
    toast.success(aprobar ? "Corrección aprobada" : "Corrección rechazada", { className: "ritmo" });
  };

  return (
    <section className="panel border-amber-400/30 p-4">
      <h2 className="mb-3 text-sm font-semibold">Salidas por confirmar ({visibles.length})</h2>
      <ul className="flex flex-col gap-2">
        {visibles.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm">
            <span className="font-medium">{c.nombre}</span>
            <span className="text-muted-foreground">
              {diaCorto(c.fecha)} · {horaPR(c.entradaAt)} → {horaPR(c.salidaAt)}
              {c.nota ? ` · “${c.nota}”` : ""}
            </span>
            <span className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" disabled={cargando === c.id} onClick={() => decidir(c.id, false)}>
                <X /> Rechazar
              </Button>
              <Button size="sm" disabled={cargando === c.id} onClick={() => decidir(c.id, true)}>
                {cargando === c.id ? <Loader2 className="animate-spin" /> : <Check />} Confirmar
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
