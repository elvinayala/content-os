import "server-only";

import { and, eq, inArray } from "drizzle-orm";

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
  estrategaId: string | null;
  grupo: string;
  industria: string | null;
  pueblo: string | null;
  fechaPago: string | null;
}

// `todos`: también los que están arrancando (ONBOARDING & SETUP, ANÁLISIS Y ESTRATEGIA…), menos las bajas. Lo usa la
// alerta de "plan listo" de #office-5-revision-estrategica (lib/estrategia/plan-listo.ts).
export async function clientesParaRevision({ todos = false }: { todos?: boolean } = {}): Promise<ClienteRevision[]> {
  const d = await db();
  const [board] = await d.select({ id: pulseBoards.id }).from(pulseBoards).where(eq(pulseBoards.slug, "level-up-media"));
  if (!board) return [];
  const [columnas, gruposTodos] = await Promise.all([
    d.select({ id: pulseColumns.id, title: pulseColumns.title, type: pulseColumns.type, settings: pulseColumns.settings }).from(pulseColumns).where(eq(pulseColumns.boardId, board.id)),
    d.select({ id: pulseGroups.id, title: pulseGroups.title }).from(pulseGroups).where(eq(pulseGroups.boardId, board.id)),
  ]);
  const grupos = gruposTodos.filter((g) => (todos ? !/offboard|baja/i.test(g.title) : g.title === "CLIENTE ACTIVO"));
  if (!grupos.length) return [];
  const nombreGrupo = new Map(grupos.map((g) => [g.id, g.title]));
  const items = await d.select({ id: pulseItems.id, name: pulseItems.name, values: pulseItems.values, groupId: pulseItems.groupId }).from(pulseItems).where(and(eq(pulseItems.boardId, board.id), inArray(pulseItems.groupId, grupos.map((g) => g.id))));
  const col = (re: RegExp) => columnas.find((c) => re.test(c.title));
  const cEmpresa = col(/^empresa$/i), cId = col(/^id cuenta publicitaria$/i), cAcuerdo = col(/^acuerdo de pago$/i), cPago = col(/^pago inicial$/i);
  const cServicio = col(/^tipo de servicio$/i), cInicio = col(/^fecha de inicio$/i), cProximo = col(/^fecha pr[oó]ximo reporte$/i);
  const cIndustria = col(/^industria$/i), cPueblo = col(/^pueblo/i), cFechaPago = col(/^fecha del pago inicial$/i);
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
        estrategaId: est.get(i.id)?.id ?? null,
        grupo: nombreGrupo.get(i.groupId) ?? "",
        industria: etiqueta(cIndustria, v),
        pueblo: texto(cPueblo, v),
        fechaPago: texto(cFechaPago, v),
      };
    })
    .filter((c) => !/^landing/i.test(c.servicio ?? "")); // sin pauta (solo landing page): no hay anuncios que revisar
}
