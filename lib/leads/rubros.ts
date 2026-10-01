import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/lib/pulse/db";

import { claveRubro, errorRubroNuevo, normalizarRubro, unirCatalogo } from "./rubros-reglas";

// Etiquetas de rubro que crea la dirección (Aure, 1/oct). Tabla chica en SQL directo, como desempeno_puestos_extra:
// se crea sola la primera vez y queda protegida por la papelera. La semilla vive en el código.
let creada = false;
async function asegurarTabla() {
  if (creada) return;
  const d = await db();
  await d.execute(sql`CREATE TABLE IF NOT EXISTS leads_rubros (
    clave text PRIMARY KEY,
    nombre text NOT NULL,
    creado_por uuid,
    creado_el timestamptz NOT NULL DEFAULT now()
  )`);
  await d.execute(sql`SELECT pulse_papelera_proteger()`).catch(() => null);
  creada = true;
}

const filas = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? [])) as { nombre: string }[];

let cache: { t: number; v: string[] } | null = null;

/** Catálogo completo (semilla + creadas). Nunca rompe la página: si la base falla, la semilla. */
export async function listarRubros(): Promise<string[]> {
  if (cache && Date.now() - cache.t < 60_000) return cache.v;
  try {
    const d = await db();
    const leer = () => d.execute(sql`SELECT nombre FROM leads_rubros ORDER BY creado_el`);
    const r = filas(
      await leer().catch(async (e) => {
        if (!/does not exist|no existe/i.test(String((e as Error)?.message ?? e))) throw e;
        await asegurarTabla();
        return leer();
      }),
    );
    const v = unirCatalogo(r.map((x) => x.nombre));
    cache = { t: Date.now(), v };
    return v;
  } catch {
    return unirCatalogo([]);
  }
}

export async function crearRubro(nombre: string, userId: string): Promise<{ ok: boolean; error?: string; nombre?: string }> {
  const catalogo = await listarRubros();
  const error = errorRubroNuevo(nombre, catalogo);
  if (error) return { ok: false, error };
  const n = normalizarRubro(nombre);
  await asegurarTabla();
  const d = await db();
  await d.execute(sql`INSERT INTO leads_rubros (clave, nombre, creado_por) VALUES (${claveRubro(n)}, ${n}, ${userId}) ON CONFLICT (clave) DO NOTHING`);
  cache = null;
  return { ok: true, nombre: n };
}
