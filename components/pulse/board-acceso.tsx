"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { guardarAccesoBoardAction } from "@/app/pulse/(app)/[board]/actions";
import { useBoard, useBoardActions } from "@/components/pulse/board-provider";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NOMBRE_ROL } from "@/lib/pulse/types";

// Quién ve el tablero (solo admins). Privado = admins + los marcados.
export function BoardAcceso({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { board, usuarios } = useBoard();
  const { dispatch } = useBoardActions();
  const router = useRouter();
  const [privado, setPrivado] = useState(board.privado);
  const [miembros, setMiembros] = useState<Set<string>>(new Set(board.miembros ?? []));
  const [guardando, setGuardando] = useState(false);
  const noAdmins = usuarios.filter((u) => u.rol !== "admin" && u.activo);

  const guardar = async () => {
    setGuardando(true);
    const lista = [...miembros];
    const r = await guardarAccesoBoardAction({ boardId: board.id, privado, miembros: lista });
    setGuardando(false);
    if (!r.ok) return toast.error(r.error, { className: "pulse" });
    dispatch({ type: "board:actualizar", patch: { privado, miembros: lista } });
    toast.success(privado ? `Tablero privado · ${lista.length} con acceso` : "Tablero visible para todo el equipo", { className: "pulse" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pulse max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-4" /> Acceso a «{board.nombre}»
          </DialogTitle>
          <DialogDescription>Los admins siempre ven todos los tableros. Un tablero privado solo lo ven, además, las personas que marques acá.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <Label htmlFor="privado" className="flex flex-col gap-0.5">
            <span>Tablero privado</span>
            <span className="text-xs font-normal text-muted-foreground">{privado ? "Solo admins y las personas marcadas" : "Lo ve todo el equipo"}</span>
          </Label>
          <Switch id="privado" checked={privado} onCheckedChange={setPrivado} />
        </div>
        {privado ? (
          <div className="flex max-h-72 flex-col gap-1 overflow-auto rounded-lg border p-2">
            {noAdmins.length === 0 ? <p className="p-2 text-sm text-muted-foreground">No hay más usuarios activos.</p> : null}
            {noAdmins.map((u) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted">
                <Checkbox
                  checked={miembros.has(u.id)}
                  onCheckedChange={(v) => {
                    const n = new Set(miembros);
                    if (v) n.add(u.id);
                    else n.delete(u.id);
                    setMiembros(n);
                  }}
                />
                <UserAvatar nombre={u.nombre} color={u.color} className="size-6 text-[10px]" />
                <span className="min-w-0 flex-1 truncate text-sm">{u.nombre}</span>
                <span className="text-xs text-muted-foreground">{NOMBRE_ROL[u.rol]}</span>
              </label>
            ))}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
