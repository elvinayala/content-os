"use client";

import { Search } from "lucide-react";

import { abrirBuscador } from "@/components/pulse/buscador-global";

// La barra de búsqueda grande del Inicio: abre el ⌘K.
export function BotonBuscar() {
  return (
    <button
      type="button"
      onClick={abrirBuscador}
      className="superficie superficie-hover flex h-11 w-full max-w-md cursor-pointer items-center gap-2.5 px-3.5 text-left text-sm text-muted-foreground"
    >
      <Search className="size-4" />
      <span className="flex-1 truncate">Buscar clientes, tableros o preguntarle al CRM…</span>
      <kbd className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
    </button>
  );
}
