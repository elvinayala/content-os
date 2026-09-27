#!/usr/bin/env node
// Respaldos de la base de EA Market (Pulse, Leads, Ritmo, Formularios, Max, AutoFlow…).
//
//   node --env-file=.env.local scripts/respaldo.mjs local
//       Copia en ESTA Mac: base completa cifrada + archivos de clientes/empleados (incremental) en
//       ~/Documents/Respaldos EA Market/. Lo corre launchd todos los días (scripts/launchd/).
//   node --env-file=.env.local scripts/respaldo.mjs listar
//       Qué respaldos hay en Supabase, Vercel Blob y la Mac.
//   node --env-file=.env.local scripts/respaldo.mjs abrir <fuente> [--salida archivo.json]
//       Descifra un respaldo a JSON para mirarlo. <fuente> = ruta local · supabase:2026-09-27 · blob:2026-09-27
//   node --env-file=.env.local scripts/respaldo.mjs restaurar <fuente> [--tabla a,b] [--real]
//       Trae de vuelta las filas que FALTAN en la base (nunca pisa lo que existe). Sin --real solo
//       dice cuántas faltan por tabla.
//
// Clave: RESPALDO_CLAVE (en .env.local y en Vercel; guardarla también en el gestor de claves).

import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

import { ORDEN_TABLAS } from "../lib/pulse/papelera-reglas.ts";
import { archivoRespaldable, cifrar, claveDe, descifrar, huella, sobrantes } from "../lib/respaldo/cifrado.ts";

const BUCKET = "pulse";
const RAIZ = process.env.RESPALDO_CARPETA || path.join(os.homedir(), "Respaldos EA Market"); // fuera de Documents: launchd no tiene permiso ahí
const LOCAL_DIAS = 90;
const SIN_RESPALDO = new Set(["leads_webhook_log"]);

const [cmd, ...resto] = process.argv.slice(2);
const flag = (n) => resto.includes(n);
const opcion = (n) => {
  const i = resto.indexOf(n);
  return i >= 0 ? resto[i + 1] : undefined;
};

const clave = () => claveDe(process.env.RESPALDO_CLAVE);
const sql = () => postgres(process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL, { prepare: false, max: 2 });
const sb = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const hoy = () => new Date().toISOString().slice(0, 10);
const existe = (p) => stat(p).then(() => true, () => false);

async function volcar(db) {
  const nombres = (await db`select c.relname as t from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1`).map((r) => r.t);
  const tablas = {};
  const conteos = {};
  for (const t of nombres) {
    if (SIN_RESPALDO.has(t)) continue;
    const filas = [...(await db`select * from ${db(t)}`)];
    tablas[t] = filas;
    conteos[t] = filas.length;
  }
  const archivos = (await db`select name, metadata->>'size' as bytes, updated_at::text as actualizado from storage.objects where bucket_id = ${BUCKET} order by name`).map((a) => ({
    name: a.name,
    bytes: Number(a.bytes ?? 0),
    actualizado: a.actualizado,
  }));
  return { version: 1, generadoEl: new Date().toISOString(), conteos, tablas, archivos };
}

async function local() {
  const db = sql();
  const s = sb();
  const inicio = Date.now();
  let estado;
  try {
    const volcado = await volcar(db);
    const cifrado = cifrar(JSON.stringify(volcado), clave());
    await mkdir(path.join(RAIZ, "base"), { recursive: true });
    const archivo = path.join(RAIZ, "base", `${hoy()}.json.gz.enc`);
    await writeFile(archivo, cifrado);
    // Comprobar que se abre.
    const vuelta = JSON.parse(descifrar(await readFile(archivo), clave()).toString());
    if (Object.keys(vuelta.conteos).length !== Object.keys(volcado.conteos).length) throw new Error("la copia local no cuadra");
    for (const n of sobrantes(await readdir(path.join(RAIZ, "base")), LOCAL_DIAS)) await rm(path.join(RAIZ, "base", n));
    // Archivos (incremental: solo lo que no está).
    let copiados = 0;
    let yaEstaban = 0;
    for (const a of volcado.archivos.filter((x) => archivoRespaldable(x.name))) {
      const destino = path.join(RAIZ, "archivos", `${a.name}.enc`);
      if (await existe(destino)) {
        yaEstaban++;
        continue;
      }
      const { data, error } = await s.storage.from(BUCKET).download(a.name);
      if (error || !data) continue;
      await mkdir(path.dirname(destino), { recursive: true });
      await writeFile(destino, cifrar(Buffer.from(await data.arrayBuffer()), clave()));
      copiados++;
    }
    const filas = Object.values(volcado.conteos).reduce((x, n) => x + n, 0);
    estado = {
      fecha: hoy(),
      ok: true,
      detalle: `${Object.keys(volcado.conteos).length} tablas · ${filas.toLocaleString("en-US")} filas · ${(cifrado.length / 1024).toFixed(0)} KB · huella ${huella(cifrado)} · archivos: ${copiados} nuevos, ${yaEstaban} ya estaban · ${Math.round((Date.now() - inicio) / 1000)} s`,
      carpeta: RAIZ,
    };
  } catch (e) {
    estado = { fecha: hoy(), ok: false, detalle: e instanceof Error ? e.message : String(e), carpeta: RAIZ };
  }
  await s.storage.from(BUCKET).upload("respaldos/estado-mac.json", Buffer.from(JSON.stringify(estado, null, 2)), { contentType: "application/json", upsert: true }).catch(() => {});
  await db.end();
  console.log(`${estado.ok ? "✔" : "✖"} Respaldo en la Mac (${estado.fecha}): ${estado.detalle}`);
  if (!estado.ok) process.exitCode = 1;
}

async function listar() {
  const s = sb();
  const { data } = await s.storage.from(BUCKET).list("respaldos/base", { limit: 1000 });
  console.log(`Supabase (respaldos/base): ${(data ?? []).map((f) => f.name.slice(0, 10)).sort().join(", ") || "—"}`);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { list } = await import("@vercel/blob");
    const r = await list({ prefix: "base/", limit: 1000 });
    const a = await list({ prefix: "archivos/", limit: 1000 });
    console.log(`Vercel Blob (base/): ${r.blobs.map((b) => b.pathname.slice(5, 15)).sort().join(", ") || "—"}`);
    console.log(`Vercel Blob (archivos/): ${a.blobs.length}${a.hasMore ? "+" : ""} archivos`);
  }
  const loc = await readdir(path.join(RAIZ, "base")).catch(() => []);
  console.log(`Mac (${RAIZ}): ${loc.map((n) => n.slice(0, 10)).sort().join(", ") || "—"}`);
}

async function leerFuente(fuente) {
  if (!fuente) throw new Error("Falta la fuente: ruta local, supabase:<día> o blob:<día>");
  if (fuente.startsWith("supabase:")) {
    const { data, error } = await sb().storage.from(BUCKET).download(`respaldos/base/${fuente.slice(9)}.json.gz.enc`);
    if (error || !data) throw new Error(`No está en Supabase: ${error?.message ?? ""}`);
    return Buffer.from(await data.arrayBuffer());
  }
  if (fuente.startsWith("blob:")) {
    const { get } = await import("@vercel/blob");
    const g = await get(`base/${fuente.slice(5)}.json.gz.enc`, { access: "private", useCache: false });
    if (!g?.stream) throw new Error("No está en Vercel Blob");
    return Buffer.from(await new Response(g.stream).arrayBuffer());
  }
  return readFile(fuente);
}

async function abrir() {
  const volcado = JSON.parse(descifrar(await leerFuente(resto[0]), clave()).toString());
  const salida = opcion("--salida");
  if (salida) {
    await writeFile(salida, JSON.stringify(volcado, null, 2));
    console.log(`Guardado en ${salida}. ⚠️ Está SIN cifrar: bórralo cuando termines.`);
  }
  console.log(`Respaldo del ${volcado.generadoEl}: ${Object.keys(volcado.conteos).length} tablas, ${volcado.archivos.length} archivos en el almacenamiento.`);
  for (const [t, n] of Object.entries(volcado.conteos).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${t.padEnd(34)} ${n}`);
}

async function restaurar() {
  const volcado = JSON.parse(descifrar(await leerFuente(resto[0]), clave()).toString());
  const soloTablas = opcion("--tabla")?.split(",").map((x) => x.trim()).filter(Boolean);
  const real = flag("--real");
  const orden = (t) => (ORDEN_TABLAS.indexOf(t) === -1 ? ORDEN_TABLAS.length : ORDEN_TABLAS.indexOf(t));
  const tablas = Object.keys(volcado.tablas).filter((t) => !soloTablas || soloTablas.includes(t)).sort((a, b) => orden(a) - orden(b));
  const db = sql();
  let total = 0;
  for (const t of tablas) {
    const filas = volcado.tablas[t];
    if (!filas.length) continue;
    // Llave de la tabla: la primaria (id o compuesta).
    // Si no tiene, el primer índice único completo.
    const [ix] = await db`select i.indexrelid from pg_index i where i.indrelid = ${t}::regclass and (i.indisprimary or (i.indisunique and i.indpred is null)) order by i.indisprimary desc, i.indexrelid limit 1`;
    const llave = ix ? (await db`select a.attname as c from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey) where i.indexrelid = ${ix.indexrelid} order by a.attname`).map((r) => r.c) : [];
    let faltan = filas;
    if (llave.length) {
      const claveDeFila = (f) => llave.map((c) => String(f[c])).join("|");
      const cols = llave.map((c) => `"${c}"::text`).join(" || '|' || ");
      const hay = new Set((await db.unsafe(`select ${cols} as k from "${t}"`)).map((r) => r.k));
      faltan = filas.filter((f) => !hay.has(claveDeFila(f)));
    }
    if (!faltan.length) continue;
    total += faltan.length;
    if (!real) {
      console.log(`  ${t.padEnd(34)} faltan ${faltan.length}${llave.length ? "" : " (sin llave primaria: se intentan todas, sin duplicar)"}`);
      continue;
    }
    let ok = 0;
    for (const f of faltan) {
      try {
        const r = await db.unsafe(`insert into "${t}" select * from jsonb_populate_record(null::"${t}", $1::jsonb) on conflict do nothing`, [db.json(f)]);
        ok += r.count;
      } catch (e) {
        console.warn(`    ${t}: ${e.message.slice(0, 90)}`);
      }
    }
    console.log(`  ${t.padEnd(34)} restauradas ${ok} de ${faltan.length}`);
  }
  await db.end();
  console.log(real ? `Listo: ${total} filas revisadas.` : `En total faltan ${total} filas. Corre con --real para traerlas de vuelta (no pisa nada existente).`);
}

const comandos = { local, listar, abrir, restaurar };
if (!comandos[cmd]) {
  console.log("Uso: node --env-file=.env.local scripts/respaldo.mjs local|listar|abrir <fuente>|restaurar <fuente> [--tabla a,b] [--real]");
  process.exit(1);
}
await comandos[cmd]();
