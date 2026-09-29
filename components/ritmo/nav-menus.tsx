"use client";

import { ChevronDown, LayoutGrid, MessageSquare, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { abrirSlack, type EspacioSlack } from "./boton-slack";

// Menús de la barra de arriba (Elvin, 29/sep: "hay muchos tabs arriba… que se desplieguen cuando le dé clic").
// "Más" junta las secciones que no se usan todos los días; "Apps" junta Pulse y los Slack de cada empresa.

export type ItemMenu = { href: string; nombre: string; icono: LucideIcon; activo: boolean; grupo: string; badge?: number; nuevo?: boolean };

export function MenuMas({ items }: { items: ItemMenu[] }) {
  if (!items.length) return null;
  const activo = items.some((i) => i.activo);
  const aviso = items.some((i) => i.badge || i.nuevo);
  const grupos = [...new Set(items.map((i) => i.grupo))];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("relative flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm transition outline-none", activo ? "tab-activa bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground data-[state=open]:bg-white/[0.06] data-[state=open]:text-foreground")}>
        {activo ? items.find((i) => i.activo)!.nombre : "Más"}
        <ChevronDown className="size-3.5 opacity-70" />
        {aviso ? <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-[color:var(--coral)]" /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="ritmo w-64 rounded-2xl border-white/10 bg-[#0c111b]/95 p-1.5 backdrop-blur-xl">
        {grupos.map((g, n) => (
          <div key={g}>
            {n ? <DropdownMenuSeparator className="bg-white/[0.06]" /> : null}
            <DropdownMenuLabel className="px-2 pt-1.5 pb-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{g}</DropdownMenuLabel>
            {items
              .filter((i) => i.grupo === g)
              .map((i) => (
                <DropdownMenuItem key={i.href} asChild className={cn("cursor-pointer rounded-lg px-2 py-2", i.activo && "bg-primary/10 text-primary")}>
                  <Link href={i.href} className="flex items-center gap-2.5">
                    <i.icono className="size-4 opacity-80" />
                    <span className="flex-1 text-sm">{i.nombre}</span>
                    {i.badge ? <span className="rounded-full bg-[color:var(--coral)] px-1.5 text-[10px] font-semibold text-background">{i.badge}</span> : null}
                    {i.nuevo ? <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--neon)]" title="Nuevo" /> : null}
                  </Link>
                </DropdownMenuItem>
              ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MenuApps({ pulse, slack }: { pulse: { href: string; nombre: string } | null; slack: EspacioSlack[] }) {
  if (!pulse && !slack.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger title="Apps" className="hidden items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition outline-none hover:text-foreground data-[state=open]:text-foreground sm:flex">
        <LayoutGrid className="size-3.5" /> Apps <ChevronDown className="size-3 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="ritmo w-52 rounded-2xl border-white/10 bg-[#0c111b]/95 p-1.5 backdrop-blur-xl">
        {pulse ? (
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2">
            <a href={pulse.href} className="flex items-center gap-2.5">
              <LayoutGrid className="size-4 opacity-80" /> {pulse.nombre}
            </a>
          </DropdownMenuItem>
        ) : null}
        {slack.map((e) => (
          <DropdownMenuItem key={e.equipo} onSelect={() => abrirSlack(e)} className="cursor-pointer rounded-lg px-2 py-2">
            <MessageSquare className="size-4 opacity-80" /> {e.nombre}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
