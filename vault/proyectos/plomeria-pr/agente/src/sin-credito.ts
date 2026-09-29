/**
 * Red de seguridad cuando se acaba el crédito de Anthropic (27 y 28/sep/2026: dos veces se quedaron clientes de
 * Messenger sin respuesta y nadie se enteró hasta que Elvin lo vio en Zernio).
 * - El mensaje que no se pudo contestar se guarda en data/estado/pendientes-ia.json.
 * - A Elvin le llega UN aviso por Telegram (como mucho uno por hora) para que recargue.
 * - Cada 3 min se prueba la API con una llamada mínima; cuando vuelve, se contestan los pendientes en orden
 *   (los de Messenger/IG solo si siguen dentro de las 24 h de Meta) y se avisa que ya salieron.
 */
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "./almacen.js";

export type Pendiente = { tipo: "dm" | "sms"; clave: string; fecha: string; m: any };
const ARCHIVO = path.join(RAIZ, "data", "estado", "pendientes-ia.json");
const leer = (): Pendiente[] => { try { return JSON.parse(fs.readFileSync(ARCHIVO, "utf8")); } catch { return []; } };
const escribir = (l: Pendiente[]) => fs.writeFileSync(ARCHIVO, JSON.stringify(l, null, 1));

/** ¿El error es que se acabó el crédito (o la cuenta está sin fondos)? Pura (tests). */
export function esSinCredito(e: unknown): boolean {
  const s = String((e as any)?.message ?? e ?? "") + " " + JSON.stringify((e as any)?.error ?? "");
  return /credit balance is too low|insufficient.?credit|billing/i.test(s);
}

/** Qué pendientes se pueden contestar todavía. Messenger/IG: dentro de 23 h (ventana de Meta); SMS: 24 h. Pura. */
export function vigentes(l: Pendiente[], ahora = Date.now()): Pendiente[] {
  return l.filter((p) => ahora - new Date(p.fecha).getTime() < (p.tipo === "dm" ? 23 : 24) * 3600_000);
}

/** Une los mensajes de la misma persona en uno solo, en orden (29/sep: Hector escribió "Reemplazo de inodoro" y luego
 *  "Precio"; guardando solo el último, el agente no supo qué quería). La fecha es la del PRIMERO (ventana de Meta). Pura. */
export function juntar(l: Pendiente[], nuevo: Pendiente): Pendiente[] {
  const previo = l.find((p) => p.clave === nuevo.clave);
  if (!previo) return [...l, nuevo];
  const texto = [previo.m?.texto, nuevo.m?.texto].filter((t) => t && String(t).trim()).join("\n");
  return l.map((p) => (p.clave === nuevo.clave ? { ...p, m: { ...nuevo.m, texto } } : p));
}

export function guardar(tipo: Pendiente["tipo"], clave: string, m: any) {
  escribir(juntar(leer(), { tipo, clave, fecha: new Date().toISOString(), m }));
}

let ultimoAviso = 0;
export async function avisar(enviar: (t: string) => Promise<unknown>) {
  if (Date.now() - ultimoAviso < 3600_000) return;
  ultimoAviso = Date.now();
  const n = leer().length;
  await enviar(`🚨 Se acabó el crédito de Anthropic: el agente NO está contestando a los clientes (${n} esperando). Recarga en console.anthropic.com → Billing (y activa la recarga automática). Cuando vuelva el crédito les contesto solo.`).catch(console.error);
}

async function hayCredito(): Promise<boolean> {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": process.env.ANTHROPIC_API_KEY ?? "", "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1, messages: [{ role: "user", content: "ok" }] }) });
    return r.ok;
  } catch { return false; }
}

let corriendo = false;
/** Si hay pendientes y volvió el crédito, los contesta con los mismos manejadores de siempre. */
export async function reintentar(manejadores: Record<Pendiente["tipo"], (m: any) => Promise<void>>, enviar: (t: string) => Promise<unknown>) {
  if (corriendo) return;
  const l = leer(); if (!l.length) return;
  corriendo = true;
  try {
    if (!(await hayCredito())) return;
    const ok = vigentes(l); let hechos = 0;
    escribir([]); // si algo vuelve a fallar por crédito, el manejador lo guarda de nuevo
    for (const p of ok) { try { await manejadores[p.tipo]({ ...p.m, reintento: true }); hechos++; } catch (e) { console.error("reintento", p.clave, e); } }
    ultimoAviso = 0;
    await enviar(`✅ Volvió el crédito de Anthropic. Les contesté a ${hechos} cliente(s) que esperaban${l.length > ok.length ? ` (${l.length - ok.length} ya estaban fuera de las 24 h de Messenger: hay que escribirles a mano)` : ""}.`).catch(console.error);
  } finally { corriendo = false; }
}

export const cuantos = () => leer().length;
