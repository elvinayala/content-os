"use client";

import { ChevronDown, ChevronRight, MoreHorizontal, Palette, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useBoardActions, type GrupoVisible } from "@/components/pulse/board-provider";
import { ColorPicker } from "@/components/pulse/color-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cssColor } from "@/lib/pulse/colores";

export function GroupHeader({ grupo, colapsado, onToggle }: { grupo: GrupoVisible; colapsado: boolean; onToggle: () => void }) {
  const { actualizarGrupo, eliminarGrupo, crearGrupo } = useBoardActions();
  const real = grupo.grupoReal;
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(grupo.titulo);
  const [color, setColor] = useState(false);
  useEffect(() => setBorrador(grupo.titulo), [grupo.titulo]);
  const guardar = () => {
    setEditando(false);
    if (real && borrador.trim() && borrador.trim() !== grupo.titulo) actualizarGrupo(real.id, { title: borrador.trim() });
    else setBorrador(grupo.titulo);
  };
  const c = cssColor(grupo.color);
  return (
    <div className="group/grupo flex h-10 items-center gap-1.5 pr-4 pl-1" style={{ color: c }}>
      <button type="button" onClick={onToggle} className="rounded p-0.5 hover:bg-accent" aria-label={colapsado ? "Expandir" : "Colapsar"}>
        {colapsado ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {editando ? (
        <input
          autoFocus
          className="h-7 rounded border bg-background px-1 text-sm font-semibold text-foreground outline-none ring-2 ring-primary"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onBlur={guardar}
          onKeyDown={(e) => {
            if (e.key === "Enter") guardar();
            if (e.key === "Escape") {
              setBorrador(grupo.titulo);
              setEditando(false);
            }
          }}
        />
      ) : (
        <span className="truncate text-sm font-semibold" onDoubleClick={() => real && setEditando(true)} title={real ? "Doble click para renombrar" : undefined}>
          {grupo.titulo}
        </span>
      )}
      <span className="text-xs font-normal text-muted-foreground">
        {grupo.items.length} elemento{grupo.items.length === 1 ? "" : "s"}
      </span>
      {real ? (
        <>
          <Popover open={color} onOpenChange={setColor}>
            <PopoverTrigger asChild>
              <span />
            </PopoverTrigger>
            <PopoverContent className="pulse w-56 p-2" align="start">
              <ColorPicker
                value={grupo.color}
                onChange={(col) => {
                  actualizarGrupo(real.id, { color: col });
                  setColor(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="rounded p-0.5 text-muted-foreground opacity-0 hover:bg-accent group-hover/grupo:opacity-100 data-[state=open]:opacity-100" aria-label="Opciones del grupo">
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="pulse w-52" align="start">
              <DropdownMenuItem onClick={() => setEditando(true)}>
                <Pencil /> Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setColor(true)}>
                <Palette /> Cambiar color
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => crearGrupo("Nuevo grupo", "bright_blue", real.id)}>
                <Plus /> Agregar grupo debajo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actualizarGrupo(real.id, { colapsadoDefault: !real.colapsadoDefault })}>
                <ChevronRight /> {real.colapsadoDefault ? "Abrir por defecto" : "Colapsar por defecto"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  if (grupo.items.length) toast.error("El grupo tiene elementos: movelos antes de eliminarlo", { className: "pulse" });
                  else eliminarGrupo(real.id);
                }}
              >
                <Trash2 /> Eliminar grupo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : null}
    </div>
  );
}
