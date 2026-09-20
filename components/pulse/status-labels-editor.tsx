"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useBoardActions } from "@/components/pulse/board-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLORES, cssColor } from "@/lib/pulse/colores";
import type { ColorPulse, Columna, EtiquetaStatus } from "@/lib/pulse/types";
import { nuevoId } from "@/lib/pulse/valores";

// Editor de etiquetas de una columna status/dropdown: renombrar, color, "listo", orden, eliminar.
export function StatusLabelsEditor({ column, open, onOpenChange }: { column: Columna; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { actualizarColumna } = useBoardActions();
  const [labels, setLabels] = useState<EtiquetaStatus[]>(column.settings.labels ?? []);
  useEffect(() => {
    if (open) setLabels(column.settings.labels ?? []);
  }, [open, column.settings.labels]);

  const set = (id: string, patch: Partial<EtiquetaStatus>) => setLabels((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const mover = (idx: number, delta: number) =>
    setLabels((ls) => {
      const a = [...ls];
      const j = idx + delta;
      if (j < 0 || j >= a.length) return ls;
      [a[idx], a[j]] = [a[j], a[idx]];
      return a;
    });

  const guardar = async () => {
    const limpias = labels.map((l) => ({ ...l, label: l.label.trim() || "Etiqueta" }));
    await actualizarColumna(column.id, { settings: { ...column.settings, labels: limpias } });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pulse sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Etiquetas de "{column.title}"</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[60vh] flex-col gap-1.5 overflow-auto">
          {labels.map((l, idx) => (
            <div key={l.id} className="flex items-center gap-2">
              <div className="flex flex-col text-muted-foreground">
                <button type="button" onClick={() => mover(idx, -1)} className="hover:text-foreground" title="Subir">
                  <GripVertical className="size-3.5" />
                </button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="size-7 shrink-0 rounded" style={{ background: cssColor(l.color) }} title="Color" />
                </PopoverTrigger>
                <PopoverContent className="pulse w-56 p-2" align="start">
                  <div className="flex flex-wrap gap-1.5">
                    {COLORES.map((c) => (
                      <button key={c} type="button" className="size-6 rounded-full hover:scale-110" style={{ background: cssColor(c) }} onClick={() => set(l.id, { color: c as ColorPulse })} />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <input className="h-8 min-w-0 flex-1 rounded border px-2 text-sm" value={l.label} onChange={(e) => set(l.id, { label: e.target.value })} />
              {column.type === "status" ? (
                <label className="flex items-center gap-1 text-xs text-muted-foreground" title="Cuenta como terminado">
                  <input type="checkbox" checked={!!l.esDone} onChange={(e) => set(l.id, { esDone: e.target.checked })} /> listo
                </label>
              ) : null}
              <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => setLabels((ls) => ls.filter((x) => x.id !== l.id))} title="Eliminar etiqueta">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="mt-1 flex h-8 items-center justify-center gap-1 rounded border border-dashed text-xs hover:bg-muted"
            onClick={() => setLabels((ls) => [...ls, { id: nuevoId(), label: "", color: COLORES[ls.length % COLORES.length] }])}
          >
            <Plus className="size-3.5" /> Agregar etiqueta
          </button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
