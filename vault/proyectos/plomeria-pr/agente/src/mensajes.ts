/**
 * Chat interno entre administración y cada plomero (10/oct/2026, Aure: "un chat entre administración y cada plomero para
 * centralizar la comunicación y que todo quede registrado dentro de la plataforma"). Un hilo por plomero, guardado en el
 * volumen (data/estado/mensajes-plomeros.json). Parte pura arriba (tests), archivo y avisos abajo.
 */
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "./almacen.js";

export type Lado = "plomero" | "equipo";
export interface Mensaje { id: string; plomeroId: string; de: Lado; autor: string; texto: string; trabajo?: string; en: string; leido?: string }

export const MAX_TEXTO = 1000;
export const limpiarTexto = (t: unknown) => String(t ?? "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_TEXTO);

export function agregarA(lista: Mensaje[], m: { plomeroId: string; de: Lado; autor: string; texto: unknown; trabajo?: string }, ahora = new Date().toISOString()): { lista: Mensaje[]; mensaje: Mensaje } | { error: string } {
  const texto = limpiarTexto(m.texto);
  if (!texto) return { error: "Escribe el mensaje." };
  const mensaje: Mensaje = { id: "M-" + String(lista.length + 1).padStart(5, "0"), plomeroId: m.plomeroId, de: m.de, autor: m.autor, texto, ...(m.trabajo ? { trabajo: m.trabajo } : {}), en: ahora };
  return { lista: [...lista, mensaje], mensaje };
}
/** Marca como leído lo que el OTRO lado escribió (el plomero lee lo del equipo; el equipo, lo del plomero). */
export function marcarLeidosEn(lista: Mensaje[], plomeroId: string, lector: Lado, ahora = new Date().toISOString()): { lista: Mensaje[]; cambiados: number } {
  let cambiados = 0;
  const out = lista.map((m) => (m.plomeroId === plomeroId && m.de !== lector && !m.leido ? (cambiados++, { ...m, leido: ahora }) : m));
  return { lista: out, cambiados };
}
export const sinLeerEn = (lista: Mensaje[], plomeroId: string, lector: Lado) => lista.filter((m) => m.plomeroId === plomeroId && m.de !== lector && !m.leido).length;
export const totalSinLeerEquipoEn = (lista: Mensaje[]) => lista.filter((m) => m.de === "plomero" && !m.leido).length;
export function conversacionesEn(lista: Mensaje[]) {
  const por = new Map<string, Mensaje[]>();
  for (const m of lista) por.set(m.plomeroId, [...(por.get(m.plomeroId) ?? []), m]);
  return [...por.entries()].map(([plomeroId, ms]) => ({ plomeroId, ultimo: ms[ms.length - 1], sinLeerEquipo: sinLeerEn(lista, plomeroId, "equipo"), total: ms.length })).sort((a, b) => b.ultimo.en.localeCompare(a.ultimo.en));
}

// ── Archivo (escritura atómica, como el resto de data/estado) ──
const ARCH = () => path.join(RAIZ, "data", "estado", "mensajes-plomeros.json");
function leer(): Mensaje[] { try { return JSON.parse(fs.readFileSync(ARCH(), "utf8")); } catch { return []; } }
function guardar(l: Mensaje[]) { fs.mkdirSync(path.dirname(ARCH()), { recursive: true }); fs.writeFileSync(ARCH() + ".tmp", JSON.stringify(l)); fs.renameSync(ARCH() + ".tmp", ARCH()); }

export const hilo = (plomeroId: string) => leer().filter((m) => m.plomeroId === plomeroId).slice(-200);
export const sinLeer = (plomeroId: string, lector: Lado) => sinLeerEn(leer(), plomeroId, lector);
export const totalSinLeerEquipo = () => totalSinLeerEquipoEn(leer());
export const conversaciones = () => conversacionesEn(leer());
export function marcarLeidos(plomeroId: string, lector: Lado) { const r = marcarLeidosEn(leer(), plomeroId, lector); if (r.cambiados) guardar(r.lista); return r.cambiados; }
export function enviar(m: { plomeroId: string; de: Lado; autor: string; texto: unknown; trabajo?: string }): { ok: true; mensaje: Mensaje } | { ok: false; motivo: string } {
  const r = agregarA(leer(), m);
  if ("error" in r) return { ok: false, motivo: r.error };
  guardar(r.lista); return { ok: true, mensaje: r.mensaje };
}

// ── Avisos ──
const ultimoAviso = new Map<string, number>();
/** Equipo → plomero: push a su app; si no tiene alertas activas, texto por SMS/WhatsApp (con el link a su app). */
export async function avisarAlPlomero(plomeroId: string, texto: string) {
  const [{ porId, linkPortal }, { notificar }, { avisarAlTelefono }, { config }] = await Promise.all([import("./proveedores.js"), import("./push.js"), import("./canales/telefono.js"), import("./config.js")]);
  const p = porId(plomeroId); if (!p) return;
  const url = linkPortal(p.id, config.urlPublica);
  const recibidos = await notificar(p.id, { titulo: "💬 Resuelto te escribió", cuerpo: texto.slice(0, 110), url, tag: "mensaje" }).catch(() => 0);
  if (!recibidos) await avisarAlTelefono(p.whatsapp, `💬 Resuelto te escribió: "${texto.slice(0, 300)}"\nResponde desde tu app (pestaña Mensajes): ${url}`).catch(() => undefined);
}
/** Plomero → equipo: al grupo de Ventas (o a Elvin si no hay grupo), máximo uno cada 10 min por plomero para no saturar. */
export async function avisarAlEquipo(plomeroId: string, nombre: string, texto: string) {
  const ahora = Date.now(); if (ahora - (ultimoAviso.get(plomeroId) ?? 0) < 10 * 60_000) return;
  ultimoAviso.set(plomeroId, ahora);
  const [{ avisarVentas }, { config }] = await Promise.all([import("./ventas.js"), import("./config.js")]);
  await avisarVentas(`💬 ${nombre} te escribió desde la app: "${texto.slice(0, 200)}"\nContéstale en el portal: ${config.urlPublica}/portal/mensajes/${encodeURIComponent(plomeroId)}`).catch(() => undefined);
}
