import "server-only";

import { createClient } from "@supabase/supabase-js";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "../pulse/db";
import { BUCKET, borrarArchivos, storageLocal, subirArchivo } from "../pulse/storage";
import { evento, perfilDe, type Perfil } from "./datos";
import { mesSiguiente, nominaMes, saldos, type Ausencia, type Nomina, type Saldos } from "./rrhh";
import { fechaPR } from "./reglas";
import { desempenoAjustes, desempenoArchivos, desempenoAusencias, desempenoFichas } from "./schema";

// Ficha del empleado (RR.HH.): datos, documentos/videos, ausencias y nómina. Solo operaciones con
// sueldo fijo: una persona "tiene ficha" cuando existe su fila en desempeno_fichas.

export type Ficha = typeof desempenoFichas.$inferSelect;
export type ArchivoFicha = typeof desempenoArchivos.$inferSelect;
export type AusenciaFila = typeof desempenoAusencias.$inferSelect;
export type AjusteFila = typeof desempenoAjustes.$inferSelect;

export const CATEGORIAS = [
  { id: "identificacion", nombre: "Identificación" },
  { id: "contrato", nombre: "Contrato" },
  { id: "certificacion", nombre: "Certificaciones" },
  { id: "entrenamiento", nombre: "Entrenamiento (videos)" },
  { id: "nomina", nombre: "Nómina y pagos" },
  { id: "otro", nombre: "Otros" },
] as const;
export type Categoria = (typeof CATEGORIAS)[number]["id"] | "foto";

// El plan actual de Supabase acepta hasta 50 MB por archivo (el bucket "pulse" quedó con ese tope el
// 26/sep/2026). Para videos más pesados: subir el plan (Pro permite más) o comprimir el video.
export const MAX_BYTES = 50 * 1000 * 1000;

// Seguridad: solo estos tipos de archivo (por extensión; el tipo que se guarda y se sirve sale de aquí,
// nunca del navegador). Nada de .html/.svg/.js que se puedan ejecutar al abrirlos.
const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif",
  pdf: "application/pdf",
  mp4: "video/mp4", mov: "video/quicktime", m4v: "video/x-m4v", webm: "video/webm",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
const IMAGEN = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
const VIDEO = ["mp4", "mov", "m4v", "webm"];
const OFFICE = ["doc", "docx", "xls", "xlsx"];
const PERMITIDOS: Record<string, string[]> = {
  foto: IMAGEN,
  identificacion: [...IMAGEN, "pdf"],
  contrato: [...IMAGEN, "pdf", "doc", "docx"],
  certificacion: [...IMAGEN, "pdf"],
  entrenamiento: [...VIDEO, "pdf", ...IMAGEN],
  nomina: ["pdf", ...IMAGEN, ...OFFICE],
  otro: ["pdf", ...IMAGEN, ...OFFICE, ...VIDEO],
};
export const extension = (nombre: string) => (nombre.split(".").pop() ?? "").toLowerCase();
/** El tipo real (por extensión) si la categoría lo acepta; si no, null. */
export function tipoPermitido(categoria: string, nombre: string): string | null {
  const ext = extension(nombre);
  return PERMITIDOS[categoria]?.includes(ext) ? MIME[ext] : null;
}
// Tope de tamaño por categoría. Se revisa ANTES (lo que dice el navegador) y DESPUÉS de subir (el tamaño
// real en el almacenamiento): si se pasa, el archivo se borra.
const MB = 1000 * 1000;
export function limiteBytes(categoria: string): number {
  if (categoria === "foto") return 10 * MB;
  if (categoria === "entrenamiento" || categoria === "otro") return MAX_BYTES;
  return 25 * MB;
}
export const textoLimite = (categoria: string) => `${Math.round(limiteBytes(categoria) / MB)} MB`;

/** Tamaño real del archivo ya subido (null si no está). */
export async function tamanoReal(path: string): Promise<number | null> {
  const sb = supabase();
  if (!sb) {
    try {
      const fs = await import("node:fs/promises");
      const p = await import("node:path");
      return (await fs.stat(p.join(process.cwd(), ".pulse-db", "archivos", path))).size;
    } catch {
      return null;
    }
  }
  const { data, error } = await sb.storage.from(BUCKET).info(path);
  if (error || !data) return null;
  return typeof data.size === "number" ? data.size : null;
}

/** Se abre en el navegador (foto, PDF, video); lo demás se descarga. */
export const seAbreEnLinea = (mime: string | null) => !!mime && (mime.startsWith("image/") || mime.startsWith("video/") || mime === "application/pdf");

export async function leerFicha(userId: string): Promise<Ficha | null> {
  const d = await db();
  const [f] = await d.select().from(desempenoFichas).where(eq(desempenoFichas.userId, userId));
  return f ?? null;
}

export async function leerFichas(): Promise<Ficha[]> {
  const d = await db();
  return d.select().from(desempenoFichas);
}

export async function guardarFicha(p: Omit<Ficha, "updatedAt" | "updatedBy" | "fotoPath" | "completadaAt">, actorId: string) {
  const d = await db();
  const valores = { ...p, updatedBy: actorId, updatedAt: new Date() };
  await d.insert(desempenoFichas).values(valores).onConflictDoUpdate({ target: desempenoFichas.userId, set: valores });
  await evento({ userId: p.userId, actorId, tipo: "ficha", datos: { ...p, salarioMensual: p.salarioMensual !== null ? "(cambiado)" : null } });
}

// ─── Archivos ────────────────────────────────────────────────────────────────────────────────

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

const limpio = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80) || "archivo";

export function rutaArchivo(userId: string, id: string, nombre: string) {
  return `ritmo/${userId}/${id}-${limpio(nombre)}`;
}

/** Prepara la subida: en Supabase, URL firmada para subir directo desde el navegador (videos grandes). */
export async function prepararSubida(userId: string, nombre: string): Promise<{ id: string; path: string; signedUrl: string | null }> {
  const id = crypto.randomUUID();
  const path = rutaArchivo(userId, id, nombre);
  const sb = supabase();
  if (!sb) return { id, path, signedUrl: null };
  const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`Storage: ${error?.message ?? "sin URL de subida"}`);
  return { id, path, signedUrl: data.signedUrl };
}

export async function subirLocal(path: string, datos: Uint8Array, mime: string | null) {
  await subirArchivo(path, datos, mime);
}

export async function registrarArchivo(a: { id: string; userId: string; categoria: Categoria; nombre: string; path: string; mime: string | null; bytes: number | null }, actorId: string) {
  if (!a.path.startsWith(`ritmo/${a.userId}/${a.id}-`)) throw new Error("Ruta inválida");
  const d = await db();
  if (a.categoria === "foto") {
    const prev = await leerFicha(a.userId);
    await d.update(desempenoFichas).set({ fotoPath: a.path, updatedAt: new Date(), updatedBy: actorId }).where(eq(desempenoFichas.userId, a.userId));
    if (prev?.fotoPath) await borrarArchivos([prev.fotoPath]).catch(() => {});
  } else {
    await d.insert(desempenoArchivos).values({ id: a.id, userId: a.userId, categoria: a.categoria, nombre: a.nombre.slice(0, 200), storagePath: a.path, mime: a.mime, bytes: a.bytes, subidoPor: actorId });
  }
  await evento({ userId: a.userId, actorId, tipo: "archivo", datos: { categoria: a.categoria, nombre: a.nombre } });
}

export async function leerArchivoFicha(id: string): Promise<ArchivoFicha | null> {
  const d = await db();
  const [a] = await d.select().from(desempenoArchivos).where(eq(desempenoArchivos.id, id));
  return a ?? null;
}

export async function borrarArchivoFicha(id: string, actorId: string) {
  const a = await leerArchivoFicha(id);
  if (!a) return;
  const d = await db();
  await d.delete(desempenoArchivos).where(eq(desempenoArchivos.id, id));
  await borrarArchivos([a.storagePath]).catch(() => {});
  await evento({ userId: a.userId, actorId, tipo: "archivo_borrado", datos: { nombre: a.nombre } });
}

/** URL firmada (5 min) o null en local (se sirve desde disco). `descargar` = forzar descarga. */
export async function urlFirmada(path: string, descargar?: string): Promise<string | null> {
  const sb = supabase();
  if (!sb || storageLocal) return null;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 300, descargar ? { download: descargar } : undefined);
  if (error || !data) throw new Error(`Storage: ${error?.message ?? "sin URL"}`);
  return data.signedUrl;
}

// ─── Ausencias y ajustes ─────────────────────────────────────────────────────────────────────

export async function listarAusencias(userId: string): Promise<AusenciaFila[]> {
  const d = await db();
  return d.select().from(desempenoAusencias).where(eq(desempenoAusencias.userId, userId)).orderBy(desc(desempenoAusencias.desde));
}

export async function crearAusencia(a: { userId: string; tipo: string; desde: string; hasta: string; dias: number; certificado: boolean; nota: string | null }, actorId: string) {
  const d = await db();
  await d.insert(desempenoAusencias).values({ ...a, registradoPor: actorId });
  await evento({ userId: a.userId, actorId, tipo: "ausencia", datos: a });
}

export async function borrarAusencia(id: string, actorId: string) {
  const d = await db();
  const [a] = await d.delete(desempenoAusencias).where(eq(desempenoAusencias.id, id)).returning();
  if (a) await evento({ userId: a.userId, actorId, tipo: "ausencia_borrada", datos: a });
}

export async function listarAjustes(userId: string, mes: string): Promise<AjusteFila[]> {
  const d = await db();
  return d.select().from(desempenoAjustes).where(and(eq(desempenoAjustes.userId, userId), eq(desempenoAjustes.mes, mes))).orderBy(asc(desempenoAjustes.createdAt));
}

export async function crearAjuste(a: { userId: string; mes: string; concepto: string; monto: number }, actorId: string) {
  const d = await db();
  await d.insert(desempenoAjustes).values({ ...a, createdBy: actorId });
  await evento({ userId: a.userId, actorId, tipo: "ajuste_nomina", datos: { mes: a.mes, concepto: a.concepto } });
}

export async function borrarAjuste(id: string, actorId: string) {
  const d = await db();
  const [a] = await d.delete(desempenoAjustes).where(eq(desempenoAjustes.id, id)).returning();
  if (a) await evento({ userId: a.userId, actorId, tipo: "ajuste_borrado", datos: { mes: a.mes, concepto: a.concepto } });
}

// ─── Todo junto ──────────────────────────────────────────────────────────────────────────────

export interface FichaCompleta {
  perfil: Perfil;
  ficha: Ficha;
  archivos: ArchivoFicha[];
  ausencias: AusenciaFila[];
  saldos: Saldos | null; // null sin fecha de ingreso
  nomina: Nomina;
  ajustes: AjusteFila[];
}

const aAusencia = (a: AusenciaFila): Ausencia => ({ id: a.id, tipo: a.tipo as Ausencia["tipo"], desde: a.desde, hasta: a.hasta, dias: a.dias, certificado: a.certificado });

export async function fichaCompleta(userId: string): Promise<FichaCompleta | null> {
  const [perfil, ficha] = await Promise.all([perfilDe(userId), leerFicha(userId)]);
  if (!perfil || !ficha) return null;
  const hoy = fechaPR(Date.now());
  const mes = mesSiguiente(hoy);
  const d = await db();
  const [archivos, ausencias, ajustes] = await Promise.all([
    d.select().from(desempenoArchivos).where(eq(desempenoArchivos.userId, userId)).orderBy(desc(desempenoArchivos.createdAt)),
    listarAusencias(userId),
    listarAjustes(userId, mes),
  ]);
  const aus = ausencias.map(aAusencia);
  return {
    perfil,
    ficha,
    archivos,
    ausencias,
    saldos: perfil.fechaIngreso ? saldos(perfil.fechaIngreso, aus, hoy) : null,
    nomina: nominaMes({ salarioMensual: ficha.salarioMensual, mes, ajustes: ajustes.map((a) => ({ concepto: a.concepto, monto: a.monto })), ingreso: perfil.fechaIngreso, ausencias: aus }),
    ajustes,
  };
}

/** Resumen para la lista de Personas (sin archivos). */
export async function resumenPersonas(): Promise<{ perfil: Perfil; ficha: Ficha | null; saldos: Saldos | null }[]> {
  const { leerPerfiles } = await import("./datos");
  const [perfiles, fichas] = await Promise.all([leerPerfiles(false), leerFichas()]);
  const d = await db();
  const ausencias = await d.select().from(desempenoAusencias);
  const hoy = fechaPR(Date.now());
  return perfiles.map((perfil) => {
    const ficha = fichas.find((f) => f.userId === perfil.userId) ?? null;
    const aus = ausencias.filter((a) => a.userId === perfil.userId).map(aAusencia);
    return { perfil, ficha, saldos: perfil.fechaIngreso ? saldos(perfil.fechaIngreso, aus, hoy) : null };
  });
}

// ─── Alta de empleado nuevo ──────────────────────────────────────────────────────────────────

/** Tiene que completar su ficha (empleado nuevo que aún no llenó sus datos). */
export const fichaPendiente = (f: Pick<Ficha, "completadaAt" | "telefono"> | null) => !!f && !f.completadaAt && !f.telefono;

/** La persona llena su propia ficha (bienvenida). No toca salario ni notas de RR.HH. */
export async function completarFichaPropia(
  userId: string,
  p: { telefono: string; telefonoAlterno: string | null; ciudad: string; pais: string; documentoTipo: string; documentoNumero: string; contactoEmergencia: string | null },
) {
  const d = await db();
  await d.update(desempenoFichas).set({ ...p, completadaAt: new Date(), updatedBy: userId, updatedAt: new Date() }).where(eq(desempenoFichas.userId, userId));
  await evento({ userId, actorId: userId, tipo: "ficha_completada" });
}

export async function contarArchivos(userId: string, categoria: string): Promise<number> {
  const d = await db();
  const filas = await d.select({ id: desempenoArchivos.id }).from(desempenoArchivos).where(and(eq(desempenoArchivos.userId, userId), eq(desempenoArchivos.categoria, categoria)));
  return filas.length;
}
