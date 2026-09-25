// Reglas de RR.HH. de Ritmo (puras; tests/rrhh.test.mjs). Política de Elvin (25/sep/2026) para
// empleados de operaciones con sueldo fijo:
//  - Vacaciones: 7 días al año que se ACUMULAN por mes completo desde la fecha de ingreso
//    (7/12 ≈ 0.58 días/mes). Se pueden SOLICITAR al cumplir 12 meses (el sistema avisa).
//    Una ausencia se descuenta de lo acumulado aunque aún no tenga 12 meses.
//  - Enfermedad: 3 días por año calendario, solo con certificado médico válido. Sin certificado
//    (o pasado el cupo) se cobra de vacaciones.
//  - Maternidad: 15 días por evento.
//  - Lo que no alcance a cubrir vacaciones queda "sin paga".
//  - Días → horas: 8 h por día (9-6 con 1 h de almuerzo).
// ⚠️ Para quien esté en nómina formal (PR o Colombia) la ley pone mínimos más altos: revisar con abogado.

export const POLITICA = { vacacionesAnual: 7, enfermedadAnual: 3, maternidad: 15, horasDia: 8, mesesParaVacaciones: 12 };

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

/**
 * Reparte cada ausencia (en orden cronológico) entre enfermedad / maternidad / vacaciones / sin paga.
 * Vacaciones disponibles en cada momento = lo acumulado hasta esa fecha − lo ya usado.
 */
export function cargosAusencias(ingreso: string, ausencias: Ausencia[]): (Ausencia & { cargo: Cargo })[] {
  const orden = [...ausencias].sort((a, b) => a.desde.localeCompare(b.desde));
  let vacUsadas = 0;
  const enfPorAno = new Map<string, number>();
  return orden.map((a) => {
    const cargo: Cargo = { vacaciones: 0, enfermedad: 0, maternidad: 0, sinPaga: 0 };
    let resto = a.dias;
    if (a.tipo === "maternidad") {
      cargo.maternidad = Math.min(resto, POLITICA.maternidad);
      resto -= cargo.maternidad;
    } else if (a.tipo === "enfermedad" && a.certificado) {
      const ano = a.desde.slice(0, 4);
      const usadas = enfPorAno.get(ano) ?? 0;
      cargo.enfermedad = Math.min(resto, Math.max(0, POLITICA.enfermedadAnual - usadas));
      enfPorAno.set(ano, usadas + cargo.enfermedad);
      resto -= cargo.enfermedad;
    }
    if (resto > 0) {
      const acumuladas = (mesesCompletos(ingreso, a.desde) * POLITICA.vacacionesAnual) / 12;
      const disponibles = Math.max(0, acumuladas - vacUsadas);
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
  enfermedad: { cupo: number; usadas: number; disponibles: number }; // año calendario de `hoy`
  maternidad: number; // días por evento
  sinPaga: number; // total histórico
  horasDia: number;
}

export function saldos(ingreso: string, ausencias: Ausencia[], hoy: string): Saldos {
  const meses = mesesCompletos(ingreso, hoy);
  const cargos = cargosAusencias(ingreso, ausencias.filter((a) => a.desde <= hoy));
  const acumuladas = r2((meses * POLITICA.vacacionesAnual) / 12);
  const usadas = r2(cargos.reduce((s, a) => s + a.cargo.vacaciones, 0));
  const enfUsadas = r2(cargos.filter((a) => a.desde.startsWith(hoy.slice(0, 4))).reduce((s, a) => s + a.cargo.enfermedad, 0));
  return {
    meses,
    puedeSolicitar: meses >= POLITICA.mesesParaVacaciones,
    fechaDoceMeses: fechaMeses(ingreso, POLITICA.mesesParaVacaciones),
    vacaciones: { acumuladas, usadas, disponibles: r2(Math.max(0, acumuladas - usadas)) },
    enfermedad: { cupo: POLITICA.enfermedadAnual, usadas: enfUsadas, disponibles: r2(Math.max(0, POLITICA.enfermedadAnual - enfUsadas)) },
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
  { id: "vacaciones", nombre: "Vacaciones", conFechas: true },
  { id: "permiso", nombre: "Permiso programado (cita, trámite…)", conFechas: true },
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
  if (s.estado === "supervisor") return actor.id === s.supervisorId || actor.rol === "admin";
  if (s.estado === "rrhh") return actor.maestro;
  return false;
}

/** Siguiente estado al aprobar. */
export const alAprobar = (estado: string): EstadoSolicitud => (estado === "supervisor" ? "rrhh" : "aprobada");

/** Qué ausencia registra una solicitud firmada (null si no aplica). */
export function ausenciaDeSolicitud(s: { tipo: string; desde: string | null; hasta: string | null; dias: number | null }): Omit<Ausencia, "id"> | null {
  if (!s.desde || !s.dias || s.dias <= 0) return null;
  if (s.tipo === "vacaciones") return { tipo: "vacaciones", desde: s.desde, hasta: s.hasta ?? s.desde, dias: s.dias, certificado: false };
  if (s.tipo === "dia_libre" || s.tipo === "permiso") return { tipo: "personal", desde: s.desde, hasta: s.hasta ?? s.desde, dias: s.dias, certificado: false };
  return null;
}
