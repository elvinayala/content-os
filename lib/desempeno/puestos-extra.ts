import "server-only";

import { sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { evento } from "./datos";
import { idPuesto, PUESTOS, registrarPuestosExtra } from "./reglas";

// Puestos que crea RR.HH. o la dirección desde Ajustes (29/sep). Tabla chica en SQL directo (no pasa por las
// migraciones de Drizzle): se crea sola la primera vez y queda protegida por la papelera.
let creada = false;
async function asegurarTabla() {
  if (creada) return;
  const d = await db();
  await d.execute(sql`CREATE TABLE IF NOT EXISTS desempeno_puestos_extra (
    id text PRIMARY KEY,
    nombre text NOT NULL,
    departamento text NOT NULL,
    creado_por uuid,
    creado_el timestamptz NOT NULL DEFAULT now()
  )`);
  await d.execute(sql`SELECT pulse_papelera_proteger()`).catch(() => null);
  creada = true;
}

const filas = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? [])) as { id: string; nombre: string; departamento: string }[];

let cache: { t: number; v: { id: string; nombre: string; departamento: string }[] } | null = null;

/** Lee los puestos nuevos y los registra en PUESTOS (una vez por minuto por instancia). Nunca rompe la página. */
export async function cargarPuestosExtra() {
  if (cache && Date.now() - cache.t < 60_000) return registrarPuestosExtra(cache.v);
  try {
    await asegurarTabla();
    const d = await db();
    const v = filas(await d.execute(sql`SELECT id, nombre, departamento FROM desempeno_puestos_extra ORDER BY creado_el`));
    cache = { t: Date.now(), v };
    registrarPuestosExtra(v);
  } catch (e) {
    console.error("[puestos-extra]", e);
  }
}

export async function crearPuesto(nombre: string, departamento: string, actorId: string): Promise<string> {
  const n = nombre.replace(/\s+/g, " ").trim();
  const dep = departamento.replace(/\s+/g, " ").trim();
  if (n.length < 3 || n.length > 60) throw new Error("El nombre del puesto va de 3 a 60 letras");
  if (dep.length < 3 || dep.length > 40) throw new Error("Escribe el departamento");
  const id = idPuesto(n);
  if (PUESTOS.some((p) => p.id === id || p.nombre.toLowerCase() === n.toLowerCase())) throw new Error("Ese puesto ya existe");
  await asegurarTabla();
  const d = await db();
  await d.execute(sql`INSERT INTO desempeno_puestos_extra (id, nombre, departamento, creado_por) VALUES (${id}, ${n}, ${dep}, ${actorId})`);
  cache = null;
  await cargarPuestosExtra();
  await evento({ actorId, tipo: "puesto_creado", datos: { id, nombre: n, departamento: dep } });
  return id;
}
