// Ritmo · Arena — ventas dentro de Ritmo (27/sep/2026). Lógica pura (tests en tests/ventas.test.mjs).
// Diseño: vault/proyectos/ritmo/arena-ventas.md.
//
// Comisiones (Nahuel Tissera, director comercial, 27/sep, iguales en Level Up y AI Borinquen):
//   · todo con el MES completo y sobre cash collected NETO = cobrado − % de la pasarela de pago;
//   · closer 7 % base; con show-up ≥ 60 % sube por % de cierre: ≥ 25 % → 8 · ≥ 30 % → 9 · ≥ 35 % → 10;
//   · setter 4 % de las ventas que él agendó;
//   · chatter 4 %, 5 % si ESE chatter pasa de 200 agendas en el mes.
// Pasarelas (Elvin, 27/sep): Stripe, PayPal y ATH Móvil 3.5 %; Klarna y FanBasis 4.5 %.
// Nahuel, 28/sep: la 2.ª cuota de una venta a plazos SÍ comisiona (cuenta para quien sale en esa fila de la hoja,
// "sobre todo si la cobra el closer"); el show-up de los closers sale del CRM (Leads → CLOSERS), no del diario:
// los closers tienen que mover cada cita que ya pasó (No show / No ofertado / Follow up / Pago reserva / Closed).

export type Empresa = "level_up" | "ai_borinquen";
export type RolVentas = "closer" | "setter" | "chatter";

export const PUESTOS_VENTAS = ["closer", "setter", "chatter", "director_ventas"] as const;
export const esPuestoVentas = (puesto: string | null | undefined) => !!puesto && (PUESTOS_VENTAS as readonly string[]).includes(puesto);

// ─── Metas (decisiones de Elvin, 27/sep) ──────────────────────────────────────────────────────

export interface MetasEmpresa {
  mesTotal: number; // cash collected del mes (nuevas + cuotas)
  mesNuevas: number | null; // solo ventas nuevas (LU)
  semana: number; // referencia semanal del equipo
}
export const METAS: Record<Empresa, MetasEmpresa> = {
  level_up: { mesTotal: 150_000, mesNuevas: 100_000, semana: 35_000 },
  ai_borinquen: { mesTotal: 30_000, mesNuevas: null, semana: 7_000 },
};

// ─── Pasarelas ────────────────────────────────────────────────────────────────────────────────

export const PASARELAS: { id: string; nombre: string; fee: number; patron: RegExp }[] = [
  { id: "stripe", nombre: "Stripe", fee: 0.035, patron: /stripe/ },
  { id: "paypal", nombre: "PayPal", fee: 0.035, patron: /paypal|pay pal/ },
  { id: "ath", nombre: "ATH Móvil", fee: 0.035, patron: /\bath\b|ath ?movil/ },
  { id: "klarna", nombre: "Klarna", fee: 0.045, patron: /klarna/ },
  { id: "fanbasis", nombre: "FanBasis", fee: 0.045, patron: /fan ?basi|comas/ },
];

/** Pasarela de la venta por el texto de la hoja. Sin pasarela reconocida (efectivo, transferencia…) = 0 %. */
export function pasarelaDe(texto: string | undefined): { id: string | null; nombre: string; fee: number; desconocida: boolean } {
  const t = norm(texto ?? "");
  if (!t) return { id: null, nombre: "—", fee: 0, desconocida: false };
  const p = PASARELAS.find((x) => x.patron.test(t));
  if (p) return { id: p.id, nombre: p.nombre, fee: p.fee, desconocida: false };
  const sinFee = /transfer|efectivo|cash|zelle|cheque|deposito|wire|ach/.test(t);
  return { id: null, nombre: texto!.trim(), fee: 0, desconocida: !sinFee };
}

// ─── Comisiones ───────────────────────────────────────────────────────────────────────────────

export const SHOW_UP_MINIMO = 0.6;
export const TRAMOS_CLOSER = [
  { cierre: 0.35, pct: 0.1 },
  { cierre: 0.3, pct: 0.09 },
  { cierre: 0.25, pct: 0.08 },
];
export const PCT_CLOSER_BASE = 0.07;
export const PCT_SETTER = 0.04;
export const PCT_CHATTER = 0.04;
export const PCT_CHATTER_ALTO = 0.05;
export const AGENDAS_CHATTER_ALTO = 200; // "más de 200 agendas al mes" (sube cuando suba la pauta)

/** % del closer. Sin datos de show-up o cierre → base (no se le puede subir sin medir). */
export function pctCloser(showUp: number | null, cierre: number | null): number {
  if (showUp == null || cierre == null || showUp < SHOW_UP_MINIMO) return PCT_CLOSER_BASE;
  return TRAMOS_CLOSER.find((t) => cierre >= t.cierre - 1e-9)?.pct ?? PCT_CLOSER_BASE;
}

export const pctChatter = (agendas: number) => (agendas > AGENDAS_CHATTER_ALTO ? PCT_CHATTER_ALTO : PCT_CHATTER);

export function pctDe(rol: RolVentas, t: { showUp: number | null; cierre: number | null; agendas: number }): number {
  if (rol === "closer") return pctCloser(t.showUp, t.cierre);
  if (rol === "chatter") return pctChatter(t.agendas);
  return PCT_SETTER;
}

/** Qué le falta para el próximo tramo (motivación en su marcador). */
export function siguienteTramo(rol: RolVentas, t: { showUp: number | null; cierre: number | null; agendas: number }): string | null {
  if (rol === "chatter") return t.agendas > AGENDAS_CHATTER_ALTO ? null : `${AGENDAS_CHATTER_ALTO + 1 - t.agendas} agendas más para el 5 %`;
  if (rol !== "closer") return null;
  if (t.showUp == null || t.cierre == null) return "Mueve en Leads cada cita que ya pasó (No show, Follow up, Closed…) para subir de 7 %";
  if (t.showUp < SHOW_UP_MINIMO) return `Sube tu show-up a 60 % (vas ${pct(t.showUp)}) para pasar de 7 %`;
  const prox = [...TRAMOS_CLOSER].reverse().find((x) => t.cierre! < x.cierre - 1e-9);
  return prox ? `Cierre de ${Math.round(prox.cierre * 100)} % → ${Math.round(prox.pct * 100)} % (vas ${pct(t.cierre)})` : null;
}

// ─── La hoja de ventas ────────────────────────────────────────────────────────────────────────

export interface Transaccion {
  fecha: string; // YYYY-MM-DD
  tipo: "nueva" | "cuota";
  cliente: string;
  bruto: number; // cash collected
  neto: number; // − pasarela
  pasarela: string;
  pasarelaDesconocida: boolean;
  closer: string;
  setter: string;
  chatter: string;
}

export interface LecturaHoja {
  transacciones: Transaccion[];
  metodoNeto: "pasarela" | "valor-neto" | "bruto";
  columnas: Record<string, string | null>; // qué columna se usó para cada dato (para revisar)
  avisos: string[];
  error?: string;
}

const COLS = {
  fecha: /^fecha/,
  tipo: /tipo de transacc|tipo de venta|^tipo$/,
  cliente: /^cliente|nombre del cliente|^nombre$|^empresa/,
  bruto: /cash collected|monto cobrado|total cobrado|pago inicial|^monto|^cobrado|^pago$/,
  neto: /valor neto|^neto/,
  pasarela: /pasarela|metodo de pago|forma de pago|plataforma de pago|procesador|^metodo|^via de pago/,
  closer: /^closer/,
  setter: /^setter/,
  chatter: /^chatter/,
};

/**
 * Lee la pestaña del mes (filas crudas del Apps Script). Tolerante: busca el encabezado en las primeras 15
 * filas por nombre de columna. Neto: si hay monto cobrado + pasarela → cobrado × (1 − fee); si no, "Valor
 * Neto"; si tampoco, el cobrado (con aviso).
 */
export function leerHojaVentas(filas: string[][], ordenPorDefecto: "dmy" | "mdy"): LecturaHoja {
  const vacio = (error: string): LecturaHoja => ({ transacciones: [], metodoNeto: "bruto", columnas: {}, avisos: [], error });
  const h = filas.slice(0, 15).findIndex((f) => f.some((c) => COLS.fecha.test(norm(c))) && f.some((c) => COLS.closer.test(norm(c)) || COLS.setter.test(norm(c))));
  if (h < 0) return vacio("no encontré el encabezado con Fecha y Closer/Setter");
  const enc = filas[h].map(norm);
  const col = (re: RegExp) => enc.findIndex((c) => re.test(c));
  const i = Object.fromEntries(Object.entries(COLS).map(([k, re]) => [k, col(re)])) as Record<keyof typeof COLS, number>;
  if (i.bruto === i.neto) i.bruto = -1;
  const columnas = Object.fromEntries(Object.entries(i).map(([k, n]) => [k, n >= 0 ? filas[h][n] : null]));
  if (i.bruto < 0 && i.neto < 0) return { ...vacio("no encontré la columna del monto cobrado"), columnas };
  const metodoNeto: LecturaHoja["metodoNeto"] = i.bruto >= 0 && i.pasarela >= 0 ? "pasarela" : i.neto >= 0 ? "valor-neto" : "bruto";
  const avisos: string[] = [];
  if (metodoNeto === "bruto") avisos.push("La hoja no trae pasarela ni valor neto: la comisión se calcula sobre lo cobrado.");
  if (i.chatter < 0) avisos.push("La hoja no trae columna de Chatter.");

  const cuerpo = filas.slice(h + 1);
  const orden = detectarOrden(cuerpo.map((f) => f[i.fecha] ?? ""), ordenPorDefecto);
  const out: Transaccion[] = [];
  const desconocidas = new Set<string>();
  for (const f of cuerpo) {
    const fecha = parseFecha(f[i.fecha], orden);
    if (!fecha) continue;
    const bruto = i.bruto >= 0 ? parseMonto(f[i.bruto]) : null;
    const netoHoja = i.neto >= 0 ? parseMonto(f[i.neto]) : null;
    const base = bruto ?? netoHoja;
    if (base == null || base === 0) continue;
    const p = pasarelaDe(i.pasarela >= 0 ? f[i.pasarela] : undefined);
    if (p.desconocida) desconocidas.add(p.nombre);
    const neto = metodoNeto === "pasarela" ? redondear(base * (1 - p.fee)) : metodoNeto === "valor-neto" ? (netoHoja ?? base) : base;
    const tipo = norm(i.tipo >= 0 ? (f[i.tipo] ?? "") : "");
    out.push({
      fecha,
      tipo: /new sale|venta nueva|^nueva|^new/.test(tipo) || (!tipo && i.tipo < 0) ? "nueva" : "cuota",
      cliente: (i.cliente >= 0 ? f[i.cliente] : "")?.trim() ?? "",
      bruto: base,
      neto,
      pasarela: p.nombre,
      pasarelaDesconocida: p.desconocida,
      closer: limpio(f[i.closer]),
      setter: limpio(f[i.setter]),
      chatter: limpio(f[i.chatter]),
    });
  }
  if (desconocidas.size) avisos.push(`Pasarelas sin % configurado (cuentan 0 %): ${[...desconocidas].join(", ")}.`);
  return { transacciones: out, metodoNeto, columnas, avisos };
}

const limpio = (s: string | undefined) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return /^(-|—|n\/?a|na|ninguno|no aplica|x)$/i.test(t) ? "" : t;
};

// ─── Quién es quién ───────────────────────────────────────────────────────────────────────────

/** ¿El nombre de la hoja es esta persona? "Roger" ≈ "Roger Arteaga"; "Luis F." ≈ "Luis Fernández". */
export function mismaPersona(hoja: string, persona: string, alias: string[] = []): boolean {
  const a = tokens(hoja);
  if (!a.length) return false;
  return [persona, ...alias].some((p) => {
    const b = tokens(p);
    if (!b.length) return false;
    const [corto, largo] = a.length <= b.length ? [a, b] : [b, a];
    // Mismo primer nombre y el resto en orden, saltando segundos nombres: "Santiago Gutiérrez" ≈ "Santiago Alejandro Gutiérrez Castaño".
    const igual = (t: string, x: string | undefined) => !!x && (x === t || (t.length <= 2 && x.startsWith(t)));
    if (!igual(corto[0], largo[0])) return false;
    let k = 1;
    for (const t of corto.slice(1)) {
      while (k < largo.length && !igual(t, largo[k])) k++;
      if (k >= largo.length) return false;
      k++;
    }
    return true;
  });
}
const tokens = (s: string) =>
  norm(s)
    .replace(/\b(pdc|bori|renovacion|inactive|inactivo)\b/g, " ")
    .replace(/[^a-z0-9 .]/g, " ")
    .split(" ")
    .map((x) => x.replace(/\.$/, ""))
    .filter(Boolean);

// ─── Marcador y ranking ───────────────────────────────────────────────────────────────────────

export interface Diario {
  fecha: string;
  citas: number; // closers: citas que tenía ese día
  presentaron: number; // closers: se presentaron
  conversaciones: number; // setters / chatters
  agendas: number; // setters / chatters (lo que reporta; manda lo automático si existe)
}

export interface Tasas {
  citas: number;
  presentaron: number;
  cierres: number;
  showUp: number | null;
  cierre: number | null;
  showUpFuente: "crm" | "diario" | null;
  sinMarcar: number; // citas del CRM que ya pasaron y el closer no ha movido
  agendas: number;
  agendasFuente: "leads" | "diario";
}

// ─── Show-up desde el CRM (Leads → embudo CLOSERS) ────────────────────────────────────────────

export type ResultadoCita = "presento" | "no_show" | "cancelada" | "sin_marcar";

const normEtapa = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/** Cómo terminó una cita que ya pasó, según la etapa donde el closer dejó el lead. */
export function resultadoCita(etapa: string, estado?: string | null): ResultadoCita {
  const e = normEtapa(etapa);
  if (/cancel/.test(e)) return "cancelada";
  if (/no ?show|no se present/.test(e)) return "no_show";
  if (estado === "ganado") return "presento";
  if (/no ofertado|follow|seguimiento|pago|reserva|closed|cerrad|ganad|perdid|oferta/.test(e)) return "presento";
  return "sin_marcar"; // sigue en "Llamada agendada/reprogramada": el closer no lo ha movido
}

export interface CitasCRM {
  citas: number; // sin las canceladas
  presentaron: number;
  noShow: number;
  sinMarcar: number;
}

export function contarCitas(rs: ResultadoCita[]): CitasCRM {
  const n = (r: ResultadoCita) => rs.filter((x) => x === r).length;
  return { citas: rs.length - n("cancelada"), presentaron: n("presento"), noShow: n("no_show"), sinMarcar: n("sin_marcar") };
}

/**
 * Show-up = presentaron ÷ (presentaron + no show). Sale del CRM (así lo mide Nahuel); si el closer no tiene citas
 * marcadas en el CRM (p. ej. AI Borinquen, que todavía no agenda por Leads), del diario. Las citas sin marcar no
 * cuentan ni a favor ni en contra: se le recuerdan. Cierre = ventas nuevas de la hoja ÷ presentaron.
 */
export function tasasDelMes(p: { diario: Diario[]; cierresHoja: number; agendasLeads: number; crm?: CitasCRM | null }): Tasas {
  const agendasDiario = p.diario.reduce((s, d) => s + d.agendas, 0);
  const marcadasCRM = p.crm ? p.crm.presentaron + p.crm.noShow : 0;
  let citas: number;
  let presentaron: number;
  let showUpFuente: Tasas["showUpFuente"];
  if (p.crm && marcadasCRM > 0) {
    citas = marcadasCRM;
    presentaron = p.crm.presentaron;
    showUpFuente = "crm";
  } else {
    citas = p.diario.reduce((s, d) => s + d.citas, 0);
    presentaron = p.diario.reduce((s, d) => s + d.presentaron, 0);
    showUpFuente = citas > 0 ? "diario" : null;
  }
  return {
    citas,
    presentaron,
    cierres: p.cierresHoja,
    showUp: citas > 0 ? Math.min(1, presentaron / citas) : null,
    cierre: presentaron > 0 ? Math.min(1, p.cierresHoja / presentaron) : null,
    showUpFuente,
    sinMarcar: p.crm?.sinMarcar ?? 0,
    agendas: p.agendasLeads > 0 ? p.agendasLeads : agendasDiario,
    agendasFuente: p.agendasLeads > 0 ? "leads" : "diario",
  };
}

export interface Marcador {
  hoy: number;
  semana: number;
  mes: number;
  nuevasMes: number;
  ventasMes: number; // transacciones
  cierresMes: number; // ventas nuevas
  netoMes: number;
  pct: number;
  comision: number;
  tasas: Tasas;
  siguiente: string | null;
}

export function transaccionesDe(txs: Transaccion[], rol: RolVentas, nombre: string, alias: string[] = []): Transaccion[] {
  return txs.filter((t) => mismaPersona(t[rol], nombre, alias));
}

export function marcador(p: { txs: Transaccion[]; rol: RolVentas; hoy: string; semana: string[]; tasas: Tasas }): Marcador {
  const suma = (xs: Transaccion[], k: "bruto" | "neto" = "bruto") => redondear(xs.reduce((s, t) => s + t[k], 0));
  const netoMes = suma(p.txs, "neto");
  const pctR = pctDe(p.rol, p.tasas);
  return {
    hoy: suma(p.txs.filter((t) => t.fecha === p.hoy)),
    semana: suma(p.txs.filter((t) => p.semana.includes(t.fecha))),
    mes: suma(p.txs),
    nuevasMes: suma(p.txs.filter((t) => t.tipo === "nueva")),
    ventasMes: p.txs.length,
    cierresMes: p.txs.filter((t) => t.tipo === "nueva").length,
    netoMes,
    pct: pctR,
    comision: redondear(netoMes * pctR),
    tasas: p.tasas,
    siguiente: siguienteTramo(p.rol, p.tasas),
  };
}

export interface Corredor {
  nombre: string;
  userId: string | null;
  monto: number;
  ventas: number;
}

/** La carrera: cash collected del mes por persona en ese rol (sin comisiones: esas son privadas). */
export function carrera(txs: Transaccion[], rol: RolVentas, personas: { userId: string; nombre: string; alias?: string[] }[]): Corredor[] {
  const m = new Map<string, Corredor>();
  for (const t of txs) {
    const quien = t[rol];
    if (!quien) continue;
    const p = personas.find((x) => mismaPersona(quien, x.nombre, x.alias));
    const k = p ? p.userId : `hoja:${norm(quien)}`;
    const c = m.get(k) ?? { nombre: p?.nombre ?? quien, userId: p?.userId ?? null, monto: 0, ventas: 0 };
    c.monto = redondear(c.monto + t.bruto);
    c.ventas++;
    m.set(k, c);
  }
  return [...m.values()].sort((a, b) => b.monto - a.monto);
}

// ─── Equipo: metas y alerta ───────────────────────────────────────────────────────────────────

export function diasDelMes(dia: string): number {
  const [y, m] = dia.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Semana lunes → domingo del día. */
export function semanaDe(dia: string): string[] {
  const t = Date.parse(`${dia}T12:00:00Z`);
  const dow = (new Date(t).getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, k) => new Date(t + (k - dow) * 86_400_000).toISOString().slice(0, 10));
}

export interface Equipo {
  hoy: number;
  semana: number;
  mes: number;
  nuevasMes: number;
  metaDia: number;
  metaSemana: number;
  metas: MetasEmpresa;
  ritmoMes: number; // a dónde llega el mes a este paso
  alerta: { nivel: "rojo" | "ambar" | null; texto: string } | null;
}

export function equipo(txs: Transaccion[], empresa: Empresa, hoy: string, horaPR: number): Equipo {
  const metas = METAS[empresa];
  const suma = (xs: Transaccion[]) => redondear(xs.reduce((s, t) => s + t.bruto, 0));
  const semana = semanaDe(hoy);
  const dHoy = suma(txs.filter((t) => t.fecha === hoy));
  const mes = suma(txs);
  const dia = Number(hoy.slice(8, 10));
  const total = diasDelMes(hoy);
  const metaDia = Math.round(metas.mesTotal / total);
  let alerta: Equipo["alerta"] = null;
  if (horaPR >= 12 && dHoy === 0) alerta = { nivel: "rojo", texto: "Hoy no se ha vendido nada todavía" };
  else if (horaPR >= 15 && dHoy < metaDia) alerta = { nivel: "ambar", texto: `Vamos ${Math.round((dHoy / metaDia) * 100)} % de la meta de hoy (${dinero(metaDia)})` };
  return {
    hoy: dHoy,
    semana: suma(txs.filter((t) => semana.includes(t.fecha))),
    mes,
    nuevasMes: suma(txs.filter((t) => t.tipo === "nueva")),
    metaDia,
    metaSemana: metas.semana,
    metas,
    ritmoMes: dia > 0 ? Math.round((mes / dia) * total) : 0,
    alerta,
  };
}

// ─── Diario y bonos ───────────────────────────────────────────────────────────────────────────

export const MAX_NOTA_DIARIO = 400;

export function errorDiario(d: { citas: number; presentaron: number; conversaciones: number; agendas: number; nota?: string | null }): string | null {
  for (const [k, v] of Object.entries({ citas: d.citas, presentaron: d.presentaron, conversaciones: d.conversaciones, agendas: d.agendas })) {
    if (!Number.isInteger(v) || v < 0 || v > 1000) return `Revisa ${k}`;
  }
  if (d.presentaron > d.citas) return "No pueden presentarse más de las citas que tenías";
  if ((d.nota ?? "").length > MAX_NOTA_DIARIO) return `Máximo ${MAX_NOTA_DIARIO} caracteres`;
  return null;
}

export type EstadoBono = "propuesto" | "autorizado" | "ganado" | "pagado" | "rechazado" | "cerrado";

export function errorBono(b: { titulo: string; monto: number; hasta: string | null; desde: string }): string | null {
  if (b.titulo.trim().length < 4) return "Ponle un título";
  if (!Number.isFinite(b.monto) || b.monto <= 0 || b.monto > 10_000) return "Monto entre $1 y $10,000";
  if (b.hasta && b.hasta < b.desde) return "La fecha final va después del inicio";
  return null;
}

/** Semana de lunes a domingo de un diario: totales para el resumen automático. */
export function resumenDiario(dias: Diario[]) {
  const s = (k: keyof Omit<Diario, "fecha">) => dias.reduce((t, d) => t + d[k], 0);
  const citas = s("citas");
  const presentaron = s("presentaron");
  return { dias: dias.length, citas, presentaron, conversaciones: s("conversaciones"), agendas: s("agendas"), showUp: citas ? presentaron / citas : null };
}

// ─── Utilidades ───────────────────────────────────────────────────────────────────────────────

export function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
export const redondear = (n: number) => Math.round(n * 100) / 100;
export const pct = (n: number) => `${Math.round(n * 100)} %`;
export const dinero = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: n % 1 ? 2 : 0 });

/** "$3.500,00" (AIB), "$3,500.00" (LU), "3500" → número; vacío o texto → null. (Igual que lib/resumen-dia.) */
export function parseMonto(s: string | undefined): number | null {
  if (!s) return null;
  let t = s.replace(/[^\d.,-]/g, "");
  if (!/\d/.test(t)) return null;
  const neg = t.startsWith("-") || /^\s*\(.*\)\s*$/.test(s);
  t = t.replace(/-/g, "");
  const p = t.lastIndexOf(".");
  const c = t.lastIndexOf(",");
  if (c > p) t = /,\d{1,2}$/.test(t) ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (p > c) t = /\.\d{1,2}$/.test(t) ? t.replace(/,/g, "") : t.replace(/[.,]/g, "");
  const n = Number(t);
  return Number.isFinite(n) ? redondear(neg ? -n : n) : null;
}

export function parseFecha(s: string | undefined, orden: "dmy" | "mdy"): string | null {
  if (!s) return null;
  const t = s.trim();
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (!m) return null;
  let [a, b] = [Number(m[1]), Number(m[2])];
  const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  if (orden === "mdy") [a, b] = [b, a];
  if (b < 1 || b > 12 || a < 1 || a > 31) return null;
  return `${y}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
}

export function detectarOrden(valores: string[], porDefecto: "dmy" | "mdy"): "dmy" | "mdy" {
  for (const v of valores) {
    const m = v.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}/);
    if (!m) continue;
    if (Number(m[1]) > 12) return "dmy";
    if (Number(m[2]) > 12) return "mdy";
  }
  return porDefecto;
}

// ─── KPIs del diario por puesto (Elvin, 28/sep) ────────────────────────────────────────────────────────────
// Setter (phone setter): llamadas realizadas, conectadas, agendadas, show, no show.
// Chatter (Ana Cecilio, Dilan): conversaciones (personas que hablaron contigo), pases (le sacaste el número y lo pasaste a
// llamada porque no agendó por chat), citas agendadas, show, no show.
// Closer (Laura, Roger, Paola…): demos, cerradas, no cerradas + cash collected (sale de la hoja, no se anota).
export const KPIS_VENTAS: Record<RolVentas, { id: string; nombre: string; ayuda?: string }[]> = {
  setter: [
    { id: "llamadas", nombre: "Llamadas realizadas" },
    { id: "conectadas", nombre: "Llamadas conectadas", ayuda: "Te contestaron" },
    { id: "agendadas", nombre: "Llamadas agendadas" },
    { id: "show", nombre: "Show", ayuda: "Citas tuyas que se presentaron" },
    { id: "no_show", nombre: "No show" },
  ],
  chatter: [
    { id: "conversaciones", nombre: "Conversaciones", ayuda: "Personas que hablaron contigo (no mensajes enviados)" },
    { id: "pases", nombre: "Pases", ayuda: "Le sacaste el número y lo pasaste a llamada porque no agendó por el chat" },
    { id: "agendadas", nombre: "Citas agendadas" },
    { id: "show", nombre: "Show" },
    { id: "no_show", nombre: "No show" },
  ],
  closer: [
    { id: "demos", nombre: "Demos", ayuda: "Llamadas de venta que hiciste (la persona se presentó)" },
    { id: "cerradas", nombre: "Cerradas" },
    { id: "no_cerradas", nombre: "No cerradas" },
  ],
};

/** Valida y limpia los KPIs del diario de un puesto (solo los suyos, enteros 0-1000). */
export function limpiarKpis(rol: RolVentas, kpis: Record<string, unknown>): { kpis: Record<string, number>; error: string | null } {
  const out: Record<string, number> = {};
  for (const k of KPIS_VENTAS[rol]) {
    const v = Number(kpis?.[k.id] ?? 0);
    if (!Number.isInteger(v) || v < 0 || v > 1000) return { kpis: {}, error: `Revisa ${k.nombre.toLowerCase()}` };
    if (v) out[k.id] = v;
  }
  if (rol === "closer" && (out.cerradas ?? 0) + (out.no_cerradas ?? 0) > (out.demos ?? 0)) return { kpis: {}, error: "Cerradas + no cerradas no pueden pasar de las demos" };
  return { kpis: out, error: null };
}

/** Suma de los KPIs del diario en el mes (para el marcador y la tabla del director). */
export function kpisDelMes(dias: { kpis?: Record<string, number> | null }[]): Record<string, number> {
  const t: Record<string, number> = {};
  for (const d of dias) for (const [k, v] of Object.entries(d.kpis ?? {})) t[k] = (t[k] ?? 0) + v;
  return t;
}

/** Los campos viejos del diario (citas, presentaron, conversaciones, agendas) que usan show-up y comisión, desde los KPIs nuevos. */
export function camposViejos(rol: RolVentas, k: Record<string, number>) {
  if (rol === "closer") return { citas: 0, presentaron: k.demos ?? 0, conversaciones: 0, agendas: 0 };
  return { citas: 0, presentaron: 0, conversaciones: rol === "chatter" ? (k.conversaciones ?? 0) : (k.conectadas ?? 0), agendas: k.agendadas ?? 0 };
}

// ─── Ranking de ventas con metas diarias (30/sep, Elvin) ─────────────────────────────────────────
// "A los setters se les piden 125 llamadas diarias… conectar por lo menos 30… 3 a 5 agendas. Los chatters, 20 a 30
// conversaciones (mínimo 15), 5 a 10 pases y 3 a 5 agendas. Los closers, 30 % de close rate: menos de 20 alerta roja,
// 20 a 30 amarilla, 30 para arriba súper, 40 élite (se puede considerar bono)." Lo ven Nahuel, Aure y Elvin en la Arena.

export interface MetaDiaria {
  min: number; // por debajo = rojo
  meta: number; // desde aquí = verde
  top?: number; // excelente
}

export const METAS_DIARIAS: Partial<Record<RolVentas, Record<string, MetaDiaria>>> = {
  setter: { llamadas: { min: 100, meta: 125 }, conectadas: { min: 25, meta: 30 }, agendadas: { min: 3, meta: 3, top: 5 } },
  chatter: { conversaciones: { min: 15, meta: 20, top: 30 }, pases: { min: 5, meta: 5, top: 10 }, agendadas: { min: 3, meta: 3, top: 5 } },
};

export const CLOSE_RATE = { rojo: 20, super: 30, elite: 40 };

export type Nivel = "elite" | "verde" | "amarillo" | "rojo" | "sin-datos";

export interface FilaRankingVentas {
  posicion: number;
  userId: string;
  nombre: string;
  rol: RolVentas;
  dias: number;
  nivel: Nivel;
  puntaje: number; // 0-100 para ordenar
  indicadores: { id: string; nombre: string; valor: number; meta: string; nivel: Nivel; unidad: "/día" | "%" | "total" }[];
  recomendaciones: string[];
  cash: number;
}

const nivelDe = (v: number, m: MetaDiaria): Nivel => (m.top !== undefined && v >= m.top ? "elite" : v >= m.meta ? "verde" : v >= m.min ? "amarillo" : "rojo");
const PEOR: Nivel[] = ["sin-datos", "rojo", "amarillo", "verde", "elite"];
const r1 = (x: number) => Math.round(x * 10) / 10;

export function nivelCloseRate(pct: number): Nivel {
  return pct >= CLOSE_RATE.elite ? "elite" : pct >= CLOSE_RATE.super ? "verde" : pct >= CLOSE_RATE.rojo ? "amarillo" : "rojo";
}

export function rankingVentas(gente: { userId: string; nombre: string; rol: RolVentas; mes: Record<string, number>; cash: number; dias: number }[]): FilaRankingVentas[] {
  const filas = gente.map((g): Omit<FilaRankingVentas, "posicion"> => {
    const nombreKpi = (id: string) => KPIS_VENTAS[g.rol].find((k) => k.id === id)?.nombre ?? id;
    const rec: string[] = [];
    if (!g.dias) {
      return { userId: g.userId, nombre: g.nombre, rol: g.rol, dias: 0, nivel: "sin-datos", puntaje: 0, indicadores: [], recomendaciones: ["No ha llenado su diario este mes: sin eso no se puede medir ni comisionar bien."], cash: g.cash };
    }
    if (g.rol === "closer") {
      const demos = g.mes.demos ?? 0;
      const cerradas = g.mes.cerradas ?? 0;
      const pct = demos ? Math.round((cerradas / demos) * 100) : 0;
      const nivel: Nivel = demos ? nivelCloseRate(pct) : "sin-datos";
      if (!demos) rec.push("No tiene demos anotadas este mes.");
      else if (nivel === "rojo") rec.push(`Close rate de ${pct} %: alerta roja (menos de ${CLOSE_RATE.rojo} %). Revisar sus llamadas con Nahuel: objeciones, oferta y cierre.`);
      else if (nivel === "amarillo") rec.push(`Va en ${pct} %: le faltan ${CLOSE_RATE.super - pct} puntos para el ${CLOSE_RATE.super} %. Practicar el cierre y el seguimiento de los que dijeron "lo pienso".`);
      else if (nivel === "elite") rec.push(`Close rate élite (${pct} %): candidato a bono.`);
      const indicadores = [
        { id: "close_rate", nombre: "Close rate", valor: pct, meta: `${CLOSE_RATE.super} % (élite ${CLOSE_RATE.elite} %)`, nivel, unidad: "%" as const },
        { id: "demos", nombre: "Demos", valor: demos, meta: "—", nivel: "verde" as Nivel, unidad: "total" as const },
        { id: "cerradas", nombre: "Cerradas", valor: cerradas, meta: "—", nivel: "verde" as Nivel, unidad: "total" as const },
      ];
      return { userId: g.userId, nombre: g.nombre, rol: g.rol, dias: g.dias, nivel, puntaje: demos ? Math.min(100, (pct / CLOSE_RATE.elite) * 100) : 0, indicadores, recomendaciones: rec, cash: g.cash };
    }
    const metas = METAS_DIARIAS[g.rol] ?? {};
    const indicadores = Object.entries(metas).map(([id, m]) => {
      const prom = r1((g.mes[id] ?? 0) / g.dias);
      return { id, nombre: nombreKpi(id), valor: prom, meta: m.top ? `${m.meta}–${m.top}` : `${m.meta}`, nivel: nivelDe(prom, m), unidad: "/día" as const };
    });
    for (const i of indicadores) if (i.nivel === "rojo" || i.nivel === "amarillo") rec.push(`Subir ${i.nombre.toLowerCase()}: promedia ${i.valor} al día y la meta es ${i.meta}.`);
    if (g.rol === "setter" && (g.mes.llamadas ?? 0) > 0) {
      const conexion = Math.round(((g.mes.conectadas ?? 0) / (g.mes.llamadas ?? 1)) * 100);
      if (conexion < 20) rec.push(`Conecta el ${conexion} % de sus llamadas: revisar horarios y lista (la meta es 30 de 125 ≈ 24 %).`);
    }
    if (!rec.length) rec.push("Va en meta en todo. 👏");
    const nivel = indicadores.reduce<Nivel>((peor, i) => (PEOR.indexOf(i.nivel) < PEOR.indexOf(peor) ? i.nivel : peor), "elite");
    const puntaje = Math.round(indicadores.reduce((s, i) => s + Math.min(1.2, i.valor / (metas[i.id].meta || 1)), 0) / Math.max(1, indicadores.length) * (100 / 1.2));
    return { userId: g.userId, nombre: g.nombre, rol: g.rol, dias: g.dias, nivel, puntaje, indicadores, recomendaciones: rec, cash: g.cash };
  });
  const orden: RolVentas[] = ["closer", "setter", "chatter"];
  return filas
    .sort((a, b) => orden.indexOf(a.rol) - orden.indexOf(b.rol) || b.puntaje - a.puntaje || b.cash - a.cash)
    .map((f, i, xs) => ({ ...f, posicion: xs.slice(0, i).filter((x) => x.rol === f.rol).length + 1 }));
}

// ─── Escalones del director de ventas (30/sep, Elvin) ─────────────────────────────────────────
// Metas de Nahuel en Level Up: SOLO ventas nuevas cobradas en el mes (New Sale de la hoja). Nada de
// renovaciones, upsells a clientes, mensualidades ni lo que cobra tesorería. Es una referencia para él,
// no una métrica que tenga que llenar.
export const ESCALONES_DIRECTOR: Partial<Record<Empresa, number[]>> = { level_up: [50_000, 75_000, 100_000] };

export function escalones(valor: number, metas: number[]): { metas: { meta: number; logrado: boolean; falta: number }[]; siguiente: { meta: number; falta: number; n: number } | null } {
  const lista = [...metas].sort((a, b) => a - b).map((meta) => ({ meta, logrado: valor >= meta, falta: redondear(Math.max(0, meta - valor)) }));
  const i = lista.findIndex((m) => !m.logrado);
  return { metas: lista, siguiente: i < 0 ? null : { meta: lista[i].meta, falta: lista[i].falta, n: i + 1 } };
}
