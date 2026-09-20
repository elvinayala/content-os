"use client";

import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";

import { useBoard, useBoardActions, useGruposVisibles } from "@/components/pulse/board-provider";
import { ItemCard } from "@/components/pulse/item-card";
import { StatusPill } from "@/components/pulse/status-pill";
import { cssColor } from "@/lib/pulse/colores";
import type { Columna, Item } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

// Kanban: una columna por etiqueta de una columna "status" (o por grupo del tablero).
// Arrastrar una tarjeta cambia el estado / grupo; también se puede desde el menú de la celda.
export function BoardKanban() {
  const s = useBoard();
  const { setValor, moverItems } = useBoardActions();
  const grupos = useGruposVisibles();
  const statusCols = s.columns.filter((c) => c.type === "status");
  const clave = `pulse:${s.board.slug}:kanban`;
  const [colId, setColId] = useState<string>(() => {
    try {
      const v = localStorage.getItem(clave);
      if (v && (v === "__grupo" || statusCols.some((c) => c.id === v))) return v;
    } catch {}
    return statusCols[0]?.id ?? "__grupo";
  });
  useEffect(() => {
    try {
      localStorage.setItem(clave, colId);
    } catch {}
  }, [clave, colId]);

  const col: Columna | undefined = statusCols.find((c) => c.id === colId);
  const visibles = useMemo(() => grupos.flatMap((g) => g.items), [grupos]);

  const columnasKanban = useMemo(() => {
    if (col) {
      const labels = col.settings.labels ?? [];
      const porLabel = new Map<string, Item[]>();
      const sin: Item[] = [];
      for (const it of visibles) {
        const v = it.values[col.id] as string | undefined;
        if (v && labels.some((l) => l.id === v)) porLabel.set(v, [...(porLabel.get(v) ?? []), it]);
        else sin.push(it);
      }
      return [
        ...labels.map((l) => ({ id: l.id, titulo: l.label, color: l.color, items: porLabel.get(l.id) ?? [] })),
        { id: "__sin", titulo: "Sin estado", color: "grey" as const, items: sin },
      ];
    }
    return s.groups.map((g) => ({ id: g.id, titulo: g.title, color: g.color, items: visibles.filter((i) => i.groupId === g.id) }));
  }, [col, visibles, s.groups]);

  const [activo, setActivo] = useState<Item | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = async (e: DragEndEvent) => {
    setActivo(null);
    const item = s.items[String(e.active.id)];
    const destino = e.over ? String(e.over.id) : null;
    if (!item || !destino) return;
    if (col) {
      const actual = (item.values[col.id] as string | undefined) ?? "__sin";
      if (actual === destino) return;
      await setValor(item.id, col, destino === "__sin" ? null : destino);
    } else if (item.groupId !== destino) {
      await moverItems([item.id], destino);
    }
  };

  const numero = s.columns.find((c) => c.type === "number");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2 text-sm">
        <span className="text-muted-foreground">Columnas por</span>
        <select value={colId} onChange={(e) => setColId(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-sm">
          {statusCols.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
          <option value="__grupo">Grupos del tablero</option>
        </select>
      </div>
      <DndContext sensors={sensors} onDragStart={(e) => setActivo(s.items[String(e.active.id)] ?? null)} onDragEnd={onDragEnd} onDragCancel={() => setActivo(null)}>
        <div className="scroll-fino flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
          {columnasKanban.map((k) => (
            <ColumnaKanban key={k.id} id={k.id} titulo={k.titulo} color={k.color} items={k.items} suma={numero ? k.items.reduce((a, i) => a + ((i.values[numero.id] as number | undefined) ?? 0), 0) : null} formato={numero?.settings.formato} />
          ))}
        </div>
        <DragOverlay>{activo ? <ItemCard item={activo} columns={s.columns} usuarios={s.usuarios} arrastrando className="w-64" /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

function ColumnaKanban({ id, titulo, color, items, suma, formato }: { id: string; titulo: string; color: Parameters<typeof StatusPill>[0]["color"]; items: Item[]; suma: number | null; formato?: "moneda" | "entero" | "decimal" }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const s = useBoard();
  return (
    <div ref={setNodeRef} className={cn("flex w-64 shrink-0 flex-col rounded-lg bg-secondary", isOver && "ring-2 ring-primary")}>
      <div className="flex items-center gap-2 rounded-t-lg px-3 py-2 text-sm font-medium text-white" style={{ background: cssColor(color) }}>
        <span className="truncate">{titulo}</span>
        <span className="ml-auto rounded bg-white/25 px-1.5 text-xs">{items.length}</span>
      </div>
      {suma !== null && items.length ? (
        <div className="px-3 pt-2 text-xs text-muted-foreground">
          Suma: <b className="text-foreground">{new Intl.NumberFormat("en-US", formato === "moneda" ? { style: "currency", currency: "USD", maximumFractionDigits: 0 } : {}).format(suma)}</b>
        </div>
      ) : null}
      <div className="scroll-fino flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {items.map((it) => (
          <TarjetaArrastrable key={it.id} item={it} colorGrupo={cssColor(s.groups.find((g) => g.id === it.groupId)?.color)} />
        ))}
        {items.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Soltá acá</p> : null}
      </div>
    </div>
  );
}

function TarjetaArrastrable({ item, colorGrupo }: { item: Item; colorGrupo: string }) {
  const s = useBoard();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn("touch-none", isDragging && "opacity-30")}>
      <ItemCard item={item} columns={s.columns} usuarios={s.usuarios} colorGrupo={colorGrupo} />
    </div>
  );
}
