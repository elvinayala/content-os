import "server-only";

import type { SnapshotVentasEA } from "@/lib/types";

// EA Market en vivo: los mismos Google Sheets públicos (gviz) que alimentan el
// dashboard-ea-market.netlify.app. Sin login. La métrica principal es el
// CASH COLLECTED (dinero que realmente entró) = columna "Pago inicial" (G) de
// cada pestaña mensual, sumando SOLO las filas con fecha válida (así se ignora
// la sección de totales/metas del pie, que antes inflaba el número ~4×).
//
// Estructura de cada pestaña (idéntica en LU y AIB):
//   col 0 = Fecha de venta · col 6 = Pago inicial (cash collected) · col 9 = Valor Neto
// Pestañas: LU "LUM Sales <Mes> <Año>" (formato US) · AIB "<Mes>" (formato EU).

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const COL = { fecha: 0, pagoInicial: 6, valorNeto: 9 };

const VENTAS = {
  levelUp: {
    id: "1zKa1NBwE9TLQ8_PDFwAR_JneMHBDW8kVwEVtQboRLTU",
    tab: (y: number, m: number) => `LUM Sales ${MESES[m - 1]} ${y}`,
  },
  aiBorinquen: {
    id: "1A99WUgPFouujA-26K90VCA7PuuEWQAL5PHFMjKIQkQ8",
    tab: (_y: number, m: number) => MESES[m - 1], // pestañas solo por mes
  },
};

// ROAS mínimo saludable: por debajo → reunión con el equipo de marketing.
const UMBRAL_ROAS = 4;

// Hojas de GASTOS: la categoría "Anuncios" sale de estas pestañas (por gid
// mensual, igual que el dashboard). Para un mes nuevo, agregá su gid acá.
const GASTOS = {
  levelUp: {
    id: "1bNbvKZjVG1vAu8QmhbxdWDb8hPqKUAdknWaw_HjDEdI",
    gids: {
      "2025-10": "960883744", "2025-11": "1684346844", "2025-12": "1721183804",
      "2026-01": "82805865", "2026-02": "1215775422", "2026-03": "977296678",
      "2026-04": "1346981244", "2026-05": "1366226569", "2026-06": "278814196",
    } as Record<string, string>,
  },
  aiBorinquen: {
    id: "1QAIA9LfZVVqcGXjSKsPoEHeh3BpOR9CFsOwQdBL4QIo",
    gids: {
      "2025-10": "960883744", "2025-11": "1494683669", "2025-12": "1488967424",
      "2026-01": "1632455336", "2026-02": "1025367417", "2026-03": "442627465",
      "2026-04": "1862765178", "2026-05": "1436167154", "2026-06": "778408060",
    } as Record<string, string>,
  },
};

interface GvizCell {
  v?: string | number | null;
  f?: string | null;
}
interface GvizResp {
  table?: {
    cols?: { label?: string }[];
    rows?: { c?: (GvizCell | null)[] }[];
  };
}

const norm = (s: string) => String(s).toLowerCase().replace(/\s+/g, " ").trim();

function toNumber(v: string): number {
  if (!v) return 0;
  let s = String(v).trim().replace(/[^0-9.,-]/g, "");
  if (!s) return 0;
  const hd = s.includes("."), hc = s.includes(",");
  if (hd && hc) {
    if (s.lastIndexOf(",") > s.lastIndexOf("."))
      s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hc) {
    const p = s.split(",");
    if (p.length > 2 || (p[1] && p[1].length === 3)) s = s.replace(/,/g, "");
    else s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Una celda es "de datos" si su col 0 es una fecha (Date(...), dd-Mmm-yyyy,
// dd/mm/yyyy, yyyy-mm-dd). Las filas de totales del pie NO tienen fecha ahí.
function esFecha(v: string): boolean {
  const f = String(v);
  return (
    /Date\(\d+/.test(f) ||
    /^\d{1,2}[-/ ][A-Za-z0-9]/.test(f) ||
    /^\d{4}-\d{2}-\d{2}/.test(f)
  );
}

function parseGviz(texto: string): GvizResp | null {
  const i = texto.indexOf("(");
  const j = texto.lastIndexOf(")");
  if (i < 0 || j <= i) return null;
  try {
    return JSON.parse(texto.slice(i + 1, j)) as GvizResp;
  } catch {
    return null;
  }
}

const cell = (c: GvizCell | null | undefined): string => {
  if (!c) return "";
  if (c.f != null) return String(c.f).trim();
  if (c.v != null) return String(c.v).trim();
  return "";
};

interface TotalMes {
  cashCollected: number;
  valorNeto: number;
  ventas: number;
}

// Lee una pestaña mensual → cash collected (col G) + valor neto (col J),
// sumando SOLO filas con fecha en col A. null si la pestaña no existe/está vacía.
async function leerTab(id: string, tab: string): Promise<TotalMes | null> {
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const table = parseGviz(await res.text())?.table;
  if (!table?.rows) return null;

  let cashCollected = 0;
  let valorNeto = 0;
  let ventas = 0;
  for (const r of table.rows) {
    if (!esFecha(cell(r.c?.[COL.fecha]))) continue; // ignora totales del pie
    const cc = toNumber(cell(r.c?.[COL.pagoInicial]));
    const vn = toNumber(cell(r.c?.[COL.valorNeto]));
    if (cc > 0 || vn > 0) {
      cashCollected += cc;
      valorNeto += vn;
      ventas += 1;
    }
  }
  return ventas > 0 ? { cashCollected, valorNeto, ventas } : null;
}

// --- Gasto en anuncios (categoría "Anuncios" de las hojas de gastos) ---
async function anunciosTab(id: string, gid: string): Promise<number | null> {
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&gid=${gid}`;
  const res = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const table = parseGviz(await res.text())?.table;
  if (!table?.cols || !table.rows) return null;
  const grid = [
    table.cols.map((c) => (c.label ?? "").trim()),
    ...table.rows.map((r) => table.cols!.map((_, i) => cell(r.c?.[i]))),
  ];
  const hi = grid.findIndex((row) => row.some((c) => norm(c).includes("mes completo")));
  if (hi < 0) return null;
  const ci = grid[hi].findIndex((c) => norm(c).includes("mes completo"));
  const body = grid.slice(hi + 1);
  const otrosIdx = body.findIndex((r) => norm(r[0]) === "otros");
  if (otrosIdx < 0) return null;
  let anuncios = 0;
  body.forEach((r, idx) => {
    if (idx <= otrosIdx) return;
    const val = toNumber(r[ci] ?? "");
    if (val > 0 && /anuncio|ads|publicidad|meta|facebook/.test(norm(r[0] ?? "")))
      anuncios += val;
  });
  return anuncios;
}

async function adSpendMes(clave: string): Promise<number | null> {
  const gLU = GASTOS.levelUp.gids[clave];
  const gAIB = GASTOS.aiBorinquen.gids[clave];
  if (!gLU && !gAIB) return null;
  const [lu, aib] = await Promise.all([
    gLU ? anunciosTab(GASTOS.levelUp.id, gLU).catch(() => null) : null,
    gAIB ? anunciosTab(GASTOS.aiBorinquen.id, gAIB).catch(() => null) : null,
  ]);
  if (lu == null && aib == null) return null;
  return (lu ?? 0) + (aib ?? 0);
}

export async function leerVentasEAlive(): Promise<SnapshotVentasEA | null> {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1; // 1-12

  // Todos los meses de 2026 hasta hoy (para el YTD) — el display muestra los últimos 4.
  const periodos: { y: number; m: number }[] = [];
  for (let m = 1; m <= mesActual; m++) periodos.push({ y: anio, m });

  try {
    const meses = await Promise.all(
      periodos.map(async ({ y, m }) => {
        const clave = `${y}-${String(m).padStart(2, "0")}`;
        const [lu, aib, adSpend] = await Promise.all([
          leerTab(VENTAS.levelUp.id, VENTAS.levelUp.tab(y, m)).catch(() => null),
          leerTab(VENTAS.aiBorinquen.id, VENTAS.aiBorinquen.tab(y, m)).catch(() => null),
          adSpendMes(clave).catch(() => null),
        ]);
        const ccLU = lu?.cashCollected ?? null;
        const ccAIB = aib?.cashCollected ?? null;
        const total = (ccLU ?? 0) + (ccAIB ?? 0);
        const valorNeto = (lu?.valorNeto ?? 0) + (aib?.valorNeto ?? 0);
        // ROAS = cash collected (dinero real) / gasto en anuncios.
        const roas =
          adSpend && adSpend > 0 ? Math.round((total / adSpend) * 10) / 10 : null;
        return {
          mes: `${MESES[m - 1]} ${y}`,
          levelUp: ccLU,
          aiBorinquen: ccAIB,
          total,
          valorNeto,
          adSpend: adSpend ?? null,
          roas,
        };
      }),
    );

    if (meses.every((x) => x.levelUp == null && x.aiBorinquen == null)) return null;

    // Acumulado del año (YTD).
    const ytd = meses.reduce(
      (acc, m) => ({
        anio,
        levelUp: acc.levelUp + (m.levelUp ?? 0),
        aiBorinquen: acc.aiBorinquen + (m.aiBorinquen ?? 0),
        total: acc.total + m.total,
        valorNeto: acc.valorNeto + (m.valorNeto ?? 0),
      }),
      { anio, levelUp: 0, aiBorinquen: 0, total: 0, valorNeto: 0 },
    );

    return {
      actualizadoEl: new Date().toISOString(),
      fuente: "EA Market (Google Sheets)",
      // El display muestra los últimos 4 meses; el YTD tiene el acumulado.
      meses: meses.slice(-4),
      ytd,
      umbralRoas: UMBRAL_ROAS,
    };
  } catch {
    return null;
  }
}
