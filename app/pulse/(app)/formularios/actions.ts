"use server";

import { revalidatePath } from "next/cache";

import { archivarFormulario, borrarRespuesta, crearFormulario, formularioPorId, guardarFormulario } from "@/lib/formularios/repo";
import { ACCIONES, type Apariencia, type ConfigFormulario, MARCAS_FORM, problemaConfig, TEMAS } from "@/lib/formularios/reglas";
import { puedeFormularios } from "@/lib/formularios/reglas";
import { usuarioActual } from "@/lib/pulse/auth";

type Res = { ok: boolean; error?: string; id?: string; slug?: string };

// Formularios: los manejan admin y editores de Pulse (Elvin, Carilin, Aure, Jessica…).
async function editor() {
  const u = await usuarioActual();
  return u && puedeFormularios(u, process.env.FORMULARIOS_ACCESO || undefined) ? u : null;
}

export async function crearFormularioAction(v: { titulo: string; marca: string; duplicarDe?: string }): Promise<Res> {
  const u = await editor();
  if (!u) return { ok: false, error: "Sin permiso" };
  if (!v.titulo?.trim()) return { ok: false, error: "Ponle un nombre" };
  if (!MARCAS_FORM[v.marca]) return { ok: false, error: "Marca inválida" };
  const base = v.duplicarDe ? await formularioPorId(v.duplicarDe) : null;
  const f = await crearFormulario({ titulo: v.titulo, marca: v.marca, autorId: u.id, basadoEn: base });
  revalidatePath("/pulse/formularios");
  return { ok: true, id: f.id };
}

export async function guardarFormularioAction(id: string, v: { titulo: string; slug: string; marca: string; apariencia: Apariencia; config: ConfigFormulario; accion: string; activo: boolean }): Promise<Res> {
  if (!(await editor())) return { ok: false, error: "Sin permiso" };
  const f = await formularioPorId(id);
  if (!f) return { ok: false, error: "No existe" };
  if (!v.titulo?.trim()) return { ok: false, error: "Ponle un nombre al formulario" };
  if (!MARCAS_FORM[v.marca] || !TEMAS[v.apariencia?.tema] || !ACCIONES[v.accion]) return { ok: false, error: "Datos inválidos" };
  const problema = problemaConfig(v.config);
  if (problema) return { ok: false, error: problema };
  // La acción de onboarding necesita estas preguntas (con estos ids) para armar la ficha.
  if (v.accion === "pulse-onboarding-lu") {
    const ids = new Set(v.config.preguntas.map((p) => p.id));
    const faltan = ["nombre", "telefono", "email", "negocio"].filter((x) => !ids.has(x));
    if (faltan.length) return { ok: false, error: `Para crear la ficha en Pulse faltan las preguntas con id: ${faltan.join(", ")}` };
  }
  const r = await guardarFormulario(id, v);
  if (!r.ok) return r;
  revalidatePath("/pulse/formularios");
  revalidatePath(`/pulse/formularios/${id}`);
  revalidatePath(`/f/${r.slug}`);
  if (r.slug === "onboarding-level-up") revalidatePath("/onboarding/level-up");
  return { ok: true, slug: r.slug };
}

export async function archivarFormularioAction(id: string): Promise<Res> {
  if (!(await editor())) return { ok: false, error: "Sin permiso" };
  const f = await formularioPorId(id);
  if (!f) return { ok: false, error: "No existe" };
  if (f.slug === "onboarding-level-up") return { ok: false, error: "El onboarding de Level Up no se archiva: es el link que mandan los closers. Puedes cerrarlo (desactivar)." };
  await archivarFormulario(id);
  revalidatePath("/pulse/formularios");
  return { ok: true };
}

export async function borrarRespuestaAction(formId: string, respuestaId: string): Promise<Res> {
  const u = await editor();
  if (!u || u.rol !== "admin") return { ok: false, error: "Solo un admin borra respuestas" };
  await borrarRespuesta(respuestaId);
  revalidatePath(`/pulse/formularios/${formId}/respuestas`);
  return { ok: true };
}
