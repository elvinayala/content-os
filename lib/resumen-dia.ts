// Resumen del día para Elvin por Telegram (27/sep/2026): "cuántas llamadas se agendaron hoy, cuánto
// en ventas nuevas y cuánto en renovaciones, Level Up y AI Borinquen por separado", ~8:30 PM PR.
// Lógica pura (tests en tests/resumen-dia.test.mjs); los datos los junta lib/resumen-dia-datos.ts.

export type MarcaResumen = "level_up" | "ai_borinquen";
export const NOMBRE_MARCA: Record<MarcaResumen, string> = { level_up: "Level Up", ai_borinquen: "AI Borinquen" };

const TZ = "America/Puerto_Rico";
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Día (YYYY-MM-DD) en hora de Puerto Rico. */
export function diaPR(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Inicio del día PR en UTC (PR = UTC−4 todo el año, sin horario de verano). */
export function inicioDiaPR(dia: string): Date {
  return new Date(`${dia}T04:00:00.000Z`);
}

/** Pestaña del mes en cada hoja: LU "LUM Sales Septiembre 2026", AIB "Septiembre". */
export function pestanasDelMes(marca: MarcaResumen, dia: string): string[] {
  const [y, m] = dia.split("-").map(Number);
  const mes = MESES[m - 1];
  return marca === "level_up" ? [`lum sales ${mes} ${y}`] : [`${mes} ${y}`, mes];
}

/** "$3.500,00" (AIB), "$3,500.00" (LU), "3500", "-$250,00" → número; vacío o texto → null. */
export function parseMonto(s: string | undefined): number | null {
  if (!s) return null;
  let t = s.replace(/[^\d.,-]/g, "");
  if (!/\d/.test(t)) return null;
  const neg = t.startsWith("-") || /^\s*\(.*\)\s*$/.test(s);
  t = t.replace(/-/g, "");
  const ultimoPunto = t.lastIndexOf(".");
  const ultimaComa = t.lastIndexOf(",");
  if (ultimaComa > ultimoPunto) {
    // coma decimal si le siguen 1-2 dígitos; si no, es separador de miles ("3,500")
    t = /,\d{1,2}$/.test(t) ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (ultimoPunto > ultimaComa) {
    t = /\.\d{1,2}$/.test(t) ? t.replace(/,/g, "") : t.replace(/[.,]/g, "");
  }
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.round((neg ? -n : n) * 100) / 100;
}

/** Fecha de la hoja → YYYY-MM-DD. `orden` dice si es día/mes o mes/día cuando no se puede saber. */
export function parseFecha(s: string | undefined, orden: "dmy" | "mdy"): string | null {
  if (!s) return null;
  const t = s.trim();
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!m) return null;
  let [a, b] = [Number(m[1]), Number(m[2])];
  const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  if (orden === "mdy") [a, b] = [b, a];
  if (b < 1 || b > 12 || a < 1 || a > 31) return null;
  return `${y}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
}

/** Mira todas las fechas de la columna: si alguna trae el 1.º número > 12 es día/mes; si el 2.º > 12, mes/día. */
export function detectarOrden(valores: string[], porDefecto: "dmy" | "mdy"): "dmy" | "mdy" {
  for (const v of valores) {
    const m = v.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}$/);
    if (!m) continue;
    if (Number(m[1]) > 12) return "dmy";
    if (Number(m[2]) > 12) return "mdy";
  }
  return porDefecto;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export interface Suma {
  monto: number;
  n: number;
}
export interface VentasDia {
  nuevas: Suma;
  renovaciones: Suma; // todo lo que no es venta nueva: cuotas, mensualidades, renovaciones ("Payment of debt")
  error?: string;
}

/**
 * Suma lo cobrado en `dia` según las columnas de la hoja: fecha ("Fecha…"), monto ("Valor Neto…", o
 * "Pago Inicial…" si no hay neto) y tipo ("Tipo de Transacción": "New Sale" = venta nueva; lo demás =
 * renovación / cuota). El encabezado se busca en las primeras 10 filas.
 */
export function ventasDelDia(filas: string[][], dia: string, ordenPorDefecto: "dmy" | "mdy"): VentasDia {
  const vacio = { nuevas: { monto: 0, n: 0 }, renovaciones: { monto: 0, n: 0 } };
  const h = filas.slice(0, 10).findIndex((f) => f.some((c) => /^fecha/.test(norm(c))) && f.some((c) => /tipo de transacc/.test(norm(c))));
  if (h < 0) return { ...vacio, error: "no encontré las columnas Fecha y Tipo de transacción" };
  const enc = filas[h].map(norm);
  const iFecha = enc.findIndex((c) => /^fecha/.test(c));
  const iTipo = enc.findIndex((c) => /tipo de transacc/.test(c));
  let iMonto = enc.findIndex((c) => /valor neto/.test(c));
  if (iMonto < 0) iMonto = enc.findIndex((c) => /pago inicial|monto|total cobrado/.test(c));
  if (iMonto < 0) return { ...vacio, error: "no encontré la columna del monto (Valor Neto)" };
  const cuerpo = filas.slice(h + 1);
  const orden = detectarOrden(cuerpo.map((f) => f[iFecha] ?? ""), ordenPorDefecto);
  const r: VentasDia = { nuevas: { monto: 0, n: 0 }, renovaciones: { monto: 0, n: 0 } };
  for (const f of cuerpo) {
    if (parseFecha(f[iFecha], orden) !== dia) continue;
    const monto = parseMonto(f[iMonto]);
    if (monto === null || monto === 0) continue;
    const tipo = norm(f[iTipo] ?? "");
    const destino = /new sale|venta nueva|^nueva/.test(tipo) ? r.nuevas : r.renovaciones;
    destino.monto = Math.round((destino.monto + monto) * 100) / 100;
    destino.n++;
  }
  return r;
}

// ---------- Llamadas (Calendly) ----------

export interface EventoCalendly {
  name: string;
  status: string;
  created_at: string;
  updated_at?: string;
}
export interface Agendas {
  llamadas: number; // con closers (todo lo que no es onboarding)
  onboardings: number;
  canceladas: number; // canceladas hoy (de cualquier fecha)
}

/** Lo agendado HOY (el día en que la persona reservó, no el de la cita). */
export function contarAgendas(eventos: EventoCalendly[], dia: string, esOnboarding: (nombre: string) => boolean): Agendas {
  const r: Agendas = { llamadas: 0, onboardings: 0, canceladas: 0 };
  for (const e of eventos) {
    if (e.status === "canceled") {
      if (e.updated_at && diaPR(new Date(e.updated_at)) === dia) r.canceladas++;
      continue;
    }
    if (diaPR(new Date(e.created_at)) !== dia) continue;
    if (esOnboarding(e.name)) r.onboardings++;
    else r.llamadas++;
  }
  return r;
}

// ---------- Mensaje ----------

export interface ResumenMarca {
  marca: MarcaResumen;
  agendas: Agendas | null; // null = no se pudo leer Calendly
  ventas: VentasDia | null; // null = la hoja todavía no está conectada
}

export const dinero = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

export function fechaLarga(dia: string): string {
  return new Intl.DateTimeFormat("es-PR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${dia}T12:00:00Z`));
}

/** Texto para Telegram (formato Slack: *negrita*; enviarTelegram lo pasa a HTML). */
export function textoResumen(dia: string, marcas: ResumenMarca[]): string {
  const lineas: string[] = [`📊 *Resumen del día* · ${fechaLarga(dia)}`];
  let totLlamadas = 0;
  let totNuevas = 0;
  let totRenov = 0;
  let ventasCompletas = true;
  for (const m of marcas) {
    lineas.push("", `*${NOMBRE_MARCA[m.marca]}*`);
    if (m.agendas) {
      totLlamadas += m.agendas.llamadas;
      const extra = [m.agendas.onboardings ? `${m.agendas.onboardings} onboarding${m.agendas.onboardings === 1 ? "" : "s"}` : "", m.agendas.canceladas ? `${m.agendas.canceladas} cancelada${m.agendas.canceladas === 1 ? "" : "s"}` : ""].filter(Boolean);
      lineas.push(`📞 Llamadas agendadas hoy: *${m.agendas.llamadas}*${extra.length ? ` (+ ${extra.join(" · ")})` : ""}`);
    } else lineas.push("📞 Llamadas: no pude leer Calendly");
    if (m.ventas && !m.ventas.error) {
      totNuevas += m.ventas.nuevas.monto;
      totRenov += m.ventas.renovaciones.monto;
      lineas.push(`💰 Ventas nuevas: *${dinero(m.ventas.nuevas.monto)}*${m.ventas.nuevas.n ? ` (${m.ventas.nuevas.n})` : ""}`);
      lineas.push(`🔁 Renovaciones y cuotas: *${dinero(m.ventas.renovaciones.monto)}*${m.ventas.renovaciones.n ? ` (${m.ventas.renovaciones.n})` : ""}`);
    } else {
      ventasCompletas = false;
      lineas.push(m.ventas?.error ? `💰 Ventas: no pude leer la hoja (${m.ventas.error})` : "💰 Ventas: falta conectar la hoja de ventas");
    }
  }
  if (marcas.length > 1) {
    lineas.push("", `*Total:* ${totLlamadas} llamadas${ventasCompletas ? ` · ${dinero(totNuevas)} en ventas nuevas · ${dinero(totRenov)} en renovaciones y cuotas` : ""}`);
  }
  lineas.push("", "_Ventas = valor neto registrado hoy en la hoja de tesorería._");
  return lineas.join("\n");
}
