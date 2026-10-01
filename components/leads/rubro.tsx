"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cambiarRubroAction, crearRubroAction } from "@/app/pulse/(app)/leads/actions";

const CREAR = "__crear";

/** Rubro del negocio del lead: etiqueta del catálogo; la dirección puede crear la que falte. */
export function RubroLead({ tratoId, actual, rubros, puedeCrear }: { tratoId: string; actual: string | null; rubros: string[]; puedeCrear: boolean }) {
  const router = useRouter();
  const [valor, setValor] = useState(actual ?? "");
  const [pend, start] = useTransition();
  // Un nicho viejo en texto libre (de antes del catálogo) se enseña tal cual hasta que lo cambien.
  const viejo = actual && !rubros.includes(actual) ? actual : null;

  const poner = (rubro: string | null) =>
    start(async () => {
      const antes = valor;
      setValor(rubro ?? "");
      const r = await cambiarRubroAction(tratoId, rubro);
      if (!r.ok) {
        setValor(antes);
        return void toast.error(r.error ?? "No se pudo guardar");
      }
      toast.success(rubro ? `Rubro: ${rubro}` : "Rubro quitado");
      router.refresh();
    });

  const crear = () =>
    start(async () => {
      const nombre = window.prompt("Nombre de la etiqueta nueva (ej. Restaurantes)")?.trim();
      if (!nombre) return;
      const r = await crearRubroAction(nombre);
      if (!r.ok || !r.nombre) return void toast.error(r.error ?? "No se pudo crear");
      const p = await cambiarRubroAction(tratoId, r.nombre);
      if (!p.ok) return void toast.error(p.error ?? "Se creó la etiqueta pero no se pudo poner");
      setValor(r.nombre);
      toast.success(`Etiqueta nueva: ${r.nombre}`);
      router.refresh();
    });

  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      Rubro del negocio
      <select
        className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
        value={valor}
        disabled={pend}
        onChange={(e) => {
          const v = e.target.value;
          if (v === CREAR) return crear();
          poner(v || null);
        }}
      >
        <option value="">Sin rubro</option>
        {viejo ? <option value={viejo}>{viejo} (sin etiqueta)</option> : null}
        {rubros.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
        {puedeCrear ? <option value={CREAR}>＋ Crear etiqueta…</option> : null}
      </select>
    </label>
  );
}
