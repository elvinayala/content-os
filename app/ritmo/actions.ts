"use server";

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { linkDeAcceso } from "@/lib/desempeno/acceso";
import * as datos from "@/lib/desempeno/datos";
import * as etica from "@/lib/desempeno/etica";
import * as fichas from "@/lib/desempeno/fichas";
import { puedeAprobar, PUESTOS, puestoPorId } from "@/lib/desempeno/reglas";
import { requiereMaestro, usuarioRitmo } from "@/lib/desempeno/sesion";
import { requiereUsuario } from "@/lib/pulse/auth";
import { COOKIE_PULSE } from "@/lib/pulse/session";

type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function envolver<T extends object>(fn: () => Promise<T>): Promise<R<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    const m = e instanceof Error ? e.message : "Error";
    return { ok: false, error: m === "no-autorizado" ? "Tu sesión venció: vuelve a entrar" : m === "solo-admin" ? "Solo admin o editoras" : m };
  }
}

async function contexto() {
  const h = await headers();
  return { ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip"), ua: h.get("user-agent") };
}

// ─── Ponche (cada quien el suyo) ──────────────────────────────────────────────────────────────

export async function entrarAction() {
  return envolver(async () => {
    const u = await requiereUsuario();
    if (!(await datos.perfilDe(u.id))?.activo) throw new Error("No tienes perfil de ponche: pídeselo a Carilin");
    const p = await datos.entrar(u.id, await contexto());
    refresh();
    return { entradaAt: p.entradaAt.toISOString() };
  });
}

export async function salirAction(r: { bloqueos: string; datos: Record<string, number> }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    const perfil = await datos.perfilDe(u.id);
    const permitidos = new Set((puestoPorId(perfil?.puesto ?? "")?.manual ?? []).map((m) => m.id));
    const limpios: Record<string, number> = {};
    for (const [k, v] of Object.entries(r.datos ?? {})) if (permitidos.has(k) && Number.isFinite(v) && v >= 0 && v <= 50) limpios[k] = Math.round(v);
    await datos.salir(u.id, await contexto(), { bloqueos: r.bloqueos?.trim().slice(0, 1000) || null, datos: limpios });
    refresh();
    return {};
  });
}

/** Salida olvidada: `hora` = "HH:MM" en hora PR del día del ponche (si queda antes de la entrada, es el día siguiente). */
export async function corregirSalidaAction(p: { poncheId: string; hora: string; nota: string }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    if (!/^\d{2}:\d{2}$/.test(p.hora)) throw new Error("Hora inválida");
    const ponche = await datos.leerPonche(p.poncheId);
    if (!ponche) throw new Error("No existe");
    let salida = new Date(`${ponche.fecha}T${p.hora}:00-04:00`);
    if (salida <= ponche.entradaAt) salida = new Date(salida.getTime() + 86_400_000);
    await datos.corregirSalida(p.poncheId, salida, u.id, p.nota?.trim().slice(0, 300) || null);
    refresh();
    return {};
  });
}

export async function decidirCorreccionAction(p: { poncheId: string; aprobar: boolean }) {
  return envolver(async () => {
    const u = datos.actorRitmo(await requiereUsuario());
    const ponche = await datos.leerPonche(p.poncheId);
    if (!ponche || ponche.correccion !== "pendiente") throw new Error("Ya no está pendiente");
    const perfil = await datos.perfilDe(ponche.userId);
    if (!perfil || !puedeAprobar(u, perfil)) throw new Error("Solo su líder, Carilin o admin");
    await datos.decidirCorreccion(p.poncheId, p.aprobar, u.id);
    refresh();
    return {};
  });
}

// ─── Configuración (admin / editoras) ─────────────────────────────────────────────────────────

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function guardarPerfilAction(p: {
  userId: string;
  puesto: string;
  liderId: string | null;
  horaEntrada: string;
  horaSalida: string;
  diasLaborables: number[];
  tipoContrato: string;
  fechaIngreso: string | null;
  activo: boolean;
}) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (!PUESTOS.some((x) => x.id === p.puesto)) throw new Error("Puesto inválido");
    if (!HORA.test(p.horaEntrada) || !HORA.test(p.horaSalida) || p.horaSalida <= p.horaEntrada) throw new Error("Horario inválido");
    if (!["contratista", "nomina", "eor"].includes(p.tipoContrato)) throw new Error("Contrato inválido");
    if (p.fechaIngreso && !/^\d{4}-\d{2}-\d{2}$/.test(p.fechaIngreso)) throw new Error("Fecha de ingreso inválida");
    if (p.liderId === p.userId) throw new Error("Nadie es su propio líder");
    const dias = [...new Set(p.diasLaborables.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    if (!dias.length) throw new Error("Escoge al menos un día");
    await datos.guardarPerfil({ ...p, diasLaborables: dias, fechaIngreso: p.fechaIngreso || null }, u.id);
    refresh();
    return {};
  });
}

export async function guardarMetaAction(m: { puesto: string; kpi: string; meta: number; peso: number }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    const kpi = puestoPorId(m.puesto)?.kpis.find((k) => k.id === m.kpi);
    if (!kpi) throw new Error("KPI inválido");
    if (!Number.isFinite(m.meta) || m.meta < 0 || !Number.isInteger(m.peso) || m.peso < 0 || m.peso > 10) throw new Error("Meta o peso inválido");
    await datos.guardarMeta(m, u.id);
    refresh();
    return {};
  });
}

export async function crearProduccionAction() {
  return envolver(async () => {
    await requiereMaestro();
    const r = await datos.crearTableroProduccion();
    refresh();
    return r;
  });
}

export async function salirDeRitmoAction() {
  const jar = await cookies();
  jar.delete(COOKIE_PULSE);
  redirect("/ritmo/entrar");
}

/** Link de un solo uso (72 h) para que la persona cree su clave. Lo manda quien lo genera. */
export async function linkAccesoAction(userId: string) {
  return envolver(async () => {
    const u = await requiereMaestro();
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    const r = await linkDeAcceso(userId, `${proto}://${host}`);
    await datos.evento({ userId, actorId: u.id, tipo: "link_acceso" });
    return r;
  });
}

// ─── Ficha del empleado (RR.HH.) ──────────────────────────────────────────────────────────────

const puedeFicha = (u: { id: string; maestro: boolean }, userId: string) => u.maestro || u.id === userId;

export async function crearFichaAction(userId: string) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (await fichas.leerFicha(userId)) return {};
    await fichas.guardarFicha({ userId, telefono: null, telefonoAlterno: null, ciudad: null, pais: null, documentoTipo: null, documentoNumero: null, salarioMensual: null, notas: null }, u.id);
    refresh();
    return {};
  });
}

export async function guardarFichaAction(p: {
  userId: string;
  telefono: string;
  telefonoAlterno: string;
  ciudad: string;
  pais: string;
  documentoTipo: string;
  documentoNumero: string;
  salarioMensual: string;
  notas: string;
}) {
  return envolver(async () => {
    const u = await requiereMaestro();
    const t = (x: string, n = 120) => x?.trim().slice(0, n) || null;
    const salario = p.salarioMensual?.trim() ? Number(p.salarioMensual) : null;
    if (salario !== null && (!Number.isFinite(salario) || salario < 0 || salario > 100000)) throw new Error("Salario inválido");
    await fichas.guardarFicha(
      { userId: p.userId, telefono: t(p.telefono, 40), telefonoAlterno: t(p.telefonoAlterno, 40), ciudad: t(p.ciudad), pais: t(p.pais), documentoTipo: t(p.documentoTipo, 40), documentoNumero: t(p.documentoNumero, 60), salarioMensual: salario, notas: t(p.notas, 2000) },
      u.id,
    );
    refresh();
    return {};
  });
}

export async function prepararSubidaAction(p: { userId: string; nombre: string; bytes: number; categoria: string }) {
  return envolver(async () => {
    const u = await usuarioRitmo();
    if (!u) throw new Error("no-autorizado");
    if (!puedeFicha(u, p.userId)) throw new Error("Solo tu propia ficha");
    if (!u.maestro && p.categoria === "nomina") throw new Error("Nómina la sube RR.HH.");
    if (![...fichas.CATEGORIAS.map((c) => c.id), "foto"].includes(p.categoria as never)) throw new Error("Categoría inválida");
    if (!(await fichas.leerFicha(p.userId))) throw new Error("Esta persona no tiene ficha");
    if (p.bytes > fichas.MAX_BYTES) throw new Error("Máximo 500 MB por archivo");
    return fichas.prepararSubida(p.userId, p.nombre);
  });
}

/** Solo en local (sin Supabase): sube el archivo por el servidor. */
export async function subirLocalAction(fd: FormData) {
  return envolver(async () => {
    const u = await usuarioRitmo();
    const userId = String(fd.get("userId"));
    const path = String(fd.get("path"));
    const file = fd.get("file");
    if (!u || !puedeFicha(u, userId) || !(file instanceof File) || !path.startsWith(`ritmo/${userId}/`)) throw new Error("No autorizado");
    await fichas.subirLocal(path, new Uint8Array(await file.arrayBuffer()), file.type || null);
    return {};
  });
}

export async function confirmarSubidaAction(p: { id: string; userId: string; path: string; nombre: string; mime: string; bytes: number; categoria: string }) {
  return envolver(async () => {
    const u = await usuarioRitmo();
    if (!u || !puedeFicha(u, p.userId)) throw new Error("No autorizado");
    if (!u.maestro && p.categoria === "nomina") throw new Error("Nómina la sube RR.HH.");
    await fichas.registrarArchivo({ id: p.id, userId: p.userId, categoria: p.categoria as fichas.Categoria, nombre: p.nombre, path: p.path, mime: p.mime || null, bytes: p.bytes }, u.id);
    refresh();
    return {};
  });
}

export async function borrarArchivoAction(id: string) {
  return envolver(async () => {
    const u = await requiereMaestro();
    await fichas.borrarArchivoFicha(id, u.id);
    refresh();
    return {};
  });
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function crearAusenciaAction(p: { userId: string; tipo: string; desde: string; hasta: string; dias: number; certificado: boolean; nota: string }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (!["vacaciones", "enfermedad", "maternidad", "personal"].includes(p.tipo)) throw new Error("Tipo inválido");
    if (!FECHA.test(p.desde) || !FECHA.test(p.hasta) || p.hasta < p.desde) throw new Error("Fechas inválidas");
    if (!Number.isFinite(p.dias) || p.dias <= 0 || p.dias > 120) throw new Error("Días inválidos");
    await fichas.crearAusencia({ userId: p.userId, tipo: p.tipo, desde: p.desde, hasta: p.hasta, dias: Math.round(p.dias * 2) / 2, certificado: p.tipo === "enfermedad" && p.certificado, nota: p.nota?.trim().slice(0, 300) || null }, u.id);
    refresh();
    return {};
  });
}

export async function borrarAusenciaAction(id: string) {
  return envolver(async () => {
    const u = await requiereMaestro();
    await fichas.borrarAusencia(id, u.id);
    refresh();
    return {};
  });
}

export async function crearAjusteAction(p: { userId: string; mes: string; concepto: string; monto: number }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (!/^\d{4}-\d{2}$/.test(p.mes) || !p.concepto?.trim() || !Number.isFinite(p.monto) || Math.abs(p.monto) > 100000) throw new Error("Ajuste inválido");
    await fichas.crearAjuste({ userId: p.userId, mes: p.mes, concepto: p.concepto.trim().slice(0, 120), monto: Math.round(p.monto * 100) / 100 }, u.id);
    refresh();
    return {};
  });
}

export async function borrarAjusteAction(id: string) {
  return envolver(async () => {
    const u = await requiereMaestro();
    await fichas.borrarAjuste(id, u.id);
    refresh();
    return {};
  });
}

// ─── Canal ético ──────────────────────────────────────────────────────────────────────────────

export async function reporteEticoAction(p: { categoria: string; descripcion: string; involucrados: string; anonimo: boolean }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    const ip = (await contexto()).ip;
    const { limiteIp } = await import("@/lib/pulse/seguridad");
    if (!limiteIp(`etica:${ip ?? u.id}`, 5, 3_600_000)) throw new Error("Demasiados reportes seguidos; intenta más tarde");
    if (!etica.CATEGORIAS_ETICA.some((c) => c.id === p.categoria)) throw new Error("Escoge una categoría");
    const descripcion = p.descripcion?.trim().slice(0, 5000);
    if (!descripcion || descripcion.length < 20) throw new Error("Cuéntanos un poco más (mínimo 20 caracteres)");
    await etica.crearReporteEtico({ userId: p.anonimo ? null : u.id, categoria: p.categoria, descripcion, involucrados: p.involucrados?.trim().slice(0, 300) || null });
    return {};
  });
}

export async function actualizarEticoAction(p: { id: string; estado: string; notaInterna: string }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    if (u.rol !== "admin") throw new Error("Solo Elvin");
    if (!["nuevo", "revisando", "cerrado"].includes(p.estado)) throw new Error("Estado inválido");
    await etica.actualizarReporteEtico(p.id, { estado: p.estado, notaInterna: p.notaInterna?.trim().slice(0, 2000) || null });
    refresh();
    return {};
  });
}
