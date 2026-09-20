/**
 * Notificaciones push a la app de proveedores (PWA instalada en el celular).
 * Web Push estándar con VAPID: funciona en Android (Chrome) y en iPhone (iOS 16.4+) cuando la
 * app está añadida a la pantalla de inicio. Sin claves VAPID → no envía y lo dice en consola.
 * Genera claves una vez: `npx web-push generate-vapid-keys`.
 */
import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";
import { RAIZ } from "./almacen.js";

const PUB = process.env.VAPID_PUBLIC ?? "";
const PRIV = process.env.VAPID_PRIVATE ?? "";
export const configurado = () => !!(PUB && PRIV);
if (configurado()) webpush.setVapidDetails(process.env.VAPID_CONTACTO ?? "mailto:hola@resueltopr.com", PUB, PRIV);
export const clavePublica = () => PUB;

type Sub = { proveedorId: string; sub: webpush.PushSubscription; dispositivo?: string; creado: string };
const ARCH = path.join(RAIZ, "data", "estado", "push.json");
function leer(): Sub[] { return fs.existsSync(ARCH) ? (JSON.parse(fs.readFileSync(ARCH, "utf8")) as Sub[]) : []; }
function guardar(l: Sub[]) { fs.mkdirSync(path.dirname(ARCH), { recursive: true }); fs.writeFileSync(ARCH, JSON.stringify(l, null, 2)); }

export function suscribir(proveedorId: string, sub: webpush.PushSubscription, dispositivo?: string) {
  const l = leer().filter((s) => s.sub.endpoint !== sub.endpoint);
  l.push({ proveedorId, sub, dispositivo, creado: new Date().toISOString() });
  guardar(l);
  return l.filter((s) => s.proveedorId === proveedorId).length;
}

export interface Aviso { titulo: string; cuerpo: string; url: string; tag?: string; urgente?: boolean; ofertaId?: string }

/** Envía a todos los dispositivos del proveedor. Borra suscripciones muertas (410/404). */
export async function notificar(proveedorId: string, aviso: Aviso): Promise<number> {
  if (!configurado()) { console.log(`[push simulado → ${proveedorId}] ${aviso.titulo}: ${aviso.cuerpo}`); return 0; }
  const todas = leer(); const mias = todas.filter((s) => s.proveedorId === proveedorId);
  let ok = 0; const muertas = new Set<string>();
  await Promise.all(mias.map(async (s) => {
    try { await webpush.sendNotification(s.sub, JSON.stringify(aviso), { TTL: 60 * 60, urgency: aviso.urgente ? "high" : "normal" }); ok++; }
    catch (e: any) { if (e?.statusCode === 410 || e?.statusCode === 404) muertas.add(s.sub.endpoint); else console.error("push", proveedorId, e?.statusCode ?? e); }
  }));
  if (muertas.size) guardar(todas.filter((s) => !muertas.has(s.sub.endpoint)));
  return ok;
}
