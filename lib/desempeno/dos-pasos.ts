import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { evento } from "./datos";
import { desempenoDosPasos } from "./schema";
import { nuevoSecreto, urlOtpauth, verificarTotp } from "./totp";

// Verificación en dos pasos de la vista maestra de Ritmo (Elvin, Carilin, Aure, RR.HH.): ven salarios,
// documentos y el canal ético. Código de Google/Microsoft Authenticator; el dispositivo queda recordado
// 30 días en la cookie `ritmo-2fa` (firmada y atada a la cuenta: si cambia la clave o se cierran sesiones,
// hay que volver a verificar). Tras 5 códigos malos, 15 min de bloqueo.

export const COOKIE_2FA = "ritmo-2fa";
const DIAS_RECORDADO = 30;
const MAX_FALLOS = 5;

function secretoApp(): string {
  const s = process.env.PULSE_SESSION_SECRET;
  if (!s) throw new Error("Falta PULSE_SESSION_SECRET");
  return s;
}
const llave = () => createHash("sha256").update(`ritmo-2fa|${secretoApp()}`).digest();

function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", llave(), iv);
  const datos = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), datos].map((b) => b.toString("base64url")).join(".");
}

function descifrar(s: string): string {
  const [iv, tag, datos] = s.split(".").map((x) => Buffer.from(x, "base64url"));
  const d = createDecipheriv("aes-256-gcm", llave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(datos), d.final()]).toString("utf8");
}

async function fila(userId: string) {
  const d = await db();
  const [f] = await d.select().from(desempenoDosPasos).where(eq(desempenoDosPasos.userId, userId));
  return f ?? null;
}

async function sesionesDesde(userId: string): Promise<number> {
  const d = await db();
  const [u] = await d.select({ s: pulseUsers.sesionesDesde }).from(pulseUsers).where(eq(pulseUsers.id, userId));
  return u ? new Date(u.s).getTime() : 0;
}

const firma = (userId: string, exp: number, desde: number) => createHmac("sha256", secretoApp()).update(`2fa|${userId}|${exp}|${desde}`).digest("base64url");

/** ¿Este navegador ya pasó la verificación para esta persona? */
export async function dispositivoVerificado(userId: string): Promise<boolean> {
  try {
    const v = (await cookies()).get(COOKIE_2FA)?.value;
    if (!v) return false;
    const [uid, expS, sig] = v.split(".");
    const exp = Number(expS);
    if (uid !== userId || !Number.isFinite(exp) || exp < Date.now() || !sig) return false;
    const f = await fila(userId);
    if (!f?.activadoAt) return false; // si se reinició la verificación, la cookie vieja ya no sirve
    const esperada = Buffer.from(firma(userId, exp, await sesionesDesde(userId)));
    const dada = Buffer.from(sig);
    return esperada.length === dada.length && timingSafeEqual(esperada, dada);
  } catch {
    return false;
  }
}

async function recordarDispositivo(userId: string) {
  const exp = Date.now() + DIAS_RECORDADO * 86_400_000;
  (await cookies()).set(COOKIE_2FA, `${userId}.${exp}.${firma(userId, exp, await sesionesDesde(userId))}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DIAS_RECORDADO * 86_400,
    path: "/",
  });
}

export async function olvidarDispositivo() {
  (await cookies()).delete(COOKIE_2FA);
}

export type EstadoDosPasos = { configurada: false; qr: string; clave: string } | { configurada: true };

/** Para la pantalla de verificación: si no está configurada, prepara (o reutiliza) la clave pendiente. */
export async function estadoDosPasos(userId: string, email: string): Promise<EstadoDosPasos> {
  const f = await fila(userId);
  if (f?.activadoAt) return { configurada: true };
  let secreto: string;
  if (f) secreto = descifrar(f.secretoCifrado);
  else {
    secreto = nuevoSecreto();
    const d = await db();
    await d.insert(desempenoDosPasos).values({ userId, secretoCifrado: cifrar(secreto) }).onConflictDoNothing();
  }
  const QR = await import("qrcode");
  const qr = await QR.toDataURL(urlOtpauth(secreto, email), { margin: 1, width: 220, color: { dark: "#0b0d17", light: "#ffffff" } });
  return { configurada: false, qr, clave: secreto.replace(/(.{4})/g, "$1 ").trim() };
}

/** Revisa el código; si es bueno activa (la primera vez) y recuerda el dispositivo. */
export async function comprobarCodigo(userId: string, codigo: string, ip: string | null): Promise<{ ok: true } | { ok: false; error: string }> {
  const f = await fila(userId);
  if (!f) return { ok: false, error: "Vuelve a abrir la verificación" };
  if (f.bloqueadoHasta && f.bloqueadoHasta.getTime() > Date.now()) return { ok: false, error: "Demasiados intentos. Espera 15 minutos." };
  const d = await db();
  const contador = verificarTotp(descifrar(f.secretoCifrado), codigo, Date.now(), f.ultimoContador);
  if (contador === null) {
    const fallos = f.intentosFallidos + 1;
    const bloquear = fallos >= MAX_FALLOS;
    await d
      .update(desempenoDosPasos)
      .set({ intentosFallidos: bloquear ? 0 : fallos, bloqueadoHasta: bloquear ? new Date(Date.now() + 15 * 60_000) : f.bloqueadoHasta, updatedAt: new Date() })
      .where(eq(desempenoDosPasos.userId, userId));
    await evento({ userId, actorId: userId, tipo: bloquear ? "2fa_bloqueado" : "2fa_fallido", ip });
    return { ok: false, error: bloquear ? "Demasiados intentos. Espera 15 minutos." : "Código incorrecto o vencido. Usa el que se ve ahora en la app." };
  }
  const primera = !f.activadoAt;
  await d
    .update(desempenoDosPasos)
    .set({ ultimoContador: contador, intentosFallidos: 0, bloqueadoHasta: null, activadoAt: f.activadoAt ?? new Date(), updatedAt: new Date() })
    .where(eq(desempenoDosPasos.userId, userId));
  await evento({ userId, actorId: userId, tipo: primera ? "2fa_activado" : "2fa_ok", ip });
  await recordarDispositivo(userId);
  return { ok: true };
}

/** Reiniciar (teléfono perdido): la persona vuelve a escanear un QR nuevo. Solo admin, o por script. */
export async function reiniciarDosPasos(userId: string, actorId: string | null) {
  const d = await db();
  await d.delete(desempenoDosPasos).where(eq(desempenoDosPasos.userId, userId));
  await evento({ userId, actorId, tipo: "2fa_reiniciado" });
}
