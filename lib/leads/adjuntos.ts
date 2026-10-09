import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/pulse/db";
import { subirArchivo } from "@/lib/pulse/storage";

import { extensionAdjunto, MAX_BYTES_ADJUNTO, seGuardaAdjunto, tipoAdjunto, type AdjuntoWa, type Marca, type TipoAdjunto } from "./reglas";
import { leadsHistorial, leadsTratos } from "./schema";
import { mensajeTimelines } from "./timelines";

// Audios, fotos y documentos de las conversaciones de WhatsApp (9/oct, Elvin: "vemos lo que se escribe pero
// no los audios que envían los chatters o leads"). Timelines manda un link que vence a los 15 min: al llegar
// el aviso se copia el archivo a nuestro Storage (pulse/leads/<marca>/<mes>/<uid>-<n>.<ext>) y queda en
// leads_historial.meta.adjuntos[n].ruta. Si no se pudo (o es de antes), se pide un link fresco a Timelines.

export interface AdjuntoGuardado {
  tipo: TipoAdjunto;
  mime: string;
  nombre: string;
  bytes: number | null;
  ruta?: string;
}

async function bajar(url: string): Promise<Buffer | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!r.ok) return null;
    const b = Buffer.from(await r.arrayBuffer());
    return b.length && b.length <= MAX_BYTES_ADJUNTO ? b : null;
  } catch {
    return null;
  }
}

export async function urlFrescaTimelines(marca: Marca, mensajeId: string): Promise<string | null> {
  const r = await mensajeTimelines(marca, mensajeId);
  return (r.ok && r.data?.data?.attachment_url) || null;
}

async function guardarUno(marca: Marca, mensajeId: string, n: number, a: { mime: string; nombre: string; url?: string | null }): Promise<{ ruta: string; bytes: number } | null> {
  const datos = (a.url ? await bajar(a.url) : null) ?? (await urlFrescaTimelines(marca, mensajeId).then((u) => (u ? bajar(u) : null)));
  if (!datos) return null;
  const ruta = `leads/${marca}/${new Date().toISOString().slice(0, 7)}/${mensajeId.replace(/[^\w-]/g, "")}-${n}.${extensionAdjunto(a)}`;
  await subirArchivo(ruta, datos, a.mime);
  return { ruta, bytes: datos.length };
}

/** Copia a Storage los adjuntos que se guardan (audio, foto, documento) de un mensaje ya registrado. */
export async function guardarAdjuntos(marca: Marca, mensajeId: string | null, adjuntos: AdjuntoWa[]): Promise<number> {
  if (!mensajeId || !adjuntos.some(seGuardaAdjunto)) return 0;
  const d = await db();
  const [h] = await d.select({ id: leadsHistorial.id, meta: leadsHistorial.meta }).from(leadsHistorial).where(eq(leadsHistorial.externoId, mensajeId)).limit(1);
  if (!h) return 0;
  const lista: AdjuntoGuardado[] = Array.isArray(h.meta?.adjuntos) ? [...(h.meta.adjuntos as AdjuntoGuardado[])] : [];
  let n = 0;
  for (const [i, a] of adjuntos.entries()) {
    lista[i] ??= { tipo: tipoAdjunto(a.mime), mime: a.mime, nombre: a.nombre, bytes: a.bytes };
    if (lista[i].ruta || !seGuardaAdjunto(a)) continue;
    const g = await guardarUno(marca, mensajeId, i, a).catch(() => null);
    if (!g) continue;
    lista[i] = { ...lista[i], ...g };
    n++;
  }
  if (n) await d.update(leadsHistorial).set({ meta: { ...(h.meta ?? {}), adjuntos: lista } }).where(eq(leadsHistorial.id, h.id));
  return n;
}

/** Para servir un adjunto: el mensaje, su lead (para los permisos) y la ruta en Storage si ya está. */
export async function adjuntoDeMensaje(historialId: string, n: number) {
  const d = await db();
  const [r] = await d
    .select({ meta: leadsHistorial.meta, externoId: leadsHistorial.externoId, marca: leadsTratos.marca, duenoId: leadsTratos.duenoId })
    .from(leadsHistorial)
    .innerJoin(leadsTratos, eq(leadsTratos.id, leadsHistorial.tratoId))
    .where(eq(leadsHistorial.id, historialId))
    .limit(1);
  const a = (Array.isArray(r?.meta?.adjuntos) ? (r.meta.adjuntos as AdjuntoGuardado[]) : [])[n];
  return r && a ? { ...a, marca: r.marca as Marca, duenoId: r.duenoId, externoId: r.externoId, historialId } : null;
}

/** Un adjunto viejo o que no se pudo copiar al llegar: se trae ahora con un link fresco de Timelines. */
export async function guardarAhora(x: { marca: Marca; externoId: string | null; historialId: string; mime: string; nombre: string }, n: number): Promise<string | null> {
  if (!x.externoId) return null;
  const g = await guardarUno(x.marca, x.externoId, n, x).catch(() => null);
  if (!g) return null;
  const d = await db();
  const [h] = await d.select({ meta: leadsHistorial.meta }).from(leadsHistorial).where(eq(leadsHistorial.id, x.historialId)).limit(1);
  const lista = Array.isArray(h?.meta?.adjuntos) ? [...(h.meta.adjuntos as AdjuntoGuardado[])] : [];
  if (lista[n]) {
    lista[n] = { ...lista[n], ...g };
    await d.update(leadsHistorial).set({ meta: { ...(h.meta ?? {}), adjuntos: lista } }).where(eq(leadsHistorial.id, x.historialId));
  }
  return g.ruta;
}

/** Recupera audios/fotos de los avisos guardados (leads_webhook_log, 14 días) que antes se descartaban:
 * los mete en su lugar del historial (sin marcarlos como nuevos) y el archivo se trae al abrirlo. */
export async function recuperarAdjuntos(dias = 14) {
  const { and, gt, sql } = await import("drizzle-orm");
  const { leadsWebhookLog } = await import("./schema");
  const { leerTimelines } = await import("./reglas");
  const { registrarMensaje } = await import("./repo");
  const d = await db();
  const filas = await d
    .select({ marca: leadsWebhookLog.marca, cuerpo: leadsWebhookLog.cuerpo })
    .from(leadsWebhookLog)
    .where(and(eq(leadsWebhookLog.fuente, "timelines"), gt(leadsWebhookLog.createdAt, new Date(Date.now() - dias * 86_400_000)), sql`jsonb_array_length(coalesce(${leadsWebhookLog.cuerpo}->'message'->'attachments', '[]'::jsonb)) > 0`))
    .orderBy(leadsWebhookLog.createdAt);
  const r = { avisos: filas.length, nuevos: 0, marcados: 0, sinLead: 0, otros: 0 };
  for (const f of filas) {
    const ev = leerTimelines(f.cuerpo);
    if (!ev.mensajeId || !ev.adjuntos.length || !f.marca) continue;
    ev.adjuntos = ev.adjuntos.map((a) => ({ ...a, url: null })); // los links ya vencieron
    const [h] = await d.select({ id: leadsHistorial.id, meta: leadsHistorial.meta }).from(leadsHistorial).where(eq(leadsHistorial.externoId, ev.mensajeId)).limit(1);
    if (h) {
      if (Array.isArray(h.meta?.adjuntos)) continue;
      await d
        .update(leadsHistorial)
        .set({ meta: { ...(h.meta ?? {}), adjuntos: ev.adjuntos.map((a) => ({ tipo: tipoAdjunto(a.mime), mime: a.mime, nombre: a.nombre, bytes: a.bytes })) } })
        .where(eq(leadsHistorial.id, h.id));
      r.marcados++;
      continue;
    }
    const res = await registrarMensaje(f.marca as Marca, ev, { historico: true }).catch((e) => `error:${e instanceof Error ? e.message : e}`);
    if (/^(mensaje|grupo):/.test(res)) r.nuevos++;
    else if (res === "ignorado:sin-lead") r.sinLead++;
    else r.otros++;
  }
  return r;
}
