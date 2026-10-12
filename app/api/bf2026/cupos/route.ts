import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/lib/pulse/db";
import { filasDe } from "@/lib/pulse/storage";
import { secretoValido } from "@/lib/pulse/seguridad";

// Contador de cupos REAL de las landings de Black Friday 2026 (demos/bf2026/).
//   GET  ?marca=lu|aib|bori → { ok, total, quedan }  (público, CORS abierto, caché 60 s)
//   POST { marca, vendidos?, total? } con ?s=CRON_SECRET → actualiza LU/AIB (lo corre
//        `node scripts/bf2026.mjs cupos <marca> <vendidos>` cuando tesorería registra una venta).
// Bori no se guarda aquí: sale de Stripe (heybori.ai /api/fundador/cupos, cupos de fundador).
// Si algo falla → { ok:false } y la landing esconde el contador (nunca un número inventado).
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Cache-Control": "public, max-age=60" };
const TOTAL_INICIAL: Record<string, number> = { lu: 12, aib: 8 }; // aprobado por Elvin (plan BF2026, 11/oct)
const json = (b: unknown, status = 200) => NextResponse.json(b, { status, headers: CORS });

let lista = false;
async function d() {
  const x = await db();
  if (!lista) {
    await x.execute(sql`CREATE TABLE IF NOT EXISTS bf2026_cupos (marca text PRIMARY KEY, total int NOT NULL, vendidos int NOT NULL DEFAULT 0, actualizado timestamptz NOT NULL DEFAULT now())`);
    await x.execute(sql`SELECT pulse_papelera_proteger()`).catch(() => null);
    lista = true;
  }
  return x;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const marca = req.nextUrl.searchParams.get("marca") ?? "";
  try {
    if (marca === "bori") {
      const r = await fetch("https://www.heybori.ai/api/fundador/cupos", { signal: AbortSignal.timeout(5000), next: { revalidate: 60 } });
      const j = (await r.json()) as { ok?: boolean; total?: number; quedan?: number | null };
      return j.ok && typeof j.quedan === "number" ? json({ ok: true, total: j.total, quedan: j.quedan }) : json({ ok: false });
    }
    if (!(marca in TOTAL_INICIAL)) return json({ ok: false, error: "marca" }, 400);
    const x = await d();
    const f = filasDe<{ total: number; vendidos: number }>(await x.execute(sql`select total, vendidos from bf2026_cupos where marca = ${marca}`))[0];
    const total = f?.total ?? TOTAL_INICIAL[marca];
    const vendidos = f?.vendidos ?? 0;
    return json({ ok: true, total, quedan: Math.max(0, total - vendidos) });
  } catch (e) {
    console.warn("[bf2026] cupos:", (e as Error).message);
    return json({ ok: false });
  }
}

export async function POST(req: NextRequest) {
  if (!secretoValido(req.nextUrl.searchParams.get("s") ?? req.headers.get("x-cron-secret"), process.env.CRON_SECRET)) return json({ error: "no" }, 401);
  const b = (await req.json().catch(() => ({}))) as { marca?: string; vendidos?: number; total?: number };
  const marca = String(b.marca ?? "");
  if (!(marca in TOTAL_INICIAL)) return json({ error: "marca" }, 400);
  const vendidos = Math.max(0, Math.floor(Number(b.vendidos ?? 0)) || 0);
  const total = b.total != null ? Math.max(1, Math.floor(Number(b.total)) || TOTAL_INICIAL[marca]) : null;
  const x = await d();
  await x.execute(sql`insert into bf2026_cupos (marca, total, vendidos) values (${marca}, ${total ?? TOTAL_INICIAL[marca]}, ${vendidos})
    on conflict (marca) do update set vendidos = excluded.vendidos, total = coalesce(${total}, bf2026_cupos.total), actualizado = now()`);
  const f = filasDe<{ total: number; vendidos: number }>(await x.execute(sql`select total, vendidos from bf2026_cupos where marca = ${marca}`))[0];
  return json({ ok: true, marca, total: f.total, vendidos: f.vendidos, quedan: Math.max(0, f.total - f.vendidos) });
}
