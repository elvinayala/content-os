"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, RefreshCw, Search } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LocaleNumero, VentaRow } from "@/lib/types";
import { formatUSD, parseMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

// ¿La celda es un monto? (todos los montos de las hojas traen "$")
function esMonto(v: string): boolean {
  return v.includes("$");
}

function formatearCelda(v: string, locale: LocaleNumero): string {
  return esMonto(v) ? formatUSD(parseMoney(v, locale)) : v;
}

export function VentasTable({
  headers,
  filas,
  locale,
  columnaTransaccion,
}: {
  headers: string[];
  filas: VentaRow[];
  locale: LocaleNumero;
  columnaTransaccion: string;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState<{ col: string; asc: boolean } | null>(null);

  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    let base = filas;
    if (texto) {
      base = filas.filter((f) =>
        Object.values(f).some((v) => v.toLowerCase().includes(texto)),
      );
    }
    if (orden) {
      const { col, asc } = orden;
      base = [...base].sort((a, b) => {
        const va = a[col] ?? "";
        const vb = b[col] ?? "";
        let cmp: number;
        if (esMonto(va) || esMonto(vb)) {
          cmp = parseMoney(va, locale) - parseMoney(vb, locale);
        } else {
          cmp = va.localeCompare(vb, "es", { numeric: true });
        }
        return asc ? cmp : -cmp;
      });
    }
    return base;
  }, [filas, q, orden, locale]);

  function toggleOrden(col: string) {
    setOrden((prev) =>
      prev?.col === col ? { col, asc: !prev.asc } : { col, asc: true },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en la tabla…"
            className="pl-8"
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {filtradas.length} / {filas.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => startTransition(() => router.refresh())}
          disabled={pendiente}
          className="gap-1.5"
        >
          <RefreshCw className={cn("size-4", pendiente && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h) => {
                const activo = orden?.col === h;
                return (
                  <TableHead key={h}>
                    <button
                      type="button"
                      onClick={() => toggleOrden(h)}
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      {h}
                      {activo ? (
                        orden!.asc ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : null}
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((f, i) => (
              <TableRow key={i}>
                {headers.map((h) => {
                  const raw = f[h] ?? "";
                  if (h === columnaTransaccion && raw) {
                    return (
                      <TableCell key={h}>
                        <Badge variant="secondary">{raw}</Badge>
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell
                      key={h}
                      className={cn(esMonto(raw) && "tabular-nums")}
                    >
                      {formatearCelda(raw, locale)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {filtradas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  Sin resultados para “{q}”.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
