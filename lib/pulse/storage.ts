import "server-only";

import { createClient } from "@supabase/supabase-js";

// Archivos de Pulse en Supabase Storage (bucket privado "pulse"). Sin SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY (dev local) los archivos van a ./.pulse-db/archivos/.
export const BUCKET = "pulse";

function cliente() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const storageLocal = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

async function rutaLocal(storagePath: string) {
  const path = await import("node:path");
  return path.join(process.cwd(), ".pulse-db", "archivos", storagePath);
}

export async function subirArchivo(storagePath: string, datos: Buffer | Uint8Array, mime: string | null): Promise<void> {
  const sb = cliente();
  if (!sb) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const ruta = await rutaLocal(storagePath);
    await fs.mkdir(path.dirname(ruta), { recursive: true });
    await fs.writeFile(ruta, datos);
    return;
  }
  const { error } = await sb.storage.from(BUCKET).upload(storagePath, datos, { contentType: mime ?? undefined, upsert: true });
  if (error) throw new Error(`Storage: ${error.message}`);
}

// URL para abrir el archivo. En Supabase es firmada (1 h); en local, la ruta a
// /api/pulse/archivo que sirve desde disco.
export async function urlArchivo(storagePath: string, fileId: string): Promise<string> {
  const sb = cliente();
  if (!sb) return `/api/pulse/archivo/${fileId}`;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
  if (error || !data) throw new Error(`Storage: ${error?.message ?? "sin URL"}`);
  return data.signedUrl;
}

export async function leerArchivoLocal(storagePath: string): Promise<Buffer> {
  const fs = await import("node:fs/promises");
  return fs.readFile(await rutaLocal(storagePath));
}

// "Borrar" un archivo = moverlo a papelera/<día>/<ruta> (nunca se elimina al momento). La purga de
// los de más de 90 días la hace el respaldo diario (purgarArchivosPapelera). Así un archivo quitado
// por error —p. ej. el acuerdo firmado de un cliente— vuelve con la ficha al restaurar el lote.
export async function borrarArchivos(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const { rutaPapelera } = await import("./papelera-reglas");
  const dia = new Date().toISOString().slice(0, 10);
  const sb = cliente();
  if (!sb) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    for (const p of paths) {
      const destino = await rutaLocal(rutaPapelera(p, dia));
      await fs.mkdir(path.dirname(destino), { recursive: true });
      await fs.rename(await rutaLocal(p), destino).catch(() => {});
    }
    return;
  }
  for (const p of paths) {
    const destino = rutaPapelera(p, dia);
    await sb.storage.from(BUCKET).remove([destino]); // por si ya había uno con ese nombre hoy
    const { error } = await sb.storage.from(BUCKET).move(p, destino);
    if (error) console.warn("[pulse] no se pudo mandar a la papelera:", p, error.message);
  }
}

// Trae de vuelta archivos de la papelera a su ruta original (al restaurar un lote).
export async function restaurarArchivos(paths: string[]): Promise<number> {
  if (!paths.length) return 0;
  const sb = cliente();
  let n = 0;
  if (!sb) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const base = await rutaLocal("papelera");
    const dias = await fs.readdir(base).catch(() => [] as string[]);
    for (const p of paths) {
      for (const dia of dias.sort().reverse()) {
        const origen = path.join(base, dia, p);
        if (await fs.stat(origen).then(() => true, () => false)) {
          const destino = await rutaLocal(p);
          await fs.mkdir(path.dirname(destino), { recursive: true });
          await fs.rename(origen, destino);
          n++;
          break;
        }
      }
    }
    return n;
  }
  const { db } = await import("./db");
  const { sql } = await import("drizzle-orm");
  const d = await db();
  for (const p of paths) {
    const filas = filasDe<{ name: string }>(await d.execute(sql`select name from storage.objects where bucket_id = ${BUCKET} and name like 'papelera/%' and right(name, ${p.length + 1}) = ${"/" + p} order by name desc limit 1`));
    const origen = filas[0]?.name;
    if (!origen) continue;
    const { error } = await sb.storage.from(BUCKET).move(origen, p);
    if (!error) n++;
    else console.warn("[pulse] no se pudo restaurar el archivo:", p, error.message);
  }
  return n;
}

// Borra de verdad lo que lleva más de `dias` en la papelera de Storage. Solo la llama el respaldo diario.
export async function purgarArchivosPapelera(dias: number): Promise<number> {
  const sb = cliente();
  if (!sb) return 0;
  const limite = new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);
  const { db } = await import("./db");
  const { sql } = await import("drizzle-orm");
  const d = await db();
  const filas = filasDe<{ name: string }>(await d.execute(sql`select name from storage.objects where bucket_id = ${BUCKET} and name like 'papelera/%' and split_part(name, '/', 2) < ${limite}`));
  const nombres = filas.map((f) => f.name);
  for (let i = 0; i < nombres.length; i += 100) await sb.storage.from(BUCKET).remove(nombres.slice(i, i + 100));
  return nombres.length;
}

// d.execute devuelve un arreglo con postgres.js y { rows } con PGlite.
export function filasDe<T>(res: unknown): T[] {
  return (Array.isArray(res) ? res : ((res as { rows?: unknown[] }).rows ?? [])) as T[];
}
