"use client";

import { memo } from "react";

import { useBoardActions } from "@/components/pulse/board-provider";
import { fmtFechaCorta } from "@/components/pulse/cell";
import { StatusPill } from "@/components/pulse/status-pill";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { cssColor } from "@/lib/pulse/colores";
import type { Columna, Item, UsuarioPulse } from "@/lib/pulse/types";
import { formatearNumero } from "@/lib/pulse/valores";
import { cn } from "@/lib/utils";

// Tarjeta de un elemento (kanban y vista tarjetas): nombre + hasta 4 campos resumidos.
export const ItemCard = memo(function ItemCard({
  item,
  columns,
  usuarios,
  colorGrupo,
  className,
  arrastrando,
}: {
  item: Item;
  columns: Columna[];
  usuarios: UsuarioPulse[];
  colorGrupo?: string;
  className?: string;
  arrastrando?: boolean;
}) {
  const { abrirItem } = useBoardActions();
  const personas = columns.find((c) => c.type === "people");
  const resumen = columns.filter((c) => ["text", "number", "status", "date", "dropdown"].includes(c.type) && c.id !== personas?.id).slice(0, 4);
  const asignados = personas ? ((item.values[personas.id] as string[] | undefined) ?? []).map((id) => usuarios.find((u) => u.id === id)).filter((u): u is UsuarioPulse => !!u) : [];

  return (
    <div
      onClick={() => abrirItem(item.id)}
      className={cn("tarjeta-item cursor-pointer rounded-lg border bg-background p-2.5 text-sm", arrastrando && "rotate-1 shadow-xl", className)}
      style={colorGrupo ? { borderLeft: `4px solid ${colorGrupo}` } : undefined}
    >
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1 font-medium leading-tight">{item.name}</span>
        {asignados.length ? (
          <span className="flex shrink-0 -space-x-1.5">
            {asignados.slice(0, 3).map((u) => (
              <UserAvatar key={u.id} nombre={u.nombre} color={u.color} className="size-5 text-[9px]" />
            ))}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
        {resumen.map((c) => {
          const v = item.values[c.id];
          if (v === undefined || v === null) return null;
          let contenido: React.ReactNode = String(v);
          if (c.type === "status") {
            const l = c.settings.labels?.find((x) => x.id === v);
            contenido = l ? <StatusPill label={l.label} color={l.color} className="h-5 text-[10px]" /> : null;
          } else if (c.type === "dropdown") {
            contenido = (v as string[]).map((id) => c.settings.labels?.find((x) => x.id === id)).filter(Boolean).map((l) => <StatusPill key={l!.id} label={l!.label} color={l!.color} llena={false} className="mr-1 h-5 text-[10px]" />);
          } else if (c.type === "number") contenido = <span className="font-medium text-foreground">{formatearNumero(v as number, c.settings.formato)}</span>;
          else if (c.type === "date") contenido = fmtFechaCorta(v as string);
          return (
            <div key={c.id} className="flex items-center gap-2">
              <span className="w-20 shrink-0 truncate">{c.title}</span>
              <span className="min-w-0 flex-1 truncate text-foreground">{contenido}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export function colorDeGrupo(item: Item, groups: { id: string; color: string }[]): string {
  const g = groups.find((x) => x.id === item.groupId);
  return cssColor((g?.color as never) ?? "grey");
}
