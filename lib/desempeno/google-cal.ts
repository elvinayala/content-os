import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "../pulse/db";
import { evento } from "./datos";
import { ALCANCES, type Anotacion, cuerpoEvento, type EventoDia, eventosDelDia, finDia, inicioDia } from "./google-cal-reglas";
import { desempenoGoogle } from "./schema";

// Google Calendar de cada empleado (OAuth por persona; la app de Google la crea el admin de Workspace una vez:
// GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET). Sin esas variables, Ritmo esconde todo lo del calendario.

export const googleListo = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

function secreto(): string {
  const s = process.env.PULSE_SESSION_SECRET;
  if (!s) throw new Error("Falta PULSE_SESSION_SECRET");
  return s;
}
const llave = () => createHash("sha256").update(`ritmo-google|${secreto()}`).digest();
const cifrar = (t: string) => {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", llave(), iv);
  const d = Buffer.concat([c.update(t, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), d].map((b) => b.toString("base64url")).join(".");
};
const descifrar = (s: string) => {
  const [iv, tag, d] = s.split(".").map((x) => Buffer.from(x, "base64url"));
  const x = createDecipheriv("aes-256-gcm", llave(), iv);
  x.setAuthTag(tag);
  return Buffer.concat([x.update(d), x.final()]).toString("utf8");
};

// state = userId.exp.firma (10 min): el regreso de Google solo guarda el calendario de quien empezó la conexión.
const firma = (carga: string) => createHmac("sha256", secreto()).update(`google-state|${carga}`).digest("base64url");
function stateDe(userId: string) {
  const carga = `${userId}.${Date.now() + 10 * 60_000}`;
  return `${carga}.${firma(carga)}`;
}
export function userDeState(state: string | null): string | null {
  const [userId, exp, f] = (state ?? "").split(".");
  if (!userId || !exp || !f || Number(exp) < Date.now()) return null;
  const esperado = Buffer.from(firma(`${userId}.${exp}`));
  const dado = Buffer.from(f);
  return esperado.length === dado.length && timingSafeEqual(esperado, dado) ? userId : null;
}

export const redirectUri = (base: string) => `${base.replace(/\/$/, "")}/ritmo/google/volver`;

export function urlConectar(userId: string, base: string, email?: string) {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(base),
    response_type: "code",
    scope: ALCANCES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: stateDe(userId),
    ...(email ? { login_hint: email } : {}),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

async function token(body: Record<string, string>) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, ...body }),
    signal: AbortSignal.timeout(15000),
  });
  const j = (await r.json()) as { access_token?: string; refresh_token?: string; id_token?: string; error?: string; error_description?: string };
  if (!r.ok || !j.access_token) throw new Error(j.error_description || j.error || `Google HTTP ${r.status}`);
  return j;
}

/** Regreso de Google: cambia el código por los tokens y guarda el refresh token cifrado. */
export async function conectar(userId: string, code: string, base: string) {
  const j = await token({ code, grant_type: "authorization_code", redirect_uri: redirectUri(base) });
  if (!j.refresh_token) throw new Error("Google no devolvió permiso permanente: desconecta Ritmo en tu cuenta de Google y vuelve a intentarlo");
  const email = j.id_token ? (JSON.parse(Buffer.from(j.id_token.split(".")[1], "base64url").toString()).email as string) : "";
  const d = await db();
  const fila = { userId, email, refreshCifrado: cifrar(j.refresh_token), conectadoAt: new Date() };
  await d.insert(desempenoGoogle).values(fila).onConflictDoUpdate({ target: desempenoGoogle.userId, set: fila });
  ACCESOS.delete(userId);
  await evento({ userId, actorId: userId, tipo: "google_conectado", datos: { email } });
}

export async function conexion(userId: string): Promise<{ email: string } | null> {
  const d = await db();
  const [f] = await d.select({ email: desempenoGoogle.email }).from(desempenoGoogle).where(eq(desempenoGoogle.userId, userId));
  return f ?? null;
}

// Token de acceso (vive ~1 h) en memoria de la instancia.
const ACCESOS = new Map<string, { token: string; hasta: number }>();
async function acceso(userId: string): Promise<string | null> {
  const c = ACCESOS.get(userId);
  if (c && c.hasta > Date.now()) return c.token;
  const d = await db();
  const [f] = await d.select().from(desempenoGoogle).where(eq(desempenoGoogle.userId, userId));
  if (!f) return null;
  try {
    const j = await token({ refresh_token: descifrar(f.refreshCifrado), grant_type: "refresh_token" });
    ACCESOS.set(userId, { token: j.access_token!, hasta: Date.now() + 50 * 60_000 });
    return j.access_token!;
  } catch (e) {
    // Revocado desde Google o vencido: se borra la conexión para que la persona la vuelva a hacer.
    if (/invalid_grant/i.test(String((e as Error).message))) await d.delete(desempenoGoogle).where(eq(desempenoGoogle.userId, userId));
    throw e;
  }
}

async function api(userId: string, ruta: string, init: RequestInit = {}) {
  const t = await acceso(userId);
  if (!t) throw new Error("Tu calendario no está conectado");
  const r = await fetch(`https://www.googleapis.com/calendar/v3${ruta}`, { ...init, headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json", ...(init.headers ?? {}) }, signal: AbortSignal.timeout(15000), cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: { message?: string } }).error?.message || `Google Calendar HTTP ${r.status}`);
  return j;
}

/** El día de la persona en su calendario principal (hora de PR). null = no conectado o Google no respondió. */
export async function miDia(userId: string, dia: string): Promise<{ email: string; eventos: EventoDia[] } | { email: string; error: string } | null> {
  const c = await conexion(userId);
  if (!c) return null;
  try {
    const q = new URLSearchParams({ timeMin: inicioDia(dia), timeMax: finDia(dia), singleEvents: "true", orderBy: "startTime", maxResults: "50", timeZone: "America/Puerto_Rico" });
    const j = (await api(userId, `/calendars/primary/events?${q}`)) as { items?: Parameters<typeof eventosDelDia>[0] };
    return { email: c.email, eventos: eventosDelDia(j.items ?? []) };
  } catch (e) {
    return { email: c.email, error: (e as Error).message };
  }
}

export async function anotar(userId: string, a: Anotacion) {
  await api(userId, "/calendars/primary/events", { method: "POST", body: JSON.stringify(cuerpoEvento(a)) });
}

export async function desconectar(userId: string) {
  const d = await db();
  const [f] = await d.select().from(desempenoGoogle).where(eq(desempenoGoogle.userId, userId));
  if (!f) return;
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(descifrar(f.refreshCifrado))}`, { method: "POST", signal: AbortSignal.timeout(10000) });
  } catch {}
  await d.delete(desempenoGoogle).where(eq(desempenoGoogle.userId, userId));
  ACCESOS.delete(userId);
  await evento({ userId, actorId: userId, tipo: "google_desconectado" });
}
