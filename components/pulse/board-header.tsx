"use client";

import { Lock, MoreHorizontal, Trash2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { eliminarBoardAction } from "@/app/pulse/(app)/[board]/actions";
import { useBoard, useBoardActions } from "@/components/pulse/board-provider";
import { BoardAcceso } from "@/components/pulse/board-acceso";
import { BoardAutomatizaciones } from "@/components/pulse/board-automatizaciones";
import { IconoTablero } from "@/components/pulse/icono-tablero";
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
import type { UsuarioPulse } from "@/lib/pulse/types";

export function BoardHeader({ usuario }: { usuario: UsuarioPulse }) {
  const { board, items } = useBoard();
  const { dispatch } = useBoardActions();
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(board.nombre);
  const [confirmar, setConfirmar] = useState(false);
  const [escrito, setEscrito] = useState("");
  const [acceso, setAcceso] = useState(false);
  const [automatizaciones, setAutomatizaciones] = useState(false);
  useEffect(() => setNombre(board.nombre), [board.nombre]);

  const guardar = async () => {
    setEditando(false);
    const n = nombre.trim();
    if (!n || n === board.nombre) return setNombre(board.nombre);
    const { actualizarBoardAction } = await import("@/app/pulse/(app)/[board]/actions");
    const r = await actualizarBoardAction({ boardId: board.id, patch: { nombre: n } });
    if (r.ok) dispatch({ type: "board:actualizar", patch: { nombre: n } });
    else setNombre(board.nombre);
    router.refresh();
  };

  return (
    <header className="vidrio relative flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <SidebarTrigger />
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="cursor-pointer rounded-lg transition hover:scale-105" title="Color del tablero">
            <IconoTablero nombre={board.nombre} color={board.color ?? "grey"} tam="md" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="pulse w-56 p-2" align="start">
          <ColorPicker
            value={board.color ?? "grey"}
            onChange={async (c) => {
              const { actualizarBoardAction } = await import("@/app/pulse/(app)/[board]/actions");
              const r = await actualizarBoardAction({ boardId: board.id, patch: { color: c } });
              if (r.ok) dispatch({ type: "board:actualizar", patch: { color: c } });
              router.refresh();
            }}
          />
        </PopoverContent>
      </Popover>
      {editando ? (
        <input autoFocus className="h-8 rounded border px-2 text-lg font-semibold outline-none ring-2 ring-primary" value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={guardar} onKeyDown={(e) => e.key === "Enter" && guardar()} />
      ) : (
        <h1 className="flex min-w-0 items-center gap-2 truncate text-base font-semibold sm:text-lg" onDoubleClick={() => setEditando(true)} title="Doble click para renombrar">
          {board.nombre}
          {board.privado ? <Lock className="size-3.5 text-muted-foreground" aria-label="Tablero privado" /> : null}
        </h1>
      )}
      <span className="hidden items-center gap-2 rounded-full border bg-background/70 px-2.5 py-0.5 text-xs text-muted-foreground sm:flex">
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
            <DropdownMenuItem onClick={() => setAutomatizaciones(true)}>
              <Zap /> Automatizaciones
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditando(true)}>Renombrar tablero</DropdownMenuItem>
            {usuario.rol === "admin" ? (
              <>
                <DropdownMenuItem onClick={() => setAcceso(true)}>
                  <Lock /> Acceso…
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmar(true)}>
                  <Trash2 /> Eliminar tablero
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {automatizaciones ? <BoardAutomatizaciones open={automatizaciones} onOpenChange={setAutomatizaciones} /> : null}
      {usuario.rol === "admin" && acceso ? <BoardAcceso open={acceso} onOpenChange={setAcceso} /> : null}
      <AlertDialog
        open={confirmar}
        onOpenChange={(v) => {
          setConfirmar(v);
          setEscrito("");
        }}
      >
        <AlertDialogContent className="pulse">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el tablero «{board.nombre}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Se van a la papelera todos sus elementos, columnas, grupos y archivos (se pueden restaurar durante 90 días). Para confirmar, escribe el nombre del tablero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
            placeholder={board.nombre}
            autoFocus
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-destructive/30"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={escrito.trim() !== board.nombre.trim()}
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
