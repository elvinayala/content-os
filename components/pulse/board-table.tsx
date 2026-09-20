"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { useBoard, useBoardActions, useGruposVisibles, type GrupoVisible } from "@/components/pulse/board-provider";
import { ColumnHeader } from "@/components/pulse/column-header";
import { GroupHeader } from "@/components/pulse/group-header";
import { NuevaColumnaPopover } from "@/components/pulse/nueva-columna";
import { ANCHO_CHECK, ANCHO_FINAL, ANCHO_NOMBRE, RowItem } from "@/components/pulse/row-item";
import { Checkbox } from "@/components/ui/checkbox";
import { cssColor } from "@/lib/pulse/colores";
import type { Item } from "@/lib/pulse/types";
import { formatearNumero } from "@/lib/pulse/valores";

type Fila =
  | { tipo: "grupo"; grupo: GrupoVisible; colapsado: boolean }
  | { tipo: "item"; item: Item; grupo: GrupoVisible }
  | { tipo: "agregar"; grupo: GrupoVisible }
  | { tipo: "resumen"; grupo: GrupoVisible }
  | { tipo: "espacio" };

const ALTO: Record<Fila["tipo"], number> = { grupo: 40, item: 36, agregar: 36, resumen: 32, espacio: 20 };

// Tabla agrupada, virtualizada (filas absolutas sobre un scroll único horizontal+vertical).
// Header de columnas sticky arriba; checkbox + nombre sticky a la izquierda.
export function BoardTable({ relacionados }: { relacionados: Record<string, { id: string; name: string }[]> }) {
  const s = useBoard();
  const { dispatch } = useBoardActions();
  const grupos = useGruposVisibles();
  const scrollRef = useRef<HTMLDivElement>(null);

  const filas = useMemo<Fila[]>(() => {
    const out: Fila[] = [];
    const hayNumero = s.columns.some((c) => c.type === "number");
    for (const g of grupos) {
      const colapsado = s.colapsados.has(g.id);
      out.push({ tipo: "grupo", grupo: g, colapsado });
      if (colapsado) continue;
      for (const it of g.items) out.push({ tipo: "item", item: it, grupo: g });
      if (g.grupoReal) out.push({ tipo: "agregar", grupo: g });
      if (hayNumero && g.items.length) out.push({ tipo: "resumen", grupo: g });
      out.push({ tipo: "espacio" });
    }
    return out;
  }, [grupos, s.colapsados, s.columns]);

  const virt = useVirtualizer({
    count: filas.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => ALTO[filas[i].tipo],
    overscan: 12,
    getItemKey: (i) => {
      const f = filas[i];
      return f.tipo === "item" ? f.item.id : f.tipo === "espacio" ? `esp-${i}` : `${f.tipo}-${f.grupo.id}`;
    },
  });

  const anchoTotal = ANCHO_CHECK + ANCHO_NOMBRE + s.columns.reduce((a, c) => a + c.width, 0) + ANCHO_FINAL;
  const todosIds = useMemo(() => grupos.flatMap((g) => g.items.map((i) => i.id)), [grupos]);
  const todosSeleccionados = todosIds.length > 0 && todosIds.every((id) => s.seleccion.has(id));

  return (
    <div ref={scrollRef} className="scroll-fino relative h-full w-full overflow-auto">
      <div style={{ width: anchoTotal, minWidth: "100%" }}>
        {/* header sticky */}
        <div className="sticky top-0 z-20 flex h-9 border-b bg-background/95 shadow-[0_1px_0_var(--pulse-linea),0_6px_14px_-12px_rgba(50,51,56,0.35)] backdrop-blur" style={{ width: anchoTotal }}>
          <div className="sticky left-0 z-30 flex shrink-0 items-center justify-center border-r border-[var(--pulse-linea)] bg-background" style={{ width: ANCHO_CHECK }}>
            <Checkbox checked={todosSeleccionados} onCheckedChange={(c) => dispatch({ type: "seleccion", itemIds: todosIds, seleccionado: c === true })} className="size-4 rounded-sm" aria-label="Seleccionar todo" />
          </div>
          <div className="sticky z-30 flex shrink-0 items-center justify-center border-r border-[var(--pulse-linea)] bg-background text-xs font-medium text-muted-foreground" style={{ width: ANCHO_NOMBRE, left: ANCHO_CHECK }}>
            Elemento
          </div>
          {s.columns.map((c) => (
            <div key={c.id} className="shrink-0 border-r border-[var(--pulse-linea)]" style={{ width: c.width }}>
              <ColumnHeader column={c} />
            </div>
          ))}
          <div className="flex shrink-0 items-center justify-center" style={{ width: ANCHO_FINAL }}>
            <NuevaColumnaPopover>
              <button type="button" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground" title="Agregar columna" aria-label="Agregar columna">
                <Plus className="size-4" />
              </button>
            </NuevaColumnaPopover>
          </div>
        </div>

        {/* filas */}
        <div className="relative" style={{ height: virt.getTotalSize() }}>
          {virt.getVirtualItems().map((v) => {
            const f = filas[v.index];
            const estilo: React.CSSProperties = { position: "absolute", top: v.start, left: 0, width: anchoTotal, height: v.size };
            if (f.tipo === "espacio") return <div key={v.key} style={estilo} />;
            if (f.tipo === "grupo") {
              return (
                <div key={v.key} style={estilo} className="sticky-grupo">
                  <div className="sticky left-0 z-10 w-fit max-w-[100vw]">
                    <GroupHeader grupo={f.grupo} colapsado={f.colapsado} onToggle={() => dispatch({ type: "colapsar", groupId: f.grupo.id })} />
                  </div>
                </div>
              );
            }
            if (f.tipo === "item") {
              return (
                <div key={v.key} style={estilo}>
                  <RowItem item={f.item} columns={s.columns} usuarios={s.usuarios} archivos={s.archivos} relacionados={relacionados} colorGrupo={cssColor(f.grupo.color)} seleccionada={s.seleccion.has(f.item.id)} />
                </div>
              );
            }
            if (f.tipo === "agregar") return <FilaAgregar key={v.key} estilo={estilo} grupo={f.grupo} />;
            return <FilaResumen key={v.key} estilo={estilo} grupo={f.grupo} />;
          })}
        </div>
      </div>
    </div>
  );
}

function FilaAgregar({ estilo, grupo }: { estilo: React.CSSProperties; grupo: GrupoVisible }) {
  const { crearItem } = useBoardActions();
  const [texto, setTexto] = useState("");
  const [activo, setActivo] = useState(false);
  const enviar = async () => {
    const n = texto.trim();
    if (!n) {
      setActivo(false);
      return;
    }
    setTexto("");
    await crearItem(grupo.grupoReal!.id, n);
  };
  return (
    <div style={estilo} className="flex border-b border-[var(--pulse-linea)]">
      <div className="sticky left-0 z-10 flex h-full items-center bg-background" style={{ width: ANCHO_CHECK + ANCHO_NOMBRE, borderLeft: `6px solid ${cssColor(grupo.color)}`, opacity: 0.85 }}>
        {activo ? (
          <input
            autoFocus
            className="mx-2 h-7 w-full rounded-sm border bg-background px-2 text-[13px] outline-none ring-2 ring-primary"
            placeholder="Nombre del elemento…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={enviar}
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar();
              if (e.key === "Escape") {
                setTexto("");
                setActivo(false);
              }
            }}
          />
        ) : (
          <button type="button" onClick={() => setActivo(true)} className="flex h-full w-full items-center gap-1 px-3 text-[13px] text-muted-foreground hover:text-foreground">
            <Plus className="size-3.5" /> Agregar elemento
          </button>
        )}
      </div>
    </div>
  );
}

function FilaResumen({ estilo, grupo }: { estilo: React.CSSProperties; grupo: GrupoVisible }) {
  const { columns } = useBoard();
  return (
    <div style={estilo} className="flex">
      <div className="sticky left-0 z-10 shrink-0 bg-background" style={{ width: ANCHO_CHECK + ANCHO_NOMBRE }} />
      {columns.map((c) => {
        if (c.type !== "number") return <div key={c.id} className="shrink-0" style={{ width: c.width }} />;
        const suma = grupo.items.reduce((a, i) => a + ((i.values[c.id] as number | undefined) ?? 0), 0);
        return (
          <div key={c.id} className="flex shrink-0 items-center justify-center rounded-b bg-muted/70 text-xs text-muted-foreground" style={{ width: c.width }}>
            <span className="mr-1 text-[10px] uppercase">suma</span>
            <span className="font-medium tabular-nums text-foreground">{formatearNumero(suma, c.settings.formato)}</span>
          </div>
        );
      })}
    </div>
  );
}
