import "server-only";

import { and, desc, eq, gte, inArray, lt, lte } from "drizzle-orm";

import { avisarPersona } from "../desempeno/avisar";
import { evento, leerPerfiles, type Perfil } from "../desempeno/datos";
import { crearAjuste, leerFicha } from "../desempeno/fichas";
import { desempenoVentasAlias, desempenoVentasBonos, desempenoVentasDiario, desempenoVentasGoals } from "../desempeno/schema";
import type { UsuarioRitmo } from "../desempeno/sesion";
import { marcasConAcceso } from "../leads/repo";
import { leadsActividades, leadsEtapas, leadsTratos } from "../leads/schema";
import { db } from "../pulse/db";
import { pestanasDelMes } from "../resumen-dia";
import { carrera, type CitasCRM, contarCitas, type Corredor, type Diario, type Empresa, equipo, type Equipo, esPuestoVentas, type LecturaHoja, leerHojaVentas, marcador, type Marcador, mismaPersona, resultadoCita, type ResultadoCita, type RolVentas, semanaDe, tasasDelMes, transaccionesDe } from "./reglas";

// Arena (ventas en Ritmo): datos. Las ventas salen de la hoja de tesorería de cada marca por el mismo Apps
// Script del resumen del día (scripts/drive/ventas-hoy.gs · VENTAS_SCRIPT_URL + VENTAS_SCRIPT_SECRETO).

const ORDEN_FECHA: Record<Empresa, "dmy" | "mdy"> = { level_up: "mdy", ai_borinquen: "dmy" };
export const hojaConectada = () => Boolean(process.env.VENTAS_SCRIPT_URL && process.env.VENTAS_SCRIPT_SECRETO);

// La hoja tarda 2-5 s en llegar: se guarda 5 min por instancia (las pestañas no la piden de nuevo).
const CACHE = new Map<string, { t: number; v: Promise<LecturaHoja & { pestana?: string }> }>();
const TTL = 5 * 60_000;

export function hojaDelMes(empresa: Empresa, dia: string): Promise<LecturaHoja & { pestana?: string }> {
  const k = `${empresa}:${dia.slice(0, 7)}`;
  const c = CACHE.get(k);
  if (c && Date.now() - c.t < TTL) return c.v;
  const v = leer(empresa, dia);
  CACHE.set(k, { t: Date.now(), v });
  v.then((r) => r.error && CACHE.delete(k)).catch(() => CACHE.delete(k));
  return v;
}

async function leer(empresa: Empresa, dia: string): Promise<LecturaHoja & { pestana?: string }> {
  const vacio = (error: string): LecturaHoja => ({ transacciones: [], metodoNeto: "bruto", columnas: {}, avisos: [], error });
  if (!hojaConectada()) return vacio("La hoja de ventas todavía no está conectada.");
  try {
    const r = await fetch(process.env.VENTAS_SCRIPT_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "hoja", marca: empresa, buscar: pestanasDelMes(empresa, dia), secreto: process.env.VENTAS_SCRIPT_SECRETO }),
      redirect: "follow",
      signal: AbortSignal.timeout(25000),
      cache: "no-store",
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; filas?: string[][]; pestana?: string; error?: string };
    if (!j.ok || !j.filas) return vacio(j.error ?? `No pude leer la hoja (HTTP ${r.status}).`);
    const mes = dia.slice(0, 7);
    const l = leerHojaVentas(j.filas, ORDEN_FECHA[empresa]);
    // Solo el mes pedido (la pestaña puede traer arrastres del mes anterior).
    return { ...l, transacciones: l.transacciones.filter((t) => t.fecha.startsWith(mes)), pestana: j.pestana };
  } catch (e) {
    return vacio(e instanceof Error ? e.message : String(e));
  }
}

// ─── Quién ve qué ─────────────────────────────────────────────────────────────────────────────

export interface AccesoArena {
  empresas: Empresa[];
  perfil: Perfil | null; // si vende (closer/setter/chatter/director)
  rol: RolVentas | null;
  director: boolean; // ve las comisiones de su empresa y crea bonos
  direccion: boolean; // Elvin / editoras con acceso a la marca: ven todo
  autoriza: boolean; // SOLO Elvin autoriza bonos y pagos
}

/**
 * Vendedores y director de ventas: su empresa. La dirección: las marcas a las que tiene acceso en Leads
 * (AI Borinquen solo Elvin y quien tenga permiso explícito: Aure).
 */
export async function accesoArena(u: UsuarioRitmo): Promise<AccesoArena> {
  const perfiles = await leerPerfiles().catch(() => [] as Perfil[]);
  const perfil = perfiles.find((p) => p.userId === u.id && esPuestoVentas(p.puesto)) ?? null;
  const direccion = u.maestro && (u.rol === "admin" || u.rol === "editor");
  const marcas = direccion ? ((await marcasConAcceso(u).catch(() => [])) as Empresa[]) : [];
  const empresas = [...new Set<Empresa>([...(perfil ? [perfil.empresa as Empresa, ...(perfil.tambienEn ? [perfil.tambienEn as Empresa] : [])] : []), ...marcas])];
  const rol = perfil && perfil.puesto !== "director_ventas" ? (perfil.puesto as RolVentas) : null;
  return { empresas, perfil, rol, director: perfil?.puesto === "director_ventas", direccion, autoriza: u.maestro && u.rol === "admin" };
}

/** Para la pestaña: ¿ve la Arena? (liviano: sin marcas de Leads). */
export async function veArena(u: UsuarioRitmo): Promise<boolean> {
  if (u.maestro && (u.rol === "admin" || u.rol === "editor")) return true;
  const p = (await leerPerfiles().catch(() => [])).find((x) => x.userId === u.id);
  return esPuestoVentas(p?.puesto);
}

// ─── Vendedores ───────────────────────────────────────────────────────────────────────────────

export interface Vendedor {
  userId: string;
  nombre: string;
  rol: RolVentas | "director_ventas";
  alias: string[];
  liderId: string | null;
}

export async function vendedores(empresa: Empresa): Promise<Vendedor[]> {
  // Su empresa o la segunda donde también vende (Laura: Level Up y AI Borinquen).
  const perfiles = (await leerPerfiles()).filter((p) => (p.empresa === empresa || p.tambienEn === empresa) && esPuestoVentas(p.puesto));
  const ids = perfiles.map((p) => p.userId);
  const d = await db();
  const alias = ids.length ? await d.select().from(desempenoVentasAlias).where(inArray(desempenoVentasAlias.userId, ids)) : [];
  return perfiles.map((p) => ({ userId: p.userId, nombre: p.nombre, rol: p.puesto as Vendedor["rol"], alias: alias.filter((a) => a.userId === p.userId).map((a) => a.alias), liderId: p.liderId ?? null }));
}

// ─── Diario ───────────────────────────────────────────────────────────────────────────────────

export async function diarioDelMes(userIds: string[], mes: string) {
  if (!userIds.length) return [];
  const d = await db();
  return d
    .select()
    .from(desempenoVentasDiario)
    .where(and(inArray(desempenoVentasDiario.userId, userIds), gte(desempenoVentasDiario.fecha, `${mes}-01`), lte(desempenoVentasDiario.fecha, `${mes}-31`)))
    .orderBy(desc(desempenoVentasDiario.fecha));
}

export const aDiario = (f: { fecha: string; citas: number; presentaron: number; conversaciones: number; agendas: number }): Diario => ({
  fecha: f.fecha,
  citas: f.citas,
  presentaron: f.presentaron,
  conversaciones: f.conversaciones,
  agendas: f.agendas,
});

export async function guardarDiario(userId: string, v: { fecha: string; citas: number; presentaron: number; conversaciones: number; agendas: number; animo: number | null; nota: string | null }) {
  const d = await db();
  await d
    .insert(desempenoVentasDiario)
    .values({ userId, ...v })
    .onConflictDoUpdate({ target: [desempenoVentasDiario.userId, desempenoVentasDiario.fecha], set: { ...v, updatedAt: new Date() } });
}

// ─── Agendas automáticas (Leads: quién agendó cada cita de Calendly) ─────────────────────────

/** Citas agendadas en el mes por cada persona (utm_source de Calendly → leads_tratos.agendo_por). */
export async function agendasDelMes(empresa: Empresa, mes: string, personas: Vendedor[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const [y, m] = mes.split("-").map(Number);
  const desde = new Date(Date.UTC(y, m - 1, 1, 4));
  const hasta = new Date(Date.UTC(y, m, 1, 4));
  try {
    const d = await db();
    const filas = await d
      .select({ agendo: leadsTratos.agendoPor })
      .from(leadsTratos)
      .where(and(eq(leadsTratos.marca, empresa), gte(leadsTratos.createdAt, desde), lt(leadsTratos.createdAt, hasta)));
    for (const f of filas) {
      if (!f.agendo) continue;
      const p = personas.find((x) => mismaPersona(f.agendo!, x.nombre, x.alias));
      if (p) out[p.userId] = (out[p.userId] ?? 0) + 1;
    }
  } catch (e) {
    console.error("[arena] agendas", e);
  }
  return out;
}

// ─── Show-up desde el CRM (Leads → CLOSERS) ──────────────────────────────────────────────────

/**
 * Citas de cada closer que ya pasaron este mes, con cómo terminaron según la etapa del lead (Nahuel, 28/sep:
 * "lo saco del CRM, solo tengo que tener los closers al día"). La cita = la actividad "llamada" que deja el cable de
 * Calendly (asignada al closer, a la hora de la cita; si reagenda se mueve). Una por lead: la última.
 */
export async function citasDelMes(empresa: Empresa, mes: string): Promise<Record<string, CitasCRM>> {
  const [y, m] = mes.split("-").map(Number);
  const desde = new Date(Date.UTC(y, m - 1, 1, 4));
  const hasta = new Date(Math.min(Date.UTC(y, m, 1, 4), Date.now()));
  const out: Record<string, CitasCRM> = {};
  try {
    const d = await db();
    const filas = await d
      .select({ trato: leadsActividades.tratoId, closer: leadsActividades.asignadoId, cuando: leadsActividades.venceAt, etapa: leadsEtapas.nombre, estado: leadsTratos.estado })
      .from(leadsActividades)
      .innerJoin(leadsTratos, eq(leadsTratos.id, leadsActividades.tratoId))
      .innerJoin(leadsEtapas, eq(leadsEtapas.id, leadsTratos.etapaId))
      .where(and(eq(leadsTratos.marca, empresa), eq(leadsActividades.tipo, "llamada"), gte(leadsActividades.venceAt, desde), lt(leadsActividades.venceAt, hasta)))
      .orderBy(desc(leadsActividades.venceAt));
    const vistos = new Set<string>();
    const porCloser = new Map<string, ResultadoCita[]>();
    for (const f of filas) {
      if (!f.closer || vistos.has(f.trato)) continue;
      vistos.add(f.trato);
      const lista = porCloser.get(f.closer) ?? [];
      lista.push(resultadoCita(f.etapa, f.estado));
      porCloser.set(f.closer, lista);
    }
    for (const [closer, rs] of porCloser) out[closer] = contarCitas(rs);
  } catch (e) {
    console.error("[arena] citas del CRM", e);
  }
  return out;
}

// ─── Metas personales ─────────────────────────────────────────────────────────────────────────

export async function goalDe(userId: string, mes: string): Promise<number | null> {
  const d = await db();
  const [g] = await d.select().from(desempenoVentasGoals).where(and(eq(desempenoVentasGoals.userId, userId), eq(desempenoVentasGoals.mes, mes)));
  return g?.monto ?? null;
}

export async function guardarGoal(userId: string, mes: string, monto: number) {
  const d = await db();
  await d.insert(desempenoVentasGoals).values({ userId, mes, monto }).onConflictDoUpdate({ target: [desempenoVentasGoals.userId, desempenoVentasGoals.mes], set: { monto, updatedAt: new Date() } });
}

// ─── Bonos ────────────────────────────────────────────────────────────────────────────────────

export async function bonosDe(empresa: Empresa) {
  const d = await db();
  return d.select().from(desempenoVentasBonos).where(eq(desempenoVentasBonos.empresa, empresa)).orderBy(desc(desempenoVentasBonos.createdAt)).limit(40);
}

export async function bono(id: string) {
  const d = await db();
  const [b] = await d.select().from(desempenoVentasBonos).where(eq(desempenoVentasBonos.id, id));
  return b ?? null;
}

export async function crearBono(v: { empresa: Empresa; titulo: string; detalle: string | null; monto: number; rol: string | null; desde: string; hasta: string | null }, actorId: string, autorizado: boolean) {
  const d = await db();
  const [b] = await d
    .insert(desempenoVentasBonos)
    .values({ ...v, creadoPor: actorId, estado: autorizado ? "autorizado" : "propuesto", autorizadoPor: autorizado ? actorId : null })
    .returning({ id: desempenoVentasBonos.id });
  await evento({ actorId, tipo: "bono_ventas_creado", datos: { id: b.id, titulo: v.titulo, monto: v.monto, autorizado } });
  return b.id;
}

export async function cambiarBono(id: string, cambios: Partial<typeof desempenoVentasBonos.$inferInsert>, actorId: string) {
  const d = await db();
  await d.update(desempenoVentasBonos).set(cambios).where(eq(desempenoVentasBonos.id, id));
  await evento({ actorId, tipo: "bono_ventas", datos: { id, ...cambios } });
}

/** Pago aprobado por Elvin: si el ganador tiene ficha con nómina, entra como ajuste del mes siguiente. */
export async function pagarBono(id: string, actorId: string, mesSiguiente: string): Promise<{ ajuste: boolean }> {
  const b = await bono(id);
  if (!b || b.estado !== "ganado" || !b.ganadorId) throw new Error("El bono no tiene ganador por aprobar");
  const ficha = await leerFicha(b.ganadorId).catch(() => null);
  let ajusteId: string | null = null;
  if (ficha) ajusteId = await crearAjuste({ userId: b.ganadorId, mes: mesSiguiente, concepto: `Bono de ventas: ${b.titulo}`, monto: b.monto }, actorId);
  await cambiarBono(id, { estado: "pagado", pagadoPor: actorId, ajusteId }, actorId);
  await avisarPersona(b.ganadorId, `🏆 Tu bono "${b.titulo}" (US$${b.monto}) quedó aprobado. ¡Felicidades!`).catch(() => false);
  return { ajuste: !!ajusteId };
}

// ─── Todo lo de la Arena para una empresa ─────────────────────────────────────────────────────

export interface FilaComision {
  userId: string;
  nombre: string;
  rol: RolVentas;
  m: Marcador;
}

export interface Arena {
  empresa: Empresa;
  hoy: string;
  hoja: { error?: string; avisos: string[]; pestana?: string; metodoNeto: string; columnas: Record<string, string | null>; ventas: number };
  equipo: Equipo;
  carreras: Record<RolVentas, Corredor[]>;
  gente: Vendedor[];
  comisiones: FilaComision[]; // solo si quien mira es director o dirección
  mio: { rol: RolVentas; m: Marcador; goal: number | null; diario: Awaited<ReturnType<typeof diarioDelMes>> } | null;
}

export async function armarArena(u: UsuarioRitmo, a: AccesoArena, empresa: Empresa): Promise<Arena> {
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
  const hora = Number(new Date().toLocaleString("en-US", { timeZone: "America/Puerto_Rico", hour: "numeric", hour12: false })) % 24;
  const mes = hoy.slice(0, 7);
  const gente = await vendedores(empresa);
  const vendiendo = gente.filter((g) => g.rol !== "director_ventas") as (Vendedor & { rol: RolVentas })[];
  const verTodos = a.director || a.direccion;
  const conMarcador = verTodos ? vendiendo : vendiendo.filter((g) => g.userId === u.id);
  const [hoja, diario, agendas, citas] = await Promise.all([hojaDelMes(empresa, hoy), diarioDelMes(conMarcador.map((g) => g.userId), mes), agendasDelMes(empresa, mes, vendiendo), citasDelMes(empresa, mes)]);
  const txs = hoja.transacciones;
  const semana = semanaDe(hoy);

  const marcadorDe = (g: Vendedor & { rol: RolVentas }): Marcador => {
    const mias = transaccionesDe(txs, g.rol, g.nombre, g.alias);
    const tasas = tasasDelMes({ diario: diario.filter((d) => d.userId === g.userId).map(aDiario), cierresHoja: mias.filter((t) => t.tipo === "nueva").length, agendasLeads: agendas[g.userId] ?? 0, crm: g.rol === "closer" ? (citas[g.userId] ?? null) : null });
    return marcador({ txs: mias, rol: g.rol, hoy, semana, tasas });
  };

  const yo = vendiendo.find((g) => g.userId === u.id);
  const personas = vendiendo.map((g) => ({ userId: g.userId, nombre: g.nombre, alias: g.alias }));
  return {
    empresa,
    hoy,
    hoja: { error: hoja.error, avisos: hoja.avisos, pestana: hoja.pestana, metodoNeto: hoja.metodoNeto, columnas: hoja.columnas, ventas: txs.length },
    equipo: equipo(txs, empresa, hoy, hora),
    carreras: { closer: carrera(txs, "closer", personas), setter: carrera(txs, "setter", personas), chatter: carrera(txs, "chatter", personas) },
    gente,
    comisiones: verTodos ? conMarcador.map((g) => ({ userId: g.userId, nombre: g.nombre, rol: g.rol, m: marcadorDe(g) })) : [],
    mio: yo ? { rol: yo.rol, m: marcadorDe(yo), goal: await goalDe(u.id, mes).catch(() => null), diario: diario.filter((d) => d.userId === u.id) } : null,
  };
}
