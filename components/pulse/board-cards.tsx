"use client";

import { useBoard, useGruposVisibles } from "@/components/pulse/board-provider";
import { BoardSinResultados, useSinResultados } from "@/components/pulse/board-sin-resultados";
import { ItemCard } from "@/components/pulse/item-card";
import { cssColor } from "@/lib/pulse/colores";
import { columnaVisible } from "@/lib/pulse/types";

// Vista de tarjetas: grilla por grupo.
export function BoardCards() {
  const s = useBoard();
  const grupos = useGruposVisibles();
  const total = grupos.reduce((n, g) => n + g.items.length, 0);
  const sinResultados = useSinResultados(total);
  return (
    <div className="scroll-fino h-full overflow-auto p-4">
      <BoardSinResultados total={total} />
      {sinResultados ? null : grupos.map((g) => (
        <section key={g.id} className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: cssColor(g.color) }}>
            {g.titulo} <span className="text-xs font-normal text-muted-foreground">{g.items.length}</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {g.items.map((it) => (
              <ItemCard key={it.id} item={it} columns={s.columns.filter(columnaVisible)} usuarios={s.usuarios} colorGrupo={cssColor(g.color)} enfocable />
            ))}
          </div>
          {g.items.length === 0 ? <p className="text-xs text-muted-foreground">Sin elementos.</p> : null}
        </section>
      ))}
    </div>
  );
}
