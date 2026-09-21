import { notFound } from "next/navigation";

import { BoardHeader } from "@/components/pulse/board-header";
import { BoardProvider } from "@/components/pulse/board-provider";
import { BoardView } from "@/components/pulse/board-view";
import { usuarioActual } from "@/lib/pulse/auth";
import { boardsVisibles, leerBoardCompleto, leerNombresItems } from "@/lib/pulse/repo";
import type { Vista } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ board: string }>;
  searchParams: Promise<{ vista?: string; item?: string }>;
}) {
  const [{ board: slug }, sp, usuario] = await Promise.all([params, searchParams, usuarioActual()]);
  if (!usuario) notFound();
  const data = await leerBoardCompleto(slug, { usuario });
  if (!data) notFound();

  // Nombres de los items de los tableros conectados (columnas relation).
  const relacionados: Record<string, { id: string; name: string }[]> = {};
  const destinos = [...new Set(data.columns.filter((c) => c.type === "relation" && c.settings.boardId).map((c) => c.settings.boardId!))];
  const visibles = await boardsVisibles(usuario);
  await Promise.all(destinos.map(async (id) => (relacionados[id] = visibles.has(id) ? await leerNombresItems(id) : [])));

  const vista: Vista = sp.vista === "kanban" || sp.vista === "tarjetas" ? sp.vista : "tabla";
  return (
    <div className="flex h-svh flex-col">
      <BoardProvider data={data} vistaInicial={vista} itemInicial={sp.item ?? null}>
        <BoardHeader usuario={usuario} />
        <BoardView relacionados={relacionados} />
      </BoardProvider>
    </div>
  );
}
