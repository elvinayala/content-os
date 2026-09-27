import "server-only";

import { and, desc, eq, max, sql } from "drizzle-orm";

import { db } from "@/lib/pulse/db";

import type { Apariencia, ConfigFormulario, Respuestas } from "./reglas";
import { slugDe } from "./reglas";
import { formFormularios, formRespuestas } from "./schema";
import { SEMILLAS } from "./semillas";
import { SEMILLAS_AGENDA } from "./semillas-agenda";

export type Formulario = typeof formFormularios.$inferSelect;
export type Respuesta = typeof formRespuestas.$inferSelect;

let sembrado = false;
/** Siembra los formularios que venían de Typeform (una vez; nunca pisa uno que ya exista). */
export async function asegurarSemillas(): Promise<void> {
  if (sembrado) return;
  const d = await db();
  for (const s of [...SEMILLAS, ...SEMILLAS_AGENDA]) {
    await d
      .insert(formFormularios)
      .values({ slug: s.slug, titulo: s.titulo, marca: s.marca, apariencia: s.apariencia, config: s.config, accion: s.accion, activo: s.activo ?? true })
      .onConflictDoNothing();
  }
  sembrado = true;
}

export interface FormularioResumen extends Formulario {
  total: number;
  parciales: number; // se quedaron a mitad
  ultima: Date | null;
}

export async function listarFormularios(): Promise<FormularioResumen[]> {
  await asegurarSemillas();
  const d = await db();
  const forms = await d.select().from(formFormularios).where(eq(formFormularios.archivado, false)).orderBy(desc(formFormularios.updatedAt));
  const stats = await d
    .select({
      id: formRespuestas.formularioId,
      total: sql<number>`count(*) filter (where ${formRespuestas.estado} = 'completa')`,
      parciales: sql<number>`count(*) filter (where ${formRespuestas.estado} = 'parcial')`,
      ultima: max(formRespuestas.createdAt),
    })
    .from(formRespuestas)
    .groupBy(formRespuestas.formularioId);
  const por = new Map(stats.map((s) => [s.id, s]));
  return forms.map((f) => ({ ...f, total: Number(por.get(f.id)?.total ?? 0), parciales: Number(por.get(f.id)?.parciales ?? 0), ultima: por.get(f.id)?.ultima ?? null }));
}

export async function formularioPorSlug(slug: string): Promise<Formulario | null> {
  await asegurarSemillas();
  const d = await db();
  const [f] = await d.select().from(formFormularios).where(eq(formFormularios.slug, slug)).limit(1);
  return f ?? null;
}

export async function formularioPorId(id: string): Promise<Formulario | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const d = await db();
  const [f] = await d.select().from(formFormularios).where(eq(formFormularios.id, id)).limit(1);
  return f ?? null;
}

async function slugLibre(base: string, ignorarId?: string): Promise<string> {
  const d = await db();
  const raiz = slugDe(base) || "formulario";
  for (let i = 1; i < 200; i++) {
    const s = i === 1 ? raiz : `${raiz}-${i}`;
    const [f] = await d.select({ id: formFormularios.id }).from(formFormularios).where(eq(formFormularios.slug, s)).limit(1);
    if (!f || f.id === ignorarId) return s;
  }
  return `${raiz}-${Date.now().toString(36)}`;
}

const VACIO: ConfigFormulario = {
  bienvenida: { titulo: "Nuevo formulario", texto: "Son solo unas preguntas.", boton: "Empezar" },
  gracias: { titulo: "¡Gracias, {nombre}!", texto: "Ya recibimos tus respuestas." },
  preguntas: [
    { id: "nombre", titulo: "¿Cómo te llamas?", tipo: "texto", requerida: true, placeholder: "Nombre y apellido" },
    { id: "email", titulo: "¿Cuál es tu e-mail?", tipo: "email", requerida: true, placeholder: "tu@correo.com" },
  ],
};

export async function crearFormulario(v: { titulo: string; marca: string; autorId: string; basadoEn?: Formulario | null }): Promise<Formulario> {
  const d = await db();
  const b = v.basadoEn;
  const [f] = await d
    .insert(formFormularios)
    .values({
      slug: await slugLibre(v.titulo),
      titulo: v.titulo.trim().slice(0, 120),
      marca: v.marca,
      apariencia: b?.apariencia ?? ({ tema: v.marca === "ai_borinquen" ? "ai-borinquen" : "level-up" } satisfies Apariencia),
      config: b?.config ?? VACIO,
      // Una copia nunca hereda la acción: crear fichas de clientes solo lo hace el original.
      accion: "ninguna",
      activo: false,
      creadoPor: v.autorId,
    })
    .returning();
  return f;
}

export async function guardarFormulario(id: string, v: { titulo: string; slug: string; marca: string; apariencia: Apariencia; config: ConfigFormulario; accion: string; activo: boolean }): Promise<{ ok: boolean; error?: string; slug?: string }> {
  const d = await db();
  const slug = slugDe(v.slug) || (await slugLibre(v.titulo, id));
  const [otro] = await d.select({ id: formFormularios.id }).from(formFormularios).where(eq(formFormularios.slug, slug)).limit(1);
  if (otro && otro.id !== id) return { ok: false, error: `El link /f/${slug} ya lo usa otro formulario.` };
  await d
    .update(formFormularios)
    .set({ titulo: v.titulo.trim().slice(0, 120), slug, marca: v.marca, apariencia: v.apariencia, config: v.config, accion: v.accion, activo: v.activo, updatedAt: new Date() })
    .where(eq(formFormularios.id, id));
  return { ok: true, slug };
}

export async function archivarFormulario(id: string): Promise<void> {
  const d = await db();
  // El slug se libera (queda con sufijo) para poder reusar el link.
  await d
    .update(formFormularios)
    .set({ archivado: true, activo: false, slug: sql`${formFormularios.slug} || '-archivado-' || substr(md5(random()::text), 1, 6)`, updatedAt: new Date() })
    .where(eq(formFormularios.id, id));
}

/** Guarda una respuesta completa. Si ese navegador ya la había completado (mismo token), no duplica
 *  (`nueva: false`); si estaba a mitad (parcial), la completa y cuenta como nueva. */
export async function guardarRespuesta(v: { formularioId: string; token: string; respuestas: Respuestas; preguntas: { id: string; titulo: string }[]; origen?: string | null }): Promise<{ id: string; nueva: boolean }> {
  const d = await db();
  const [r] = await d
    .insert(formRespuestas)
    .values({ formularioId: v.formularioId, token: v.token, respuestas: v.respuestas, preguntas: v.preguntas, origen: v.origen ?? null })
    .onConflictDoNothing()
    .returning({ id: formRespuestas.id });
  if (r) return { id: r.id, nueva: true };
  const [ya] = await d
    .update(formRespuestas)
    .set({ respuestas: v.respuestas, preguntas: v.preguntas, estado: "completa", createdAt: new Date() })
    .where(and(eq(formRespuestas.formularioId, v.formularioId), eq(formRespuestas.token, v.token), eq(formRespuestas.estado, "parcial")))
    .returning({ id: formRespuestas.id });
  if (ya) return { id: ya.id, nueva: true };
  const [antes] = await d.select({ id: formRespuestas.id }).from(formRespuestas).where(and(eq(formRespuestas.formularioId, v.formularioId), eq(formRespuestas.token, v.token))).limit(1);
  return { id: antes.id, nueva: false };
}

/** Guarda lo que lleva alguien que todavía no termina (una fila por navegador, se va pisando).
 *  `primera` = es la primera vez que se guarda (para avisar/crear el lead una sola vez). Si ya la
 *  completó, no toca nada. */
export async function guardarParcial(v: { formularioId: string; token: string; respuestas: Respuestas; preguntas: { id: string; titulo: string }[]; origen?: string | null }): Promise<{ id: string; primera: boolean } | null> {
  const d = await db();
  const [r] = await d
    .insert(formRespuestas)
    .values({ formularioId: v.formularioId, token: v.token, respuestas: v.respuestas, preguntas: v.preguntas, origen: v.origen ?? null, estado: "parcial" })
    .onConflictDoNothing()
    .returning({ id: formRespuestas.id });
  if (r) return { id: r.id, primera: true };
  const [ya] = await d
    .update(formRespuestas)
    .set({ respuestas: v.respuestas, preguntas: v.preguntas })
    .where(and(eq(formRespuestas.formularioId, v.formularioId), eq(formRespuestas.token, v.token), eq(formRespuestas.estado, "parcial")))
    .returning({ id: formRespuestas.id });
  return ya ? { id: ya.id, primera: false } : null;
}

export async function marcarResultado(id: string, resultado: string): Promise<void> {
  const d = await db();
  await d.update(formRespuestas).set({ resultado: resultado.slice(0, 500) }).where(eq(formRespuestas.id, id));
}

export async function respuestasDe(formularioId: string, limite = 1000): Promise<Respuesta[]> {
  const d = await db();
  return d.select().from(formRespuestas).where(eq(formRespuestas.formularioId, formularioId)).orderBy(desc(formRespuestas.createdAt)).limit(limite);
}

export async function borrarRespuesta(id: string): Promise<void> {
  const d = await db();
  await d.delete(formRespuestas).where(eq(formRespuestas.id, id));
}

/** El que respondió terminó el paso 2 (agendó en Calendly desde el formulario). */
export async function marcarAgendo(formularioId: string, token: string): Promise<void> {
  const d = await db();
  await d
    .update(formRespuestas)
    .set({ resultado: sql`case when ${formRespuestas.resultado} is null or ${formRespuestas.resultado} = '' then 'agendó' else ${formRespuestas.resultado} || ' · agendó' end` })
    .where(and(eq(formRespuestas.formularioId, formularioId), eq(formRespuestas.token, token), sql`coalesce(${formRespuestas.resultado}, '') not like '%agendó%'`));
}
