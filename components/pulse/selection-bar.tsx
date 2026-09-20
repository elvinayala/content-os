"use client";

import { FolderInput, Trash2, X } from "lucide-react";
import { useState } from "react";

import { useBoard, useBoardActions } from "@/components/pulse/board-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cssColor } from "@/lib/pulse/colores";

// Barra flotante al pie cuando hay elementos seleccionados.
export function SelectionBar() {
  const { seleccion, groups } = useBoard();
  const { dispatch, moverItems, eliminarItems } = useBoardActions();
  const [confirmar, setConfirmar] = useState(false);
  if (seleccion.size === 0) return null;
  const ids = [...seleccion];
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-lg">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">{ids.length}</span>
        <span className="text-sm">seleccionado{ids.length === 1 ? "" : "s"}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-muted">
              <FolderInput className="size-4" /> Mover a
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="pulse" align="center">
            {groups.map((g) => (
              <DropdownMenuItem key={g.id} onClick={() => moverItems(ids, g.id)}>
                <span className="size-2.5 rounded-full" style={{ background: cssColor(g.color) }} />
                {g.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button type="button" className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-destructive hover:bg-destructive/10" onClick={() => setConfirmar(true)}>
          <Trash2 className="size-4" /> Eliminar
        </button>
        <button type="button" className="rounded-md p-1 text-muted-foreground hover:bg-muted" onClick={() => dispatch({ type: "seleccion:limpiar" })} aria-label="Cancelar selección">
          <X className="size-4" />
        </button>
      </div>
      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent className="pulse">
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {ids.length} elemento{ids.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>Se borran con su actividad y archivos. No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => eliminarItems(ids)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
