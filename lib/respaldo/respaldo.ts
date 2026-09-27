import "server-only";

import { get, list, put, del } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";
import { sql } from "drizzle-orm";

import { db } from "@/lib/pulse/db";
import { protegerTablasNuevas, purgarPapelera } from "@/lib/pulse/papelera";
import { filasDe } from "@/lib/pulse/storage";
import { archivoRespaldable, cifrar, claveDe, descifrar, diferencias, huella, sobrantes } from "./cifrado";

// Respaldo diario de TODA la base (las 60 tablas: Pulse, Leads, Ritmo, Formularios, Max, AutoFlow…)
// y de los archivos de clientes y empleados, cifrado, en varios lugares:
//   1. Supabase Storage  pulse/respaldos/base/<día>.json.gz.enc   (30 días; rápido de restaurar)
//   2. Vercel Blob       base/<día>.json.gz.enc  + archivos/<ruta>.enc  (60 días; OTRO proveedor)
//   3. La Mac de Elvin   ~/Documents/Respaldos EA Market (scripts/respaldo.mjs local, launchd)
// Después de subir, abre la copia de Vercel y cuenta las filas: un respaldo que no se puede abrir
// no es un respaldo. Si algo falla, le avisa a Elvin. Restaurar: scripts/respaldo.mjs.

const BUCKET = "pulse";
const SUPA_DIAS = 30;
const BLOB_DIAS = 60;
const SIN_RESPALDO = new Set(["leads_webhook_log"]); // ruido que se purga solo a los 14 días

export interface Volcado {
  version: 1;
  generadoEl: string;
  conteos: Record<string, number>;
  tablas: Record<string, unknown[]>;
  archivos: { name: string; bytes: number; actualizado: string }[];
}

export interface EstadoRespaldo {
  fecha: string;
  ok: boolean;
  duracionS: number;
  filas: number;
  tablas: number;
  bytesCifrados: number;
  huella: string;
  destinos: { nombre: string; ok: boolean; detalle: string }[];
  verificado: { ok: boolean; detalle: string };
  archivos: { copiados: number; yaEstaban: number; pendientes: number; error?: string };
  papelera: { filasPurgadas: number; archivosPurgados: number; tablasProtegidas: number };
}

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function volcarBase(): Promise<Volcado> {
  const d = await db();
  const nombres = filasDe<{ t: string }>(
    await d.execute(sql`select c.relname as t from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1`),
  ).map((r) => r.t);
  const tablas: Record<string, unknown[]> = {};
  const conteos: Record<string, number> = {};
  for (const t of nombres) {
    if (SIN_RESPALDO.has(t)) continue;
    const filas = filasDe<unknown>(await d.execute(sql`select * from ${sql.identifier(t)}`));
    tablas[t] = filas;
    conteos[t] = filas.length;
  }
  const archivos = filasDe<{ name: string; bytes: string | null; actualizado: string }>(
    await d.execute(sql`select name, metadata->>'size' as bytes, updated_at::text as actualizado from storage.objects where bucket_id = ${BUCKET} order by name`),
  ).map((a) => ({ name: a.name, bytes: Number(a.bytes ?? 0), actualizado: a.actualizado }));
  return { version: 1, generadoEl: new Date().toISOString(), conteos, tablas, archivos };
}

async function leerStream(s: ReadableStream<Uint8Array>): Promise<Buffer> {
  const partes: Uint8Array[] = [];
  const r = s.getReader();
  for (;;) {
    const { done, value } = await r.read();
    if (done) break;
    if (value) partes.push(value);
  }
  return Buffer.concat(partes);
}

// Copia incremental de los archivos (acuerdos firmados, documentos de empleados…) a Vercel Blob,
// cifrados. Solo sube lo que no está; se detiene antes de que se acabe el tiempo de la función.
async function copiarArchivos(volcado: Volcado, clave: Buffer, hasta: number): Promise<EstadoRespaldo["archivos"]> {
  const sb = supabase();
  if (!sb) return { copiados: 0, yaEstaban: 0, pendientes: 0, error: "sin Supabase" };
  const ya = new Set<string>();
  let cursor: string | undefined;
  do {
    const r = await list({ prefix: "archivos/", cursor, limit: 1000 });
    for (const b of r.blobs) ya.add(b.pathname);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  const faltan = volcado.archivos.filter((a) => archivoRespaldable(a.name) && !ya.has(`archivos/${a.name}.enc`));
  let copiados = 0;
  for (const a of faltan) {
    if (Date.now() > hasta) break;
    const { data, error } = await sb.storage.from(BUCKET).download(a.name);
    if (error || !data) continue;
    await put(`archivos/${a.name}.enc`, cifrar(Buffer.from(await data.arrayBuffer()), clave), { access: "private", allowOverwrite: true, contentType: "application/octet-stream" });
    copiados++;
  }
  return { copiados, yaEstaban: volcado.archivos.filter((a) => archivoRespaldable(a.name)).length - faltan.length, pendientes: faltan.length - copiados };
}

export async function respaldarTodo(): Promise<EstadoRespaldo> {
  const inicio = Date.now();
  const hasta = inicio + 240_000; // la función tiene 300 s
  const fecha = new Date().toISOString().slice(0, 10);
  const nombre = `${fecha}.json.gz.enc`;
  const destinos: EstadoRespaldo["destinos"] = [];
  const clave = claveDe(process.env.RESPALDO_CLAVE);

  // Tablas nuevas protegidas antes de copiar (así el respaldo de mañana ya las cubre con papelera).
  const tablasProtegidas = await protegerTablasNuevas().catch(() => 0);
  const volcado = await volcarBase();
  const cifrado = cifrar(JSON.stringify(volcado), clave);

  // 1. Supabase Storage
  const sb = supabase();
  if (sb) {
    const { error } = await sb.storage.from(BUCKET).upload(`respaldos/base/${nombre}`, cifrado, { contentType: "application/octet-stream", upsert: true });
    destinos.push({ nombre: "Supabase", ok: !error, detalle: error ? error.message : `respaldos/base/${nombre}` });
    if (!error) {
      const { data } = await sb.storage.from(BUCKET).list("respaldos/base", { limit: 1000 });
      const viejos = sobrantes((data ?? []).map((f) => f.name), SUPA_DIAS).map((n) => `respaldos/base/${n}`);
      if (viejos.length) await sb.storage.from(BUCKET).remove(viejos);
    }
  } else destinos.push({ nombre: "Supabase", ok: false, detalle: "sin configurar" });

  // 2. Vercel Blob (otro proveedor)
  let verificado: EstadoRespaldo["verificado"] = { ok: false, detalle: "no se pudo verificar" };
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(`base/${nombre}`, cifrado, { access: "private", allowOverwrite: true, contentType: "application/octet-stream" });
      destinos.push({ nombre: "Vercel Blob", ok: true, detalle: `base/${nombre}` });
      const r = await list({ prefix: "base/", limit: 1000 });
      const viejos = sobrantes(r.blobs.map((b) => b.pathname), BLOB_DIAS);
      if (viejos.length) await del(viejos);
      // Verificación: bajar la copia, descifrarla y contar.
      const g = await get(`base/${nombre}`, { access: "private", useCache: false });
      if (g?.stream) {
        const vuelta = JSON.parse(descifrar(await leerStream(g.stream), clave).toString()) as Volcado;
        const malas = diferencias(vuelta.conteos, volcado.conteos);
        verificado = malas.length ? { ok: false, detalle: `no cuadran: ${malas.join(", ")}` } : { ok: true, detalle: `abierto y contado: ${Object.keys(vuelta.conteos).length} tablas` };
      }
    } catch (e) {
      destinos.push({ nombre: "Vercel Blob", ok: false, detalle: e instanceof Error ? e.message : String(e) });
    }
  } else destinos.push({ nombre: "Vercel Blob", ok: false, detalle: "falta BLOB_READ_WRITE_TOKEN" });

  // Archivos a Blob (incremental)
  const archivos = process.env.BLOB_READ_WRITE_TOKEN
    ? await copiarArchivos(volcado, clave, hasta).catch((e) => ({ copiados: 0, yaEstaban: 0, pendientes: 0, error: e instanceof Error ? e.message : String(e) }))
    : { copiados: 0, yaEstaban: 0, pendientes: 0, error: "sin Blob" };

  // Papelera: se purga lo de más de 90 días SOLO si hoy la base quedó copiada fuera.
  const fuera = destinos.find((x) => x.nombre === "Vercel Blob")?.ok && verificado.ok;
  const purga = fuera ? await purgarPapelera().catch(() => ({ filas: 0, archivos: 0 })) : { filas: 0, archivos: 0 };

  const estado: EstadoRespaldo = {
    fecha,
    ok: destinos.every((x) => x.ok) && verificado.ok && !archivos.error,
    duracionS: Math.round((Date.now() - inicio) / 1000),
    filas: Object.values(volcado.conteos).reduce((a, n) => a + n, 0),
    tablas: Object.keys(volcado.conteos).length,
    bytesCifrados: cifrado.length,
    huella: huella(cifrado),
    destinos,
    verificado,
    archivos,
    papelera: { filasPurgadas: purga.filas, archivosPurgados: purga.archivos, tablasProtegidas },
  };
  const json = JSON.stringify(estado, null, 2);
  await sb?.storage.from(BUCKET).upload("respaldos/estado.json", Buffer.from(json), { contentType: "application/json", upsert: true });
  if (process.env.BLOB_READ_WRITE_TOKEN) await put("estado.json", json, { access: "private", allowOverwrite: true, contentType: "application/json" }).catch(() => {});
  return estado;
}

// Para la página de la Papelera: estado del último respaldo de la nube y de la Mac.
export async function leerEstados(): Promise<{ nube: EstadoRespaldo | null; mac: { fecha: string; ok: boolean; detalle: string } | null }> {
  const sb = supabase();
  if (!sb) return { nube: null, mac: null };
  const leer = async <T,>(p: string): Promise<T | null> => {
    const { data } = await sb.storage.from(BUCKET).download(p);
    return data ? (JSON.parse(await data.text()) as T) : null;
  };
  const [nube, mac] = await Promise.all([leer<EstadoRespaldo>("respaldos/estado.json").catch(() => null), leer<{ fecha: string; ok: boolean; detalle: string }>("respaldos/estado-mac.json").catch(() => null)]);
  return { nube, mac };
}
