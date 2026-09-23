import "server-only";

import { timingSafeEqual } from "node:crypto";
import { eq, desc, sql } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "./db";
import { pulseSecurityLog, pulseUsers } from "./schema";

// Medidas de seguridad de Pulse (datos de clientes): registro de eventos, bloqueo por
// intentos fallidos, límite de solicitudes por IP y comparación segura de secretos.

export type TipoEventoSeguridad =
  | "login_ok"
  | "login_fallido"
  | "login_bloqueado"
  | "login_limite_ip"
  | "logout"
  | "clave_cambiada"
  | "usuario_creado"
  | "rol_cambiado"
  | "usuario_desactivado"
  | "usuario_activado"
  | "acceso_tablero"
  | "tablero_eliminado"
  | "borrado_masivo"
  | "archivo_descargado"
  | "accion_bloqueada"
  | "login_ip_nueva"
  | "alerta_enviada";

export const MAX_INTENTOS = 5;
export const BLOQUEO_MIN = 15;

export async function ipActual(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

export async function registrarEvento(p: { tipo: TipoEventoSeguridad; email?: string | null; userId?: string | null; actorId?: string | null; detalle?: string | null; ip?: string | null }): Promise<void> {
  try {
    const d = await db();
    await d.insert(pulseSecurityLog).values({
      tipo: p.tipo,
      email: p.email ?? null,
      userId: p.userId ?? null,
      actorId: p.actorId ?? null,
      ip: p.ip === undefined ? await ipActual() : p.ip,
      detalle: p.detalle ?? null,
    });
  } catch (e) {
    console.error("[pulse] no se pudo registrar el evento de seguridad", e);
  }
}

// Aviso a Elvin (Telegram + espejo Slack) ante algo raro. Anti-spam: la misma `clave` no se
// repite antes de 15 minutos (se consulta el propio registro, así vale entre instancias).
export async function alertarElvin(clave: string, texto: string): Promise<void> {
  try {
    const d = await db();
    const [previo] = await d
      .select({ id: pulseSecurityLog.id })
      .from(pulseSecurityLog)
      .where(sql`${pulseSecurityLog.tipo} = 'alerta_enviada' and ${pulseSecurityLog.detalle} = ${clave} and ${pulseSecurityLog.at} > now() - interval '15 minutes'`)
      .limit(1);
    if (previo) return;
    await d.insert(pulseSecurityLog).values({ tipo: "alerta_enviada", detalle: clave, ip: null });
    const { notificarCEO } = await import("@/lib/notificar-ceo");
    await notificarCEO(`🛡️ Pulse · ${texto}`);
  } catch (e) {
    console.error("[pulse] no se pudo alertar", e);
  }
}

// Alguien intentó algo que su rol no permite: queda registrado, se avisa y se corta.
export async function prohibido(u: { id: string; email: string; nombre: string }, accion: string): Promise<never> {
  await registrarEvento({ tipo: "accion_bloqueada", email: u.email, userId: u.id, detalle: accion });
  await alertarElvin(`bloqueada:${u.id}:${accion}`, `${u.nombre} intentó ${accion} y se lo bloqueé.`);
  throw new Error(`Tu rol no permite ${accion}. Si hace falta, pedíselo a Elvin.`);
}

// Muchas descargas de archivos en poco tiempo = posible extracción.
export async function vigilarDescargas(u: { id: string; nombre: string }): Promise<void> {
  const d = await db();
  const [{ n }] = await d
    .select({ n: sql<number>`count(*)` })
    .from(pulseSecurityLog)
    .where(sql`${pulseSecurityLog.tipo} = 'archivo_descargado' and ${pulseSecurityLog.userId} = ${u.id} and ${pulseSecurityLog.at} > now() - interval '10 minutes'`);
  if (Number(n) >= 15) await alertarElvin(`descargas:${u.id}`, `${u.nombre} bajó ${n} archivos en los últimos 10 minutos. Revisalo en Actividad de seguridad.`);
}

// Inicio de sesión de una editora/admin desde una IP que nunca usó.
export async function vigilarIpNueva(u: { id: string; email: string; nombre: string; rol: string }, ip: string | null): Promise<void> {
  if (!ip || u.rol === "miembro") return;
  const d = await db();
  const [conocida] = await d
    .select({ id: pulseSecurityLog.id })
    .from(pulseSecurityLog)
    .where(sql`${pulseSecurityLog.tipo} = 'login_ok' and ${pulseSecurityLog.userId} = ${u.id} and ${pulseSecurityLog.ip} = ${ip}`)
    .limit(1);
  if (conocida) return;
  const [alguna] = await d.select({ id: pulseSecurityLog.id }).from(pulseSecurityLog).where(sql`${pulseSecurityLog.tipo} = 'login_ok' and ${pulseSecurityLog.userId} = ${u.id}`).limit(1);
  await registrarEvento({ tipo: "login_ip_nueva", email: u.email, userId: u.id, ip });
  // La primera vez que entra no es "nueva", es la primera.
  if (alguna && u.rol === "editor") await alertarElvin(`ip:${u.id}:${ip}`, `${u.nombre} entró desde una conexión nueva (${ip}). Si no fue ella, cambiale la clave.`);
}

export async function leerEventos(limit = 60) {
  const d = await db();
  return d.select().from(pulseSecurityLog).orderBy(desc(pulseSecurityLog.at)).limit(limit);
}

// Bloqueo por usuario (persistente en la base): tras MAX_INTENTOS fallidos, BLOQUEO_MIN minutos.
export async function registrarFallo(userId: string): Promise<{ bloqueado: boolean }> {
  const d = await db();
  const [u] = await d
    .update(pulseUsers)
    .set({ intentosFallidos: sql`${pulseUsers.intentosFallidos} + 1` })
    .where(eq(pulseUsers.id, userId))
    .returning({ intentos: pulseUsers.intentosFallidos });
  if ((u?.intentos ?? 0) >= MAX_INTENTOS) {
    await d.update(pulseUsers).set({ bloqueadoHasta: new Date(Date.now() + BLOQUEO_MIN * 60_000), intentosFallidos: 0 }).where(eq(pulseUsers.id, userId));
    const [f] = await d.select({ nombre: pulseUsers.nombre, email: pulseUsers.email }).from(pulseUsers).where(eq(pulseUsers.id, userId));
    await alertarElvin(`bloqueo:${userId}`, `la cuenta de ${f?.nombre ?? "?"} (${f?.email ?? "?"}) se bloqueó 15 min por ${MAX_INTENTOS} claves erradas seguidas.`);
    return { bloqueado: true };
  }
  return { bloqueado: false };
}

export async function limpiarFallos(userId: string): Promise<void> {
  const d = await db();
  await d.update(pulseUsers).set({ intentosFallidos: 0, bloqueadoHasta: null }).where(eq(pulseUsers.id, userId));
}

// Cierra todas las sesiones del usuario (las cookies emitidas antes de ahora dejan de valer).
export async function cerrarSesiones(userId: string): Promise<void> {
  const d = await db();
  await d.update(pulseUsers).set({ sesionesDesde: new Date() }).where(eq(pulseUsers.id, userId));
}

// Límite de solicitudes por IP en memoria (por instancia; en Vercel es "best effort", el
// bloqueo real por usuario está en la base). ventana deslizante simple.
const ventana = new Map<string, number[]>();
export function limiteIp(clave: string, max: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const lista = (ventana.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (lista.length >= max) {
    ventana.set(clave, lista);
    return false;
  }
  lista.push(ahora);
  ventana.set(clave, lista);
  if (ventana.size > 5000) ventana.clear();
  return true;
}

// Comparación en tiempo constante para secretos compartidos (webhooks, n8n, cron).
export function secretoValido(recibido: string | null | undefined, esperado: string | undefined): boolean {
  if (!recibido || !esperado) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}
