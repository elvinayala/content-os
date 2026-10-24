import "server-only";

import { sql } from "drizzle-orm";

import { evento } from "../desempeno/datos";
import { db } from "../pulse/db";
import { pestanasDelMes } from "../resumen-dia";
import type { Empresa } from "./reglas";
import { COLUMNAS_HOJA, valoresParaHoja, type Venta, type VentaNueva } from "./registro-reglas";

// Registro de ventas de la tesorera (19/oct, María García). Tabla chica en SQL directo (como desempeno_trabajos): se
// crea sola la primera vez y queda protegida por la papelera. La Arena la lee en vez de la hoja cuando el mes tiene ventas.

let creada = false;
async function asegurarTabla() {
  if (creada) return;
  const d = await db();
  await d.execute(sql`CREATE TABLE IF NOT EXISTS desempeno_ventas_registro (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa text NOT NULL,
    fecha text NOT NULL,
    cliente text NOT NULL,
    vendedor text NOT NULL,
    agendo text,
    tipo text NOT NULL,
    fuente text NOT NULL,
    anuncio text,
    referido_por text,
    cash double precision NOT NULL DEFAULT 0,
    acuerdo double precision NOT NULL DEFAULT 0,
    metodo text,
    nota text,
    registrado_por uuid,
    creado_el timestamptz NOT NULL DEFAULT now()
  )`);
  await d.execute(sql`CREATE INDEX IF NOT EXISTS desempeno_ventas_registro_emp_fecha ON desempeno_ventas_registro (empresa, fecha)`);
  // Copia en la hoja de tesorería (24/oct): fila donde quedó, o el error si no pasó (se reintenta en el próximo registro).
  await d.execute(sql`ALTER TABLE desempeno_ventas_registro ADD COLUMN IF NOT EXISTS hoja_fila integer, ADD COLUMN IF NOT EXISTS hoja_error text`);
  await d.execute(sql`SELECT pulse_papelera_proteger()`).catch(() => null);
  creada = true;
}

type Fila = { id: string; fecha: string; cliente: string; vendedor: string; agendo: string | null; tipo: string; fuente: string; anuncio: string | null; referido_por: string | null; cash: number; acuerdo: number; metodo: string | null; nota: string | null; registrado_por: string | null; hoja_fila?: number | null; hoja_error?: string | null };
const filas = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? [])) as Fila[];

/** Ventas de una empresa entre dos días (incluidos), de la más nueva a la más vieja. */
export async function ventasRegistradas(empresa: Empresa, desde: string, hasta: string): Promise<Venta[]> {
  await asegurarTabla();
  const d = await db();
  const r = await d.execute(sql`SELECT id, fecha, cliente, vendedor, agendo, tipo, fuente, anuncio, referido_por, cash, acuerdo, metodo, nota, registrado_por, hoja_fila, hoja_error
    FROM desempeno_ventas_registro WHERE empresa = ${empresa} AND fecha >= ${desde} AND fecha <= ${hasta} ORDER BY fecha DESC, creado_el DESC`);
  return filas(r).map(aVenta);
}

const aVenta = (x: Fila): Venta => ({
    id: x.id,
    fecha: x.fecha,
    cliente: x.cliente,
    vendedor: x.vendedor,
    agendo: x.agendo,
    tipo: x.tipo as Venta["tipo"],
    fuente: x.fuente,
    anuncio: x.anuncio,
    referidoPor: x.referido_por,
    cash: Number(x.cash),
    acuerdo: Number(x.acuerdo),
    metodo: x.metodo,
    nota: x.nota,
    registradoPor: x.registrado_por,
    hoja: hojaConectada() ? (x.hoja_fila ? "ok" : x.hoja_error ? "error" : "pendiente") : null,
  });

export async function registrarVenta(empresa: Empresa, v: VentaNueva, actorId: string): Promise<string> {
  await asegurarTabla();
  const d = await db();
  const [n] = filas(await d.execute(sql`INSERT INTO desempeno_ventas_registro (empresa, fecha, cliente, vendedor, agendo, tipo, fuente, anuncio, referido_por, cash, acuerdo, metodo, nota, registrado_por)
    VALUES (${empresa}, ${v.fecha}, ${v.cliente}, ${v.vendedor}, ${v.agendo}, ${v.tipo}, ${v.fuente}, ${v.anuncio}, ${v.referidoPor}, ${v.cash}, ${v.acuerdo}, ${v.metodo}, ${v.nota}, ${actorId}) RETURNING id`));
  await evento({ userId: actorId, actorId, tipo: "venta-registrada", datos: { empresa, fecha: v.fecha, cliente: v.cliente, cash: v.cash, tipo: v.tipo } });
  return n.id;
}

export async function borrarVenta(id: string, empresas: Empresa[], actorId: string) {
  await asegurarTabla();
  const d = await db();
  const [v] = filas(await d.execute(sql`SELECT id, fecha, cliente, cash, tipo, empresa, hoja_fila FROM desempeno_ventas_registro WHERE id = ${id}`)) as (Fila & { empresa: Empresa })[];
  if (!v) throw new Error("Esa venta ya no existe");
  if (!empresas.includes(v.empresa)) throw new Error("Esa venta no es de tu empresa");
  await d.execute(sql`DELETE FROM desempeno_ventas_registro WHERE id = ${id}`);
  if (v.hoja_fila) await quitarDeHoja(v.empresa, id, v.fecha).catch((e) => console.error("[registro→hoja] quitar", e));
  await evento({ userId: actorId, actorId, tipo: "venta-borrada", datos: { empresa: v.empresa, fecha: v.fecha, cliente: v.cliente, cash: Number(v.cash) } });
}

// ─── Copia en la hoja de ventas de tesorería ─────────────────────────────────────────────────────────────────────

const ORDEN_FECHA: Record<Empresa, "mdy" | "dmy"> = { level_up: "mdy", ai_borinquen: "dmy" };
export const hojaConectada = () => !!(process.env.VENTAS_SCRIPT_URL && process.env.VENTAS_SCRIPT_SECRETO);

async function script(cuerpo: Record<string, unknown>): Promise<{ ok?: boolean; fila?: number; error?: string }> {
  const r = await fetch(process.env.VENTAS_SCRIPT_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...cuerpo, secreto: process.env.VENTAS_SCRIPT_SECRETO }),
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  return (await r.json().catch(() => ({ error: `HTTP ${r.status}` }))) as { ok?: boolean; fila?: number; error?: string };
}

/** Pasa a la hoja las ventas de la empresa que todavía no están (las de los últimos 45 días). Una por una, en orden. */
export async function copiarPendientesAHoja(empresa: Empresa): Promise<{ copiadas: number; errores: number }> {
  if (!hojaConectada()) return { copiadas: 0, errores: 0 };
  await asegurarTabla();
  const d = await db();
  const desde = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
  const pend = filas(await d.execute(sql`SELECT id, fecha, cliente, vendedor, agendo, tipo, fuente, anuncio, referido_por, cash, acuerdo, metodo, nota, registrado_por
    FROM desempeno_ventas_registro WHERE empresa = ${empresa} AND hoja_fila IS NULL AND fecha >= ${desde} ORDER BY fecha, creado_el LIMIT 30`));
  let copiadas = 0;
  let errores = 0;
  for (const x of pend) {
    const v = aVenta(x);
    try {
      const r = await script({ accion: "agregar", marca: empresa, buscar: pestanasDelMes(empresa, v.fecha), id: v.id, columnas: COLUMNAS_HOJA, valores: valoresParaHoja(v, ORDEN_FECHA[empresa]) });
      if (!r.ok || !r.fila) throw new Error(r.error ?? "sin respuesta");
      await d.execute(sql`UPDATE desempeno_ventas_registro SET hoja_fila = ${r.fila}, hoja_error = NULL WHERE id = ${v.id}`);
      copiadas++;
    } catch (e) {
      errores++;
      const m = (e instanceof Error ? e.message : String(e)).slice(0, 300);
      await d.execute(sql`UPDATE desempeno_ventas_registro SET hoja_error = ${m} WHERE id = ${v.id}`);
    }
  }
  return { copiadas, errores };
}

/** Quita de la hoja la fila de una venta borrada en Ritmo (la busca por su "ID Ritmo"; nunca toca filas escritas a mano). */
async function quitarDeHoja(empresa: Empresa, id: string, fecha: string) {
  if (!hojaConectada()) return;
  const r = await script({ accion: "quitar", marca: empresa, buscar: pestanasDelMes(empresa, fecha), id });
  if (!r.ok) throw new Error(r.error ?? "sin respuesta");
}
