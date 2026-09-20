import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  Agencia,
  DashboardAgencia,
  KpisVentas,
  LtvCliente,
  MetricasAgencia,
  MetricasNegocio,
  VentaRow,
} from "@/lib/types";
import { fetchSheet } from "@/lib/sheets";
import { parseMoney } from "@/lib/format";

const METRICAS_PATH = path.join(process.cwd(), "data", "metricas.json");

// Lee las métricas de negocio (CAC/LTV/Churn) que calcula la tesorera.
// Están en data/metricas.json por agencia; se actualizan el 1 de cada mes.
export async function leerMetricasNegocio(
  agenciaId: string,
): Promise<MetricasNegocio | null> {
  try {
    const raw = await fs.readFile(METRICAS_PATH, "utf-8");
    const todas = JSON.parse(raw) as Record<string, MetricasNegocio>;
    return todas[agenciaId] ?? null;
  } catch {
    return null;
  }
}

// Snapshot del xlsx `metricas clientes actualizada.xlsx` (pestaña JUNIO).
// Se usa mientras la tesorera no publique su libro de métricas como Google Sheet.
// churn/ltvPromedio quedan null acá y se derivan de las ventas más abajo.
const FALLBACK: Record<
  string,
  Pick<MetricasAgencia, "cac" | "clientesNuevos" | "costoTotalAdquisicion" | "churn">
> = {
  "level-up": {
    cac: 1546.28,
    clientesNuevos: 20,
    costoTotalAdquisicion: 30925.5,
    churn: null,
  },
};

// KPIs de cabecera desde el libro de ventas.
function calcularKpis(filas: VentaRow[], a: Agencia): KpisVentas {
  const totalFacturado = filas.reduce(
    (acc, f) => acc + parseMoney(f[a.columnas.neto] ?? "", a.locale),
    0,
  );
  const clientes = new Set(
    filas.map((f) => (f[a.columnas.cliente] ?? "").trim()).filter(Boolean),
  );
  const cantidadVentas = filas.length;
  return {
    totalFacturado,
    cantidadVentas,
    clientesUnicos: clientes.size,
    ticketPromedio: cantidadVentas ? totalFacturado / cantidadVentas : 0,
  };
}

// LTV por cliente = suma del valor neto agrupado por cliente (derivado de ventas).
function derivarLtv(filas: VentaRow[], a: Agencia): LtvCliente[] {
  const mapa = new Map<string, number>();
  for (const f of filas) {
    const cliente = (f[a.columnas.cliente] ?? "").trim();
    if (!cliente) continue;
    const neto = parseMoney(f[a.columnas.neto] ?? "", a.locale);
    mapa.set(cliente, (mapa.get(cliente) ?? 0) + neto);
  }
  return [...mapa.entries()]
    .map(([cliente, total]) => ({ cliente, total }))
    .sort((x, y) => y.total - x.total);
}

// Lee un número junto a una etiqueta en la hoja de métricas (búsqueda tolerante).
// Ej.: encuentra la fila donde alguna celda dice "CAC" y toma el número de la fila.
function valorPorEtiqueta(
  filas: VentaRow[],
  etiquetas: string[],
  locale: Agencia["locale"],
): number | null {
  const norm = (s: string) => s.toLowerCase().trim();
  const objetivo = etiquetas.map(norm);
  for (const f of filas) {
    const valores = Object.values(f);
    const hit = valores.some((v) => objetivo.includes(norm(v)));
    if (!hit) continue;
    // primer número parseable de la fila
    for (const v of valores) {
      const n = parseMoney(v, locale);
      if (n) return n;
    }
  }
  return null;
}

// Arma el dashboard completo de una agencia: ventas + KPIs + LTV + métricas.
// Nunca tira: si falla la hoja, devuelve el objeto con `error` y todo en cero.
export async function armarDashboardAgencia(
  a: Agencia,
): Promise<DashboardAgencia> {
  const negocio = await leerMetricasNegocio(a.id);
  try {
    const hoja = await fetchSheet(a.ventas.sheetId, a.ventas.gid);
    const kpis = calcularKpis(hoja.filas, a);
    const ltvPorCliente = derivarLtv(hoja.filas, a);
    const ltvPromedio = kpis.clientesUnicos
      ? kpis.totalFacturado / kpis.clientesUnicos
      : null;

    const metricas = await leerMetricas(a, ltvPorCliente, ltvPromedio);

    return {
      agencia: a,
      headers: hoja.headers,
      filas: hoja.filas,
      kpis,
      metricas,
      negocio,
    };
  } catch (e) {
    return {
      agencia: a,
      headers: [],
      filas: [],
      kpis: {
        totalFacturado: 0,
        cantidadVentas: 0,
        clientesUnicos: 0,
        ticketPromedio: 0,
      },
      metricas: {
        fuente: "fallback",
        cac: FALLBACK[a.id]?.cac ?? null,
        ltvPromedio: null,
        churn: FALLBACK[a.id]?.churn ?? null,
        clientesNuevos: FALLBACK[a.id]?.clientesNuevos ?? null,
        costoTotalAdquisicion: FALLBACK[a.id]?.costoTotalAdquisicion ?? null,
        ltvPorCliente: [],
      },
      negocio,
      error: e instanceof Error ? e.message : "Error leyendo la hoja",
    };
  }
}

// Lee CAC/LTV/Churn de la hoja de métricas de la tesorera si está configurada;
// si no, usa el snapshot de fallback. ltvPorCliente siempre se deriva de ventas.
async function leerMetricas(
  a: Agencia,
  ltvPorCliente: LtvCliente[],
  ltvPromedioDerivado: number | null,
): Promise<MetricasAgencia> {
  if (a.metricas?.sheetId) {
    try {
      const ref = a.metricas;
      const [cacHoja, churnHoja] = await Promise.all([
        fetchSheet(ref.sheetId, ref.gidCac ?? ref.gid),
        ref.gidChurn
          ? fetchSheet(ref.sheetId, ref.gidChurn)
          : Promise.resolve({ headers: [], filas: [] }),
      ]);
      const cac = valorPorEtiqueta(cacHoja.filas, ["CAC"], a.locale);
      const churn = valorPorEtiqueta(
        churnHoja.filas,
        ["Churn", "Chrun", "CHURN"],
        a.locale,
      );
      return {
        fuente: "hoja",
        cac,
        churn,
        ltvPromedio: ltvPromedioDerivado,
        clientesNuevos: FALLBACK[a.id]?.clientesNuevos ?? null,
        costoTotalAdquisicion: FALLBACK[a.id]?.costoTotalAdquisicion ?? null,
        ltvPorCliente,
      };
    } catch {
      // cae al fallback de abajo
    }
  }

  const fb = FALLBACK[a.id];
  return {
    fuente: "fallback",
    cac: fb?.cac ?? null,
    churn: fb?.churn ?? null,
    ltvPromedio: ltvPromedioDerivado,
    clientesNuevos: fb?.clientesNuevos ?? null,
    costoTotalAdquisicion: fb?.costoTotalAdquisicion ?? null,
    ltvPorCliente,
  };
}
