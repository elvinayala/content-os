"use server";

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { linkDeAcceso } from "@/lib/desempeno/acceso";
import * as calendario from "@/lib/desempeno/calendario";
import * as carreras from "@/lib/desempeno/carreras";
import { ESTADOS_VACANTE, MODALIDADES } from "@/lib/desempeno/carreras-reglas";
import * as datos from "@/lib/desempeno/datos";
import * as dosPasos from "@/lib/desempeno/dos-pasos";
import * as empresa from "@/lib/desempeno/empresa";
import * as etica from "@/lib/desempeno/etica";
import * as seguridad from "@/lib/desempeno/seguridad";
import { errorAlmuerzo } from "@/lib/desempeno/seguridad-reglas";
import { altaEmpleado } from "@/lib/desempeno/alta";
import { decidirCambio, proponerCambio } from "@/lib/desempeno/cambios";
import { diferencias, necesitaAprobacion, SENSIBLES_FICHA, SENSIBLES_PERFIL, separar } from "@/lib/desempeno/cambios-reglas";
import { buscarSlackPorNombre } from "@/lib/desempeno/avisar";
import * as bienestar from "@/lib/desempeno/bienestar";
import { ACTIVIDADES, duracionRutina, rutinaDelDia } from "@/lib/desempeno/bienestar-reglas";
import * as fichas from "@/lib/desempeno/fichas";
import * as noticias from "@/lib/desempeno/noticias";
import { CATEGORIAS_NOTICIA } from "@/lib/desempeno/noticias-tipos";
import { puedeDecidir, TIPOS_SOLICITUD } from "@/lib/desempeno/rrhh";
import * as solicitudes from "@/lib/desempeno/solicitudes";
import * as viajes from "@/lib/desempeno/viajes";
import { errorPlan } from "@/lib/desempeno/viajes-reglas";
import { EMPRESAS, puedeAprobar, PUESTOS, puestoPorId } from "@/lib/desempeno/reglas";
import { requiereMaestro, usuarioRitmo } from "@/lib/desempeno/sesion";
import { requiereCuenta as requiereUsuario } from "@/lib/pulse/auth";
import { esPuestoVentas } from "@/lib/ventas/reglas";
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

export async function entrarAction(huella?: string | null) {
  return envolver(async () => {
    const u = await requiereUsuario();
    // La dirección (admin/editoras) puede ponchar sin perfil: es opcional y no cuenta en ningún reporte.
    const direccion = u.rol === "admin" || u.rol === "editor";
    if (!direccion && !(await datos.perfilDe(u.id))?.activo) throw new Error("No tienes perfil de ponche: pídeselo a Carilin");
    const { equipoId } = await seguridad.verificarParaPonchar(u, huella);
    const p = await datos.entrar(u.id, { ...(await contexto()), equipoId });
    refresh();
    return { entradaAt: p.entradaAt.toISOString() };
  });
}

export async function salirAction(r: { bloqueos: string; datos: Record<string, number>; huella?: string | null }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    await seguridad.verificarParaPonchar(u, r.huella);
    const perfil = await datos.perfilDe(u.id);
    const permitidos = new Set((puestoPorId(perfil?.puesto ?? "")?.manual ?? []).map((m) => m.id));
    const limpios: Record<string, number> = {};
    for (const [k, v] of Object.entries(r.datos ?? {})) if (permitidos.has(k) && Number.isFinite(v) && v >= 0 && v <= 50) limpios[k] = Math.round(v);
    await datos.salir(u.id, await contexto(), { bloqueos: r.bloqueos?.trim().slice(0, 1000) || null, datos: limpios });
    refresh();
    return {};
  });
}

/** Salir a almorzar (1 hora, entre las 11:00 AM y las 2:00 PM PR). Volver = entrarAction. */
export async function almuerzoAction(huella?: string | null) {
  return envolver(async () => {
    const u = await requiereUsuario();
    await seguridad.verificarParaPonchar(u, huella);
    const est = await datos.estadoPonche(u.id, true);
    const err = errorAlmuerzo({ ahora: new Date(), yaAlmorzo: !!est?.almuerzo, trabajando: !!est?.abiertoHoy });
    if (err) throw new Error(err);
    await datos.salirAlmuerzo(u.id, await contexto());
    refresh();
    return {};
  });
}

// ─── Seguridad del ponche: equipos registrados y ponche manual (lo autoriza RR.HH.) ───────────

export async function registrarEquipoAction(p: { nombre: string; huella: string | null; motivo?: string; reemplaza?: boolean }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    const { limiteIp } = await import("@/lib/pulse/seguridad");
    if (!limiteIp(`equipo:${u.id}`, 5, 3_600_000)) throw new Error("Demasiados intentos; espera un rato");
    const e = await seguridad.registrarEquipo(u.id, p);
    refresh();
    return { estado: e.estado };
  });
}

export async function poncheManualAction(p: { tipo: string; fecha: string; hora: string; motivo: string }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.fecha) || !/^\d{2}:\d{2}$/.test(p.hora)) throw new Error("Fecha u hora inválida");
    const { limiteIp } = await import("@/lib/pulse/seguridad");
    if (!limiteIp(`manual:${u.id}`, 6, 3_600_000)) throw new Error("Demasiadas solicitudes seguidas");
    await seguridad.pedirPoncheManual(u.id, { tipo: p.tipo, hora: new Date(`${p.fecha}T${p.hora}:00-04:00`), motivo: p.motivo ?? "" });
    refresh();
    return {};
  });
}

export async function decidirPoncheManualAction(p: { id: string; aprobar: boolean }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    await seguridad.decidirPoncheManual(p.id, p.aprobar, u.id);
    refresh();
    return {};
  });
}

export async function decidirEquipoAction(p: { id: string; aprobar: boolean }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    await seguridad.decidirEquipo(p.id, p.aprobar, u.id);
    refresh();
    return {};
  });
}

export async function decidirRedAction(p: { id: string; aprobar: boolean }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    await seguridad.decidirRed(p.id, p.aprobar, u.id);
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
    const u = await usuarioRitmo();
    if (!u) throw new Error("no-autorizado");
    const ponche = await datos.leerPonche(p.poncheId);
    if (!ponche || ponche.correccion !== "pendiente") throw new Error("Ya no está pendiente");
    const perfil = await datos.perfilDe(ponche.userId);
    if (!perfil || !u.maestro || !puedeAprobar(u, perfil)) throw new Error("Solo la vista maestra (con la verificación en dos pasos)");
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
  empresa: string;
  tambienEn?: string | null;
  slackId?: string | null;
  soloRitmo?: boolean;
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
    if (!EMPRESAS.some((x) => x.id === p.empresa)) throw new Error("Empresa inválida");
    // Solo ventas vende en las dos empresas (Laura); a los demás se les limpia.
    const tambienEn = esPuestoVentas(p.puesto) && p.tambienEn && p.tambienEn !== p.empresa && EMPRESAS.some((x) => x.id === p.tambienEn) ? p.tambienEn : null;
    if (!HORA.test(p.horaEntrada) || !HORA.test(p.horaSalida) || p.horaSalida <= p.horaEntrada) throw new Error("Horario inválido");
    if (!["contratista", "nomina", "eor"].includes(p.tipoContrato)) throw new Error("Contrato inválido");
    if (p.fechaIngreso && !/^\d{4}-\d{2}-\d{2}$/.test(p.fechaIngreso)) throw new Error("Fecha de ingreso inválida");
    if (p.liderId === p.userId) throw new Error("Nadie es su propio líder");
    const dias = [...new Set(p.diasLaborables.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    if (!dias.length) throw new Error("Escoge al menos un día");
    let slackId = p.slackId?.trim() || null;
    if (slackId && !/^[UW][A-Z0-9]{6,}$/.test(slackId)) throw new Error("El ID de Slack empieza con U (p. ej. U08Q51UFLSH)");
    if (!slackId) {
      const usuario = (await datos.leerPerfiles(false)).find((x) => x.userId === p.userId);
      const nombre = usuario?.nombre ?? (await import("@/lib/pulse/repo").then((r) => r.leerUsuario(p.userId)))?.nombre;
      if (nombre) slackId = await buscarSlackPorNombre(nombre).catch(() => null);
    }
    // Acceso a Pulse: al crear el perfil, quien no tenía clave queda SOLO Ritmo (no ve clientes/tesorería).
    // Lo cambian la dirección y RR.HH. (Elvin, 28/sep: "todo lo de recursos y accesos es con Yaileen"); como es
    // sensible, lo que no haga Elvin espera su aprobación (Ajustes → Por aprobar).
    const previo = (await datos.leerPerfiles(false)).find((x) => x.userId === p.userId);
    const cuenta = await import("@/lib/pulse/repo").then((r) => r.leerUsuario(p.userId));
    if (cuenta && (await import("@/lib/desempeno/acceso")).estaBloqueado(cuenta.email)) throw new Error("Esta persona no puede tener acceso (decisión de Elvin)");
    const gestorPulse = u.maestro; // admin, editoras y RR.HH.
    // Quien tiene permiso de Leads (closers, setters, chatters; lo da un admin) sigue entrando a Pulse: si no,
    // el perfil de Ritmo le cerraba Leads (28/sep: Dilan y Ana, chatters, perdieron Leads al crearles el perfil).
    const conLeads = await import("@/lib/leads/repo").then((r) => r.tienePermisoLeads(p.userId));
    const soloRitmo = gestorPulse && typeof p.soloRitmo === "boolean" ? p.soloRitmo : conLeads ? false : (previo?.soloRitmo ?? !cuenta?.tieneClave);
    const nuevo = { ...p, tambienEn, soloRitmo, slackId, diasLaborables: dias, fechaIngreso: p.fechaIngreso || null };
    // Lo sensible (puesto, empresa, supervisor, activo, acceso a Pulse, contrato) espera a Elvin; lo menor pasa ya.
    if (necesitaAprobacion(u.rol)) {
      const { aplicarYa, pendientes } = separar(SENSIBLES_PERFIL, previo ?? null, nuevo);
      if (aplicarYa) await datos.guardarPerfil(aplicarYa, u.id);
      const lineas = pendientes.length ? await proponerCambio({ tipo: "perfil", userId: p.userId, cambios: pendientes, datos: previo ? null : nuevo, actorId: u.id }) : [];
      refresh();
      return { pendientes: lineas };
    }
    await datos.guardarPerfil(nuevo, u.id);
    refresh();
    return { pendientes: [] as string[] };
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
    const r = await linkDeAcceso(userId, `${proto}://${host}`, u.rol === "admin" || u.rol === "editor");
    await datos.evento({ userId, actorId: u.id, tipo: r.yaTieneClave ? "link_acceso_ya_tiene_clave" : "link_acceso" });
    return r;
  });
}

// ─── Ficha del empleado (RR.HH.) ──────────────────────────────────────────────────────────────

const puedeFicha = (u: { id: string; maestro: boolean }, userId: string) => u.maestro || u.id === userId;

export async function crearFichaAction(userId: string) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (await fichas.leerFicha(userId)) return {};
    await fichas.guardarFicha({ userId, telefono: null, telefonoAlterno: null, ciudad: null, pais: null, documentoTipo: null, documentoNumero: null, salarioMensual: null, notas: null, contactoEmergencia: null }, u.id);
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
  contactoEmergencia?: string;
}) {
  return envolver(async () => {
    const u = await requiereMaestro();
    const t = (x: string, n = 120) => x?.trim().slice(0, n) || null;
    const salario = p.salarioMensual?.trim() ? Number(p.salarioMensual) : null;
    if (salario !== null && (!Number.isFinite(salario) || salario < 0 || salario > 100000)) throw new Error("Salario inválido");
    const nueva = { userId: p.userId, telefono: t(p.telefono, 40), telefonoAlterno: t(p.telefonoAlterno, 40), ciudad: t(p.ciudad), pais: t(p.pais), documentoTipo: t(p.documentoTipo, 40), documentoNumero: t(p.documentoNumero, 60), salarioMensual: salario, notas: t(p.notas, 2000), contactoEmergencia: t(p.contactoEmergencia ?? "", 160) };
    // El salario espera a Elvin (28/sep); lo demás de la ficha se guarda ya.
    if (necesitaAprobacion(u.rol)) {
      const previa = await fichas.leerFicha(p.userId);
      const antes = previa ? { salarioMensual: previa.salarioMensual } : { salarioMensual: null };
      const pendientes = diferencias(SENSIBLES_FICHA, antes, { salarioMensual: salario });
      await fichas.guardarFicha({ ...nueva, salarioMensual: antes.salarioMensual }, u.id);
      const lineas = pendientes.length ? await proponerCambio({ tipo: "ficha", userId: p.userId, cambios: pendientes, actorId: u.id }) : [];
      refresh();
      return { pendientes: lineas };
    }
    await fichas.guardarFicha(nueva, u.id);
    refresh();
    return { pendientes: [] as string[] };
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
    if (!Number.isFinite(p.bytes) || p.bytes <= 0 || p.bytes > fichas.limiteBytes(p.categoria)) throw new Error(`Máximo ${fichas.textoLimite(p.categoria)} para este tipo de archivo`);
    if (!fichas.tipoPermitido(p.categoria, p.nombre)) throw new Error(p.categoria === "foto" ? "La foto tiene que ser JPG, PNG, WEBP o HEIC" : "Ese tipo de archivo no se acepta aquí (usa PDF, foto, video o Word/Excel)");
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
    if (!u || !puedeFicha(u, userId) || !(file instanceof File) || !path.startsWith(`ritmo/${userId}/`) || path.includes("..")) throw new Error("No autorizado");
    await fichas.subirLocal(path, new Uint8Array(await file.arrayBuffer()), file.type || null);
    return {};
  });
}

export async function confirmarSubidaAction(p: { id: string; userId: string; path: string; nombre: string; mime: string; bytes: number; categoria: string }) {
  return envolver(async () => {
    const u = await usuarioRitmo();
    if (!u || !puedeFicha(u, p.userId)) throw new Error("No autorizado");
    if (!u.maestro && p.categoria === "nomina") throw new Error("Nómina la sube RR.HH.");
    const mime = fichas.tipoPermitido(p.categoria, p.nombre);
    if (!mime) throw new Error("Ese tipo de archivo no se acepta aquí");
    if (!p.path.startsWith(`ritmo/${p.userId}/${p.id}-`) || p.path.includes("..")) throw new Error("Ruta inválida");
    // Tamaño REAL en el almacenamiento (no el que dice el navegador): si no está o se pasa, se borra.
    const real = await fichas.tamanoReal(p.path);
    if (real === null) throw new Error("El archivo no terminó de subir. Inténtalo otra vez.");
    if (real > fichas.limiteBytes(p.categoria)) {
      const { borrarArchivos } = await import("@/lib/pulse/storage");
      await borrarArchivos([p.path]).catch(() => {});
      throw new Error(`El archivo pesa más de ${fichas.textoLimite(p.categoria)} y no se guardó`);
    }
    p.bytes = real;
    await fichas.registrarArchivo({ id: p.id, userId: p.userId, categoria: p.categoria as fichas.Categoria, nombre: p.nombre, path: p.path, mime, bytes: p.bytes }, u.id);
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
    const u = await usuarioRitmo();
    if (!u?.maestro || u.rol !== "admin") throw new Error("Solo Elvin (con la verificación en dos pasos)");
    if (!["nuevo", "revisando", "cerrado"].includes(p.estado)) throw new Error("Estado inválido");
    await etica.actualizarReporteEtico(p.id, { estado: p.estado, notaInterna: p.notaInterna?.trim().slice(0, 2000) || null });
    refresh();
    return {};
  });
}

// ─── Solicitudes a RR.HH. ─────────────────────────────────────────────────────────────────────

export async function crearSolicitudAction(p: { tipo: string; desde: string; hasta: string; dias: string; detalle: string }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    const tipo = TIPOS_SOLICITUD.find((t) => t.id === p.tipo);
    if (!tipo) throw new Error("Escoge qué necesitas");
    const detalle = p.detalle?.trim().slice(0, 2000);
    if (!detalle || detalle.length < 5) throw new Error("Explica brevemente lo que necesitas");
    let desde: string | null = null, hasta: string | null = null, dias: number | null = null;
    if (tipo.conFechas) {
      if (!FECHA.test(p.desde)) throw new Error("Escoge la fecha");
      desde = p.desde;
      hasta = FECHA.test(p.hasta) && p.hasta >= p.desde ? p.hasta : p.desde;
      dias = Number(p.dias);
      if (!Number.isFinite(dias) || dias < 0 || dias > 60) throw new Error("Días inválidos");
      dias = Math.round(dias * 2) / 2;
    }
    // Choques de fechas (28/sep): dos estrategas no pueden estar fuera a la vez.
    if (desde && hasta && ["vacaciones", "dia_libre", "permiso"].includes(tipo.id)) {
      const r = await calendario.revisarFechas({ userId: u.id, desde, hasta });
      if (r.error) throw new Error(r.error);
    }
    await solicitudes.crearSolicitud({ userId: u.id, nombre: u.nombre, tipo: tipo.id, desde, hasta, dias, detalle });
    refresh();
    return {};
  });
}

export async function decidirSolicitudAction(p: { id: string; aprobar: boolean; nota: string }) {
  return envolver(async () => {
    const u = await usuarioRitmo();
    if (!u) throw new Error("no-autorizado");
    const s = await solicitudes.leerSolicitud(p.id);
    if (!s || !puedeDecidir(s, u)) throw new Error("Esta solicitud no te toca o ya se decidió");
    if (p.aprobar && s.desde && ["vacaciones", "dia_libre", "permiso"].includes(s.tipo)) {
      const r = await calendario.revisarFechas({ id: s.id, userId: s.userId, desde: s.desde, hasta: s.hasta ?? s.desde });
      if (r.error) throw new Error(`No se puede aprobar: ${r.error.replace(": escoge otras fechas.", ".")} Recházala o pídele otras fechas.`);
    }
    const estado = await solicitudes.decidirSolicitud(s, u, p.aprobar, p.nota?.trim().slice(0, 500) || null);
    refresh();
    return { estado };
  });
}

/** Revisión en vivo del formulario: ¿esas fechas chocan con alguien del mismo puesto? */
export async function revisarFechasAction(desde: string, hasta: string) {
  return envolver(async () => {
    const u = await requiereUsuario();
    if (!FECHA.test(desde)) return { error: null, aviso: null };
    return calendario.revisarFechas({ userId: u.id, desde, hasta: FECHA.test(hasta) && hasta >= desde ? hasta : desde });
  });
}

export async function cancelarSolicitudAction(id: string) {
  return envolver(async () => {
    const u = await requiereUsuario();
    const s = await solicitudes.leerSolicitud(id);
    if (!s) throw new Error("No existe");
    await solicitudes.cancelarSolicitud(s, u.id);
    refresh();
    return {};
  });
}

// ─── Alta de empleado nuevo (al firmar contrato) ─────────────────────────────────────────────

async function baseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function altaEmpleadoAction(p: { nombre: string; email: string; empresa: string; puesto: string; liderId: string; fechaIngreso: string; salario: string }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (!p.nombre?.trim() || p.nombre.trim().length < 3) throw new Error("Escribe el nombre completo");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email?.trim() ?? "")) throw new Error("Correo inválido");
    if (!EMPRESAS.some((x) => x.id === p.empresa)) throw new Error("Escoge la empresa");
    if (!PUESTOS.some((x) => x.id === p.puesto)) throw new Error("Escoge el puesto");
    if (!FECHA.test(p.fechaIngreso)) throw new Error("Fecha de ingreso inválida");
    const salario = p.salario?.trim() ? Number(p.salario) : null;
    if (salario !== null && (!Number.isFinite(salario) || salario < 0 || salario > 100000)) throw new Error("Salario inválido");
    const r = await altaEmpleado({ nombre: p.nombre, email: p.email, empresa: p.empresa, puesto: p.puesto, liderId: p.liderId || null, fechaIngreso: p.fechaIngreso, salarioMensual: salario }, u.id, await baseUrl());
    refresh();
    return r;
  });
}

/** Bienvenida: la persona llena su propia ficha (obligatorio antes de usar Ritmo). */
export async function completarFichaAction(p: { telefono: string; telefonoAlterno: string; ciudad: string; pais: string; documentoTipo: string; documentoNumero: string; contactoEmergencia: string }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    if (!(await fichas.leerFicha(u.id))) throw new Error("No tienes ficha");
    const t = (x: string, n = 120) => x?.trim().slice(0, n) || "";
    const d = { telefono: t(p.telefono, 40), ciudad: t(p.ciudad), pais: t(p.pais), documentoTipo: t(p.documentoTipo, 40), documentoNumero: t(p.documentoNumero, 60) };
    const falta = Object.entries(d).find(([, v]) => !v);
    if (falta) throw new Error("Completa todos los campos obligatorios");
    if (!(await fichas.contarArchivos(u.id, "identificacion"))) throw new Error("Sube una foto de tu identificación");
    await fichas.completarFichaPropia(u.id, { ...d, telefonoAlterno: t(p.telefonoAlterno, 40) || null, contactoEmergencia: t(p.contactoEmergencia, 160) || null });
    return {};
  });
}

// ─── Verificación en dos pasos (vista maestra) ───────────────────────────────────────────────

export async function verificarDosPasosAction(codigo: string) {
  return envolver(async () => {
    const u = await usuarioRitmo();
    if (!u) throw new Error("no-autorizado");
    if (!u.falta2fa) return {};
    const { limiteIp } = await import("@/lib/pulse/seguridad");
    const ip = (await contexto()).ip;
    if (!limiteIp(`2fa:${u.id}:${ip ?? "?"}`, 10, 60_000)) throw new Error("Demasiados intentos seguidos. Espera un minuto.");
    const r = await dosPasos.comprobarCodigo(u.id, String(codigo ?? "").slice(0, 12), ip);
    if (!r.ok) throw new Error(r.error);
    return {};
  });
}

/** Solo Elvin (admin verificado): reinicia la verificación de alguien que perdió el teléfono. */
export async function reiniciarDosPasosAction(userId: string) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (u.rol !== "admin") throw new Error("Solo Elvin puede reiniciar la verificación");
    await dosPasos.reiniciarDosPasos(userId, u.id);
    return {};
  });
}

// ─── Carreras: vacantes, aplicaciones internas y referidos ────────────────────────────────────

export async function guardarVacanteAction(p: {
  id: string | null;
  titulo: string;
  empresa: string;
  departamento: string;
  modalidad: string;
  ubicacion: string;
  descripcion: string;
  requisitos: string;
  salario: string;
  bonoReferido: string;
  estado: string;
}) {
  return envolver(async () => {
    const u = await requiereMaestro();
    const titulo = p.titulo?.trim().slice(0, 120);
    const descripcion = p.descripcion?.trim().slice(0, 5000);
    if (!titulo || titulo.length < 3) throw new Error("Ponle un título a la vacante");
    if (!descripcion || descripcion.length < 20) throw new Error("Describe la vacante (qué hará la persona)");
    if (!EMPRESAS.some((e) => e.id === p.empresa)) throw new Error("Escoge la empresa");
    if (!MODALIDADES.some((m) => m.id === p.modalidad)) throw new Error("Escoge la modalidad");
    if (!ESTADOS_VACANTE.some((e) => e.id === p.estado)) throw new Error("Estado inválido");
    const bono = p.bonoReferido === "" ? 100 : Number(p.bonoReferido);
    if (!Number.isFinite(bono) || bono < 0 || bono > 5000) throw new Error("Bono por referido inválido");
    const corto = (x: string, n: number) => x?.trim().slice(0, n) || null;
    await carreras.guardarVacante(
      p.id,
      { titulo, empresa: p.empresa, departamento: corto(p.departamento, 80), modalidad: p.modalidad, ubicacion: corto(p.ubicacion, 80), descripcion, requisitos: corto(p.requisitos, 5000), salario: corto(p.salario, 80), bonoReferido: Math.round(bono), estado: p.estado },
      u.id,
    );
    refresh();
    return {};
  });
}

async function limiteCarreras(clave: string) {
  const { limiteIp } = await import("@/lib/pulse/seguridad");
  if (!limiteIp(`carreras:${clave}`, 10, 3_600_000)) throw new Error("Demasiados envíos seguidos; intenta más tarde");
}

export async function aplicarVacanteAction(p: { vacanteId: string; motivo: string; enlace: string }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    await limiteCarreras(u.id);
    await carreras.aplicar(u, p.vacanteId, { motivo: p.motivo ?? "", enlace: p.enlace ?? "" });
    refresh();
    return {};
  });
}

export async function referirVacanteAction(p: { vacanteId: string; nombre: string; email: string; telefono: string; relacion: string; motivo: string; enlace: string }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    await limiteCarreras(u.id);
    await carreras.referir(u, p.vacanteId, { nombre: p.nombre ?? "", email: p.email ?? "", telefono: p.telefono ?? "", relacion: p.relacion ?? "", motivo: p.motivo ?? "", enlace: p.enlace ?? "" });
    refresh();
    return {};
  });
}

export async function retirarPostulacionAction(id: string) {
  return envolver(async () => {
    const u = await requiereUsuario();
    await carreras.retirar(u, id);
    refresh();
    return {};
  });
}

export async function estadoPostulacionAction(p: { id: string; estado: string; nota: string }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    const r = await carreras.cambiarEstado(u, p.id, p.estado, p.nota?.trim().slice(0, 1000) || null);
    refresh();
    return r;
  });
}

// ─── Noticias: logros, noticias, comunicados y causas benéficas ───────────────────────────────

export async function publicarNoticiaAction(p: { categoria: string; titulo: string; cuerpo: string; personaId: string; enlace: string; fijada: boolean }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (!CATEGORIAS_NOTICIA.some((c) => c.id === p.categoria)) throw new Error("Escoge el tipo");
    const titulo = p.titulo?.trim().slice(0, 140);
    const cuerpo = p.cuerpo?.trim().slice(0, 3000);
    if (!titulo || titulo.length < 3) throw new Error("Ponle un título");
    if (!cuerpo || cuerpo.length < 5) throw new Error("Escribe el mensaje");
    const enlace = p.enlace?.trim() || null;
    if (enlace && !/^https:\/\//i.test(enlace)) throw new Error("El enlace debe empezar con https://");
    await noticias.publicarNoticia({ categoria: p.categoria, titulo, cuerpo, personaId: p.categoria === "logro" && p.personaId ? p.personaId : null, enlace: enlace?.slice(0, 500) ?? null, fijada: !!p.fijada }, u);
    refresh();
    return {};
  });
}

export async function fijarNoticiaAction(id: string, fijada: boolean) {
  return envolver(async () => {
    await requiereMaestro();
    await noticias.fijarNoticia(id, fijada);
    refresh();
    return {};
  });
}

export async function borrarNoticiaAction(id: string) {
  return envolver(async () => {
    const u = await requiereMaestro();
    await noticias.borrarNoticia(id, u.id);
    refresh();
    return {};
  });
}

// ─── Bienestar: pausa activa, ejercicio y energía (voluntario, fuera del score) ───────────────

export async function pausaHechaAction() {
  return envolver(async () => {
    const u = await requiereUsuario();
    const hoy = bienestar.hoyPR();
    await bienestar.registrarPausa(u.id, hoy, Math.ceil(duracionRutina(rutinaDelDia(hoy)) / 60));
    await bienestar.revisarLogros(u.id, hoy).catch(() => {});
    refresh();
    return {};
  });
}

export async function actividadAction(p: { actividad: string; minutos: number }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    if (!ACTIVIDADES.some((a) => a.id === p.actividad)) throw new Error("Escoge la actividad");
    const min = Math.round(Number(p.minutos));
    if (!Number.isFinite(min) || min < 5 || min > 300) throw new Error("Pon entre 5 y 300 minutos");
    await bienestar.registrarActividad(u.id, bienestar.hoyPR(), p.actividad, min);
    await bienestar.revisarLogros(u.id, bienestar.hoyPR()).catch(() => {});
    refresh();
    return {};
  });
}

export async function animoAction(valor: number) {
  return envolver(async () => {
    const u = await requiereUsuario();
    if (![1, 2, 3, 4, 5].includes(valor)) throw new Error("Valor inválido");
    await bienestar.registrarAnimo(u.id, bienestar.hoyPR(), valor);
    refresh();
    return {};
  });
}

// Comunidad de Bienestar (opcional): unirse/salir, mensajes cortos y reacciones.
export async function comunidadVisibleAction(visible: boolean) {
  return envolver(async () => {
    const u = await requiereUsuario();
    await bienestar.ponerVisible(u.id, visible);
    refresh();
    return {};
  });
}

export async function mensajeComunidadAction(texto: string, paraId?: string | null) {
  return envolver(async () => {
    const u = await requiereUsuario();
    const { limiteIp } = await import("@/lib/pulse/seguridad");
    if (!limiteIp(`comunidad:${u.id}`, 10, 3_600_000)) throw new Error("Muchos mensajes seguidos; intenta en un rato");
    await bienestar.publicarMensaje(u.id, texto ?? "", paraId || null);
    refresh();
    return {};
  });
}

export async function comentarComunidadAction(p: { postId: string; texto: string }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    const { limiteIp } = await import("@/lib/pulse/seguridad");
    if (!limiteIp(`comentarios:${u.id}`, 30, 3_600_000)) throw new Error("Muchos comentarios seguidos; intenta en un rato");
    await bienestar.comentar(p.postId, u.id, p.texto ?? "");
    refresh();
    return {};
  });
}

export async function borrarComentarioAction(id: string) {
  return envolver(async () => {
    const u = await usuarioRitmo();
    if (!u) throw new Error("no-autorizado");
    await bienestar.borrarComentario(id, u);
    refresh();
    return {};
  });
}

export async function borrarMensajeComunidadAction(id: string) {
  return envolver(async () => {
    const u = await usuarioRitmo();
    if (!u) throw new Error("no-autorizado");
    await bienestar.borrarMensaje(id, u);
    refresh();
    return {};
  });
}

export async function reaccionComunidadAction(p: { postId: string; emoji: string }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    await bienestar.reaccionar(p.postId, u.id, p.emoji);
    refresh();
    return {};
  });
}

// ─── Viajes: planificar vacaciones y el viaje del año (por mérito) ────────────────────────────

const hoyViajes = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });

export async function crearPlanViajeAction(p: { tipo: string; destino: string; desde: string; hasta: string; presupuesto: string; notas: string }) {
  return envolver(async () => {
    const u = await requiereDireccion();
    const err = errorPlan(p, hoyViajes());
    if (err) throw new Error(err);
    await viajes.crearPlan(u.id, {
      tipo: p.tipo,
      destino: p.destino.trim().slice(0, 120),
      desde: p.desde || null,
      hasta: p.hasta || null,
      presupuestoUsd: p.presupuesto ? Math.round(Number(p.presupuesto)) : null,
      notas: p.notas?.trim().slice(0, 1000) || null,
    });
    refresh();
    return {};
  });
}

export async function borrarPlanViajeAction(id: string) {
  return envolver(async () => {
    const u = await requiereDireccion();
    await viajes.borrarPlan(u.id, id);
    refresh();
    return {};
  });
}

export async function pedirVacacionesPlanAction(id: string) {
  return envolver(async () => {
    const u = await requiereDireccion();
    const r = await viajes.pedirVacaciones(u, id);
    refresh();
    return r;
  });
}

// Viajes está oculto al equipo por ahora (Elvin, 27/sep): todo, planes incluidos, solo para él.
async function requiereDireccion() {
  const u = await requiereMaestro();
  if (u.rol !== "admin") throw new Error("Solo Elvin, por ahora");
  return u;
}

export async function guardarViajeAnualAction(p: { anio: number; premio: string; topeUsd: string; anuncio: string; nota: string }) {
  return envolver(async () => {
    const u = await requiereDireccion();
    if (!Number.isInteger(p.anio) || p.anio < 2026 || p.anio > 2100) throw new Error("Año inválido");
    const premio = p.premio?.trim().slice(0, 300);
    if (!premio || premio.length < 5) throw new Error("Describe el premio");
    if (!FECHA.test(p.anuncio)) throw new Error("Pon la fecha del anuncio");
    const tope = p.topeUsd ? Number(p.topeUsd) : null;
    if (tope !== null && (!Number.isFinite(tope) || tope < 0 || tope > 50000)) throw new Error("Tope inválido");
    await viajes.guardarPrograma({ anio: p.anio, premio, topeUsd: tope, anuncio: p.anuncio, nota: p.nota?.trim().slice(0, 1000) || null }, u.id);
    refresh();
    return {};
  });
}

export async function elegirGanadorViajeAction(p: { anio: number; userId: string; nombre: string }) {
  return envolver(async () => {
    const u = await requiereDireccion();
    const prog = await viajes.programaDelAnio(p.anio);
    if (!prog) throw new Error("Primero configura el viaje del año");
    // Por mérito: solo se puede escoger a quien cumple (antigüedad, días y índice).
    const lista = await viajes.elegibilidadAnio(u, p.anio, prog.anuncio);
    const c = lista.find((x) => x.userId === p.userId);
    if (!c?.e.enCarrera) throw new Error("Esa persona no cumple los requisitos del viaje del año");
    await viajes.elegirGanador(p.anio, { id: c.userId, nombre: c.nombre }, u);
    refresh();
    return {};
  });
}

// ─── Empresa: quiénes somos, recursos, políticas y preguntas (lo edita la dirección: Elvin, Carilin, Aure) ──

export async function guardarEmpresaAction(p: { id?: string; seccion: string; titulo: string; cuerpo: string; url?: string | null; empresa: string; publicado: boolean }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (u.rol !== "admin" && u.rol !== "editor") throw new Error("Solo la dirección edita Empresa");
    await empresa.guardarItemEmpresa(p, u.id);
    refresh();
    return {};
  });
}

export async function borrarEmpresaAction(id: string) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (u.rol !== "admin" && u.rol !== "editor") throw new Error("Solo la dirección edita Empresa");
    await empresa.borrarItemEmpresa(id);
    refresh();
    return {};
  });
}

// ─── Cambios sensibles: solo Elvin (admin) decide ─────────────────────────────────────────────

export async function decidirCambioAction(p: { id: string; aprobar: boolean; nota?: string }) {
  return envolver(async () => {
    const u = await requiereMaestro();
    if (u.rol !== "admin") throw new Error("Solo Elvin aprueba estos cambios");
    await decidirCambio(p.id, p.aprobar, u.id, p.nota);
    refresh();
    return {};
  });
}
