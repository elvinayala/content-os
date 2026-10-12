import "server-only";

import { createClient } from "@supabase/supabase-js";
import { sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { BUCKET, borrarArchivos, leerArchivoLocal, storageLocal, subirArchivo } from "../pulse/storage";
import { archivoValido, avisoEntrega, nombreVisible, TOPE_ENTREGA, type TipoEntrega } from "./entregas-reglas";
import { avisarCliente } from "./push";

// Entregables del cliente en la app (plan de marketing, creativos, videos). Tabla creada desde el código (como
// max_clientes) para no chocar con la numeración de migraciones de otras sesiones; protegida por la papelera.
// Archivo subido por el equipo → Storage privado `pulse/clientes-app/<item>/entregas/…`; lo que manda Max → su link
// (ya vive en Storage, firmado por 1 año). El cliente solo abre los de SU ficha.

export interface Entrega {
  id: string;
  tipo: TipoEntrega;
  nombre: string;
  mime: string | null;
  creadoAt: string;
}

let lista = false;
async function tabla() {
  const d = await db();
  if (!lista) {
    await d.execute(sql`create table if not exists pulse_app_entregas (
      id uuid primary key default gen_random_uuid(),
      item_id uuid not null references pulse_items(id) on delete cascade,
      tipo text not null,
      nombre text not null,
      storage_path text,
      url text,
      mime text,
      bytes bigint,
      origen text unique,
      creado_por uuid references pulse_users(id) on delete set null,
      creado_at timestamptz not null default now()
    )`);
    await d.execute(sql`create index if not exists pulse_app_entregas_item on pulse_app_entregas (item_id, tipo)`);
    await d.execute(sql`select pulse_papelera_proteger()`).catch(() => null);
    lista = true;
  }
  return d;
}

const filas = <T>(r: unknown): T[] => (Array.isArray(r) ? r : ((r as { rows?: T[] }).rows ?? [])) as T[];

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function listarEntregas(itemId: string): Promise<Entrega[]> {
  const d = await tabla();
  const r = filas<{ id: string; tipo: TipoEntrega; nombre: string; mime: string | null; creado_at: string | Date }>(
    await d.execute(sql`select id, tipo, nombre, mime, creado_at from pulse_app_entregas where item_id = ${itemId} order by creado_at desc limit 200`),
  );
  return r.map((x) => ({ id: x.id, tipo: x.tipo, nombre: x.nombre, mime: x.mime, creadoAt: new Date(x.creado_at).toISOString() }));
}

const limpio = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80) || "archivo";

/** Paso 1 (equipo): URL firmada para subir directo a Storage (null en dev local: va por el servidor). */
export async function prepararEntrega(itemId: string, tipo: TipoEntrega, nombre: string, mime: string, bytes: number): Promise<{ ruta: string; signedUrl: string | null }> {
  if (!archivoValido(tipo, mime, nombre)) throw new Error(tipo === "video" ? "Solo videos (MP4 o MOV)." : tipo === "creativo" ? "Solo imágenes (PNG, JPG o WEBP)." : "Solo PDF o imagen.");
  if (bytes > TOPE_ENTREGA) throw new Error("El archivo pasa de 50 MB: comprímelo y vuelve a subirlo.");
  const ruta = `clientes-app/${itemId}/entregas/${crypto.randomUUID()}-${limpio(nombre)}`;
  const sb = supabase();
  if (!sb) return { ruta, signedUrl: null };
  const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(ruta);
  if (error || !data) throw new Error(`Storage: ${error?.message ?? "sin URL de subida"}`);
  return { ruta, signedUrl: data.signedUrl };
}

export async function subirEntregaLocal(ruta: string, datos: Uint8Array, mime: string | null) {
  if (!storageLocal) throw new Error("Solo en local");
  await subirArchivo(ruta, datos, mime);
}

/** Paso 2: registra lo subido (con su tamaño real) y le avisa al cliente. */
export async function confirmarEntrega(itemId: string, p: { tipo: TipoEntrega; ruta: string; nombre: string; mime: string }, userId: string): Promise<void> {
  if (!p.ruta.startsWith(`clientes-app/${itemId}/entregas/`)) throw new Error("Ruta inválida");
  let bytes: number | null = null;
  const sb = supabase();
  if (sb) {
    const carpeta = p.ruta.slice(0, p.ruta.lastIndexOf("/"));
    const archivo = p.ruta.slice(p.ruta.lastIndexOf("/") + 1);
    const { data } = await sb.storage.from(BUCKET).list(carpeta, { search: archivo, limit: 1 });
    const meta = data?.find((x) => x.name === archivo);
    if (!meta) throw new Error("No encontré lo que subiste: vuelve a intentarlo");
    bytes = Number((meta.metadata as { size?: number } | null)?.size ?? 0) || null;
    if (bytes && bytes > TOPE_ENTREGA) {
      await sb.storage.from(BUCKET).remove([p.ruta]);
      throw new Error("El archivo pasa de 50 MB");
    }
  }
  const d = await tabla();
  await d.execute(sql`insert into pulse_app_entregas (item_id, tipo, nombre, storage_path, mime, bytes, creado_por) values (${itemId}, ${p.tipo}, ${nombreVisible(p.nombre)}, ${p.ruta}, ${p.mime || null}, ${bytes}, ${userId})`);
}

/** Aviso al cliente por lo que se acaba de subir (uno por tanda, no uno por archivo). */
export async function avisarEntregas(itemId: string, tipo: TipoEntrega, n: number) {
  const a = avisoEntrega(tipo, n);
  await avisarCliente(itemId, { ...a, url: "/cliente/trabajo", tag: `lu-${tipo}` });
}

export async function borrarEntrega(itemId: string, id: string): Promise<void> {
  const d = await tabla();
  const [e] = filas<{ storage_path: string | null }>(await d.execute(sql`delete from pulse_app_entregas where id = ${id} and item_id = ${itemId} returning storage_path`));
  if (e?.storage_path) await borrarArchivos([e.storage_path]).catch(() => null);
}

/** Para abrirlo: link firmado de 5 min, el link de Max, o los bytes (dev local). Solo si es de ESTE cliente. */
export async function abrirEntrega(itemId: string, id: string): Promise<{ url: string } | { datos: Buffer; mime: string; nombre: string } | null> {
  const d = await tabla();
  const [e] = filas<{ storage_path: string | null; url: string | null; mime: string | null; nombre: string }>(
    await d.execute(sql`select storage_path, url, mime, nombre from pulse_app_entregas where id = ${id} and item_id = ${itemId}`),
  );
  if (!e) return null;
  if (e.url) return { url: e.url };
  if (!e.storage_path) return null;
  const sb = supabase();
  if (!sb) return { datos: await leerArchivoLocal(e.storage_path), mime: e.mime ?? "application/octet-stream", nombre: e.nombre };
  const { data } = await sb.storage.from(BUCKET).createSignedUrl(e.storage_path, 300);
  return data?.signedUrl ? { url: data.signedUrl } : null;
}

async function copiarAStorage(itemId: string, url: string, tipo: TipoEntrega): Promise<{ ruta: string; mime: string; bytes: number }> {
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const datos = new Uint8Array(await r.arrayBuffer());
  if (datos.byteLength > TOPE_ENTREGA) throw new Error("grande");
  const mime = r.headers.get("content-type")?.split(";")[0] || (tipo === "video" ? "video/mp4" : "image/png");
  const ext = mime.includes("mp4") ? "mp4" : mime.includes("quicktime") ? "mov" : mime.includes("jpeg") ? "jpg" : mime.includes("webp") ? "webp" : tipo === "video" ? "mp4" : "png";
  const ruta = `clientes-app/${itemId}/entregas/${crypto.randomUUID()}-max.${ext}`;
  await subirArchivo(ruta, datos, mime);
  return { ruta, mime, bytes: datos.byteLength };
}

/** Lo que Max le mandó aprobado al canal del cliente entra solo a la app (si su expediente está ligado a la ficha). */
export async function entregasDesdeMax(clienteSlug: string, itemMax: number, titulo: string, medios: { imagenes: string[]; videos: string[] }): Promise<number> {
  if (!medios.imagenes.length && !medios.videos.length) return 0;
  const d = await tabla();
  const [c] = filas<{ pulse_item: string | null }>(await d.execute(sql`select pulse_item from max_clientes where slug = ${clienteSlug}`));
  if (!c?.pulse_item) return 0;
  let n = 0;
  const base = nombreVisible(titulo || "Creativo aprobado");
  for (const [tipo, urls] of [
    ["creativo", medios.imagenes],
    ["video", medios.videos],
  ] as const) {
    for (const [k, url] of urls.entries()) {
      const origen = `max:${itemMax}:${tipo}:${k}`;
      const [ya] = filas(await d.execute(sql`select 1 from pulse_app_entregas where origen = ${origen}`));
      if (ya) continue;
      // Se copia a nuestro Storage: el link de Max puede ser de fal/Higgsfield (la CSP de la app no los deja mostrar) o vencer.
      const copia = await copiarAStorage(c.pulse_item, url, tipo).catch(() => null);
      const nombre = urls.length > 1 ? `${base} ${k + 1}` : base;
      const r = filas(
        await d.execute(sql`insert into pulse_app_entregas (item_id, tipo, nombre, storage_path, url, mime, bytes, origen) values (${c.pulse_item}, ${tipo}, ${nombre}, ${copia?.ruta ?? null}, ${copia ? null : url}, ${copia?.mime ?? null}, ${copia?.bytes ?? null}, ${origen}) on conflict (origen) do nothing returning id`),
      );
      n += r.length;
    }
  }
  if (medios.imagenes.length) await avisarEntregas(c.pulse_item, "creativo", medios.imagenes.length).catch(() => null);
  if (medios.videos.length) await avisarEntregas(c.pulse_item, "video", medios.videos.length).catch(() => null);
  return n;
}
