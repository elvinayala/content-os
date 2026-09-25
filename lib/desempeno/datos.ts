import "server-only";

import { and, asc, eq, gte, inArray, isNull, lte } from "drizzle-orm";

import { db } from "../pulse/db";
import * as repo from "../pulse/repo";
import { pulseActivity, pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "../pulse/schema";
import type { ColorPulse, UsuarioPulse, ValorCelda } from "../pulse/types";
import {
  asistenciaDia,
  colorScore,
  ESTADOS_PRODUCCION,
  fechaPR,
  GRUPOS_PRODUCCION,
  kpisDe,
  kpisProduccion,
  promedio,
  puedeVer,
  puestoPorId,
  rangoFechas,
  scoreDia,
  valoresProduccion,
  type Asistencia,
  type CambioEstado,
  type Color,
  type OverrideMeta,
  type ScoreDia,
  type TareaProduccion,
} from "./reglas";
import { desempenoEventos, desempenoMetas, desempenoMetricas, desempenoPerfiles, desempenoPonches, desempenoReportes } from "./schema";

export const SLUG_PRODUCCION = "produccion";
// Un tramo abierto de menos de 16 h se cierra normal (trabajó de noche y pasó la medianoche);
// más viejo que eso es una salida olvidada y se corrige con aprobación del líder.
const TRAMO_MAX_MS = 16 * 3_600_000;
const vigente = (p: { entradaAt: Date }, ahora = Date.now()) => ahora - p.entradaAt.getTime() < TRAMO_MAX_MS;

// ─── Perfiles ─────────────────────────────────────────────────────────────────────────────────

export interface Perfil {
  userId: string;
  nombre: string;
  email: string;
  color: string | null;
  puesto: string;
  empresa: string;
  liderId: string | null;
  horaEntrada: string;
  horaSalida: string;
  diasLaborables: number[];
  tipoContrato: string;
  fechaIngreso: string | null;
  activo: boolean;
  desde: string;
}

export async function leerPerfiles(soloActivos = true): Promise<Perfil[]> {
  const d = await db();
  const filas = await d
    .select({ p: desempenoPerfiles, nombre: pulseUsers.nombre, email: pulseUsers.email, color: pulseUsers.color, userActivo: pulseUsers.activo })
    .from(desempenoPerfiles)
    .innerJoin(pulseUsers, eq(pulseUsers.id, desempenoPerfiles.userId))
    .orderBy(asc(pulseUsers.nombre));
  return filas
    .filter((f) => !soloActivos || (f.p.activo && f.userActivo))
    .map((f) => ({
      userId: f.p.userId,
      nombre: f.nombre,
      email: f.email,
      color: f.color,
      puesto: f.p.puesto,
      empresa: f.p.empresa,
      liderId: f.p.liderId,
      horaEntrada: f.p.horaEntrada,
      horaSalida: f.p.horaSalida,
      diasLaborables: f.p.diasLaborables,
      tipoContrato: f.p.tipoContrato,
      fechaIngreso: f.p.fechaIngreso,
      activo: f.p.activo,
      desde: f.p.desde,
    }));
}

export async function perfilDe(userId: string): Promise<Perfil | null> {
  return (await leerPerfiles(false)).find((p) => p.userId === userId) ?? null;
}

export async function guardarPerfil(
  p: Pick<Perfil, "userId" | "puesto" | "empresa" | "liderId" | "horaEntrada" | "horaSalida" | "diasLaborables" | "tipoContrato" | "fechaIngreso" | "activo">,
  actorId: string,
): Promise<void> {
  const d = await db();
  const valores = { ...p, updatedAt: new Date() };
  // `desde` se fija al crear el perfil (no se toca al editar).
  await d.insert(desempenoPerfiles).values({ ...valores, desde: fechaPR(Date.now()) }).onConflictDoUpdate({ target: desempenoPerfiles.userId, set: valores });
  await evento({ userId: p.userId, actorId, tipo: "perfil", datos: p });
}

export async function evento(p: { userId?: string | null; actorId?: string | null; tipo: string; datos?: unknown; ip?: string | null }) {
  const d = await db();
  await d.insert(desempenoEventos).values({ userId: p.userId ?? null, actorId: p.actorId ?? null, tipo: p.tipo, datos: p.datos ?? null, ip: p.ip ?? null });
}

// ─── Ponche ───────────────────────────────────────────────────────────────────────────────────

export type Ponche = typeof desempenoPonches.$inferSelect;

export async function ponchesAbiertos(userId: string): Promise<Ponche[]> {
  const d = await db();
  return d.select().from(desempenoPonches).where(and(eq(desempenoPonches.userId, userId), isNull(desempenoPonches.salidaAt))).orderBy(asc(desempenoPonches.entradaAt));
}

export async function ponchesEntre(desde: string, hasta: string, userIds?: string[]): Promise<Ponche[]> {
  const d = await db();
  const cond = [gte(desempenoPonches.fecha, desde), lte(desempenoPonches.fecha, hasta)];
  if (userIds) {
    if (!userIds.length) return [];
    cond.push(inArray(desempenoPonches.userId, userIds));
  }
  return d.select().from(desempenoPonches).where(and(...cond)).orderBy(asc(desempenoPonches.entradaAt));
}

export async function leerPonche(id: string): Promise<Ponche | null> {
  const d = await db();
  const [p] = await d.select().from(desempenoPonches).where(eq(desempenoPonches.id, id));
  return p ?? null;
}

/** Marca entrada con la hora del servidor. Falla si hay un tramo abierto (hay que cerrarlo primero). */
export async function entrar(userId: string, ctx: { ip: string | null; ua: string | null }): Promise<Ponche> {
  const abiertos = await ponchesAbiertos(userId);
  if (abiertos.some((x) => !vigente(x))) throw new Error("Tienes una salida pendiente de otro día: corrígela primero");
  if (abiertos.length) throw new Error("Ya tienes una entrada abierta");
  const d = await db();
  const ahora = new Date();
  const [p] = await d.insert(desempenoPonches).values({ userId, fecha: fechaPR(ahora), entradaAt: ahora, ipEntrada: ctx.ip, userAgent: ctx.ua }).returning();
  await evento({ userId, actorId: userId, tipo: "entrada", datos: { poncheId: p.id }, ip: ctx.ip });
  return p;
}

/** Marca salida del tramo abierto de HOY y guarda el mini-reporte (bloqueos + datos manuales). */
export async function salir(userId: string, ctx: { ip: string | null }, reporte: { bloqueos: string | null; datos: Record<string, number> }): Promise<void> {
  const abiertos = await ponchesAbiertos(userId);
  const p = abiertos.find((x) => vigente(x));
  if (!p) throw new Error(abiertos.length ? "Tienes una salida pendiente de otro día: corrígela primero" : "No tienes una entrada abierta");
  const hoy = p.fecha;
  const d = await db();
  await d.update(desempenoPonches).set({ salidaAt: new Date(), ipSalida: ctx.ip }).where(eq(desempenoPonches.id, p.id));
  await guardarReporte(userId, hoy, reporte);
  await evento({ userId, actorId: userId, tipo: "salida", datos: { poncheId: p.id }, ip: ctx.ip });
}

export async function guardarReporte(userId: string, fecha: string, r: { bloqueos: string | null; datos: Record<string, number> }) {
  const d = await db();
  const [prev] = await d.select().from(desempenoReportes).where(and(eq(desempenoReportes.userId, userId), eq(desempenoReportes.fecha, fecha)));
  // Varias salidas en el día: se suman los datos y se juntan los bloqueos.
  const datos = { ...(prev?.datos ?? {}) };
  for (const [k, v] of Object.entries(r.datos)) datos[k] = (datos[k] ?? 0) + v;
  const bloqueos = [prev?.bloqueos, r.bloqueos].filter(Boolean).join("\n") || null;
  await d
    .insert(desempenoReportes)
    .values({ userId, fecha, bloqueos, datos })
    .onConflictDoUpdate({ target: [desempenoReportes.userId, desempenoReportes.fecha], set: { bloqueos, datos, updatedAt: new Date() } });
}

/** Salida olvidada: la persona dice a qué hora terminó; queda pendiente hasta que el líder la apruebe. */
export async function corregirSalida(poncheId: string, salida: Date, userId: string, nota: string | null) {
  const p = await leerPonche(poncheId);
  if (!p || p.userId !== userId) throw new Error("No existe");
  if (p.salidaAt) throw new Error("Ese ponche ya tiene salida");
  if (salida.getTime() <= p.entradaAt.getTime() || salida.getTime() > Date.now()) throw new Error("La hora de salida no es válida");
  if (salida.getTime() - p.entradaAt.getTime() > TRAMO_MAX_MS) throw new Error("Más de 16 horas: revisa la hora");
  const d = await db();
  await d.update(desempenoPonches).set({ salidaAt: salida, correccion: "pendiente", nota }).where(eq(desempenoPonches.id, poncheId));
  await evento({ userId, actorId: userId, tipo: "correccion", datos: { poncheId, salida: salida.toISOString(), nota } });
}

export async function decidirCorreccion(poncheId: string, aprobar: boolean, actorId: string) {
  const d = await db();
  await d.update(desempenoPonches).set({ correccion: aprobar ? "aprobada" : "rechazada", correccionPor: actorId }).where(eq(desempenoPonches.id, poncheId));
  await evento({ actorId, tipo: aprobar ? "correccion_aprobada" : "correccion_rechazada", datos: { poncheId } });
}

export async function reportesEntre(desde: string, hasta: string) {
  const d = await db();
  return d.select().from(desempenoReportes).where(and(gte(desempenoReportes.fecha, desde), lte(desempenoReportes.fecha, hasta)));
}

// ─── Metas ────────────────────────────────────────────────────────────────────────────────────

export async function leerMetas(): Promise<OverrideMeta[]> {
  const d = await db();
  return (await d.select().from(desempenoMetas)).map((m) => ({ puesto: m.puesto, kpi: m.kpi, meta: m.meta, peso: m.peso }));
}

export async function guardarMeta(m: OverrideMeta, actorId: string) {
  const d = await db();
  await d
    .insert(desempenoMetas)
    .values({ ...m, updatedBy: actorId })
    .onConflictDoUpdate({ target: [desempenoMetas.puesto, desempenoMetas.kpi], set: { meta: m.meta, peso: m.peso, updatedBy: actorId, updatedAt: new Date() } });
  await evento({ actorId, tipo: "meta", datos: m });
}

// ─── Tablero Producción ───────────────────────────────────────────────────────────────────────

interface ColumnasProduccion {
  boardId: string;
  responsable: string | null;
  pidio: string | null;
  estado: string | null;
  fechaLimite: string | null;
}

export async function columnasProduccion(): Promise<ColumnasProduccion | null> {
  const d = await db();
  const [b] = await d.select({ id: pulseBoards.id }).from(pulseBoards).where(eq(pulseBoards.slug, SLUG_PRODUCCION));
  if (!b) return null;
  const cols = await d.select({ id: pulseColumns.id, title: pulseColumns.title, type: pulseColumns.type }).from(pulseColumns).where(eq(pulseColumns.boardId, b.id));
  const por = (tipo: string, re: RegExp) => cols.find((c) => c.type === tipo && re.test(c.title))?.id ?? null;
  return {
    boardId: b.id,
    responsable: por("people", /responsable/i),
    pidio: por("people", /pidi[oó]|solicit/i),
    estado: por("status", /estado/i),
    fechaLimite: por("date", /l[ií]mite|entrega|fecha/i),
  };
}

export async function leerProduccion(): Promise<{ tareas: TareaProduccion[]; cambios: CambioEstado[] } | null> {
  const c = await columnasProduccion();
  if (!c || !c.estado) return null;
  const d = await db();
  const [items, acts] = await Promise.all([
    d.select({ id: pulseItems.id, values: pulseItems.values, createdAt: pulseItems.createdAt }).from(pulseItems).where(eq(pulseItems.boardId, c.boardId)),
    d
      .select({ itemId: pulseActivity.itemId, after: pulseActivity.after, userId: pulseActivity.userId, at: pulseActivity.at })
      .from(pulseActivity)
      .where(and(eq(pulseActivity.boardId, c.boardId), eq(pulseActivity.columnId, c.estado), eq(pulseActivity.tipo, "valor")))
      .orderBy(asc(pulseActivity.at)),
  ]);
  const lista = (v: ValorCelda | undefined) => (Array.isArray(v) ? v : []);
  const tareas: TareaProduccion[] = items.map((i) => ({
    id: i.id,
    createdAt: i.createdAt.toISOString(),
    responsables: c.responsable ? lista(i.values[c.responsable]) : [],
    pidio: c.pidio ? lista(i.values[c.pidio]) : [],
    estado: (i.values[c.estado!] as string | null) ?? null,
    fechaLimite: c.fechaLimite ? ((i.values[c.fechaLimite] as string | null) ?? null) : null,
  }));
  const cambios: CambioEstado[] = acts.map((a) => ({ itemId: a.itemId, estado: typeof a.after === "string" ? a.after : null, userId: a.userId, at: a.at.toISOString() }));
  return { tareas, cambios };
}

/** Crea el tablero Producción (grupos por área, Responsable/Pidió/Estado/Fecha límite/Cliente). Idempotente. */
export async function crearTableroProduccion(): Promise<{ creado: boolean }> {
  if (await columnasProduccion()) return { creado: false };
  const b = await repo.crearBoard({ nombre: "Producción", slug: SLUG_PRODUCCION, color: "purple" });
  const { columns, groups } = await repo.leerEstructura(b.id);
  const personas = columns.find((c) => c.type === "people");
  const estado = columns.find((c) => c.type === "status");
  const fecha = columns.find((c) => c.type === "date");
  if (personas) await repo.actualizarColumna(personas.id, { title: "Responsable", settings: { multiple: false } });
  if (estado) await repo.actualizarColumna(estado.id, { settings: { labels: ESTADOS_PRODUCCION.map((e) => ({ ...e, color: e.color as ColorPulse })) } });
  if (fecha) await repo.actualizarColumna(fecha.id, { title: "Fecha límite" });
  await repo.crearColumna({ boardId: b.id, title: "Pidió", type: "people", settings: { multiple: false } });
  await repo.crearColumna({ boardId: b.id, title: "Cliente", type: "text" });
  const colores: ColorPulse[] = ["pink", "purple", "orange", "teal", "blue"];
  const d = await db();
  const [primero] = groups;
  if (primero) await d.update(pulseGroups).set({ title: GRUPOS_PRODUCCION[0], color: colores[0] }).where(eq(pulseGroups.id, primero.id));
  for (let i = 1; i < GRUPOS_PRODUCCION.length; i++) await repo.crearGrupo({ boardId: b.id, title: GRUPOS_PRODUCCION[i], color: colores[i] });
  return { creado: true };
}

// ─── Panel ────────────────────────────────────────────────────────────────────────────────────

export interface DiaPersona {
  fecha: string;
  asistencia: Asistencia;
  score: ScoreDia;
  color: Color | null;
  reporte: { bloqueos: string | null; datos: Record<string, number> } | null;
}

export interface FilaPersona {
  perfil: Perfil;
  puestoNombre: string;
  departamento: string;
  dias: DiaPersona[]; // desde → hasta
  hoy: DiaPersona;
  scoreSemana: number | null;
  colorSemana: Color | null;
  produccion: ReturnType<typeof kpisProduccion> | null;
  ponchesAbiertos: Ponche[];
  correcciones: Ponche[]; // pendientes de aprobar
}

export interface Panel {
  hoy: string;
  desde: string;
  hasta: string;
  filas: FilaPersona[];
  lideres: Record<string, string>; // id → nombre
  hayProduccion: boolean;
}

/** Todo lo del panel para lo que `actor` puede ver, de `desde` a `hasta` (días PR). */
export async function armarPanel(actor: UsuarioPulse & { rrhh?: boolean }, desde: string, hasta: string, ahora = Date.now()): Promise<Panel> {
  const hoy = fechaPR(ahora);
  const perfiles = (await leerPerfiles()).filter((p) => puedeVer(actor, p));
  const ids = perfiles.map((p) => p.userId);
  const d = await db();
  const [ponches, reportes, metas, prod, externas, lideresFilas] = await Promise.all([
    ponchesEntre(desde, hasta, ids),
    reportesEntre(desde, hasta),
    leerMetas(),
    leerProduccion(),
    ids.length ? d.select().from(desempenoMetricas).where(and(inArray(desempenoMetricas.userId, ids), gte(desempenoMetricas.fecha, desde), lte(desempenoMetricas.fecha, hasta))) : Promise.resolve([]),
    d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre }).from(pulseUsers),
  ]);
  const abiertos = ids.length ? await d.select().from(desempenoPonches).where(and(inArray(desempenoPonches.userId, ids), isNull(desempenoPonches.salidaAt))) : [];
  const pendientes = ids.length ? await d.select().from(desempenoPonches).where(and(inArray(desempenoPonches.userId, ids), eq(desempenoPonches.correccion, "pendiente"))) : [];
  const fechas = rangoFechas(desde, hasta);

  const filas: FilaPersona[] = perfiles.map((perfil) => {
    const puesto = puestoPorId(perfil.puesto);
    const kpis = kpisDe(perfil.puesto, metas);
    const dias = fechas.map((fecha): DiaPersona => {
      const asistencia = asistenciaDia({
        fecha,
        horario: perfil,
        ahora,
        desde: perfil.desde,
        ponches: ponches.filter((p) => p.userId === perfil.userId && p.fecha === fecha).map((p) => ({ entradaAt: p.entradaAt.toISOString(), salidaAt: p.salidaAt?.toISOString() ?? null, correccion: p.correccion })),
      });
      const valores: Record<string, number | null> = {};
      if (prod) Object.assign(valores, valoresProduccion(kpisProduccion({ userId: perfil.userId, fecha, ...prod })));
      for (const m of externas) if (m.userId === perfil.userId && m.fecha === fecha) valores[m.kpi] = m.valor;
      const rep = reportes.find((r) => r.userId === perfil.userId && r.fecha === fecha);
      const score = scoreDia({ asistencia: asistencia.puntaje, kpis, valores });
      return { fecha, asistencia, score, color: colorScore(score.score), reporte: rep ? { bloqueos: rep.bloqueos, datos: rep.datos } : null };
    });
    const hoyDia = dias.find((x) => x.fecha === hoy) ?? dias[dias.length - 1];
    const scoreSemana = promedio(dias.filter((x) => x.fecha <= hoy).map((x) => x.score.score));
    return {
      perfil,
      puestoNombre: puesto?.nombre ?? perfil.puesto,
      departamento: puesto?.departamento ?? "Otro",
      dias,
      hoy: hoyDia,
      scoreSemana,
      colorSemana: colorScore(scoreSemana),
      produccion: prod ? kpisProduccion({ userId: perfil.userId, fecha: hasta < hoy ? hasta : hoy, ...prod }) : null,
      ponchesAbiertos: abiertos.filter((p) => p.userId === perfil.userId),
      correcciones: pendientes.filter((p) => p.userId === perfil.userId),
    };
  });
  const lideres: Record<string, string> = {};
  for (const l of lideresFilas) lideres[l.id] = l.nombre;
  return { hoy, desde, hasta, filas, lideres, hayProduccion: !!prod };
}

// ─── Estado del botón de ponche (layout de Pulse) ─────────────────────────────────────────────

/** null si la persona no tiene perfil (o las tablas aún no existen: nunca rompe Pulse). */
export async function estadoPonche(userId: string): Promise<{ hoy: string; abiertoHoy: string | null; pendiente: { id: string; fecha: string; entradaAt: string } | null; manual: { id: string; nombre: string }[] } | null> {
  try {
    const perfil = await perfilDe(userId);
    if (!perfil?.activo) return null;
    const hoy = fechaPR(Date.now());
    const abiertos = await ponchesAbiertos(userId);
    const deHoy = abiertos.find((p) => vigente(p));
    const viejo = abiertos.find((p) => !vigente(p));
    return {
      hoy,
      abiertoHoy: deHoy ? deHoy.entradaAt.toISOString() : null,
      pendiente: viejo ? { id: viejo.id, fecha: viejo.fecha, entradaAt: viejo.entradaAt.toISOString() } : null,
      manual: puestoPorId(perfil.puesto)?.manual ?? [],
    };
  } catch (e) {
    console.error("[desempeno] estadoPonche", e);
    return null;
  }
}

/** El score se enseña cuando termina la calibración (DESEMPENO_SCORE=on). Antes, solo admin lo ve (vista previa). */
/** Actor de Ritmo: el usuario de Pulse + si es de Recursos Humanos (emails en RITMO_RRHH). */
export function actorRitmo<T extends { email: string; rol: UsuarioPulse["rol"] }>(u: T): T & { rrhh: boolean } {
  const rrhh = (process.env.RITMO_RRHH ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  return { ...u, rrhh: rrhh.includes(u.email.toLowerCase()) };
}

export function modoScore(rol: string): "visible" | "vista-previa" | "oculto" {
  if (process.env.DESEMPENO_SCORE === "on") return "visible";
  return rol === "admin" ? "vista-previa" : "oculto";
}
