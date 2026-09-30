import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import webpush from "web-push";

import { desempenoPush } from "../desempeno/schema";
import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import type { AvisoPush } from "./texto";

// Notificaciones push a las apps instaladas en el teléfono (Web Push estándar + VAPID, sin App Store ni Firebase).
// Android (Chrome) siempre; iPhone (iOS 16.4+) solo con la app agregada a la pantalla de inicio.
// Llaves: `npx web-push generate-vapid-keys` → NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (+ VAPID_SUBJECT).
// Patrón portado del portal de proveedores de Resuelto (vault/proyectos/plomeria-pr/agente/src/push.ts).

const PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIV = process.env.VAPID_PRIVATE_KEY ?? "";
export const pushConfigurado = () => !!(PUB && PRIV);
let listo = false;
/** Configura web-push con las llaves VAPID una vez; false si faltan. Lo usa también la app de clientes. */
export function vapid() {
  if (!listo && pushConfigurado()) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:levelupmediapr@gmail.com", PUB, PRIV);
    listo = true;
  }
  return listo;
}

export interface SuscripcionNavegador {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function suscripcionValida(s: unknown): s is SuscripcionNavegador {
  const x = s as SuscripcionNavegador | null;
  return !!x && typeof x.endpoint === "string" && /^https:\/\//.test(x.endpoint) && x.endpoint.length < 1000 && typeof x.keys?.p256dh === "string" && typeof x.keys?.auth === "string" && x.keys.p256dh.length < 200 && x.keys.auth.length < 100;
}

/** Guarda (o mueve a esta persona) la suscripción de un teléfono. Un endpoint = un teléfono/navegador. */
export async function guardarSuscripcion(userId: string, s: SuscripcionNavegador, dispositivo: string, app = "ritmo") {
  const d = await db();
  await d
    .insert(desempenoPush)
    .values({ userId, app, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, dispositivo })
    .onConflictDoUpdate({ target: desempenoPush.endpoint, set: { userId, app, p256dh: s.keys.p256dh, auth: s.keys.auth, dispositivo, fallos: 0 } });
}

export async function borrarSuscripcion(userId: string, endpoint: string) {
  const d = await db();
  await d.delete(desempenoPush).where(and(eq(desempenoPush.userId, userId), eq(desempenoPush.endpoint, endpoint)));
}

export async function suscripcionesDe(userId: string, app = "ritmo") {
  const d = await db();
  return d
    .select({ id: desempenoPush.id, endpoint: desempenoPush.endpoint, dispositivo: desempenoPush.dispositivo, creadoAt: desempenoPush.creadoAt, ultimoOkAt: desempenoPush.ultimoOkAt })
    .from(desempenoPush)
    .where(and(eq(desempenoPush.userId, userId), eq(desempenoPush.app, app)));
}

/** Quiénes (de esta lista) tienen al menos un teléfono con notificaciones activas. */
export async function conPush(userIds: string[], app = "ritmo"): Promise<Set<string>> {
  if (!userIds.length) return new Set();
  const d = await db();
  const filas = await d.selectDistinct({ userId: desempenoPush.userId }).from(desempenoPush).where(and(inArray(desempenoPush.userId, userIds), eq(desempenoPush.app, app)));
  return new Set(filas.map((f) => f.userId));
}

/** Manda el aviso a todos los teléfonos de la persona. Devuelve a cuántos llegó. Borra los muertos (404/410). */
export async function enviarPush(userId: string, aviso: AvisoPush, app = "ritmo"): Promise<number> {
  if (!vapid()) return 0;
  const d = await db();
  const subs = await d.select().from(desempenoPush).where(and(eq(desempenoPush.userId, userId), eq(desempenoPush.app, app)));
  let ok = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(aviso), { TTL: 60 * 60, urgency: "normal" });
        ok++;
        await d.update(desempenoPush).set({ ultimoOkAt: new Date(), fallos: 0 }).where(eq(desempenoPush.id, s.id));
      } catch (e) {
        const codigo = (e as { statusCode?: number })?.statusCode;
        if (codigo === 404 || codigo === 410) await d.delete(desempenoPush).where(eq(desempenoPush.id, s.id));
        else {
          console.error("push", app, userId, codigo ?? e);
          // Un teléfono que falla muchas veces seguidas (sin 410) también se da por perdido.
          await d.update(desempenoPush).set({ fallos: sql`${desempenoPush.fallos} + 1` }).where(eq(desempenoPush.id, s.id));
          if (s.fallos >= 9) await d.delete(desempenoPush).where(eq(desempenoPush.id, s.id));
        }
      }
    }),
  );
  return ok;
}

/** Igual que enviarPush pero por correo (Carilin, RR.HH., destinatarios fijos). */
export async function enviarPushCorreo(email: string, aviso: AvisoPush, app = "ritmo"): Promise<number> {
  if (!vapid()) return 0;
  const d = await db();
  const [u] = await d.select({ id: pulseUsers.id }).from(pulseUsers).where(eq(sql`lower(${pulseUsers.email})`, email.trim().toLowerCase()));
  return u ? enviarPush(u.id, aviso, app) : 0;
}
