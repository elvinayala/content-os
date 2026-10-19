import "server-only";

import { sql } from "drizzle-orm";

import { evento } from "../desempeno/datos";
import { db } from "../pulse/db";
import type { Empresa } from "./reglas";
import type { Venta, VentaNueva } from "./registro-reglas";

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
  await d.execute(sql`SELECT pulse_papelera_proteger()`).catch(() => null);
  creada = true;
}

type Fila = { id: string; fecha: string; cliente: string; vendedor: string; agendo: string | null; tipo: string; fuente: string; anuncio: string | null; referido_por: string | null; cash: number; acuerdo: number; metodo: string | null; nota: string | null; registrado_por: string | null };
const filas = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? [])) as Fila[];

/** Ventas de una empresa entre dos días (incluidos), de la más nueva a la más vieja. */
export async function ventasRegistradas(empresa: Empresa, desde: string, hasta: string): Promise<Venta[]> {
  await asegurarTabla();
  const d = await db();
  const r = await d.execute(sql`SELECT id, fecha, cliente, vendedor, agendo, tipo, fuente, anuncio, referido_por, cash, acuerdo, metodo, nota, registrado_por
    FROM desempeno_ventas_registro WHERE empresa = ${empresa} AND fecha >= ${desde} AND fecha <= ${hasta} ORDER BY fecha DESC, creado_el DESC`);
  return filas(r).map((x) => ({
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
  }));
}

export async function registrarVenta(empresa: Empresa, v: VentaNueva, actorId: string) {
  await asegurarTabla();
  const d = await db();
  await d.execute(sql`INSERT INTO desempeno_ventas_registro (empresa, fecha, cliente, vendedor, agendo, tipo, fuente, anuncio, referido_por, cash, acuerdo, metodo, nota, registrado_por)
    VALUES (${empresa}, ${v.fecha}, ${v.cliente}, ${v.vendedor}, ${v.agendo}, ${v.tipo}, ${v.fuente}, ${v.anuncio}, ${v.referidoPor}, ${v.cash}, ${v.acuerdo}, ${v.metodo}, ${v.nota}, ${actorId})`);
  await evento({ userId: actorId, actorId, tipo: "venta-registrada", datos: { empresa, fecha: v.fecha, cliente: v.cliente, cash: v.cash, tipo: v.tipo } });
}

export async function borrarVenta(id: string, empresas: Empresa[], actorId: string) {
  await asegurarTabla();
  const d = await db();
  const [v] = filas(await d.execute(sql`SELECT id, fecha, cliente, cash, tipo, empresa FROM desempeno_ventas_registro WHERE id = ${id}`)) as (Fila & { empresa: Empresa })[];
  if (!v) throw new Error("Esa venta ya no existe");
  if (!empresas.includes(v.empresa)) throw new Error("Esa venta no es de tu empresa");
  await d.execute(sql`DELETE FROM desempeno_ventas_registro WHERE id = ${id}`);
  await evento({ userId: actorId, actorId, tipo: "venta-borrada", datos: { empresa: v.empresa, fecha: v.fecha, cliente: v.cliente, cash: Number(v.cash) } });
}
