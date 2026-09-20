"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { Gancho } from "@/lib/types";
import { GanchoCard } from "@/components/sections/gancho-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  ganchos: Gancho[];
  nichos: string[];
  tipos: string[];
}

const TODOS = "__todos__";

export function GanchosExplorer({ ganchos, nichos, tipos }: Props) {
  const [q, setQ] = useState("");
  const [nicho, setNicho] = useState<string>(TODOS);
  const [tipo, setTipo] = useState<string>(TODOS);
  const [orden, setOrden] = useState<"vistas" | "recientes">("vistas");

  const visibles = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ganchos
      .filter((g) => {
        if (nicho !== TODOS && g.nicho !== nicho) return false;
        if (tipo !== TODOS && g.tipo !== tipo) return false;
        if (
          term &&
          !(
            g.titulo.toLowerCase().includes(term) ||
            g.plantilla.toLowerCase().includes(term) ||
            g.transcripto.toLowerCase().includes(term) ||
            g.fuente.toLowerCase().includes(term)
          )
        )
          return false;
        return true;
      })
      .sort((a, b) =>
        orden === "vistas"
          ? b.vistas - a.vistas
          : b.guardadoEl.localeCompare(a.guardadoEl),
      );
  }, [ganchos, q, nicho, tipo, orden]);

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar gancho, plantilla o creador..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={nicho} onValueChange={setNicho}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Nicho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los nichos</SelectItem>
              {nichos.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Tipo de gancho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los tipos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={orden}
            onValueChange={(v) => setOrden(v as "vistas" | "recientes")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vistas">Más vistas</SelectItem>
              <SelectItem value="recientes">Más recientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {visibles.length} {visibles.length === 1 ? "gancho" : "ganchos"}
      </p>

      {visibles.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay ganchos que coincidan con el filtro.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((g) => (
            <GanchoCard key={g.id} gancho={g} />
          ))}
        </div>
      )}
    </div>
  );
}
