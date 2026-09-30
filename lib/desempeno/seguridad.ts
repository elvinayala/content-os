import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { and, asc, desc, eq, isNull, lte, ne } from "drizzle-orm";
import { cookies, headers } from "next/headers";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { avisarPersona, avisarRrhh, esc } from "./avisar";
import { evento } from "./datos";
import { fechaPR } from "./reglas";
import { desempenoDispositivos, desempenoPoncheManual, desempenoPonches } from "./schema";
import { decisionPonche, errorNombreEquipo, errorPoncheManual, esMovil, estadoAlRegistrar, noEsComputadora, redDe, resumenAgente, TEXTO_BLOQUEO, type MotivoBloqueo, type PistaEquipo } from "./seguridad-reglas";

// Seguridad del ponche (27/sep, Elvin): "que no puedan evadir o engañar el sistema… un solo dispositivo a la vez…
// si no están en la computadora no pueden ponchar; tienen que solicitar el ponche manual a Yaileen".
// RITMO_SEGURIDAD = on (bloquea, por defecto) | aviso (deja ponchar pero lo registra) | off.

export const COOKIE_EQUIPO = "ritmo-equipo";
const UN_ANO = 400 * 24 * 3600;
const base = () => process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app";
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
export const modoSeguridad = (): "on" | "aviso" | "off" => {
  const m = (process.env.RITMO_SEGURIDAD ?? "on").toLowerCase();
  return m === "off" || m === "aviso" ? m : "on";
};

export type Equipo = typeof desempenoDispositivos.$inferSelect;

export async function contextoRed(): Promise<{ ip: string | null; ua: string | null }> {
  const h = await headers();
  return { ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip"), ua: h.get("user-agent") };
}

async function nombreDe(userId: string) {
  const d = await db();
  const [u] = await d.select({ nombre: pulseUsers.nombre }).from(pulseUsers).where(eq(pulseUsers.id, userId));
  return u?.nombre ?? "Alguien";
}

/** El equipo de ESTE navegador (por la cookie). Si borraron las cookies, lo reconoce por la huella + la red. */
export async function equipoActual(userId: string, huella?: string | null): Promise<Equipo | null> {
  const d = await db();
  const token = (await cookies()).get(COOKIE_EQUIPO)?.value;
  if (token) {
    const [e] = await d.select().from(desempenoDispositivos).where(and(eq(desempenoDispositivos.tokenHash, hash(token)), eq(desempenoDispositivos.userId, userId)));
    if (e) return e;
  }
  if (!huella) return null;
  const { ip } = await contextoRed();
  const red = redDe(ip);
  const candidatos = await d.select().from(desempenoDispositivos).where(and(eq(desempenoDispositivos.userId, userId), eq(desempenoDispositivos.huella, huella), ne(desempenoDispositivos.estado, "revocado")));
  const e = candidatos.find((c) => red && c.ips.includes(red));
  if (!e) return null;
  // Mismo equipo y misma red: se le devuelve su llave a este navegador.
  const nuevo = randomBytes(32).toString("base64url");
  await d.update(desempenoDispositivos).set({ tokenHash: hash(nuevo) }).where(eq(desempenoDispositivos.id, e.id));
  (await cookies()).set(COOKIE_EQUIPO, nuevo, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: UN_ANO });
  await evento({ userId, actorId: userId, tipo: "equipo-reconocido", datos: { equipoId: e.id }, ip });
  return { ...e, tokenHash: hash(nuevo) };
}

export async function equiposDe(userId: string): Promise<Equipo[]> {
  const d = await db();
  return d.select().from(desempenoDispositivos).where(eq(desempenoDispositivos.userId, userId)).orderBy(asc(desempenoDispositivos.createdAt));
}

/** Registrar ESTA computadora. La primera queda aprobada con la red de este momento; otra espera a RR.HH. */
export async function registrarEquipo(userId: string, p: { nombre: string; huella: string | null; motivo?: string | null; reemplaza?: boolean; pista?: PistaEquipo | null }): Promise<Equipo> {
  const err = errorNombreEquipo(p.nombre);
  if (err) throw new Error(err);
  const { ip, ua } = await contextoRed();
  const ya = await equipoActual(userId, p.huella);
  if (ya && ya.estado !== "revocado") throw new Error("Esta computadora ya está registrada");
  const d = await db();
  const aprobados = (await equiposDe(userId)).filter((e) => e.estado === "aprobado").length;
  const r = estadoAlRegistrar({ aprobadosQueTiene: aprobados, movil: !!noEsComputadora(ua, p.pista) });
  if ("error" in r) throw new Error(r.error);
  if (r.estado === "pendiente" && (p.motivo ?? "").trim().length < 5) throw new Error("Cuéntale a RR.HH. por qué necesitas otra computadora (ej. tengo laptop y desktop)");
  const token = randomBytes(32).toString("base64url");
  const red = redDe(ip);
  const [e] = await d
    .insert(desempenoDispositivos)
    .values({
      userId,
      nombre: p.nombre.trim(),
      tokenHash: hash(token),
      huella: p.huella?.slice(0, 128) || null,
      agente: resumenAgente(ua),
      ips: r.estado === "aprobado" && red ? [red] : [],
      ipPendiente: r.estado === "pendiente" ? red : null,
      ultimaIp: ip,
      estado: r.estado,
      motivo: p.motivo?.trim().slice(0, 300) || null,
      reemplaza: !!p.reemplaza,
      decididoAt: r.estado === "aprobado" ? new Date() : null,
    })
    .returning();
  (await cookies()).set(COOKIE_EQUIPO, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: UN_ANO });
  await evento({ userId, actorId: userId, tipo: "equipo-registrado", datos: { equipoId: e.id, estado: r.estado, agente: e.agente }, ip });
  const quien = esc(await nombreDe(userId));
  if (r.estado === "pendiente")
    await avisarRrhh(`💻 ${quien} pide autorizar ${p.reemplaza ? "una computadora NUEVA (reemplaza la anterior)" : "una segunda computadora"}: *${esc(e.nombre)}* (${esc(e.agente)}). Motivo: “${esc(e.motivo)}”. <${base()}/ritmo/seguridad|Aprobar en Ritmo>`).catch(() => 0);
  else await avisarRrhh(`💻 ${quien} registró su computadora de trabajo: *${esc(e.nombre)}* (${esc(e.agente)}). Solo puede ponchar desde ahí y desde esa red. <${base()}/ritmo/seguridad|Ver en Ritmo>`).catch(() => 0);
  return e;
}

/**
 * Antes de marcar entrada, salida o almuerzo. Lanza el error con el porqué si no puede (modo "on").
 * La dirección (admin/editoras) no tiene que ponchar: queda fuera del registro de computadoras, PERO nadie poncha
 * desde el teléfono, la tablet o la app instalada (29/sep, Elvin), aunque el modo sea "aviso".
 */
export async function verificarParaPonchar(u: { id: string; rol: string }, huella?: string | null, pista?: PistaEquipo | null): Promise<{ equipoId: string | null }> {
  const modo = modoSeguridad();
  if (modo === "off") return { equipoId: null };
  const { ip, ua } = await contextoRed();
  const fuera = noEsComputadora(ua, pista);
  if (fuera) {
    await evento({ userId: u.id, actorId: u.id, tipo: "ponche-bloqueado", datos: { motivo: fuera, equipoId: null, agente: resumenAgente(ua), modo }, ip });
    throw new Error(TEXTO_BLOQUEO[fuera]);
  }
  if (u.rol === "admin" || u.rol === "editor") return { equipoId: null };
  const e = await equipoActual(u.id, huella);
  const r = decisionPonche({ equipo: e, ip, movil: esMovil(ua) });
  const d = await db();
  if (e) await d.update(desempenoDispositivos).set({ ultimoUsoAt: new Date(), ultimaIp: ip }).where(eq(desempenoDispositivos.id, e.id));
  if (r.ok) return { equipoId: e?.id ?? null };
  // Red nueva en un equipo aprobado: queda pedida a RR.HH. (una vez por red).
  const red = redDe(ip);
  if (r.motivo === "red-nueva" && e && red && e.ipPendiente !== red) {
    await d.update(desempenoDispositivos).set({ ipPendiente: red }).where(eq(desempenoDispositivos.id, e.id));
    await avisarRrhh(`🌐 ${esc(await nombreDe(u.id))} intentó ponchar desde su computadora *${esc(e.nombre)}* pero en otra red (internet). Si es su nueva red de trabajo, apruébala: <${base()}/ritmo/seguridad|Ver en Ritmo>`).catch(() => 0);
  }
  await evento({ userId: u.id, actorId: u.id, tipo: "ponche-bloqueado", datos: { motivo: r.motivo, equipoId: e?.id ?? null, agente: resumenAgente(ua), modo }, ip });
  if (modo === "aviso") return { equipoId: e?.id ?? null };
  throw new Error(TEXTO_BLOQUEO[r.motivo]);
}

/** Lo que Hoy necesita saber (sin huella: solo cookie + red). */
export async function estadoSeguridad(u: { id: string; rol: string }): Promise<{ modo: string; exento: boolean; equipo: { nombre: string; estado: string } | null; bloqueo: MotivoBloqueo | null; tieneEquipos: boolean; manualPendientes: number }> {
  const modo = modoSeguridad();
  const exento = modo === "off" || u.rol === "admin" || u.rol === "editor";
  const { ip, ua } = await contextoRed();
  const d = await db();
  const [e, todos, pend] = await Promise.all([
    equipoActual(u.id),
    equiposDe(u.id),
    d.select({ id: desempenoPoncheManual.id }).from(desempenoPoncheManual).where(and(eq(desempenoPoncheManual.userId, u.id), eq(desempenoPoncheManual.estado, "pendiente"))),
  ]);
  const r = decisionPonche({ equipo: e, ip, movil: esMovil(ua) });
  return { modo, exento, equipo: e ? { nombre: e.nombre, estado: e.estado } : null, bloqueo: r.ok ? null : r.motivo, tieneEquipos: todos.some((x) => x.estado !== "revocado"), manualPendientes: pend.length };
}

// ---- Ponche manual ----

export async function pedirPoncheManual(userId: string, p: { tipo: string; hora: Date; motivo: string }) {
  const err = errorPoncheManual({ ...p, ahora: new Date() });
  if (err) throw new Error(err);
  const { ip, ua } = await contextoRed();
  const d = await db();
  const [m] = await d.insert(desempenoPoncheManual).values({ userId, tipo: p.tipo, hora: p.hora, motivo: p.motivo.trim(), ip, agente: resumenAgente(ua) }).returning();
  const hora = p.hora.toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  await avisarRrhh(`🕐 ${esc(await nombreDe(userId))} pide un ponche manual de *${p.tipo}* a las ${hora}. Motivo: “${esc(m.motivo)}”. <${base()}/ritmo/seguridad|Autorizar en Ritmo>`).catch(() => 0);
  return m;
}

/** RR.HH. autoriza o rechaza. Autorizar crea la entrada, o cierra la entrada abierta con esa hora de salida. */
export async function decidirPoncheManual(id: string, aprobar: boolean, actorId: string) {
  const d = await db();
  const [m] = await d.select().from(desempenoPoncheManual).where(eq(desempenoPoncheManual.id, id));
  if (!m || m.estado !== "pendiente") throw new Error("Ya no está pendiente");
  if (aprobar) {
    if (m.tipo === "entrada") {
      const abiertos = await d.select().from(desempenoPonches).where(and(eq(desempenoPonches.userId, m.userId), isNull(desempenoPonches.salidaAt)));
      if (abiertos.length) throw new Error("Esta persona ya tiene una entrada abierta: primero hay que cerrarla");
      await d.insert(desempenoPonches).values({ userId: m.userId, fecha: fechaPR(m.hora), entradaAt: m.hora, manualPor: actorId, nota: `Ponche manual: ${m.motivo}`.slice(0, 300) });
    } else {
      const [abierto] = await d
        .select()
        .from(desempenoPonches)
        .where(and(eq(desempenoPonches.userId, m.userId), isNull(desempenoPonches.salidaAt), lte(desempenoPonches.entradaAt, m.hora)))
        .orderBy(desc(desempenoPonches.entradaAt))
        .limit(1);
      if (!abierto) throw new Error("No hay una entrada abierta antes de esa hora: primero autoriza (o pide) la entrada");
      await d.update(desempenoPonches).set({ salidaAt: m.hora, manualPor: actorId }).where(eq(desempenoPonches.id, abierto.id));
    }
  }
  await d.update(desempenoPoncheManual).set({ estado: aprobar ? "aprobada" : "rechazada", decididoPor: actorId, decididoAt: new Date() }).where(eq(desempenoPoncheManual.id, id));
  await evento({ userId: m.userId, actorId, tipo: aprobar ? "ponche-manual-aprobado" : "ponche-manual-rechazado", datos: { id, tipo: m.tipo } });
  await avisarPersona(m.userId, aprobar ? `✅ RR.HH. autorizó tu ponche manual de ${m.tipo}.` : `❌ RR.HH. no autorizó tu ponche manual de ${m.tipo}. Si tienes dudas, escríbele.`).catch(() => false);
}

// ---- Panel de RR.HH. ----

export async function decidirEquipo(id: string, aprobar: boolean, actorId: string) {
  const d = await db();
  const [e] = await d.select().from(desempenoDispositivos).where(eq(desempenoDispositivos.id, id));
  if (!e) throw new Error("No existe");
  if (aprobar) {
    const ips = [...new Set([...e.ips, ...(e.ipPendiente ? [e.ipPendiente] : [])])];
    await d.update(desempenoDispositivos).set({ estado: "aprobado", ips, ipPendiente: null, decididoPor: actorId, decididoAt: new Date() }).where(eq(desempenoDispositivos.id, id));
    if (e.reemplaza) await d.update(desempenoDispositivos).set({ estado: "revocado", decididoPor: actorId, decididoAt: new Date() }).where(and(eq(desempenoDispositivos.userId, e.userId), ne(desempenoDispositivos.id, id), eq(desempenoDispositivos.estado, "aprobado")));
  } else {
    await d.update(desempenoDispositivos).set({ estado: "revocado", ipPendiente: null, decididoPor: actorId, decididoAt: new Date() }).where(eq(desempenoDispositivos.id, id));
  }
  await evento({ userId: e.userId, actorId, tipo: aprobar ? "equipo-aprobado" : "equipo-revocado", datos: { equipoId: id } });
  await avisarPersona(e.userId, aprobar ? `✅ RR.HH. autorizó tu computadora *${esc(e.nombre)}*. Ya puedes ponchar desde ahí.` : `🔒 RR.HH. quitó la autorización de la computadora *${esc(e.nombre)}*.`).catch(() => false);
}

/** Aprobar (o no) la red nueva de un equipo que ya estaba aprobado. */
export async function decidirRed(id: string, aprobar: boolean, actorId: string) {
  const d = await db();
  const [e] = await d.select().from(desempenoDispositivos).where(eq(desempenoDispositivos.id, id));
  if (!e?.ipPendiente) throw new Error("No hay una red pendiente");
  await d
    .update(desempenoDispositivos)
    .set({ ips: aprobar ? [...new Set([...e.ips, e.ipPendiente])] : e.ips, ipPendiente: null, decididoPor: actorId, decididoAt: new Date() })
    .where(eq(desempenoDispositivos.id, id));
  await evento({ userId: e.userId, actorId, tipo: aprobar ? "red-aprobada" : "red-rechazada", datos: { equipoId: id, red: e.ipPendiente } });
  if (aprobar) await avisarPersona(e.userId, `✅ RR.HH. aprobó tu nueva red de internet en *${esc(e.nombre)}*. Ya puedes ponchar.`).catch(() => false);
}

export async function panelSeguridad() {
  const d = await db();
  const [equipos, manuales, usuarios] = await Promise.all([
    d.select().from(desempenoDispositivos).orderBy(desc(desempenoDispositivos.createdAt)),
    d.select().from(desempenoPoncheManual).orderBy(desc(desempenoPoncheManual.createdAt)).limit(200),
    d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre }).from(pulseUsers),
  ]);
  const nombre = (id: string) => usuarios.find((u) => u.id === id)?.nombre ?? "—";
  const iso = (x: Date | null) => (x ? x.toISOString() : null);
  return {
    equipos: equipos.map((e) => ({ id: e.id, persona: nombre(e.userId), nombre: e.nombre, agente: e.agente, estado: e.estado, redes: e.ips.length, redPendiente: !!e.ipPendiente, motivo: e.motivo, reemplaza: e.reemplaza, ultimoUso: iso(e.ultimoUsoAt), creado: e.createdAt.toISOString() })),
    manuales: manuales.map((m) => ({ id: m.id, persona: nombre(m.userId), tipo: m.tipo, hora: m.hora.toISOString(), motivo: m.motivo, estado: m.estado, agente: m.agente, creado: m.createdAt.toISOString() })),
  };
}
