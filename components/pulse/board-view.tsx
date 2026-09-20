"use client";

import { useBoard } from "@/components/pulse/board-provider";
import { BoardCards } from "@/components/pulse/board-cards";
import { BoardKanban } from "@/components/pulse/board-kanban";
import { BoardTable } from "@/components/pulse/board-table";
import { BoardToolbar } from "@/components/pulse/board-toolbar";
import { ItemPanel } from "@/components/pulse/item-panel";
import { SelectionBar } from "@/components/pulse/selection-bar";

export function BoardView({ relacionados }: { relacionados: Record<string, { id: string; name: string }[]> }) {
  const { vista } = useBoard();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BoardToolbar />
      <div className="relative min-h-0 flex-1">
        {vista === "kanban" ? <BoardKanban /> : vista === "tarjetas" ? <BoardCards /> : <BoardTable relacionados={relacionados} />}
        <SelectionBar />
      </div>
      <ItemPanel relacionados={relacionados} />
    </div>
  );
}
