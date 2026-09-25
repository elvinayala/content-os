import "server-only";

import { eq } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";

// Link de acceso a Ritmo: Carilin/Aure/Elvin lo generan en Ajustes y se lo mandan a la persona, que
// crea su propia clave (nadie más la conoce). Firmado con PULSE_SESSION_SECRET, vence en 72 h y
// muere al usarse (la firma incluye `sesiones_desde`, que cambia al poner la clave). Solo para
// miembros: nunca sirve para tomar la cuenta de un admin o una editora.

const TTL_MS = 72 * 3_600_000;

async function hmac(payload: string): Promise<string> {
  const secret = process.env.PULSE_SESSION_SECRET;
  if (!secret) throw new Error("Falta PULSE_SESSION_SECRET");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Buffer.from(sig).toString("hex");
}

const carga = (userId: string, exp: number, desde: Date) => `ritmo-activar|${userId}|${exp}|${desde.getTime()}`;

export async function linkDeAcceso(userId: string, base: string): Promise<{ url: string; vence: string }> {
  const d = await db();
  const [u] = await d.select().from(pulseUsers).where(eq(pulseUsers.id, userId));
  if (!u || !u.activo) throw new Error("La persona no está activa en Pulse");
  if (u.rol !== "miembro") throw new Error("Los admins y editoras entran con su propia clave");
  const exp = Date.now() + TTL_MS;
  const t = `${u.id}.${exp}.${await hmac(carga(u.id, exp, u.sesionesDesde))}`;
  return { url: `${base.replace(/\/$/, "")}/ritmo/activar?t=${t}`, vence: new Date(exp).toISOString() };
}

/** Devuelve el usuario si el link es válido (firma, vigencia, sin usar, miembro activo). */
export async function verificarLink(t: string | null | undefined) {
  const [userId, expS, firma] = (t ?? "").split(".");
  const exp = Number(expS);
  if (!userId || !firma || !Number.isFinite(exp) || exp < Date.now()) return null;
  if (!/^[0-9a-f-]{36}$/.test(userId)) return null;
  const d = await db();
  const [u] = await d.select().from(pulseUsers).where(eq(pulseUsers.id, userId));
  if (!u || !u.activo || u.rol !== "miembro") return null;
  const esperado = await hmac(carga(u.id, exp, u.sesionesDesde));
  if (esperado.length !== firma.length) return null;
  let dif = 0;
  for (let i = 0; i < esperado.length; i++) dif |= esperado.charCodeAt(i) ^ firma.charCodeAt(i);
  return dif === 0 ? u : null;
}
