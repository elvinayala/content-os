"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { eliminarBoardAction } from "@/app/pulse/(app)/[board]/actions";
import { useBoard, useBoardActions } from "@/components/pulse/board-provider";
import { ColorPicker } from "@/components/pulse/color-picker";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cssColor } from "@/lib/pulse/colores";
import type { UsuarioPulse } from "@/lib/pulse/types";

export function BoardHeader({ usuario }: { usuario: UsuarioPulse }) {
  const { board, items } = useBoard();
  const { dispatch } = useBoardActions();
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(board.nombre);
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => setNombre(board.nombre), [board.nombre]);

  const guardar = async () => {
    setEditando(false);
    const n = nombre.trim();
    if (!n || n === board.nombre) return setNombre(board.nombre);
    const { actualizarBoardAction } = await import("@/app/pulse/(app)/[board]/actions");
    const r = await actualizarBoardAction({ boardId: board.id, patch: { nombre: n } });
    if (r.ok) dispatch({ type: "reemplazar", data: { board: { ...board, nombre: n }, columns: [], groups: [], items: [], usuarios: [], archivos: [] } });
    router.refresh();
  };

  return (
    <header className="vidrio relative flex h-14 shrink-0 items-center gap-3 border-b px-4" style={{ boxShadow: `inset 0 3px 0 ${cssColor(board.color)}` }}>
      <SidebarTrigger />
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="size-4 rounded" style={{ background: cssColor(board.color) }} title="Color del tablero" />
        </PopoverTrigger>
        <PopoverContent className="pulse w-56 p-2" align="start">
          <ColorPicker
            value={board.color ?? "grey"}
            onChange={async (c) => {
              const { actualizarBoardAction } = await import("@/app/pulse/(app)/[board]/actions");
              await actualizarBoardAction({ boardId: board.id, patch: { color: c } });
              router.refresh();
            }}
          />
        </PopoverContent>
      </Popover>
      {editando ? (
        <input autoFocus className="h-8 rounded border px-2 text-lg font-semibold outline-none ring-2 ring-primary" value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={guardar} onKeyDown={(e) => e.key === "Enter" && guardar()} />
      ) : (
        <h1 className="text-lg font-semibold" onDoubleClick={() => setEditando(true)} title="Doble click para renombrar">
          {board.nombre}
        </h1>
      )}
      <span className="flex items-center gap-2 rounded-full border bg-background/70 px-2.5 py-0.5 text-xs text-muted-foreground">
        <span className="punto-vivo" /> {Object.keys(items).length.toLocaleString("en-US")} elementos
      </span>
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded p-1.5 text-muted-foreground hover:bg-accent" aria-label="Opciones del tablero">
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="pulse" align="end">
            <DropdownMenuItem onClick={() => setEditando(true)}>Renombrar tablero</DropdownMenuItem>
            {usuario.rol === "admin" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmar(true)}>
                  <Trash2 /> Eliminar tablero
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent className="pulse">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el tablero "{board.nombre}"?</AlertDialogTitle>
            <AlertDialogDescription>Se borran todos sus elementos, columnas, grupos y archivos. No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                const r = await eliminarBoardAction({ boardId: board.id });
                if (r.ok) router.push("/pulse");
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
