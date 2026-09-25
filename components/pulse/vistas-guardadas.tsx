"use client";

import { Bookmark, BookmarkPlus, Check, ChevronDown, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { eliminarVistaAction, guardarVistaAction, listarVistasAction } from "@/app/pulse/(app)/[board]/actions";
import { type Filtro, type Orden, useBoard, useBoardActions } from "@/components/pulse/board-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { VistaGuardada } from "@/lib/pulse/repo";
import type { Vista } from "@/lib/pulse/types";

interface EstadoVista {
  vista: Vista;
  busqueda: string;
  filtroPersona: string | null;
  filtros: Filtro[];
  orden: Orden;
  agruparPor: string | null;
}

// Vistas guardadas por persona: filtros + orden + agrupar + búsqueda + tipo de vista, con nombre.
export function VistasGuardadas() {
  const s = useBoard();
  const { dispatch, setVista } = useBoardActions();
  const [vistas, setVistas] = useState<VistaGuardada[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [activa, setActiva] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const r = await listarVistasAction({ boardId: s.board.id });
    if (r.ok) setVistas(r.vistas);
  }, [s.board.id]);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const aplicar = (v: VistaGuardada) => {
    const e = v.estado as unknown as EstadoVista;
    dispatch({ type: "busqueda", texto: e.busqueda ?? "" });
    dispatch({ type: "filtroPersona", userId: e.filtroPersona ?? null });
    dispatch({ type: "filtros", filtros: (e.filtros ?? []).filter((f) => s.columns.some((c) => c.id === f.columnId)) });
    dispatch({ type: "orden", orden: e.orden && (e.orden.columnId === "name" || s.columns.some((c) => c.id === e.orden!.columnId)) ? e.orden : null });
    dispatch({ type: "agruparPor", columnId: e.agruparPor && s.columns.some((c) => c.id === e.agruparPor) ? e.agruparPor : null });
    if (e.vista && e.vista !== s.vista) setVista(e.vista);
    setActiva(v.id);
    setAbierto(false);
  };

  const guardar = async () => {
    const estado: EstadoVista = { vista: s.vista, busqueda: s.busqueda, filtroPersona: s.filtroPersona, filtros: s.filtros, orden: s.orden, agruparPor: s.agruparPor };
    const r = await guardarVistaAction({ boardId: s.board.id, nombre, estado: estado as unknown as Record<string, unknown> });
    if (!r.ok) return toast.error(r.error, { className: "pulse" });
    setNombre("");
    setVistas((vs) => [...vs, r.vista]);
    setActiva(r.vista.id);
    toast.success(`Vista «${r.vista.nombre}» guardada`, { className: "pulse" });
  };

  const actual = vistas.find((v) => v.id === activa);
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={actual ? "text-primary" : undefined}>
          <Bookmark /> <span className="max-w-32 truncate">{actual ? actual.nombre : "Vistas"}</span> <ChevronDown className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="pulse w-72 p-2" align="start">
        <p className="px-2 pt-1 pb-2 text-xs text-muted-foreground">Tus vistas de este tablero (solo las ves tú).</p>
        {vistas.length === 0 ? <p className="px-2 pb-2 text-sm text-muted-foreground">Todavía no guardaste ninguna.</p> : null}
        <ul className="flex flex-col">
          {vistas.map((v) => (
            <li key={v.id} className="group flex items-center gap-1 rounded-md hover:bg-muted">
              <button type="button" onClick={() => aplicar(v)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm">
                {activa === v.id ? <Check className="size-3.5 text-primary" /> : <Bookmark className="size-3.5 text-muted-foreground" />}
                <span className="truncate">{v.nombre}</span>
              </button>
              <button
                type="button"
                title="Borrar vista"
                className="mr-1 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                onClick={async () => {
                  const r = await eliminarVistaAction({ boardId: s.board.id, id: v.id });
                  if (r.ok) setVistas((vs) => vs.filter((x) => x.id !== v.id));
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-1.5 border-t pt-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && nombre.trim() && guardar()} placeholder="Nombre de la vista actual" className="h-8 min-w-0 flex-1 rounded-md border px-2 text-sm" />
          <Button size="sm" onClick={guardar} disabled={!nombre.trim()}>
            <BookmarkPlus /> Guardar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
