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

export async function borrarArchivos(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const sb = cliente();
  if (!sb) {
    const fs = await import("node:fs/promises");
    for (const p of paths) await fs.rm(await rutaLocal(p), { force: true });
    return;
  }
  const { error } = await sb.storage.from(BUCKET).remove(paths);
  if (error) console.warn("[pulse] no se pudieron borrar archivos:", error.message);
}
