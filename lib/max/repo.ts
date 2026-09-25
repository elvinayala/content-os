import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/lib/pulse/db";

import type { EstadoItem, TipoItem } from "./operador";

// Max en Slack — datos (base de Pulse, igual que el buzón de agentes: es lo único que comparten
// Vercel, los contenedores de Railway y la Mac).
//  max_clientes: el expediente de cada cliente (canal de Slack, etapa, ficha, ids de Meta).
//  max_items: cada cosa que Max propone y espera el OK de Elvin o Carilin en #max-aprobaciones.

function filas<T = Record<string, unknown>>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  return (r as { rows?: T[] })?.rows ?? [];
}

let listas: Promise<void> | null = null;
export function asegurarTablas(): Promise<void> {
  if (!listas) {
    listas = (async () => {
      const d = await db();
      await d.execute(sql`CREATE TABLE IF NOT EXISTS max_clientes (
        slug text PRIMARY KEY,
        nombre text NOT NULL,
        canal text,
        etapa text NOT NULL DEFAULT 'onboarding',
        ficha jsonb NOT NULL DEFAULT '{}'::jsonb,
        meta jsonb NOT NULL DEFAULT '{}'::jsonb,
        pulse_item text,
        creado_el timestamptz NOT NULL DEFAULT now(),
        actualizado_el timestamptz NOT NULL DEFAULT now()
      )`);
      await d.execute(sql`CREATE INDEX IF NOT EXISTS max_clientes_canal ON max_clientes (canal)`);
      await d.execute(sql`CREATE TABLE IF NOT EXISTS max_items (
        id serial PRIMARY KEY,
        cliente text NOT NULL,
        tipo text NOT NULL,
        titulo text NOT NULL DEFAULT '',
        contenido text NOT NULL,
        hilo text,
        nota text,
        datos jsonb NOT NULL DEFAULT '{}'::jsonb,
        estado text NOT NULL DEFAULT 'esperando',
        decidido_por text,
        decision_nota text,
        aprobacion_ts text,
        resultado text,
        creado_el timestamptz NOT NULL DEFAULT now(),
        decidido_el timestamptz
      )`);
      await d.execute(sql`CREATE INDEX IF NOT EXISTS max_items_estado ON max_items (estado, cliente)`);
    })().catch((e) => {
      listas = null;
      throw e;
    });
  }
  return listas;
}

export interface ClienteMax {
  slug: string;
  nombre: string;
  canal: string | null;
  etapa: string;
  ficha: Record<string, unknown>;
  meta: Record<string, unknown>;
  pulse_item: string | null;
  actualizado_el?: string;
}

export interface ItemMax {
  id: number;
  cliente: string;
  tipo: TipoItem;
  titulo: string;
  contenido: string;
  hilo: string | null;
  nota: string | null;
  datos: Record<string, unknown>;
  estado: EstadoItem;
  decidido_por: string | null;
  decision_nota: string | null;
  aprobacion_ts: string | null;
  resultado: string | null;
  creado_el: string;
}

export async function cliente(slug: string): Promise<ClienteMax | null> {
  await asegurarTablas();
  const d = await db();
  return filas<ClienteMax>(await d.execute(sql`SELECT * FROM max_clientes WHERE slug = ${slug}`))[0] ?? null;
}

// Cache corto: cada mensaje de cualquier canal privado donde está el bot pregunta esto.
const cacheCanal = new Map<string, { t: number; c: ClienteMax | null }>();
export async function clientePorCanal(canal: string): Promise<ClienteMax | null> {
  const hit = cacheCanal.get(canal);
  if (hit && Date.now() - hit.t < 60_000) return hit.c;
  await asegurarTablas();
  const d = await db();
  const c = filas<ClienteMax>(await d.execute(sql`SELECT * FROM max_clientes WHERE canal = ${canal} LIMIT 1`))[0] ?? null;
  cacheCanal.set(canal, { t: Date.now(), c });
  return c;
}

// Para cruzar una reunión de Fathom con el expediente que abrió el formulario: por correo del
// cliente (ficha.email) o por slug del nombre.
export async function buscarCliente(emails: string[], slug: string): Promise<ClienteMax | null> {
  await asegurarTablas();
  const d = await db();
  for (const e of emails) {
    const r = filas<ClienteMax>(await d.execute(sql`SELECT * FROM max_clientes WHERE lower(ficha->>'email') = ${e.toLowerCase()} ORDER BY actualizado_el DESC LIMIT 1`))[0];
    if (r) return r;
  }
  return cliente(slug);
}

export async function listarClientes(): Promise<ClienteMax[]> {
  await asegurarTablas();
  const d = await db();
  return filas<ClienteMax>(await d.execute(sql`SELECT slug, nombre, canal, etapa, pulse_item, actualizado_el FROM max_clientes ORDER BY actualizado_el DESC LIMIT 200`));
}

// Alta o actualización: ficha y meta se FUSIONAN (no se pisan).
export async function guardarCliente(c: { slug: string; nombre?: string; canal?: string | null; etapa?: string; ficha?: Record<string, unknown>; meta?: Record<string, unknown>; pulseItem?: string }): Promise<ClienteMax> {
  await asegurarTablas();
  const d = await db();
  const ficha = JSON.stringify(c.ficha ?? {});
  const meta = JSON.stringify(c.meta ?? {});
  const r = await d.execute(sql`INSERT INTO max_clientes (slug, nombre, canal, etapa, ficha, meta, pulse_item)
    VALUES (${c.slug}, ${c.nombre ?? c.slug}, ${c.canal ?? null}, ${c.etapa ?? "onboarding"}, ${ficha}::jsonb, ${meta}::jsonb, ${c.pulseItem ?? null})
    ON CONFLICT (slug) DO UPDATE SET
      nombre = COALESCE(${c.nombre ?? null}, max_clientes.nombre),
      canal = COALESCE(${c.canal ?? null}, max_clientes.canal),
      etapa = COALESCE(${c.etapa ?? null}, max_clientes.etapa),
      ficha = max_clientes.ficha || ${ficha}::jsonb,
      meta = max_clientes.meta || ${meta}::jsonb,
      pulse_item = COALESCE(${c.pulseItem ?? null}, max_clientes.pulse_item),
      actualizado_el = now()
    RETURNING *`);
  cacheCanal.clear();
  return filas<ClienteMax>(r)[0];
}

export async function crearItem(i: { cliente: string; tipo: TipoItem; titulo?: string; contenido: string; hilo?: string | null; nota?: string | null; datos?: Record<string, unknown> }): Promise<ItemMax> {
  await asegurarTablas();
  const d = await db();
  const r = await d.execute(sql`INSERT INTO max_items (cliente, tipo, titulo, contenido, hilo, nota, datos)
    VALUES (${i.cliente}, ${i.tipo}, ${i.titulo ?? ""}, ${i.contenido}, ${i.hilo ?? null}, ${i.nota ?? null}, ${JSON.stringify(i.datos ?? {})}::jsonb)
    RETURNING *`);
  return filas<ItemMax>(r)[0];
}

export async function item(id: number): Promise<ItemMax | null> {
  await asegurarTablas();
  const d = await db();
  return filas<ItemMax>(await d.execute(sql`SELECT * FROM max_items WHERE id = ${id}`))[0] ?? null;
}

export async function items(f: { estado?: string; cliente?: string; limite?: number }): Promise<ItemMax[]> {
  await asegurarTablas();
  const d = await db();
  const lim = Math.min(Math.max(f.limite ?? 30, 1), 200);
  const r = await d.execute(sql`SELECT * FROM max_items
    WHERE (${f.estado ?? null}::text IS NULL OR estado = ${f.estado ?? null})
      AND (${f.cliente ?? null}::text IS NULL OR cliente = ${f.cliente ?? null})
    ORDER BY id DESC LIMIT ${lim}`);
  return filas<ItemMax>(r);
}

export async function actualizarItem(id: number, c: { estado?: EstadoItem; decididoPor?: string; decisionNota?: string; resultado?: string; aprobacionTs?: string; datos?: Record<string, unknown> }): Promise<ItemMax | null> {
  await asegurarTablas();
  const d = await db();
  const r = await d.execute(sql`UPDATE max_items SET
      estado = COALESCE(${c.estado ?? null}, estado),
      decidido_por = COALESCE(${c.decididoPor ?? null}, decidido_por),
      decision_nota = COALESCE(${c.decisionNota ?? null}, decision_nota),
      resultado = COALESCE(${c.resultado ?? null}, resultado),
      aprobacion_ts = COALESCE(${c.aprobacionTs ?? null}, aprobacion_ts),
      datos = datos || ${JSON.stringify(c.datos ?? {})}::jsonb,
      decidido_el = CASE WHEN ${c.decididoPor ?? null}::text IS NOT NULL THEN now() ELSE decidido_el END
    WHERE id = ${id} RETURNING *`);
  return filas<ItemMax>(r)[0] ?? null;
}

// Deja un pedido en el buzón de Max (lo atiende su puente en Railway, cada ~90 s).
export async function alBuzonMax(texto: string): Promise<number | null> {
  const d = await db();
  const r = await d.execute(sql`INSERT INTO agentes_mensajes (de, para, texto) VALUES ('slack', 'max', ${texto.slice(0, 8000)}) RETURNING id`);
  return filas<{ id: number }>(r)[0]?.id ?? null;
}
