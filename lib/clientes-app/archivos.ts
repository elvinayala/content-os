import "server-only";

import { createClient } from "@supabase/supabase-js";

import { BUCKET, storageLocal, subirArchivo } from "../pulse/storage";
import { tipoSubidaPermitido, TOPE_SUBIDA, type ArchivoDrive } from "./archivos-reglas";

// Archivos del cliente en SU carpeta de Drive, a través del Apps Script de Level Up (scripts/drive/max-drive.gs,
// acciones app-listar / app-bajar / app-subir; DRIVE_SCRIPT_URL + DRIVE_SCRIPT_SECRETO). La carpeta está compartida solo
// con el equipo, así que el cliente nunca la abre directo:
//  - bajar: Apps Script → este servidor → copia en Storage (bucket privado) → link firmado de 5 min (Vercel no
//    devuelve respuestas grandes). La copia se reusa mientras el archivo no cambie en Drive.
//  - subir: el teléfono sube a Storage con URL firmada → Apps Script lo copia a "Material del cliente (app)".

export const driveListo = () => Boolean(process.env.DRIVE_SCRIPT_URL && process.env.DRIVE_SCRIPT_SECRETO);

async function drive<T>(accion: string, datos: Record<string, unknown>): Promise<T> {
  if (!driveListo()) throw new Error("drive-no-conectado");
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
    throw new Error(`drive-respuesta (${r.status})`);
  }
  if (!j.ok) throw new Error(j.error || "drive-error");
  return j;
}

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

const lista = new Map<string, { hasta: number; archivos: ArchivoDrive[] }>();

export async function listarArchivos(carpetaId: string): Promise<ArchivoDrive[]> {
  const g = lista.get(carpetaId);
  if (g && g.hasta > Date.now()) return g.archivos;
  const r = await drive<{ archivos: ArchivoDrive[] }>("app-listar", { carpetaId });
  lista.set(carpetaId, { hasta: Date.now() + 5 * 60_000, archivos: r.archivos ?? [] });
  return r.archivos ?? [];
}

/** El archivo del cliente para abrirlo: link firmado (Supabase) o los bytes (dev local sin Supabase). */
export async function abrirArchivo(itemId: string, carpetaId: string, archivoId: string): Promise<{ url: string } | { datos: Buffer; mime: string; nombre: string }> {
  const meta = (await listarArchivos(carpetaId)).find((a) => a.id === archivoId);
  if (!meta) throw new Error("no-existe");
  const sb = supabase();
  const version = meta.fecha.replace(/\D/g, "");
  const ruta = `clientes-app/${itemId}/cache/${archivoId}-${version}`;
  if (sb) {
    const ya = await sb.storage.from(BUCKET).createSignedUrl(ruta, 300, { download: false });
    if (ya.data?.signedUrl) {
      const head = await fetch(ya.data.signedUrl, { method: "HEAD" }).catch(() => null);
      if (head?.ok) return { url: ya.data.signedUrl };
    }
  }
  const r = await drive<{ nombre: string; mime: string; base64: string }>("app-bajar", { carpetaId, archivoId });
  const datos = Buffer.from(r.base64, "base64");
  if (!sb) return { datos, mime: r.mime, nombre: r.nombre };
  const { error } = await sb.storage.from(BUCKET).upload(ruta, datos, { contentType: r.mime, upsert: true });
  if (error) throw new Error(`storage: ${error.message}`);
  const firmada = await sb.storage.from(BUCKET).createSignedUrl(ruta, 300);
  if (!firmada.data?.signedUrl) throw new Error("storage: sin link");
  return { url: firmada.data.signedUrl };
}

const limpio = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80) || "archivo";

/** Paso 1 de subir: URL firmada para que el teléfono suba directo a Storage (null en dev local: va por el servidor). */
export async function prepararSubidaCliente(itemId: string, nombre: string, mime: string, bytes: number): Promise<{ ruta: string; signedUrl: string | null }> {
  if (!tipoSubidaPermitido(mime, nombre)) throw new Error("Solo fotos, videos o PDF.");
  if (bytes > TOPE_SUBIDA) throw new Error("El archivo pasa de 100 MB: mándalo por Slack o compártelo por Drive.");
  const ruta = `clientes-app/${itemId}/subidas/${crypto.randomUUID()}-${limpio(nombre)}`;
  const sb = supabase();
  if (!sb) return { ruta, signedUrl: null };
  const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(ruta);
  if (error || !data) throw new Error(`Storage: ${error?.message ?? "sin URL de subida"}`);
  return { ruta, signedUrl: data.signedUrl };
}

/** En dev local (sin Supabase) el archivo llega por el servidor. */
export async function subirLocalCliente(ruta: string, datos: Uint8Array, mime: string | null) {
  if (!storageLocal) throw new Error("Solo en local");
  await subirArchivo(ruta, datos, mime);
}

/** Paso 2: copia lo subido a la carpeta de Drive del cliente y borra la copia temporal. */
export async function confirmarSubidaCliente(itemId: string, carpetaId: string, ruta: string, nombre: string): Promise<void> {
  if (!ruta.startsWith(`clientes-app/${itemId}/subidas/`)) throw new Error("Ruta inválida");
  const sb = supabase();
  if (!sb) throw new Error("drive-no-conectado");
  const firmada = await sb.storage.from(BUCKET).createSignedUrl(ruta, 600);
  if (!firmada.data?.signedUrl) throw new Error("No encontré lo que subiste: vuelve a intentarlo");
  await drive("app-subir", { carpetaId, url: firmada.data.signedUrl, nombre: nombre.slice(0, 200) });
  lista.delete(carpetaId);
  await sb.storage.from(BUCKET).remove([ruta]).catch(() => null);
}
