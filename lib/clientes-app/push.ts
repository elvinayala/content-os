import "server-only";

import { eq, inArray, sql } from "drizzle-orm";
import webpush from "web-push";

import { db } from "../pulse/db";
import { pulseAppPush } from "../pulse/schema";
import { vapid, type SuscripcionNavegador } from "../push/enviar";
import type { AvisoPush } from "../push/texto";

// Avisos push a los teléfonos del cliente (app de Level Up). Mismo envío que Ritmo (lib/push/enviar.ts), pero la
// suscripción es del CLIENTE (item de LEVEL UP MEDIA), no de un usuario de Pulse.
// Los avisos que manda el equipo o el sistema salen solo con CLIENTES_APP_AVISOS=real (decisión de Elvin, 29/sep);
// la prueba que el cliente se manda a sí mismo desde la app siempre sale.
export const avisosClientesReales = () => process.env.CLIENTES_APP_AVISOS === "real";

export async function guardarSuscripcionCliente(itemId: string, s: SuscripcionNavegador, dispositivo: string) {
  const d = await db();
  await d
    .insert(pulseAppPush)
    .values({ itemId, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, dispositivo })
    .onConflictDoUpdate({ target: pulseAppPush.endpoint, set: { itemId, p256dh: s.keys.p256dh, auth: s.keys.auth, dispositivo, fallos: 0 } });
}

export async function borrarSuscripcionCliente(itemId: string, endpoint: string) {
  const d = await db();
  await d.delete(pulseAppPush).where(sql`${pulseAppPush.itemId} = ${itemId} and ${pulseAppPush.endpoint} = ${endpoint}`);
}

export async function telefonosCliente(itemId: string) {
  const d = await db();
  return d
    .select({ id: pulseAppPush.id, dispositivo: pulseAppPush.dispositivo, creadoAt: pulseAppPush.creadoAt, ultimoOkAt: pulseAppPush.ultimoOkAt })
    .from(pulseAppPush)
    .where(eq(pulseAppPush.itemId, itemId));
}

export async function clientesConPush(itemIds: string[]): Promise<Set<string>> {
  if (!itemIds.length) return new Set();
  const d = await db();
  const filas = await d.selectDistinct({ itemId: pulseAppPush.itemId }).from(pulseAppPush).where(inArray(pulseAppPush.itemId, itemIds));
  return new Set(filas.map((f) => f.itemId));
}

/** Manda a todos los teléfonos del cliente. Devuelve a cuántos llegó; borra los que ya no existen (404/410). */
export async function enviarPushCliente(itemId: string, aviso: AvisoPush): Promise<number> {
  if (!vapid()) return 0;
  const d = await db();
  const subs = await d.select().from(pulseAppPush).where(eq(pulseAppPush.itemId, itemId));
  let ok = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(aviso), { TTL: 60 * 60 * 6, urgency: "normal" });
        ok++;
        await d.update(pulseAppPush).set({ ultimoOkAt: new Date(), fallos: 0 }).where(eq(pulseAppPush.id, s.id));
      } catch (e) {
        const codigo = (e as { statusCode?: number })?.statusCode;
        if (codigo === 404 || codigo === 410 || s.fallos >= 9) await d.delete(pulseAppPush).where(eq(pulseAppPush.id, s.id));
        else {
          console.error("push cliente", itemId, codigo ?? e);
          await d.update(pulseAppPush).set({ fallos: sql`${pulseAppPush.fallos} + 1` }).where(eq(pulseAppPush.id, s.id));
        }
      }
    }),
  );
  return ok;
}

/** Aviso del equipo o del sistema al cliente: solo con CLIENTES_APP_AVISOS=real. */
export async function avisarCliente(itemId: string, aviso: AvisoPush): Promise<number> {
  if (!avisosClientesReales()) return 0;
  return enviarPushCliente(itemId, aviso).catch((e) => (console.error("push cliente", e), 0));
}
