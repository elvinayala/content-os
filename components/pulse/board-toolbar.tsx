"use client";

import { ArrowUpDown, ChevronDown, Filter, LayoutGrid, Plus, Search, Table2, Columns3, User, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useBoard, useBoardActions } from "@/components/pulse/board-provider";
import { NuevaColumnaPopover } from "@/components/pulse/nueva-columna";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cssColor } from "@/lib/pulse/colores";
import type { Vista } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

const VISTAS: { id: Vista; nombre: string; icon: typeof Table2 }[] = [
  { id: "tabla", nombre: "Tabla", icon: Table2 },
  { id: "kanban", nombre: "Kanban", icon: Columns3 },
  { id: "tarjetas", nombre: "Tarjetas", icon: LayoutGrid },
];

export function BoardToolbar() {
  const s = useBoard();
  const { dispatch, crearItem, setVista } = useBoardActions();
  const [q, setQ] = useState(s.busqueda);
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: "busqueda", texto: q }), 150);
    return () => clearTimeout(t);
  }, [q, dispatch]);

  const colsFiltrables = s.columns.filter((c) => ["status", "dropdown", "people", "checkbox"].includes(c.type));
  const colsAgrupables = s.columns.filter((c) => ["status", "dropdown", "people"].includes(c.type));
  const hayFiltros = s.filtros.length > 0 || !!s.filtroPersona;
  const persona = s.usuarios.find((u) => u.id === s.filtroPersona);

  return (
    <div className="vidrio sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b px-4 py-2">
      <div className="segmentado mr-2 flex">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVista(v.id)}
            data-activo={s.vista === v.id}
            className={cn("flex items-center gap-1 rounded-[7px] px-2.5 py-1 text-xs transition", s.vista === v.id ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <v.icon className="size-3.5" /> {v.nombre}
          </button>
        ))}
      </div>

      <Button size="sm" onClick={() => s.groups[0] && crearItem(s.groups[0].id, "Nuevo elemento", true)}>
        <Plus /> Nuevo elemento
      </Button>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="h-8 w-44 rounded-md border bg-background pl-7 pr-6 text-sm outline-none focus:ring-2 focus:ring-primary" />
        {q ? (
          <button type="button" className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground" onClick={() => setQ("")} aria-label="Limpiar">
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* Persona */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={persona ? "secondary" : "ghost"} size="sm">
            {persona ? <UserAvatar nombre={persona.nombre} color={persona.color} className="size-5" /> : <User />}
            {persona ? persona.nombre : "Persona"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="pulse w-56 p-1" align="start">
          {s.usuarios.map((u) => (
            <button key={u.id} type="button" onClick={() => dispatch({ type: "filtroPersona", userId: s.filtroPersona === u.id ? null : u.id })} className={cn("flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-muted", s.filtroPersona === u.id && "bg-accent")}>
              <UserAvatar nombre={u.nombre} color={u.color} /> {u.nombre}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Filtro por columna */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={s.filtros.length ? "secondary" : "ghost"} size="sm">
            <Filter /> Filtrar {s.filtros.length ? `(${s.filtros.length})` : ""}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="pulse max-h-96 w-64 overflow-auto" align="start">
          {colsFiltrables.length === 0 ? <DropdownMenuLabel className="font-normal text-muted-foreground">No hay columnas de estado, lista, personas o casilla.</DropdownMenuLabel> : null}
          {colsFiltrables.map((c) => {
            const opciones: { id: string; label: string; color?: string }[] =
              c.type === "checkbox"
                ? [
                    { id: "1", label: "Marcado" },
                    { id: "0", label: "Sin marcar" },
                  ]
                : c.type === "people"
                  ? s.usuarios.map((u) => ({ id: u.id, label: u.nombre }))
                  : (c.settings.labels ?? []).map((l) => ({ id: l.id, label: l.label, color: cssColor(l.color) }));
            return (
              <div key={c.id}>
                <DropdownMenuLabel>{c.title}</DropdownMenuLabel>
                {[...opciones, { id: "__vacio", label: "Vacío" }].map((o) => {
                  const activo = s.filtros.some((f) => f.columnId === c.id && f.valor === o.id);
                  return (
                    <DropdownMenuItem
                      key={o.id}
                      onSelect={(e) => {
                        e.preventDefault();
                        const otros = s.filtros.filter((f) => f.columnId !== c.id);
                        dispatch({ type: "filtros", filtros: activo ? otros : [...otros, { columnId: c.id, valor: o.id }] });
                      }}
                      className={cn(activo && "bg-accent")}
                    >
                      {o.color ? <span className="size-2.5 rounded-full" style={{ background: o.color }} /> : null}
                      {o.label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Ordenar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={s.orden ? "secondary" : "ghost"} size="sm">
            <ArrowUpDown /> Ordenar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="pulse max-h-96 w-56 overflow-auto" align="start">
          <DropdownMenuItem onClick={() => dispatch({ type: "orden", orden: { columnId: "name", dir: "asc" } })}>Nombre A→Z</DropdownMenuItem>
          <DropdownMenuItem onClick={() => dispatch({ type: "orden", orden: { columnId: "name", dir: "desc" } })}>Nombre Z→A</DropdownMenuItem>
          <DropdownMenuSeparator />
          {s.columns.map((c) => (
            <DropdownMenuItem key={c.id} onClick={() => dispatch({ type: "orden", orden: { columnId: c.id, dir: s.orden?.columnId === c.id && s.orden.dir === "asc" ? "desc" : "asc" } })}>
              {c.title} {s.orden?.columnId === c.id ? (s.orden.dir === "asc" ? "↑" : "↓") : ""}
            </DropdownMenuItem>
          ))}
          {s.orden ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => dispatch({ type: "orden", orden: null })}>Quitar orden</DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Agrupar por */}
      {s.vista === "tabla" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={s.agruparPor ? "secondary" : "ghost"} size="sm">
              Agrupar por {s.agruparPor ? `: ${s.columns.find((c) => c.id === s.agruparPor)?.title}` : ""} <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="pulse w-56" align="start">
            <DropdownMenuItem onClick={() => dispatch({ type: "agruparPor", columnId: null })}>Grupos del tablero</DropdownMenuItem>
            <DropdownMenuSeparator />
            {colsAgrupables.map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => dispatch({ type: "agruparPor", columnId: c.id })}>
                {c.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {hayFiltros ? (
        <Button variant="ghost" size="sm" onClick={() => { dispatch({ type: "filtros", filtros: [] }); dispatch({ type: "filtroPersona", userId: null }); }}>
          <X /> Limpiar filtros
        </Button>
      ) : null}

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "colapsar:todos", colapsado: s.colapsados.size < s.groups.length })}>
          {s.colapsados.size < s.groups.length ? "Colapsar todo" : "Expandir todo"}
        </Button>
        <NuevaColumnaPopover>
          <Button variant="outline" size="sm">
            <Plus /> Columna
          </Button>
        </NuevaColumnaPopover>
      </div>
    </div>
  );
}
