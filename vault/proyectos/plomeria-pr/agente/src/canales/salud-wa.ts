/**
 * Vigilante de la cuenta de WhatsApp del negocio (23/sep/2026). Esa noche Meta marcó la WABA de Resuelto por
 * "SCAM" y nadie se enteró hasta que Elvin vio el error en el inbox. Ahora:
 *  - cada 10 min se lee el estado de la cuenta en Zernio (violaciones de Meta, desconexión, calidad, nivel);
 *  - si cae: aviso a Elvin (Telegram) y a la reclutadora (Slack), el agente deja de mandar mensajes y cada persona
 *    que escribe se le pasa a la reclutadora para que la llame;
 *  - candado: el número del negocio nunca le abre conversación a un número interno (así se causó el bloqueo) y hay
 *    un tope diario de mensajes que inicia el negocio (plantillas / conversaciones nuevas).
 * `evaluarSalud` y `puedeEnviar` son puras (tests/salud-wa.test.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "../almacen.js";
import { config } from "../config.js";

export interface SaludWa { ok: boolean; motivo: string; alerta?: string; evento?: string; eventoEn?: string; calidad?: string; nivel?: string; metaStatus?: string; revisado: string }
interface Estado {
  ultimo?: SaludWa;
  caidoDesde?: string;
  /** Eventos de Meta ya resueltos (Elvin confirmó que la cuenta volvió): no vuelven a contar como caída. */
  resueltos: string[];
  /** Contactos que escribieron con la cuenta caída y ya se le pasaron a la reclutadora. */
  pasados: string[];
  /** Mensajes iniciados por el negocio, por día (AAAA-MM-DD en PR). */
  iniciados: Record<string, number>;
}
const ARCHIVO = path.join(RAIZ, "data", "estado", "salud-wa.json");
export function leer(): Estado { try { return { resueltos: [], pasados: [], iniciados: {}, ...JSON.parse(fs.readFileSync(ARCHIVO, "utf8")) }; } catch { return { resueltos: [], pasados: [], iniciados: {} }; } }
export function guardar(e: Estado) { fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true }); fs.writeFileSync(ARCHIVO + ".tmp", JSON.stringify(e, null, 2)); fs.renameSync(ARCHIVO + ".tmp", ARCHIVO); }

const MALO = /VIOLATION|RESTRICT|DISABLE|BAN|FLAGGED|SUSPEND/i;
const claveEvento = (ev?: string, en?: string) => `${ev ?? ""}@${en ?? ""}`;

/** Lee la cuenta de Zernio (`GET /accounts?platform=whatsapp`) y dice si el número puede trabajar. */
export function evaluarSalud(cuenta: any, resueltos: string[] = [], ahora = new Date()): SaludWa {
  const revisado = ahora.toISOString();
  if (!cuenta) return { ok: false, motivo: "La cuenta de WhatsApp no aparece en Zernio", revisado };
  const m = cuenta.metadata ?? {};
  const ultimo = m.businessStatus?.lastEvent ?? {};
  const evento = [ultimo.event, ultimo.violation_info?.violation_type ?? ultimo.restriction_info?.[0]?.restriction_type].filter(Boolean).join(" · ") || undefined;
  const eventoEn = m.businessStatus?.lastEventAt;
  const base = { evento, eventoEn, calidad: m.qualityRating, nivel: m.messagingLimitTier, metaStatus: m.metaStatus, revisado };
  if (cuenta.enabled === false || cuenta.isActive === false || cuenta.needsReconnection) return { ...base, ok: false, motivo: "Zernio tiene la cuenta desconectada (hay que reconectar el número)" };
  if (m.metaStatus && m.metaStatus !== "CONNECTED") return { ...base, ok: false, motivo: `Meta dice ${m.metaStatus}` };
  if (ultimo.event && MALO.test(String(ultimo.event)) && !resueltos.includes(claveEvento(ultimo.event, eventoEn)))
    return { ...base, ok: false, motivo: `Meta restringió la cuenta: ${evento}` };
  const alerta = m.qualityRating && m.qualityRating !== "GREEN" ? `Calidad del número en ${m.qualityRating}: bajar el volumen y revisar quejas` : undefined;
  return { ...base, ok: true, motivo: "OK", alerta };
}

export async function consultar(): Promise<SaludWa | null> {
  if (!config.zernio.apiKey || !config.zernio.accountId) return null;
  const r = await fetch(`${config.zernio.base}/accounts?platform=whatsapp`, { headers: { Authorization: `Bearer ${config.zernio.apiKey}` } }).catch(() => null);
  if (!r?.ok) return null; // Zernio caído o red: no se decide nada con un error de red
  const j = (await r.json().catch(() => null)) as { accounts?: any[] } | null;
  return evaluarSalud((j?.accounts ?? []).find((a) => a._id === config.zernio.accountId), leer().resueltos);
}

export const caido = () => { const e = leer(); return !!e.ultimo && !e.ultimo.ok; };

/** Marca como resuelto el evento que tumbó la cuenta (cuando Meta la devuelve). */
export function marcarResuelto(): SaludWa | undefined {
  const e = leer();
  if (e.ultimo?.evento) e.resueltos.push(claveEvento(e.ultimo.evento.split(" · ")[0], e.ultimo.eventoEn));
  if (e.ultimo) e.ultimo = { ...e.ultimo, ok: true, motivo: "Marcado como resuelto" };
  e.caidoDesde = undefined; e.pasados = [];
  guardar(e);
  return e.ultimo;
}

// ── Candado de envíos ──
export const TOPE_INICIADOS_DIA = 40;
const soloDigitos = (t: string) => String(t ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
/** Números del equipo/dueño: el WhatsApp del negocio no les inicia nada (COORDINADOR_WHATSAPP + NUMEROS_INTERNOS). */
export function numerosInternos(): string[] {
  return [config.coordinadorWhatsapp, ...(process.env.NUMEROS_INTERNOS ?? "").split(",")].map(soloDigitos).filter((t) => t.length === 10);
}
/**
 * ¿Se puede mandar este mensaje por el WhatsApp del negocio?
 *  - con la cuenta caída, nada (cada intento fallido empeora el historial con Meta);
 *  - a un número interno solo se le CONTESTA (respuesta a algo que él escribió), nunca se le inicia;
 *  - lo que inicia el negocio tiene tope diario.
 */
export function puedeEnviar(p: { telefono: string; inicia: boolean; respuesta: boolean; caido: boolean; internos: string[]; iniciadosHoy: number }): { ok: true } | { ok: false; motivo: string } {
  if (p.caido) return { ok: false, motivo: "cuenta de WhatsApp restringida" };
  if (p.internos.includes(soloDigitos(p.telefono)) && !p.respuesta) return { ok: false, motivo: "número interno: el WhatsApp del negocio no le escribe al equipo" };
  if (p.inicia && p.iniciadosHoy >= TOPE_INICIADOS_DIA) return { ok: false, motivo: `tope de ${TOPE_INICIADOS_DIA} mensajes iniciados por día` };
  return { ok: true };
}
const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: config.zonaHoraria });
/** Aplica el candado. Si `inicia` y pasa, cuenta el envío. */
export function autorizar(telefono: string, inicia: boolean, respuesta: boolean): boolean {
  const e = leer();
  const v = puedeEnviar({ telefono, inicia, respuesta, caido: !!e.ultimo && !e.ultimo.ok, internos: numerosInternos(), iniciadosHoy: e.iniciados[hoyPR()] ?? 0 });
  if (!v.ok) { console.warn(`WhatsApp bloqueado por el candado → ${soloDigitos(telefono).slice(-4)}: ${v.motivo}`); return false; }
  if (inicia) { const d = hoyPR(); e.iniciados = { [d]: (e.iniciados[d] ?? 0) + 1 }; guardar(e); }
  return true;
}
