"use client";

import { SearchX } from "lucide-react";
import { useMemo } from "react";

import { useBoard, useBoardActions } from "@/components/pulse/board-provider";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/ui/estado-vacio";

// Vacío por búsqueda/filtro en un tablero (tabla, kanban o tarjetas): dice por qué no sale nada y deja limpiar
// todo de un clic. Solo aparece si hay búsqueda o filtros, si ya llegaron todos los elementos (sin grupos a medio
// cargar, para que no parpadee) y si el resultado es cero. `total` = elementos que quedaron visibles.
export function useSinResultados(total: number): boolean {
  const s = useBoard();
  const hayFiltro = !!s.busqueda.trim() || s.filtros.length > 0 || !!s.filtroPersona;
  const cargandoGrupos = useMemo(() => Object.values(s.items).some((i) => i.parcial), [s.items]);
  return hayFiltro && total === 0 && !cargandoGrupos;
}

export function BoardSinResultados({ total, className }: { total: number; className?: string }) {
  const s = useBoard();
  const { dispatch } = useBoardActions();
  const q = s.busqueda.trim();
  const vacio = useSinResultados(total);
  if (!vacio) return null;
  return (
    <EstadoVacio
      tipo="filtro"
      icono={SearchX}
      titulo={q ? `Nada en este tablero coincide con «${q}»` : "Ningún elemento con estos filtros"}
      className={className}
      accion={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            dispatch({ type: "busqueda", texto: "" });
            dispatch({ type: "filtros", filtros: [] });
            dispatch({ type: "filtroPersona", userId: null });
          }}
        >
          Limpiar búsqueda y filtros
        </Button>
      }
    >
      Prueba con otra palabra o quita algún filtro de la barra de arriba.
    </EstadoVacio>
  );
}
