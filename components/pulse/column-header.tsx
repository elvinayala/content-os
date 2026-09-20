"use client";

import { ArrowDownAZ, ArrowLeft, ArrowRight, ArrowUpAZ, ChevronDown, Pencil, Settings2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useBoard, useBoardActions } from "@/components/pulse/board-provider";
import { StatusLabelsEditor } from "@/components/pulse/status-labels-editor";
import { TipoColumnaIcon } from "@/components/pulse/tipo-columna-icon";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Columna } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

// Encabezado de una columna: título (doble click renombra), menú (ordenar, renombrar,
// etiquetas, formato, eliminar) y tirador para el ancho.
export function ColumnHeader({ column }: { column: Columna }) {
  const { orden, columns } = useBoard();
  const { actualizarColumna, eliminarColumna, reordenarColumnas, dispatch } = useBoardActions();
  const idx = columns.findIndex((c) => c.id === column.id);
  const mover = (delta: number) => {
    const ids = columns.map((c) => c.id);
    const j = idx + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    reordenarColumnas(ids);
  };
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(column.title);
  const [editorLabels, setEditorLabels] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => setBorrador(column.title), [column.title]);

  const guardarTitulo = () => {
    setEditando(false);
    if (borrador.trim() && borrador.trim() !== column.title) actualizarColumna(column.id, { title: borrador.trim() });
    else setBorrador(column.title);
  };

  // Ancho por arrastre del borde derecho.
  const arrastre = useRef<{ x: number; w: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    arrastre.current = { x: e.clientX, w: column.width };
    const mover = (ev: PointerEvent) => {
      if (!arrastre.current) return;
      const w = Math.max(70, Math.min(800, arrastre.current.w + ev.clientX - arrastre.current.x));
      dispatch({ type: "columna:actualizar", column: { ...column, width: w } });
    };
    const soltar = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      if (!arrastre.current) return;
      const w = Math.max(70, Math.min(800, arrastre.current.w + ev.clientX - arrastre.current.x));
      arrastre.current = null;
      if (w !== column.width) actualizarColumna(column.id, { width: w });
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  };

  const ordenActivo = orden?.columnId === column.id ? orden.dir : null;
  const conLabels = column.type === "status" || column.type === "dropdown";

  return (
    <div className="group/col relative flex h-full w-full items-center justify-center gap-1 px-1 text-xs font-medium text-muted-foreground" style={{ width: column.width }}>
      {editando ? (
        <input
          autoFocus
          className="h-6 w-full rounded border bg-background px-1 text-center text-xs text-foreground outline-none ring-2 ring-primary"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onBlur={guardarTitulo}
          onKeyDown={(e) => {
            if (e.key === "Enter") guardarTitulo();
            if (e.key === "Escape") {
              setBorrador(column.title);
              setEditando(false);
            }
          }}
        />
      ) : (
        <>
          <TipoColumnaIcon tipo={column.type} className="size-3 shrink-0 opacity-60" />
          <span className="truncate" title={column.title} onDoubleClick={() => setEditando(true)}>
            {column.title}
          </span>
          {ordenActivo ? ordenActivo === "asc" ? <ArrowDownAZ className="size-3 text-primary" /> : <ArrowUpAZ className="size-3 text-primary" /> : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={cn("absolute right-2 rounded p-0.5 opacity-0 hover:bg-accent group-hover/col:opacity-100", "data-[state=open]:opacity-100")} aria-label="Opciones de la columna">
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="pulse w-56" align="end">
              <DropdownMenuItem onClick={() => dispatch({ type: "orden", orden: ordenActivo === "asc" ? null : { columnId: column.id, dir: "asc" } })}>
                <ArrowDownAZ /> Ordenar ascendente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => dispatch({ type: "orden", orden: ordenActivo === "desc" ? null : { columnId: column.id, dir: "desc" } })}>
                <ArrowUpAZ /> Ordenar descendente
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditando(true)}>
                <Pencil /> Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem disabled={idx <= 0} onClick={() => mover(-1)}>
                <ArrowLeft /> Mover a la izquierda
              </DropdownMenuItem>
              <DropdownMenuItem disabled={idx >= columns.length - 1} onClick={() => mover(1)}>
                <ArrowRight /> Mover a la derecha
              </DropdownMenuItem>
              {conLabels ? (
                <DropdownMenuItem onClick={() => setEditorLabels(true)}>
                  <Settings2 /> Editar etiquetas
                </DropdownMenuItem>
              ) : null}
              {column.type === "number" ? (
                <DropdownMenuItem
                  onClick={() =>
                    actualizarColumna(column.id, {
                      settings: { ...column.settings, formato: column.settings.formato === "moneda" ? "decimal" : "moneda" },
                    })
                  }
                >
                  <Settings2 /> {column.settings.formato === "moneda" ? "Mostrar sin $" : "Mostrar como $"}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmar(true)}>
                <Trash2 /> Eliminar columna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      <div onPointerDown={onPointerDown} className="absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-primary/40" />
      {conLabels ? <StatusLabelsEditor column={column} open={editorLabels} onOpenChange={setEditorLabels} /> : null}
      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent className="pulse">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la columna "{column.title}"?</AlertDialogTitle>
            <AlertDialogDescription>Se borran los valores de esta columna en todos los elementos. No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => eliminarColumna(column.id)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
