import "server-only";

import { and, eq } from "drizzle-orm";

import { estrategas } from "@/lib/pulse/cuentas-meta";
import { limpiarId } from "@/lib/pulse/cuentas-meta-reglas";
import { db } from "@/lib/pulse/db";
import { pulseBoards, pulseColumns, pulseGroups, pulseItems } from "@/lib/pulse/schema";
import type { ValorCelda } from "@/lib/pulse/types";

// Los clientes que Max revisa para Elvin (15/oct/2026): CLIENTE ACTIVO de LEVEL UP MEDIA con lo que hace falta para
// la cadencia (acuerdo y pago inicial) y para leer sus anuncios (cuenta publicitaria). Lo pide
// scripts/revision-clientes.mjs por GET /api/max?revision=1 (Max corre en Railway, sin base de datos).
// Solo lectura y solo estos campos: nada de comentarios, teléfonos, correos ni montos que no sean el acuerdo.

export interface ClienteRevision {
  itemId: string;
  nombre: string;
  empresa: string | null;
  cuentaId: string | null;
  acuerdo: string | null;
  pagoInicial: number | null;
  servicio: string | null;
  fechaInicio: string | null;
  proximoReporte: string | null;
  estratega: string | null;
}

export async function clientesParaRevision(): Promise<ClienteRevision[]> {
  const d = await db();
  const [board] = await d.select({ id: pulseBoards.id }).from(pulseBoards).where(eq(pulseBoards.slug, "level-up-media"));
  if (!board) return [];
  const [columnas, [grupo]] = await Promise.all([
    d.select({ id: pulseColumns.id, title: pulseColumns.title, type: pulseColumns.type, settings: pulseColumns.settings }).from(pulseColumns).where(eq(pulseColumns.boardId, board.id)),
    d.select({ id: pulseGroups.id }).from(pulseGroups).where(and(eq(pulseGroups.boardId, board.id), eq(pulseGroups.title, "CLIENTE ACTIVO"))),
  ]);
  if (!grupo) return [];
  const items = await d.select({ id: pulseItems.id, name: pulseItems.name, values: pulseItems.values }).from(pulseItems).where(and(eq(pulseItems.boardId, board.id), eq(pulseItems.groupId, grupo.id)));
  const col = (re: RegExp) => columnas.find((c) => re.test(c.title));
  const cEmpresa = col(/^empresa$/i), cId = col(/^id cuenta publicitaria$/i), cAcuerdo = col(/^acuerdo de pago$/i), cPago = col(/^pago inicial$/i);
  const cServicio = col(/^tipo de servicio$/i), cInicio = col(/^fecha de inicio$/i), cProximo = col(/^fecha pr[oó]ximo reporte$/i);
  const texto = (c: (typeof columnas)[number] | undefined, v: Record<string, ValorCelda>) => {
    const x = c ? v[c.id] : null;
    return typeof x === "string" && x.trim() ? x.trim() : null;
  };
  const etiqueta = (c: (typeof columnas)[number] | undefined, v: Record<string, ValorCelda>) => {
    if (!c) return null;
    const x = v[c.id];
    const id = Array.isArray(x) ? x[0] : x;
    return ((c.settings as { labels?: { id: string; label: string }[] } | null)?.labels ?? []).find((l) => l.id === id)?.label ?? null;
  };
  const est = await estrategas(items.map((i) => ({ id: i.id, name: i.name, empresa: texto(cEmpresa, i.values as Record<string, ValorCelda>) })));
  return items
    .map((i) => {
      const v = (i.values ?? {}) as Record<string, ValorCelda>;
      const pago = cPago ? v[cPago.id] : null;
      return {
        itemId: i.id,
        nombre: i.name,
        empresa: texto(cEmpresa, v),
        cuentaId: cId ? limpiarId(v[cId.id]) : null,
        acuerdo: texto(cAcuerdo, v),
        pagoInicial: typeof pago === "number" ? pago : null,
        servicio: etiqueta(cServicio, v),
        fechaInicio: texto(cInicio, v),
        proximoReporte: texto(cProximo, v),
        estratega: est.get(i.id)?.nombre ?? null,
      };
    })
    .filter((c) => !/^landing/i.test(c.servicio ?? "")); // sin pauta (solo landing page): no hay anuncios que revisar
}
