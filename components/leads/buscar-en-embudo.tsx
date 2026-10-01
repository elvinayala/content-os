"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { buscarEnEmbudoAction } from "@/app/pulse/(app)/leads/actions";
import { telefonoLegible } from "@/lib/leads/reglas";
import { cn } from "@/lib/utils";

type Resultado = Awaited<ReturnType<typeof buscarEnEmbudoAction>>[number];

/** Buscador de la ficha: busca otro lead del MISMO embudo y salta a su ficha. Enter = ver los resultados en el tablero. */
export function BuscarEnEmbudo({ marcaSlug, embudoId, embudoNombre, actualId }: { marcaSlug: string; embudoId: string; embudoNombre: string; actualId: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Resultado[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) {
      setRes([]);
      return;
    }
    let vigente = true;
    setBuscando(true);
    const t = setTimeout(async () => {
      const r = await buscarEnEmbudoAction(embudoId, texto).catch(() => []);
      if (!vigente) return;
      setRes(r.filter((x) => x.id !== actualId));
      setBuscando(false);
      setAbierto(true);
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [q, embudoId, actualId]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const irA = (id: string) => {
    setAbierto(false);
    setQ("");
    router.push(`/pulse/leads/${marcaSlug}/${id}`);
  };

  return (
    <div ref={caja} className="relative ml-auto w-full max-w-72">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.trim().length >= 2 && setAbierto(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAbierto(false);
          if (e.key === "Enter" && q.trim()) {
            if (res.length === 1) irA(res[0].id);
            else router.push(`/pulse/leads/${marcaSlug}?embudo=${embudoId}&q=${encodeURIComponent(q.trim())}`);
          }
        }}
        placeholder={`Buscar en ${embudoNombre}: nombre o teléfono…`}
        aria-label={`Buscar en ${embudoNombre}`}
        className="h-8 w-full rounded-md border bg-background pl-8 pr-7 text-sm outline-none focus:ring-2 focus:ring-[#08a742]/40"
      />
      {q && (
        <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setQ("")} aria-label="Borrar búsqueda">
          <X className="size-3.5 text-muted-foreground" />
        </button>
      )}
      {abierto && q.trim().length >= 2 && (
        <div className="absolute right-0 z-50 mt-1 max-h-80 w-full min-w-72 overflow-y-auto rounded-md border bg-background p-1 shadow-lg">
          {buscando && !res.length ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Buscando…</p>
          ) : !res.length ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Nada en {embudoNombre} con “{q.trim()}”.</p>
          ) : (
            res.map((r) => (
              <button key={r.id} onClick={() => irA(r.id)} className="flex w-full cursor-pointer flex-col rounded px-2 py-1.5 text-left hover:bg-muted">
                <span className="truncate text-sm font-medium">{r.nombre}</span>
                <span className={cn("truncate text-xs text-muted-foreground")}>
                  {[telefonoLegible(r.telefono), r.etapa, r.estado !== "abierto" ? r.estado : null].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
