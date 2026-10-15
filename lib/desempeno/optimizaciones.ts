import "server-only";

import { sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { avisarCorreo, avisarPersona, esc } from "./avisar";
import { cumplimiento, limpiarAcciones, plazo, progreso, rolCuentas, seguimientoDe, validarMarca, venceEl, type Accion, type Caso, type EstadoCuentaRevision, type Pedido, type RolCuentas } from "./optimizaciones-reglas";
import { fechaPR } from "./reglas";

// Cuentas por optimizar (15/oct/2026): los casos que abre la revisión de Max y que el estratega marca en Ritmo. Tabla en
// SQL directo (como desempeno_trabajos): se crea sola y queda protegida por la papelera. Reglas en optimizaciones-reglas.ts.
//
// Encendido: REVISION_CUENTAS=on. Antes de eso (vista previa) los casos se guardan con `simulacion`, solo Elvin (admin)
// los ve en /ritmo/cuentas y no se le escribe a nadie. Elvin lo prende cuando Carilin verifica los montos en Pulse.

export const cuentasEncendidas = () => process.env.REVISION_CUENTAS === "on";
export const DIRECTORES_TRAFICO = () =>
  (process.env.RITMO_DIRECTORES_TRAFICO || "maria.valencia@levelupmediapr.net,juan.guzman@levelupmediapr.net,carilin@levelupmediapr.net")
    .split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
const BASE = () => (process.env.RITMO_URL || "https://ritmo.levelupmediapr.net").replace(/\/$/, "");
export const linkCaso = (id: number) => `${BASE()}/ritmo/cuentas#caso-${id}`;

let creada = false;
async function asegurarTabla() {
  if (creada) return;
  const d = await db();
  await d.execute(sql`CREATE TABLE IF NOT EXISTS desempeno_optimizaciones (
    id serial PRIMARY KEY,
    item_id text NOT NULL,
    cliente text NOT NULL,
    empresa text,
    cuenta_id text,
    estratega_id uuid,
    estratega text,
    fecha text NOT NULL,
    estado_cuenta text NOT NULL,
    estado text NOT NULL DEFAULT 'abierta',
    resumen text NOT NULL,
    acciones jsonb NOT NULL DEFAULT '[]'::jsonb,
    pedidos jsonb NOT NULL DEFAULT '[]'::jsonb,
    simulacion boolean NOT NULL DEFAULT true,
    recordado_at timestamptz,
    escalado_at timestamptz,
    cerrado_por text,
    cerrado_at timestamptz,
    nota_cierre text,
    creado_el timestamptz NOT NULL DEFAULT now(),
    actualizado_el timestamptz NOT NULL DEFAULT now()
  )`);
  await d.execute(sql`CREATE INDEX IF NOT EXISTS desempeno_optimizaciones_item ON desempeno_optimizaciones (item_id, estado)`);
  await d.execute(sql`CREATE INDEX IF NOT EXISTS desempeno_optimizaciones_estratega ON desempeno_optimizaciones (estratega_id, estado)`);
  await d.execute(sql`SELECT pulse_papelera_proteger()`).catch(() => null);
  creada = true;
}

type Fila = Record<string, unknown>;
const filas = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? [])) as Fila[];
const iso = (x: unknown) => (x instanceof Date ? x.toISOString() : x ? String(x) : null);
function aCaso(f: Fila): Caso & { recordado: boolean; escalado: boolean; creadoEl: string } {
  return {
    id: Number(f.id),
    itemId: String(f.item_id),
    cliente: String(f.cliente),
    empresa: (f.empresa as string) ?? null,
    cuentaId: (f.cuenta_id as string) ?? null,
    estrategaId: (f.estratega_id as string) ?? null,
    estratega: (f.estratega as string) ?? null,
    fecha: String(f.fecha),
    estadoCuenta: f.estado_cuenta as EstadoCuentaRevision,
    estado: f.estado as Caso["estado"],
    resumen: String(f.resumen),
    acciones: (f.acciones as Accion[]) ?? [],
    pedidos: (f.pedidos as Pedido[]) ?? [],
    simulacion: Boolean(f.simulacion),
    cerradoPor: (f.cerrado_por as string) ?? null,
    cerradoAt: iso(f.cerrado_at),
    notaCierre: (f.nota_cierre as string) ?? null,
    recordado: Boolean(f.recordado_at),
    escalado: Boolean(f.escalado_at),
    creadoEl: iso(f.creado_el) ?? "",
  };
}
export type CasoCuenta = ReturnType<typeof aCaso>;

/** Quién entra a /ritmo/cuentas. En vista previa (REVISION_CUENTAS apagado) solo Elvin. */
export async function accesoCuentas(u: { id: string; email: string; rol: string }): Promise<RolCuentas> {
  if (!cuentasEncendidas()) return u.rol === "admin" ? "direccion" : null;
  await asegurarTabla();
  const d = await db();
  const [f] = filas(await d.execute(sql`SELECT 1 AS x FROM desempeno_optimizaciones WHERE estratega_id = ${u.id} AND simulacion = false LIMIT 1`));
  return rolCuentas(u, DIRECTORES_TRAFICO(), !!f);
}

/** La tarjeta de Hoy: el estratega ve sus puntos sin marcar; la dirección, todas las cuentas abiertas. */
export async function resumenCuentasHoy(u: { id: string; email: string; rol: string }): Promise<{ rol: RolCuentas; abiertas: number; sinMarcar: number } | null> {
  const rol = await accesoCuentas(u);
  if (!rol) return null;
  const cs = await listarCasos({ estrategaId: rol === "estratega" ? u.id : undefined, abiertos: true, conSimulacion: !cuentasEncendidas() });
  return { rol, abiertas: cs.length, sinMarcar: cs.reduce((s, c) => s + progreso(c.acciones).pendientes, 0) };
}

/** Una revisión de Max: reemplaza el caso abierto del cliente y, si hay algo que hacer, abre uno nuevo y le avisa al estratega. */
export async function registrarRevision(r: { itemId: string; cliente: string; empresa: string | null; cuentaId: string | null; estrategaId: string | null; estratega: string | null; estadoCuenta: string; resumen: string; acciones: unknown }) {
  await asegurarTabla();
  const d = await db();
  const acciones = limpiarAcciones(r.acciones);
  const simulacion = !cuentasEncendidas();
  await d.execute(sql`UPDATE desempeno_optimizaciones SET estado = 'reemplazada', actualizado_el = now() WHERE item_id = ${r.itemId} AND estado = 'abierta'`);
  if (!acciones.length) return { id: null, simulacion, avisado: false };
  const estadoCuenta: EstadoCuentaRevision = r.estadoCuenta === "escalar" ? "escalar" : "no-optimizada";
  const [nuevo] = filas(await d.execute(sql`INSERT INTO desempeno_optimizaciones (item_id, cliente, empresa, cuenta_id, estratega_id, estratega, fecha, estado_cuenta, resumen, acciones, simulacion)
    VALUES (${r.itemId}, ${r.cliente.slice(0, 160)}, ${r.empresa?.slice(0, 160) ?? null}, ${r.cuentaId}, ${r.estrategaId}, ${r.estratega}, ${fechaPR(Date.now())}, ${estadoCuenta}, ${r.resumen.slice(0, 6000)}, ${JSON.stringify(acciones)}::jsonb, ${simulacion})
    RETURNING id`));
  // El aviso sale después, UNO por estratega con todas sus cuentas de la semana (avisarRevisiones).
  return { id: Number(nuevo.id), simulacion, avisado: false };
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const diaLargo = (f: string) => `${DIAS[new Date(f + "T12:00:00Z").getUTCDay()]} ${Number(f.slice(8, 10))} ${MESES[Number(f.slice(5, 7)) - 1]}`;
const ordenAcciones = (xs: Accion[]) => [...xs].sort((a, b) => a.prioridad - b.prioridad);

/** El mensaje del lunes a cada estratega: todas sus cuentas de la semana en uno, con el plazo (miércoles). */
export function textoSemanal(nombre: string | null, casos: CasoCuenta[], fecha: string): string {
  const L = [`📋 *Revisión de cuentas · ${diaLargo(fecha)}*`, `${nombre ? `Hola ${esc(nombre.split(" ")[0])} 👋 ` : ""}Esta semana te ${casos.length === 1 ? "toca *1 cuenta*" : `tocan *${casos.length} cuentas*`}. Tienes hasta el *${diaLargo(venceEl(fecha))}* para optimizarlas y marcarlas en Ritmo.`];
  for (const c of casos) {
    const p = progreso(c.acciones);
    L.push("", `*${esc(c.empresa || c.cliente)}* · ${c.estadoCuenta === "no-optimizada" ? "⚠️ no optimizada" : "🚀 para escalar"} · ${p.total === 1 ? "1 punto" : `${p.total} puntos`}`);
    for (const a of ordenAcciones(c.acciones).slice(0, 2)) L.push(`• ${esc(a.texto)}`);
    if (p.total > 2) L.push(`• y ${p.total - 2} más`);
  }
  L.push("", `👉 Marca cada punto: *Ejecutado*, o por qué no. <${BASE()}/ritmo/cuentas|Abrir Ritmo → Cuentas>`);
  return L.join("\n");
}

/** El lunes, después de la tanda: UN mensaje por estratega (Slack del bot + push de Ritmo). En vista previa no se manda:
 * devuelve los textos para que Elvin los vea. */
export async function avisarRevisiones(fecha = fechaPR(Date.now())) {
  const casos = (await listarCasos({ abiertos: true, conSimulacion: true })).filter((c) => c.fecha === fecha);
  const por = new Map<string, CasoCuenta[]>();
  for (const c of casos) {
    const k = c.estrategaId ?? "—";
    por.set(k, [...(por.get(k) ?? []), c]);
  }
  const textos: { estratega: string; cuentas: number; texto: string; avisado: boolean }[] = [];
  for (const [id, cs] of por) {
    const texto = textoSemanal(cs[0].estratega, cs, fecha);
    const avisado = id !== "—" && !cs[0].simulacion ? await avisarPersona(id, texto) : false;
    textos.push({ estratega: cs[0].estratega ?? "Sin estratega", cuentas: cs.length, texto, avisado });
  }
  return { estrategas: textos.length, avisados: textos.filter((t) => t.avisado).length, textos };
}

/** "Tus prioridades de hoy" en Ritmo: las cuentas del estratega con puntos sin marcar, lo más urgente primero. */
export async function prioridadesDe(userId: string) {
  if (!cuentasEncendidas()) return [];
  const hoy = fechaPR(Date.now());
  const cs = await listarCasos({ estrategaId: userId, abiertos: true });
  return cs
    .map((c) => {
      const pend = ordenAcciones(c.acciones.filter((a) => a.estado === "pendiente"));
      return { id: c.id, cliente: c.empresa || c.cliente, pendientes: pend.length, total: c.acciones.length, primero: pend[0]?.texto ?? null, urgente: pend.some((a) => a.prioridad === 1), plazo: plazo(c.fecha, hoy), vence: venceEl(c.fecha) };
    })
    .filter((x) => x.pendientes > 0)
    .sort((a, b) => Number(b.plazo !== "a-tiempo") - Number(a.plazo !== "a-tiempo") || Number(b.urgente) - Number(a.urgente) || b.pendientes - a.pendientes);
}
export type Prioridad = Awaited<ReturnType<typeof prioridadesDe>>[number];

export async function listarCasos(o: { estrategaId?: string; abiertos?: boolean; dias?: number; conSimulacion?: boolean } = {}): Promise<CasoCuenta[]> {
  await asegurarTabla();
  const d = await db();
  const desde = new Date(Date.now() - (o.dias ?? 45) * 86_400_000);
  const r = await d.execute(sql`SELECT * FROM desempeno_optimizaciones
    WHERE estado <> 'reemplazada'
      ${o.estrategaId ? sql`AND estratega_id = ${o.estrategaId}` : sql``}
      ${o.abiertos ? sql`AND estado = 'abierta'` : sql`AND (estado = 'abierta' OR creado_el >= ${desde})`}
      ${o.conSimulacion ? sql`` : sql`AND simulacion = false`}
    ORDER BY (estado = 'abierta') DESC, creado_el DESC LIMIT 300`);
  return filas(r).map(aCaso);
}

/** Para el cumplimiento: también cuentan los casos reemplazados (lo que quedó sin marcar es no cumplido). */
export async function cumplimientoEstrategas(dias = 30) {
  await asegurarTabla();
  const d = await db();
  const desde = new Date(Date.now() - dias * 86_400_000);
  const r = await d.execute(sql`SELECT * FROM desempeno_optimizaciones WHERE simulacion = false AND creado_el >= ${desde}`);
  return cumplimiento(filas(r).map(aCaso));
}

export async function casoPorId(id: number): Promise<CasoCuenta | null> {
  await asegurarTabla();
  const d = await db();
  const [f] = filas(await d.execute(sql`SELECT * FROM desempeno_optimizaciones WHERE id = ${id}`));
  return f ? aCaso(f) : null;
}

/** Lo que tiene pendiente un estratega (para Hoy). En vista previa nadie tiene nada pendiente. */
export async function pendientesDeEstratega(userId: string): Promise<{ casos: number; puntos: number }> {
  if (!cuentasEncendidas()) return { casos: 0, puntos: 0 };
  const cs = await listarCasos({ estrategaId: userId, abiertos: true });
  return { casos: cs.length, puntos: cs.reduce((s, c) => s + progreso(c.acciones).pendientes, 0) };
}

export async function marcarAccion(id: number, accionId: string, estado: string, motivo: string | null, actor: { nombre: string }) {
  const v = validarMarca(estado, motivo);
  if (!v.ok) throw new Error(v.error);
  const caso = await casoPorId(id);
  if (!caso) throw new Error("Ese caso ya no existe");
  if (caso.estado !== "abierta") throw new Error("Ese caso ya está cerrado");
  const acciones = caso.acciones.map((a): Accion => {
    if (a.id !== accionId) return a;
    if (v.estado === "pendiente") return { id: a.id, tipo: a.tipo, prioridad: a.prioridad, texto: a.texto, estado: "pendiente" }; // deshacer
    return { ...a, estado: v.estado, motivo: v.motivo, por: actor.nombre, at: new Date().toISOString() };
  });
  if (!acciones.some((a) => a.id === accionId)) throw new Error("Ese punto ya no está en el caso");
  const d = await db();
  await d.execute(sql`UPDATE desempeno_optimizaciones SET acciones = ${JSON.stringify(acciones)}::jsonb, actualizado_el = now() WHERE id = ${id}`);
}

/** "Ya está bien": la dirección de tráfico cierra el caso. */
export async function cerrarCaso(id: number, actor: { nombre: string }, nota: string | null) {
  const d = await db();
  await asegurarTabla();
  await d.execute(sql`UPDATE desempeno_optimizaciones SET estado = 'bien', cerrado_por = ${actor.nombre}, cerrado_at = now(), nota_cierre = ${nota?.trim().slice(0, 400) || null}, actualizado_el = now() WHERE id = ${id} AND estado = 'abierta'`);
}

/** La dirección le pide más optimización al estratega sobre un caso abierto (le llega por Slack). */
export async function pedirOptimizacion(id: number, actor: { nombre: string }, texto: string) {
  const t = texto.replace(/\s+/g, " ").trim();
  if (t.length < 8) throw new Error("Escribe qué hay que optimizar");
  const caso = await casoPorId(id);
  if (!caso) throw new Error("Ese caso ya no existe");
  const pedidos = [...caso.pedidos, { por: actor.nombre, texto: t.slice(0, 500), at: new Date().toISOString() }];
  const d = await db();
  await d.execute(sql`UPDATE desempeno_optimizaciones SET pedidos = ${JSON.stringify(pedidos)}::jsonb, estado = 'abierta', actualizado_el = now() WHERE id = ${id}`);
  if (!caso.simulacion && caso.estrategaId) await avisarPersona(caso.estrategaId, `🔧 *${esc(actor.nombre)}* te pide optimizar *${esc(caso.empresa || caso.cliente)}*:\n${esc(t)}\n<${linkCaso(id)}|Abrir en Ritmo>`);
}

/** Recordatorio al estratega (2 días hábiles con puntos sin marcar) y aviso a la dirección de tráfico (4 días). */
export async function seguimientoCasos(): Promise<{ recordados: number; escalados: number; abiertos: number; pendientes: number }> {
  const hoy = fechaPR(Date.now());
  const casos = await listarCasos({ abiertos: true });
  const d = await db();
  let recordados = 0, escalados = 0;
  const aDireccion: string[] = [];
  for (const c of casos) {
    const s = seguimientoDe(c, hoy);
    const p = progreso(c.acciones);
    if (s === "recordar" && c.estrategaId) {
      if (await avisarPersona(c.estrategaId, `⏰ *${esc(c.empresa || c.cliente)}*: el plazo era el ${diaLargo(venceEl(c.fecha))} y tienes ${p.pendientes === 1 ? "1 punto" : `${p.pendientes} puntos`} sin marcar. Márcalo hoy: *Ejecutado*, o por qué no.\n<${linkCaso(c.id)}|Abrir en Ritmo>`)) recordados++;
      await d.execute(sql`UPDATE desempeno_optimizaciones SET recordado_at = now() WHERE id = ${c.id}`);
    } else if (s === "escalar") {
      aDireccion.push(`• ${esc(c.estratega || "Sin estratega")} · *${esc(c.empresa || c.cliente)}* · ${p.pendientes} sin marcar desde el ${c.fecha.slice(8)}/${c.fecha.slice(5, 7)}`);
      await d.execute(sql`UPDATE desempeno_optimizaciones SET escalado_at = now() WHERE id = ${c.id}`);
      escalados++;
    }
  }
  if (aDireccion.length) {
    const texto = `🔔 *Cuentas sin marcar* (venció el miércoles)\n${aDireccion.join("\n")}\n<${BASE()}/ritmo/cuentas|Ver en Ritmo>`;
    for (const e of DIRECTORES_TRAFICO()) await avisarCorreo(e, texto);
  }
  return { recordados, escalados, abiertos: casos.length, pendientes: casos.reduce((s, c) => s + progreso(c.acciones).pendientes, 0) };
}
