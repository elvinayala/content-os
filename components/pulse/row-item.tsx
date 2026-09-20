"use client";

import { Maximize2 } from "lucide-react";
import { memo, useEffect, useState } from "react";

import { useBoardActions } from "@/components/pulse/board-provider";
import { Cell } from "@/components/pulse/cell";
import { Checkbox } from "@/components/ui/checkbox";
import type { ArchivoPulse, Columna, Item, UsuarioPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export const ANCHO_CHECK = 36;
export const ANCHO_NOMBRE = 300;
export const ANCHO_FINAL = 48;

// Una fila de la grilla. memo: solo re-renderiza si cambia su item, las columnas, la
// selección o los diccionarios de usuarios/archivos (referencias estables en el store).
export const RowItem = memo(function RowItem({
  item,
  columns,
  usuarios,
  archivos,
  relacionados,
  colorGrupo,
  seleccionada,
}: {
  item: Item;
  columns: Columna[];
  usuarios: UsuarioPulse[];
  archivos: Record<string, ArchivoPulse>;
  relacionados: Record<string, { id: string; name: string }[]>;
  colorGrupo: string;
  seleccionada: boolean;
}) {
  const { dispatch, abrirItem, renombrar } = useBoardActions();
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(item.name);
  useEffect(() => {
    if (!editando) setBorrador(item.name);
  }, [item.name, editando]);
  const guardar = () => {
    setEditando(false);
    renombrar(item.id, borrador);
  };

  return (
    <div className="fila flex h-[var(--pulse-fila)] border-b border-[var(--pulse-linea)] bg-background" data-seleccionada={seleccionada}>
      <div className="celda sticky left-0 z-10 flex shrink-0 justify-center bg-background !px-0" style={{ width: ANCHO_CHECK, borderLeft: `6px solid ${colorGrupo}` }}>
        <Checkbox checked={seleccionada} onCheckedChange={(c) => dispatch({ type: "seleccion", itemIds: [item.id], seleccionado: c === true })} className="size-4 rounded-sm" aria-label="Seleccionar" />
      </div>
      <div className={cn("celda group/nombre sticky z-10 shrink-0 gap-1 bg-background")} style={{ width: ANCHO_NOMBRE, left: ANCHO_CHECK }}>
        {editando ? (
          <input
            autoFocus
            className="h-7 w-full rounded-sm bg-background px-1 text-[13px] outline-none ring-2 ring-primary"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onBlur={guardar}
            onKeyDown={(e) => {
              if (e.key === "Enter") guardar();
              if (e.key === "Escape") {
                setBorrador(item.name);
                setEditando(false);
              }
            }}
          />
        ) : (
          <>
            <button type="button" className="min-w-0 flex-1 truncate text-left font-medium" onClick={() => abrirItem(item.id)} onDoubleClick={() => setEditando(true)} title={item.name}>
              {item.name}
            </button>
            <button type="button" onClick={() => abrirItem(item.id)} className="hidden shrink-0 items-center gap-1 rounded px-1 text-[11px] text-muted-foreground hover:bg-accent group-hover/nombre:flex" title="Abrir">
              <Maximize2 className="size-3" /> Abrir
            </button>
          </>
        )}
      </div>
      {columns.map((c) => (
        <div key={c.id} className="celda shrink-0" style={{ width: c.width }}>
          <Cell item={item} column={c} usuarios={usuarios} archivos={archivos} relacionados={c.type === "relation" ? (relacionados[c.settings.boardId ?? ""] ?? []) : undefined} />
        </div>
      ))}
      <div className="shrink-0" style={{ width: ANCHO_FINAL }} />
    </div>
  );
});
