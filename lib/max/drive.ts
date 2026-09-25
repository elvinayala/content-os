import "server-only";

import { and, eq } from "drizzle-orm";

import { usuarioSistema } from "@/lib/pulse/alta-typeform";
import { db } from "@/lib/pulse/db";
import { actualizarValor, crearColumna, leerNombresItems } from "@/lib/pulse/repo";
import { pulseBoards, pulseColumns } from "@/lib/pulse/schema";

import { notaEnAprobaciones } from "./flujo";
import { mismoCliente, nombreCarpetaCliente, subcarpetaDrive } from "./operador";
import { cliente as leerCliente, type ClienteMax, guardarCliente } from "./repo";

// La carpeta de Drive de cada cliente de Max (Elvin, 24/sep/2026): "De cada cliente quiero una carpeta;
// que Max la ponga en el canal de Slack y en una columna del CRM Pulse, y ahí va todo: branding, logo,
// estrategia, documentos, imágenes, flyers, videos." Drive se maneja con un Google Apps Script publicado
// en la cuenta de Level Up (scripts/drive/max-drive.gs): DRIVE_SCRIPT_URL + DRIVE_SCRIPT_SECRETO.

export interface CarpetaDrive {
  id: string;
  url: string;
  subcarpetas: Record<string, string>;
}

export const driveListo = () => Boolean(process.env.DRIVE_SCRIPT_URL && process.env.DRIVE_SCRIPT_SECRETO);
const COLUMNA_PULSE = () => process.env.MAX_PULSE_COLUMNA || "Carpeta del cliente (Drive)";
const TABLERO_PULSE = () => process.env.PULSE_TYPEFORM_BOARD || "level-up-media";

async function llamar<T>(accion: string, datos: Record<string, unknown>): Promise<T> {
  if (!driveListo()) throw new Error("Drive no está conectado (falta DRIVE_SCRIPT_URL / DRIVE_SCRIPT_SECRETO)");
  // Apps Script responde con un 302 a googleusercontent; fetch lo sigue solo.
  const r = await fetch(process.env.DRIVE_SCRIPT_URL!, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...datos, accion, secreto: process.env.DRIVE_SCRIPT_SECRETO }),
    redirect: "follow",
    signal: AbortSignal.timeout(55_000),
  });
  const texto = await r.text();
  let j: { ok?: boolean; error?: string } & T;
  try {
    j = JSON.parse(texto);
  } catch {
    throw new Error(`Drive respondió algo que no es JSON (${r.status}): ${texto.slice(0, 120)}`);
  }
  if (!j.ok) throw new Error(`Drive: ${j.error || "error"}`);
  return j;
}

export function carpetaDe(c: ClienteMax | null): CarpetaDrive | null {
  const d = (c?.meta as { drive?: CarpetaDrive } | undefined)?.drive;
  return d?.id && d?.url ? d : null;
}

// Crea (o reusa) la carpeta del cliente, la guarda en el expediente, la pone en Pulse y avisa en Slack.
export async function asegurarCarpeta(slug: string, opciones: { hilo?: string | null; silencioso?: boolean } = {}): Promise<{ carpeta: CarpetaDrive; nueva: boolean; pulse: string }> {
  const c = await leerCliente(slug);
  if (!c) throw new Error(`No existe el cliente ${slug}`);
  const ya = carpetaDe(c);
  if (ya) return { carpeta: ya, nueva: false, pulse: "ya estaba" };
  const r = await llamar<CarpetaDrive>("carpeta", { nombre: nombreCarpetaCliente(c.nombre) });
  const carpeta = { id: r.id, url: r.url, subcarpetas: r.subcarpetas };
  await guardarCliente({ slug, meta: { drive: carpeta } });
  const pulse = await enlazarEnPulse({ ...c, meta: { ...c.meta, drive: carpeta } }, carpeta.url).catch((e) => `no se pudo (${e instanceof Error ? e.message : e})`);
  if (!opciones.silencioso) {
    await notaEnAprobaciones(`📁 *Carpeta de ${c.nombre}:* <${carpeta.url}|abrir en Drive>\nAquí va todo el cliente: branding y logo, estrategia, creativos, videos, reportes y sus documentos. Pulse: ${pulse}.\n— Max`, opciones.hilo);
  }
  return { carpeta, nueva: true, pulse };
}

// Columna de enlace en el tablero de clientes de Pulse (se crea si no existe) con la carpeta del cliente.
async function enlazarEnPulse(c: ClienteMax, url: string): Promise<string> {
  const d = await db();
  const [board] = await d.select().from(pulseBoards).where(eq(pulseBoards.slug, TABLERO_PULSE()));
  if (!board) return `no existe el tablero ${TABLERO_PULSE()}`;
  let itemId = c.pulse_item;
  if (!itemId) {
    const items = await leerNombresItems(board.id);
    const hit = items.filter((i) => mismoCliente(i.name, c.nombre));
    if (hit.length !== 1) return hit.length ? `hay ${hit.length} fichas parecidas a "${c.nombre}"; vincúlala a mano` : `no encontré la ficha de "${c.nombre}"`;
    itemId = hit[0].id;
    await guardarCliente({ slug: c.slug, pulseItem: itemId });
  }
  const titulo = COLUMNA_PULSE();
  let [col] = await d.select().from(pulseColumns).where(and(eq(pulseColumns.boardId, board.id), eq(pulseColumns.title, titulo)));
  if (!col) col = (await crearColumna({ boardId: board.id, title: titulo, type: "link" })) as unknown as typeof col;
  const userId = await usuarioSistema("max");
  await actualizarValor({ itemId, columnId: col.id, value: { url, text: "📁 Carpeta en Drive" }, userId });
  return `columna "${titulo}" ✅`;
}

async function carpetaOCrear(slug: string): Promise<CarpetaDrive> {
  const c = await leerCliente(slug);
  return carpetaDe(c) ?? (await asegurarCarpeta(slug)).carpeta;
}

export async function guardarDoc(slug: string, sub: string, nombre: string, texto: string): Promise<{ id: string; url: string }> {
  const carpeta = await carpetaOCrear(slug);
  return llamar("doc", { carpetaId: carpeta.id, sub: subcarpetaDrive(sub) || sub, nombre, texto });
}

export async function guardarArchivo(slug: string, sub: string, url: string, nombre?: string): Promise<{ id: string; url: string }> {
  if (!/^https:\/\//i.test(url)) throw new Error("el enlace tiene que ser https");
  const carpeta = await carpetaOCrear(slug);
  return llamar("archivo", { carpetaId: carpeta.id, sub: subcarpetaDrive(sub) || sub, url, nombre });
}

export async function listarCarpeta(slug: string): Promise<{ carpeta: string; nombre: string; url: string }[]> {
  const carpeta = carpetaDe(await leerCliente(slug));
  if (!carpeta) return [];
  return (await llamar<{ archivos: { carpeta: string; nombre: string; url: string }[] }>("listar", { carpetaId: carpeta.id })).archivos;
}

export async function saludDrive(): Promise<string> {
  return (await llamar<{ raiz: string }>("salud", {})).raiz;
}
