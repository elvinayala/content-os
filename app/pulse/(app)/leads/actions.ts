"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/pulse/db";
import { usuarioActual } from "@/lib/pulse/auth";
import {
  accesoLeads,
  actualizarTrato,
  agregarNota,
  cerrarTrato,
  completarActividad,
  crearActividad,
  crearEmbudo,
  crearTrato,
  eliminarTrato,
  guardarEmbudo,
  marcarLeido,
  moverTrato,
  registrarSaliente,
} from "@/lib/leads/repo";
import { slugDeMarca, type Marca } from "@/lib/leads/reglas";
import { leadsActividades, leadsEmbudos, leadsTratos } from "@/lib/leads/schema";
import { enviarWhatsapp } from "@/lib/leads/timelines";
import { eq } from "drizzle-orm";

type Res = { ok: boolean; error?: string; id?: string };

async function puedeMarca(marca: Marca) {
  const u = await usuarioActual();
  if (!u) return null;
  const a = await accesoLeads(u, marca);
  return a.puede ? { u, alcance: a.alcance } : null;
}

/** Carga el trato y verifica permiso (marca + "solo mis leads"). */
async function puedeTrato(tratoId: string) {
  const d = await db();
  const [t] = await d.select().from(leadsTratos).where(eq(leadsTratos.id, tratoId)).limit(1);
  if (!t) return null;
  const p = await puedeMarca(t.marca as Marca);
  if (!p) return null;
  if (p.alcance === "mios" && t.duenoId !== p.u.id) return null;
  return { ...p, t };
}

const refrescar = (marca: string, id?: string) => {
  const slug = slugDeMarca(marca as Marca);
  revalidatePath(`/pulse/leads/${slug}`);
  if (id) revalidatePath(`/pulse/leads/${slug}/${id}`);
};

export async function crearLeadAction(v: { marca: Marca; embudoId: string; etapaId?: string; nombre: string; negocio?: string; telefono?: string; email?: string; valor?: number; duenoId?: string | null }): Promise<Res> {
  const p = await puedeMarca(v.marca);
  if (!p) return { ok: false, error: "Sin acceso" };
  if (!v.nombre?.trim()) return { ok: false, error: "Ponle un nombre al lead" };
  const d = await db();
  const [emb] = await d.select().from(leadsEmbudos).where(eq(leadsEmbudos.id, v.embudoId)).limit(1);
  if (!emb || emb.marca !== v.marca) return { ok: false, error: "Embudo inválido" };
  const t = await crearTrato({ ...v, duenoId: p.alcance === "mios" ? p.u.id : (v.duenoId ?? p.u.id), origen: "manual", autorId: p.u.id });
  refrescar(v.marca);
  if (t.yaExistia) return { ok: false, id: t.id, error: `${t.nombre} ya existe con ese teléfono (abierto).` };
  return { ok: true, id: t.id };
}

export async function moverLeadAction(tratoId: string, etapaId: string, antesId: string | null, despuesId: string | null): Promise<Res> {
  const p = await puedeTrato(tratoId);
  if (!p) return { ok: false, error: "Sin acceso" };
  await moverTrato(tratoId, etapaId, antesId, despuesId, p.u.id);
  refrescar(p.t.marca, tratoId);
  return { ok: true };
}

export async function cerrarLeadAction(tratoId: string, estado: "ganado" | "perdido" | "abierto", motivo?: string | null): Promise<Res> {
  const p = await puedeTrato(tratoId);
  if (!p) return { ok: false, error: "Sin acceso" };
  if (estado === "perdido" && !motivo?.trim()) return { ok: false, error: "Escoge el motivo" };
  const r = await cerrarTrato(tratoId, estado, motivo?.trim() || null, p.u.id);
  refrescar(p.t.marca, tratoId);
  return r;
}

export async function actualizarLeadAction(tratoId: string, cambios: { nombre?: string; negocio?: string | null; telefono?: string | null; email?: string | null; valor?: number; duenoId?: string | null }): Promise<Res> {
  const p = await puedeTrato(tratoId);
  if (!p) return { ok: false, error: "Sin acceso" };
  if (p.alcance === "mios" && cambios.duenoId !== undefined && cambios.duenoId !== p.u.id) return { ok: false, error: "Solo puedes tener tus propios leads" };
  const r = await actualizarTrato(tratoId, cambios, p.u.id);
  refrescar(p.t.marca, tratoId);
  return r;
}

export async function eliminarLeadAction(tratoId: string): Promise<Res> {
  const p = await puedeTrato(tratoId);
  if (!p) return { ok: false, error: "Sin acceso" };
  if (p.u.rol !== "admin" && p.u.rol !== "editor") return { ok: false, error: "Solo un admin puede borrar leads" };
  await eliminarTrato(tratoId);
  refrescar(p.t.marca);
  return { ok: true };
}

export async function notaAction(tratoId: string, texto: string): Promise<Res> {
  const p = await puedeTrato(tratoId);
  if (!p) return { ok: false, error: "Sin acceso" };
  if (!texto.trim()) return { ok: false, error: "Nota vacía" };
  await agregarNota(tratoId, texto.trim(), p.u.id);
  refrescar(p.t.marca, tratoId);
  return { ok: true };
}

export async function actividadAction(tratoId: string, v: { tipo: string; asunto: string; venceAt: string; asignadoId?: string | null }): Promise<Res> {
  const p = await puedeTrato(tratoId);
  if (!p) return { ok: false, error: "Sin acceso" };
  const fecha = new Date(v.venceAt);
  if (Number.isNaN(fecha.getTime())) return { ok: false, error: "Fecha inválida" };
  await crearActividad(tratoId, { tipo: v.tipo, asunto: v.asunto, venceAt: fecha, asignadoId: v.asignadoId || p.u.id }, p.u.id);
  refrescar(p.t.marca, tratoId);
  return { ok: true };
}

export async function completarActividadAction(actividadId: string, hecha: boolean): Promise<Res> {
  const d = await db();
  const [a] = await d.select().from(leadsActividades).where(eq(leadsActividades.id, actividadId)).limit(1);
  if (!a) return { ok: false, error: "No existe" };
  const p = await puedeTrato(a.tratoId);
  if (!p) return { ok: false, error: "Sin acceso" };
  await completarActividad(actividadId, hecha);
  refrescar(p.t.marca, a.tratoId);
  revalidatePath(`/pulse/leads/${slugDeMarca(p.t.marca as Marca)}/actividades`);
  return { ok: true };
}

export async function whatsappAction(tratoId: string, texto: string): Promise<Res> {
  const p = await puedeTrato(tratoId);
  if (!p) return { ok: false, error: "Sin acceso" };
  if (!p.t.telefono && !p.t.chatId) return { ok: false, error: "Este lead no tiene teléfono" };
  const r = await enviarWhatsapp(p.t.marca as Marca, { chatId: p.t.chatId, telefono: p.t.telefono, cuenta: p.t.cuentaWhatsapp, texto });
  if (!r.ok) return { ok: false, error: r.error ?? "No se pudo enviar" };
  await registrarSaliente(tratoId, texto.trim(), p.u.id, r.mensajeId);
  refrescar(p.t.marca, tratoId);
  return { ok: true };
}

export async function marcarLeidoAction(tratoId: string): Promise<Res> {
  const p = await puedeTrato(tratoId);
  if (!p) return { ok: false };
  await marcarLeido(tratoId);
  return { ok: true };
}

export async function crearEmbudoAction(marca: Marca, nombre: string, etapas: string[]): Promise<Res> {
  const p = await puedeMarca(marca);
  if (!p || (p.u.rol !== "admin" && p.u.rol !== "editor")) return { ok: false, error: "Solo admin/editor crea embudos" };
  if (!nombre.trim()) return { ok: false, error: "Ponle nombre" };
  const e = await crearEmbudo(marca, nombre.trim(), etapas.map((x) => x.trim()).filter(Boolean));
  refrescar(marca);
  return { ok: true, id: e.id };
}

export async function guardarEmbudoAction(embudoId: string, datos: { nombre: string; diasEstancado: number; etapas: { id?: string; nombre: string }[] }): Promise<Res> {
  const d = await db();
  const [e] = await d.select().from(leadsEmbudos).where(eq(leadsEmbudos.id, embudoId)).limit(1);
  if (!e) return { ok: false, error: "No existe" };
  const p = await puedeMarca(e.marca as Marca);
  if (!p || (p.u.rol !== "admin" && p.u.rol !== "editor")) return { ok: false, error: "Solo admin/editor edita embudos" };
  const r = await guardarEmbudo(embudoId, datos);
  refrescar(e.marca);
  return r;
}
