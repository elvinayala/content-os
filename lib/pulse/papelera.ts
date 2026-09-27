import "server-only";

import { and, desc, gte, isNull, lt, sql } from "drizzle-orm";

import { db, type DbPulse } from "./db";
import { agruparLotes, archivosDelLote, DIAS_PAPELERA, ordenRestaurar, tablaValida, type FilaPapelera, type Lote } from "./papelera-reglas";
import { pulsePapelera } from "./schema";
import { filasDe, purgarArchivosPapelera, restaurarArchivos } from "./storage";

type Tx = Parameters<Parameters<DbPulse["transaction"]>[0]>[0];

// Corre `fn` en una transacción marcada con quién borra: el trigger de la papelera lo guarda en
// borrado_por. Devuelve también el lote (hora de la transacción) para poder deshacer.
export async function borrarComo<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<{ resultado: T; lote: string }> {
  const d = await db();
  return d.transaction(async (tx) => {
    const [r] = filasDe<{ ahora: string }>(await tx.execute(sql`select set_config('app.usuario', ${userId}, true), now()::text as ahora`));
    const resultado = await fn(tx);
    return { resultado, lote: new Date(r.ahora).toISOString() };
  });
}

// Postgres guarda microsegundos y JS milisegundos: un lote = su milisegundo.
function delLote(lote: string) {
  const t = new Date(lote);
  return and(gte(pulsePapelera.borradoAt, t), lt(pulsePapelera.borradoAt, new Date(t.getTime() + 1)));
}

function aFila(r: typeof pulsePapelera.$inferSelect): FilaPapelera {
  return {
    id: r.id,
    tabla: r.tabla,
    fila: r.fila as Record<string, unknown>,
    borradoAt: r.borradoAt.toISOString(),
    borradoPor: r.borradoPor,
    restauradoAt: r.restauradoAt ? r.restauradoAt.toISOString() : null,
  };
}

export async function listarLotes(p: { dias?: number; limiteFilas?: number } = {}): Promise<Lote[]> {
  const d = await db();
  const desde = new Date(Date.now() - (p.dias ?? DIAS_PAPELERA) * 86_400_000);
  const filas = await d
    .select()
    .from(pulsePapelera)
    .where(gte(pulsePapelera.borradoAt, desde))
    .orderBy(desc(pulsePapelera.borradoAt))
    .limit(p.limiteFilas ?? 5000);
  return agruparLotes(filas.map(aFila));
}

export async function leerLote(lote: string): Promise<Lote | null> {
  const d = await db();
  const filas = await d.select().from(pulsePapelera).where(delLote(lote));
  return agruparLotes(filas.map(aFila))[0] ?? null;
}

// Vuelve a insertar todas las filas del lote (padres primero, varias vueltas por las FK), sin pisar
// nada que ya exista (on conflict do nothing), y trae de vuelta sus archivos.
export async function restaurarLote(lote: string, actorId: string): Promise<{ restauradas: number; fallidas: number; archivos: number }> {
  const d = await db();
  const filas = (await d.select().from(pulsePapelera).where(and(delLote(lote), isNull(pulsePapelera.restauradoAt)))).map(aFila);
  if (!filas.length) return { restauradas: 0, fallidas: 0, archivos: 0 };
  let pendientes = [...filas].sort((a, b) => ordenRestaurar(a.tabla) - ordenRestaurar(b.tabla));
  const hechas: number[] = [];
  await d.transaction(async (tx) => {
    for (let vuelta = 0; vuelta < 6 && pendientes.length; vuelta++) {
      const fallan: FilaPapelera[] = [];
      for (const f of pendientes) {
        if (!tablaValida(f.tabla)) continue;
        try {
          await tx.transaction(async (s) => {
            await s.execute(sql`insert into ${sql.identifier(f.tabla)} select * from jsonb_populate_record(null::${sql.identifier(f.tabla)}, ${JSON.stringify(f.fila)}::jsonb) on conflict do nothing`);
          });
          hechas.push(f.id);
        } catch {
          fallan.push(f);
        }
      }
      if (fallan.length === pendientes.length) break; // nada avanzó
      pendientes = fallan;
    }
    for (let i = 0; i < hechas.length; i += 500) {
      const ids = hechas.slice(i, i + 500);
      await tx.execute(sql`update pulse_papelera set restaurado_at = now(), restaurado_por = ${actorId} where id = any(${`{${ids.join(",")}}`}::bigint[])`);
    }
  });
  const archivos = await restaurarArchivos(archivosDelLote(filas.filter((f) => hechas.includes(f.id)))).catch(() => 0);
  return { restauradas: hechas.length, fallidas: filas.length - hechas.length, archivos };
}

// Lo que lleva más de 90 días se va de verdad (filas y archivos). Lo llama el respaldo diario, que
// antes ya dejó la base copiada en varios lugares.
export async function purgarPapelera(dias = DIAS_PAPELERA): Promise<{ filas: number; archivos: number }> {
  const d = await db();
  const limite = new Date(Date.now() - dias * 86_400_000);
  const borradas = await d.delete(pulsePapelera).where(lt(pulsePapelera.borradoAt, limite)).returning({ id: pulsePapelera.id });
  const archivos = await purgarArchivosPapelera(dias).catch(() => 0);
  return { filas: borradas.length, archivos };
}

// Pone la papelera y el bloqueo de TRUNCATE en cualquier tabla nueva. Devuelve cuántas protegió hoy.
export async function protegerTablasNuevas(): Promise<number> {
  const d = await db();
  const [r] = filasDe<{ n: number }>(await d.execute(sql`select pulse_papelera_proteger() as n`));
  return Number(r?.n ?? 0);
}
