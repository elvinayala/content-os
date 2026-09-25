"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { useBoard, useBoardActions } from "@/components/pulse/board-provider";
import { StatusPill } from "@/components/pulse/status-pill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { etiquetaElegible } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

// Una automatización exige llenar un campo antes del cambio (p. ej. la Razón de Baja antes de
// pasar a OFFBOARDED). Pide el valor para todos los elementos afectados y reintenta el cambio.
export function RequisitoDialog({
  requisito,
  onCerrar,
}: {
  requisito: { columnId: string; itemIds: string[]; mensaje: string; reintentar: () => Promise<unknown> };
  onCerrar: () => void;
}) {
  const s = useBoard();
  const { setValor } = useBoardActions();
  const col = s.columns.find((c) => c.id === requisito.columnId);
  const [valor, setValorLocal] = useState<string>("");
  const [guardando, setGuardando] = useState(false);
  if (!col) return null;
  const conEtiquetas = col.type === "status" || col.type === "dropdown";
  const nombres = requisito.itemIds.map((id) => s.items[id]?.name).filter(Boolean);

  const confirmar = async () => {
    if (!valor.trim()) return;
    setGuardando(true);
    for (const id of requisito.itemIds) {
      const ok = await setValor(id, col, col.type === "dropdown" ? [valor] : valor);
      if (!ok) {
        setGuardando(false);
        return;
      }
    }
    onCerrar();
    await requisito.reintentar();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !guardando && onCerrar()}>
      <DialogContent className="pulse sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-primary" /> Falta «{col.title}»
          </DialogTitle>
          <DialogDescription>
            {requisito.mensaje} {nombres.length ? <b className="text-foreground">{nombres.length === 1 ? nombres[0] : `${nombres.length} elementos`}</b> : null}
          </DialogDescription>
        </DialogHeader>
        {conEtiquetas ? (
          <div className="grid grid-cols-2 gap-1.5">
            {(col.settings.labels ?? [])
              .filter((l) => etiquetaElegible(l) && l.label.trim())
              .map((l) => (
                <button key={l.id} type="button" onClick={() => setValorLocal(l.id)} className={cn("rounded ring-offset-background transition", valor === l.id && "ring-2 ring-foreground ring-offset-2")}>
                  <StatusPill label={l.label} color={l.color} className="w-full" />
                </button>
              ))}
          </div>
        ) : (
          <input autoFocus value={valor} onChange={(e) => setValorLocal(e.target.value)} type={col.type === "date" ? "date" : "text"} className="h-9 rounded-md border px-3 text-sm" />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={!valor.trim() || guardando}>
            {guardando ? <Loader2 className="animate-spin" /> : null} Guardar y continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
