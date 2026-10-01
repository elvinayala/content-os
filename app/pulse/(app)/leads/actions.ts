"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/pulse/db";
import { usuarioVerificado as usuarioActual } from "@/lib/pulse/auth";
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

/** ⌘K de Pulse: leads de las marcas a las que la persona tiene acceso (solo los suyos si su alcance es "mios"). */
export async function buscarLeadsGlobalAction(q: string): Promise<{ id: string; nombre: string; telefono: string | null; embudo: string; etapa: string | null; estado: string; marca: string; slug: string }[]> {
  const u = await usuarioActual();
  if (!u || q.trim().length < 2) return [];
  const { buscarEnMarca, marcasConAcceso } = await import("@/lib/leads/repo");
  const marcas = await marcasConAcceso(u).catch(() => []);
  const por = await Promise.all(
    marcas.map(async (m) => {
      const a = await accesoLeads(u, m);
      if (!a.puede) return [];
      const filas = await buscarEnMarca(m, q.slice(0, 100), null, 8, a.alcance === "mios" ? u.id : null).catch(() => []);
      return filas.map((f) => ({ ...f, marca: m === "level_up" ? "Level Up" : "AI Borinquen", slug: slugDeMarca(m) }));
    }),
  );
  return por.flat();
}

/** Buscador de la ficha: solo los leads del mismo embudo (respeta "solo mis leads"). */
export async function buscarEnEmbudoAction(embudoId: string, q: string): Promise<{ id: string; nombre: string; telefono: string | null; etapa: string | null; estado: string }[]> {
  if (q.trim().length < 2) return [];
  const d = await db();
  const [e] = await d.select({ marca: leadsEmbudos.marca }).from(leadsEmbudos).where(eq(leadsEmbudos.id, embudoId)).limit(1);
  if (!e) return [];
  const p = await puedeMarca(e.marca as Marca);
  if (!p) return [];
  const { buscarEnMarca } = await import("@/lib/leads/repo");
  const filas = await buscarEnMarca(e.marca as Marca, q.slice(0, 100), null, 10, p.alcance === "mios" ? p.u.id : null, embudoId);
  return filas.map((f) => ({ id: f.id, nombre: f.nombre, telefono: f.telefono, etapa: f.etapa, estado: f.estado }));
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

// Elvin (1/oct): "que reconozca cuáles son los números de nosotros". La dirección y el director de ventas.
export async function marcarDelEquipoAction(tratoId: string): Promise<Res> {
  const p = await puedeTrato(tratoId);
  if (!p) return { ok: false, error: "Sin acceso" };
  const { manejaEquipo } = await import("@/lib/leads/equipo-datos");
  if (p.u.rol !== "admin" && p.u.rol !== "editor" && !(await manejaEquipo(p.u, p.t.marca as Marca))) return { ok: false, error: "Solo la dirección o el director de ventas" };
  const { marcarDelEquipo } = await import("@/lib/leads/repo");
  const r = await marcarDelEquipo(tratoId, p.u.id);
  refrescar(p.t.marca);
  return r;
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

export async function guardarEmbudoAction(embudoId: string, datos: { nombre: string; diasEstancado: number; etapas: { id?: string; nombre: string }[]; reparto?: { modo: "ninguno" | "fijo" | "rotacion"; personas: string[] } }): Promise<Res> {
  const d = await db();
  const [e] = await d.select().from(leadsEmbudos).where(eq(leadsEmbudos.id, embudoId)).limit(1);
  if (!e) return { ok: false, error: "No existe" };
  const p = await puedeMarca(e.marca as Marca);
  if (!p || (p.u.rol !== "admin" && p.u.rol !== "editor")) return { ok: false, error: "Solo admin/editor edita embudos" };
  const r = await guardarEmbudo(embudoId, datos);
  refrescar(e.marca);
  return r;
}

// El director de ventas (Nahuel) también reparte: solo toca el reparto, no el nombre ni las etapas.
export async function guardarRepartoAction(embudoId: string, reparto: { modo: "ninguno" | "fijo" | "rotacion"; personas: string[] }): Promise<Res> {
  const d = await db();
  const [e] = await d.select().from(leadsEmbudos).where(eq(leadsEmbudos.id, embudoId)).limit(1);
  if (!e) return { ok: false, error: "No existe" };
  const p = await puedeMarca(e.marca as Marca);
  if (!p) return { ok: false, error: "Sin acceso a esta marca" };
  const { manejaEquipo } = await import("@/lib/leads/equipo-datos");
  if (p.u.rol !== "admin" && p.u.rol !== "editor" && !(await manejaEquipo(p.u, e.marca as Marca))) return { ok: false, error: "Solo la dirección y el director de ventas reparten leads" };
  const { guardarReparto } = await import("@/lib/leads/repo");
  const r = await guardarReparto(embudoId, reparto);
  refrescar(e.marca);
  return r;
}

// ---------- Exportar con aprobación (28/sep): Nahuel y Aure piden, Elvin aprueba ----------

export async function pedirExportacionAction(p: { marca: Marca; embudoId: string | null; estado: string; dueno: string | null; q: string }): Promise<Res> {
  const acc = await puedeMarca(p.marca);
  if (!acc) return { ok: false, error: "Sin acceso a esta marca" };
  const { modoExportar } = await import("@/lib/leads/exportar");
  if (modoExportar(acc.u, process.env.LEADS_EXPORTAR ?? undefined) !== "con_ok") return { ok: false, error: "No tienes permiso para exportar" };
  const { listarEmbudos, usuariosActivos } = await import("@/lib/leads/repo");
  const [embudos, usuarios] = await Promise.all([listarEmbudos(p.marca), usuariosActivos()]);
  const embudo = p.embudoId ? embudos.find((e) => e.id === p.embudoId) : null;
  const dueno = acc.alcance === "mios" ? acc.u.id : p.dueno === "__sin" ? "__sin" : usuarios.some((x) => x.id === p.dueno) ? p.dueno : null;
  const estado = ["abierto", "ganado", "perdido", "todos"].includes(p.estado) ? p.estado : "todos";
  const { pedirExportacion } = await import("@/lib/leads/exportaciones");
  const id = await pedirExportacion(acc.u, p.marca, {
    embudoId: embudo?.id ?? null,
    embudoNombre: embudo?.nombre ?? null,
    estado,
    dueno,
    duenoNombre: dueno === "__sin" ? "sin dueño" : dueno ? (usuarios.find((x) => x.id === dueno)?.nombre ?? null) : null,
    q: p.q.trim().slice(0, 80),
  });
  revalidatePath("/pulse/leads/exportaciones");
  return { ok: true, id };
}

export async function decidirExportacionAction(p: { id: string; aprobar: boolean; nota?: string }): Promise<Res> {
  const u = await usuarioActual();
  if (!u || u.rol !== "admin") return { ok: false, error: "Solo Elvin aprueba exportaciones" };
  const { decidirExportacion } = await import("@/lib/leads/exportaciones");
  try {
    await decidirExportacion(p.id, p.aprobar, u, p.nota);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
  revalidatePath("/pulse/leads/exportaciones");
  return { ok: true };
}

// ---------- Equipo de ventas: quién entra a Leads (28/sep; lo maneja Nahuel en Level Up) ----------

export async function accesoEquipoLeadsAction(p: { marca: Marca; userId: string; alcance: "todos" | "mios" | null }): Promise<Res> {
  const u = await usuarioActual();
  if (!u) return { ok: false, error: "Tu sesión venció" };
  const { manejaEquipo, darAccesoLeads, quitarAccesoLeads } = await import("@/lib/leads/equipo-datos");
  if (!(await manejaEquipo(u, p.marca))) return { ok: false, error: "Solo el director de ventas, las editoras o Elvin manejan el equipo" };
  const { leerUsuario } = await import("@/lib/pulse/repo");
  const objetivo = await leerUsuario(p.userId);
  const { estaBloqueado } = await import("@/lib/desempeno/acceso");
  const { esSoloRitmo } = await import("@/lib/pulse/auth");
  const nombre = objetivo?.nombre ?? "esa persona";
  const { MARCAS, slugDeMarca: slug } = await import("@/lib/leads/reglas");
  const marcaNombre = MARCAS[slug(p.marca)]?.nombre ?? p.marca;
  if (p.alcance === null) {
    if (p.userId === u.id) return { ok: false, error: "No te puedes quitar el acceso a ti mismo" };
    await quitarAccesoLeads(p.userId, p.marca);
  } else {
    const { errorDarAcceso } = await import("@/lib/leads/equipo");
    const error = errorDarAcceso({
      yoId: u.id,
      objetivo: objetivo ? { id: objetivo.id, rol: objetivo.rol, activo: objetivo.activo, soloRitmo: await esSoloRitmo(objetivo.id), bloqueado: estaBloqueado(objetivo.email), sistema: objetivo.email.endsWith("@pulse.sistema") } : null,
      alcance: p.alcance,
    });
    if (error) return { ok: false, error };
    await darAccesoLeads(p.userId, p.marca, p.alcance);
  }
  const detalle = p.alcance === null ? `${u.nombre} le quitó Leads de ${marcaNombre} a ${nombre}` : `${u.nombre} le dio Leads de ${marcaNombre} a ${nombre} (${p.alcance === "mios" ? "solo sus leads" : "todos los leads"})`;
  const { registrarEvento } = await import("@/lib/pulse/seguridad");
  await registrarEvento({ tipo: "acceso_leads", email: u.email, actorId: u.id, userId: p.userId, detalle }).catch(() => {});
  if (u.rol !== "admin") {
    const { notificarCEO } = await import("@/lib/notificar-ceo");
    await notificarCEO(`👥 ${detalle}.`).catch(() => null);
  }
  revalidatePath(`/pulse/leads/${slugDeMarca(p.marca)}/equipo`);
  return { ok: true };
}
