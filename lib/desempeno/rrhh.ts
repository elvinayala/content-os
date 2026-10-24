// Reglas de RR.HH. de Ritmo (puras; tests/rrhh.test.mjs). Política de Elvin (25/sep/2026) para
// empleados de operaciones con sueldo fijo:
//  - Vacaciones: 8 días al año que se ACUMULAN por mes completo desde la fecha de ingreso
//    (8/12 ≈ 0.67 días/mes). Subió de 7 a 8 el 27/sep (Elvin). Se pueden SOLICITAR al cumplir 12 meses (el sistema avisa).
//    Una ausencia se descuenta de lo acumulado aunque aún no tenga 12 meses.
//  - Enfermedad: 5 días cada 12 meses contados desde la fecha de ingreso (antes 3; 27/sep; desde el 17/oct por período de
//    12 meses y no por año calendario, Elvin: "acumulan cada 12 meses"), solo con certificado médico válido o por una
//    solicitud de **cita médica** aprobada. Sin certificado (o pasado el cupo) se cobra de vacaciones.
//  - Vacaciones: se piden con mínimo 60 días de anticipación (17/oct, Elvin: "no pueden solicitarlas el mismo mes").
//  - Maternidad: 30 días por evento (antes 15; 27/sep).
//  - Lo que no alcance a cubrir vacaciones queda "sin paga".
//  - Días → horas: 8 h por día (9-6 con 1 h de almuerzo).
// ⚠️ Para quien esté en nómina formal (PR o Colombia) la ley pone mínimos más altos: revisar con abogado.

// 30/sep (Elvin): "lo más que han podido acumular son ocho días… el máximo ahora que estamos acumulando anual" → tope de
// 8 días acumulados, y se cuenta desde las ÚLTIMAS vacaciones que cogió (dato que pone RR.HH. en la ficha), no desde el ingreso.
export const POLITICA = { vacacionesAnual: 8, topeVacaciones: 8, enfermedadAnual: 5, maternidad: 30, horasDia: 8, mesesParaVacaciones: 12, anticipacionVacaciones: 60 };

export type TipoAusencia = "vacaciones" | "enfermedad" | "maternidad" | "personal";

export interface Ausencia {
  id?: string;
  tipo: TipoAusencia;
  desde: string; // YYYY-MM-DD
  hasta: string;
  dias: number;
  certificado: boolean;
}

export interface Cargo {
  vacaciones: number;
  enfermedad: number;
  maternidad: number;
  sinPaga: number;
}

/** Meses completos entre la fecha de ingreso y `hoy` (el mes cuenta al cumplir el mismo día). */
export function mesesCompletos(ingreso: string, hoy: string): number {
  const [ay, am, ad] = ingreso.split("-").map(Number);
  const [by, bm, bd] = hoy.split("-").map(Number);
  let m = (by - ay) * 12 + (bm - am);
  if (bd < ad) m--;
  return Math.max(0, m);
}

/** Fecha en que cumple `n` meses (para el aviso de los 12 meses). */
export function fechaMeses(ingreso: string, n: number): string {
  const [y, m, d] = ingreso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const ultimo = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(d, ultimo)).padStart(2, "0")}`;
}

/** Días laborables (L-V) entre dos fechas, inclusive. */
export function diasLaborables(desde: string, hasta: string, laborables: number[] = [1, 2, 3, 4, 5]): number {
  let n = 0;
  for (let t = Date.parse(`${desde}T12:00:00Z`); t <= Date.parse(`${hasta}T12:00:00Z`); t += 86_400_000) if (laborables.includes(new Date(t).getUTCDay())) n++;
  return n;
}

const r2 = (x: number) => Math.round(x * 100) / 100;

/** Período de 12 meses (desde la fecha de ingreso) en que cae `fecha`: los días de enfermedad se renuevan en cada aniversario. */
export function periodoEnfermedad(ingreso: string, fecha: string): { desde: string; hasta: string; renueva: string } {
  const n = Math.floor(mesesCompletos(ingreso, fecha) / 12);
  const desde = fechaMeses(ingreso, n * 12);
  const renueva = fechaMeses(ingreso, (n + 1) * 12);
  const hasta = new Date(Date.parse(`${renueva}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  return { desde, hasta, renueva };
}

const sumarDiasR = (f: string, n: number) => new Date(Date.parse(`${f}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** Primer día que se pueden pedir vacaciones hoy (60 días de anticipación). */
export const primerDiaVacaciones = (hoy: string) => sumarDiasR(hoy, POLITICA.anticipacionVacaciones);

/** Error si una solicitud nueva rompe la anticipación de las vacaciones (null = está bien). */
export function errorAnticipacion(tipo: string, desde: string | null, hoy: string): string | null {
  if (tipo !== "vacaciones" || !desde) return null;
  const minimo = primerDiaVacaciones(hoy);
  if (desde >= minimo) return null;
  const bonita = new Date(`${minimo}T12:00:00Z`).toLocaleDateString("es-PR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return `Las vacaciones se piden con mínimo ${POLITICA.anticipacionVacaciones} días de anticipación: lo más pronto que puedes pedir hoy es desde el ${bonita}. Para una cita médica usa "Cita médica"; para otra cosa, "Día libre" o "Permiso".`;
}

/**
 * Reparte cada ausencia (en orden cronológico) entre enfermedad / maternidad / vacaciones / sin paga.
 * Vacaciones disponibles en cada momento = lo acumulado hasta esa fecha − lo ya usado.
 */
export function cargosAusencias(ingreso: string, ausencias: Ausencia[]): (Ausencia & { cargo: Cargo })[] {
  const orden = [...ausencias].sort((a, b) => a.desde.localeCompare(b.desde));
  let vacUsadas = 0;
  const enfPorPeriodo = new Map<string, number>();
  return orden.map((a) => {
    const cargo: Cargo = { vacaciones: 0, enfermedad: 0, maternidad: 0, sinPaga: 0 };
    let resto = a.dias;
    if (a.tipo === "maternidad") {
      cargo.maternidad = Math.min(resto, POLITICA.maternidad);
      resto -= cargo.maternidad;
    } else if (a.tipo === "enfermedad" && a.certificado) {
      const periodo = periodoEnfermedad(ingreso, a.desde).desde;
      const usadas = enfPorPeriodo.get(periodo) ?? 0;
      cargo.enfermedad = Math.min(resto, Math.max(0, POLITICA.enfermedadAnual - usadas));
      enfPorPeriodo.set(periodo, usadas + cargo.enfermedad);
      resto -= cargo.enfermedad;
    }
    if (resto > 0) {
      const acumuladas = (mesesCompletos(ingreso, a.desde) * POLITICA.vacacionesAnual) / 12;
      const disponibles = Math.min(POLITICA.topeVacaciones, Math.max(0, acumuladas - vacUsadas));
      cargo.vacaciones = Math.min(resto, disponibles);
      vacUsadas += cargo.vacaciones;
      cargo.sinPaga = resto - cargo.vacaciones;
    }
    return { ...a, cargo: { vacaciones: r2(cargo.vacaciones), enfermedad: r2(cargo.enfermedad), maternidad: r2(cargo.maternidad), sinPaga: r2(cargo.sinPaga) } };
  });
}

export interface Saldos {
  meses: number;
  puedeSolicitar: boolean; // cumplió 12 meses
  fechaDoceMeses: string;
  vacaciones: { acumuladas: number; usadas: number; disponibles: number };
  enfermedad: { cupo: number; usadas: number; disponibles: number; desde: string; renueva: string }; // período de 12 meses (desde el ingreso) en que cae `hoy`
  maternidad: number; // días por evento
  sinPaga: number; // total histórico
  horasDia: number;
}

/**
 * `ultimasVacaciones` (YYYY-MM-DD, el día que volvió de las últimas): si está, se acumula desde ahí y solo cuentan las
 * vacaciones usadas después. Siempre con tope de 8 días.
 */
export function saldos(ingreso: string, ausencias: Ausencia[], hoy: string, ultimasVacaciones?: string | null): Saldos {
  const meses = mesesCompletos(ingreso, hoy);
  const cargos = cargosAusencias(ingreso, ausencias.filter((a) => a.desde <= hoy));
  const inicio = ultimasVacaciones && ultimasVacaciones > ingreso && ultimasVacaciones <= hoy ? ultimasVacaciones : ingreso;
  const acumuladas = r2(Math.min(POLITICA.topeVacaciones, (mesesCompletos(inicio, hoy) * POLITICA.vacacionesAnual) / 12));
  const usadas = r2(cargos.filter((a) => inicio === ingreso || a.desde > inicio).reduce((s, a) => s + a.cargo.vacaciones, 0));
  const per = periodoEnfermedad(ingreso, hoy);
  const enfUsadas = r2(cargos.filter((a) => a.desde >= per.desde && a.desde <= per.hasta).reduce((s, a) => s + a.cargo.enfermedad, 0));
  return {
    meses,
    puedeSolicitar: meses >= POLITICA.mesesParaVacaciones,
    fechaDoceMeses: fechaMeses(ingreso, POLITICA.mesesParaVacaciones),
    vacaciones: { acumuladas, usadas, disponibles: r2(Math.max(0, acumuladas - usadas)) },
    enfermedad: { cupo: POLITICA.enfermedadAnual, usadas: enfUsadas, disponibles: r2(Math.max(0, POLITICA.enfermedadAnual - enfUsadas)), desde: per.desde, renueva: per.renueva },
    maternidad: POLITICA.maternidad,
    sinPaga: r2(cargos.reduce((s, a) => s + a.cargo.sinPaga, 0)),
    horasDia: POLITICA.horasDia,
  };
}

/** Hoy se cumplen exactamente los 12 meses (para mandar el aviso una sola vez). */
export const cumpleDoceMesesHoy = (ingreso: string, hoy: string) => fechaMeses(ingreso, POLITICA.mesesParaVacaciones) === hoy;

// ─── Nómina estimada del mes ────────────────────────────────────────────────────────────────────

export interface Nomina {
  mes: string; // YYYY-MM
  base: number;
  ajustes: { concepto: string; monto: number }[];
  diasSinPaga: number;
  descuentoSinPaga: number;
  total: number;
}

/**
 * Lo que debería cobrar en `mes` (USD): salario mensual + ajustes − días sin paga del mes
 * (salario ÷ días laborables del mes × días sin paga). Es un estimado para RR.HH.
 */
export function nominaMes(p: { salarioMensual: number | null; mes: string; ajustes: { concepto: string; monto: number }[]; ingreso: string | null; ausencias: Ausencia[] }): Nomina {
  const base = p.salarioMensual ?? 0;
  const [y, m] = p.mes.split("-").map(Number);
  const ini = `${p.mes}-01`;
  const fin = `${p.mes}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
  const laborables = diasLaborables(ini, fin) || 1;
  const cargos = p.ingreso ? cargosAusencias(p.ingreso, p.ausencias) : [];
  const diasSinPaga = r2(cargos.filter((a) => a.desde >= ini && a.desde <= fin).reduce((s, a) => s + a.cargo.sinPaga, 0));
  const descuentoSinPaga = r2((base / laborables) * diasSinPaga);
  const sumaAjustes = p.ajustes.reduce((s, a) => s + a.monto, 0);
  return { mes: p.mes, base, ajustes: p.ajustes, diasSinPaga, descuentoSinPaga, total: r2(base + sumaAjustes - descuentoSinPaga) };
}

export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export const mesSiguiente = (hoy: string) => fechaMeses(`${hoy.slice(0, 7)}-01`, 1).slice(0, 7);

// ─── Solicitudes a RR.HH. ─────────────────────────────────────────────────────────────────────

export const TIPOS_SOLICITUD = [
  { id: "dia_libre", nombre: "Día libre", conFechas: true },
  { id: "vacaciones", nombre: "Vacaciones (mínimo 60 días de anticipación)", conFechas: true },
  // 17/oct (Elvin): las citas médicas van por aquí y, al aprobarse, se descuentan de los días de enfermedad.
  { id: "cita_medica", nombre: "Cita médica (se descuenta de tus días de enfermedad)", conFechas: true },
  { id: "permiso", nombre: "Permiso programado (trámite, gestión…)", conFechas: true },
  { id: "documento", nombre: "Carta o documento (constancia, certificación…)", conFechas: false },
  { id: "otro", nombre: "Otra petición", conFechas: false },
] as const;

export type EstadoSolicitud = "supervisor" | "rrhh" | "aprobada" | "rechazada" | "cancelada";

/** Estado inicial: si no tiene supervisor (o el supervisor es RR.HH./maestro), va directo a RR.HH. */
export const estadoInicial = (supervisorId: string | null): EstadoSolicitud => (supervisorId ? "supervisor" : "rrhh");

/**
 * Quién decide: en "supervisor" solo el supervisor (o Elvin, admin); en "rrhh" la vista maestra
 * (RR.HH., Carilin, Aure, Elvin). Nadie decide lo suyo. RR.HH. no se salta al supervisor.
 */
export function puedeDecidir(s: { userId: string; estado: string; supervisorId: string | null }, actor: { id: string; maestro: boolean; rol?: string }): boolean {
  if (actor.id === s.userId) return false;
  if (s.estado === "supervisor") return actor.id === s.supervisorId || (actor.rol === "admin" && actor.maestro);
  if (s.estado === "rrhh") return actor.maestro;
  return false;
}

/** Siguiente estado al aprobar. */
export const alAprobar = (estado: string): EstadoSolicitud => (estado === "supervisor" ? "rrhh" : "aprobada");

/** Qué ausencia registra una solicitud firmada (null si no aplica). */
export function ausenciaDeSolicitud(s: { tipo: string; desde: string | null; hasta: string | null; dias: number | null }): Omit<Ausencia, "id"> | null {
  if (!s.desde || !s.dias || s.dias <= 0) return null;
  if (s.tipo === "vacaciones") return { tipo: "vacaciones", desde: s.desde, hasta: s.hasta ?? s.desde, dias: s.dias, certificado: false };
  // Aprobada por el supervisor y firmada por RR.HH. = vale como certificada: sale de enfermedad (lo que pase del cupo, de vacaciones).
  if (s.tipo === "cita_medica") return { tipo: "enfermedad", desde: s.desde, hasta: s.hasta ?? s.desde, dias: s.dias, certificado: true };
  if (s.tipo === "dia_libre" || s.tipo === "permiso") return { tipo: "personal", desde: s.desde, hasta: s.hasta ?? s.desde, dias: s.dias, certificado: false };
  return null;
}

/** Lo que va por horas (1/8 de día = 1 h): citas médicas, enfermedad y permisos (24/oct: Jessica pidió 2 h para vacunar
 *  a su bebé con un permiso y se le descontó el día entero de vacaciones). Lo demás, por medio día. */
export const POR_HORAS: readonly string[] = ["cita_medica", "enfermedad", "permiso", "personal"];
export function redondearDias(tipo: string, dias: number): number {
  return POR_HORAS.includes(tipo) ? Math.round(dias * 8) / 8 : Math.round(dias * 2) / 2;
}

/** "2 h" si es menos de un día; si no, "1 día", "1.5 días"… (para tarjetas, ficha y calendario). */
export function duracionTexto(dias: number, horasDia: number = POLITICA.horasDia): string {
  if (dias > 0 && dias < 1) return `${Math.round(dias * horasDia)} h`;
  return `${dias} ${dias === 1 ? "día" : "días"}`;
}

/** Saldo legible en días y horas: 11.08 días con jornada de 9 h → "11 días y 1 h". */
export function diasYHoras(dias: number, horasDia: number): string {
  let enteros = Math.floor(dias + 1e-9);
  let horas = Math.round((dias - enteros) * horasDia);
  if (horas >= horasDia) { enteros += 1; horas = 0; }
  const d = `${enteros} ${enteros === 1 ? "día" : "días"}`;
  return horas ? `${d} y ${horas} h` : d;
}
