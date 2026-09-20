"use client";

import { useState } from "react";

import { useBoardActions } from "@/components/pulse/board-provider";
import { TipoColumnaIcon } from "@/components/pulse/tipo-columna-icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TIPOS_COLUMNA, type TipoColumna } from "@/lib/pulse/types";

// Popover "Agregar columna": nombre + tipo. Para status/dropdown arranca con 3 etiquetas.
export function NuevaColumnaPopover({ children }: { children: React.ReactNode }) {
  const { crearColumna } = useBoardActions();
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const crear = async (tipo: TipoColumna) => {
    setAbierto(false);
    const nombre = titulo.trim() || TIPOS_COLUMNA.find((t) => t.tipo === tipo)!.nombre;
    setTitulo("");
    const settings =
      tipo === "status" || tipo === "dropdown"
        ? {
            labels: [
              { id: "l1", label: tipo === "status" ? "Listo" : "Opción 1", color: "green" as const, esDone: tipo === "status" },
              { id: "l2", label: tipo === "status" ? "En proceso" : "Opción 2", color: "orange" as const },
              { id: "l3", label: tipo === "status" ? "Detenido" : "Opción 3", color: "red" as const },
            ],
          }
        : tipo === "number"
          ? { formato: "moneda" as const }
          : tipo === "people"
            ? { multiple: true }
            : {};
    await crearColumna(nombre, tipo, settings);
  };
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="pulse w-72 p-2" align="end">
        <input autoFocus className="mb-2 h-8 w-full rounded border px-2 text-sm" placeholder="Nombre de la columna" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <p className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tipo</p>
        <div className="grid max-h-72 grid-cols-1 gap-0.5 overflow-auto">
          {TIPOS_COLUMNA.filter((t) => t.tipo !== "relation").map((t) => (
            <button key={t.tipo} type="button" onClick={() => crear(t.tipo)} className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted">
              <TipoColumnaIcon tipo={t.tipo} className="size-4 text-muted-foreground" />
              <span className="flex-1">{t.nombre}</span>
              <span className="text-[11px] text-muted-foreground">{t.descripcion}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
