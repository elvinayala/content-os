"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import type { FichaInicio, VistaInicio } from "@/lib/pulse/inicio-clientes";

const ABRIR_MS = 120;
const CERRAR_MS = 220;

export function NumeroInicio({ vista, titulo, nota, total, muestra, destacado }: { vista: VistaInicio; titulo: string; nota: string; total: number; muestra: FichaInicio[]; destacado?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipo = useRef("");
  const programar = (valor: boolean, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAbierto(valor), ms);
  };
  // El mouse abre y cierra solo; el toque (celular) abre y cierra con cada toque.
  const sobre = (e: React.PointerEvent) => e.pointerType === "mouse" && programar(true, ABRIR_MS);
  const fuera = (e: React.PointerEvent) => e.pointerType === "mouse" && programar(false, CERRAR_MS);

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverAnchor asChild>
        <button
          type="button"
          onPointerEnter={sobre}
          onPointerLeave={fuera}
          onPointerDown={(e) => (tipo.current = e.pointerType)}
          onClick={() => {
            if (timer.current) clearTimeout(timer.current);
            setAbierto((v) => (tipo.current === "mouse" ? true : !v));
          }}
          aria-expanded={abierto}
          className={`superficie superficie-hover group flex cursor-pointer flex-col gap-1.5 px-4 py-4 text-left transition ${abierto ? "ring-2 ring-primary/25" : ""}`}
        >
          <span className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            {titulo}
            <ChevronDown className={`size-3.5 transition ${abierto ? "rotate-180 text-foreground" : "opacity-0 group-hover:opacity-100"}`} />
          </span>
          <span className={`text-[28px] leading-none font-semibold tabular-nums ${destacado ? "text-primary" : ""}`}>{total.toLocaleString("en-US")}</span>
          <span className="text-[11px] text-muted-foreground/80">{nota}</span>
        </button>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        onPointerEnter={sobre}
        onPointerLeave={fuera}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="pulse w-80 gap-0 overflow-hidden p-0"
      >
        <div className="flex items-baseline justify-between border-b px-3.5 py-2.5">
          <span className="text-[13px] font-semibold">{titulo}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{total.toLocaleString("en-US")}</span>
        </div>
        {muestra.length ? (
          <ul className="flex flex-col py-1">
            {muestra.map((f) => (
              <li key={f.id}>
                <Link href={`/pulse/${f.boardSlug}?item=${f.id}`} className="flex items-center gap-2.5 px-3.5 py-2 transition hover:bg-[var(--pulse-hover)]">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground uppercase">{iniciales(f.nombre)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{f.nombre}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{[f.empresa, f.grupo].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{f.marca === "AI Borinquen" ? "AIB" : "LU"}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3.5 py-5 text-center text-xs text-muted-foreground">No hay clientes aquí todavía.</p>
        )}
        {total ? (
          <Link href={`/pulse/clientes?vista=${vista}`} className="flex items-center justify-center gap-1.5 border-t px-3.5 py-2.5 text-xs font-medium text-primary transition hover:bg-[var(--pulse-hover)]">
            {total > muestra.length ? `Ver los ${total.toLocaleString("en-US")}` : "Ver la lista"} <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function iniciales(nombre: string): string {
  const p = nombre.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")) || "·";
}
