// Ranking de productividad del equipo (30/sep, Elvin: "un ranking de hasta el 100… con lo bueno, con lo malo, con lo que
// tiene que mejorar… mensual" y "una alerta de algún empleado que lleva días con baja productividad"). Puro (tests en
// tests/ranking.test.mjs): lo usan la pestaña Ranking, el reporte del día y el reporte mensual a RR.HH./Carilin.
//
// Índice 0-100 (no es el score oficial, que sigue en calibración):
//  - Asistencia (30 %): promedio del puntaje de asistencia de los días que le tocaba (a tiempo 100, tarde 85/70/50, sin marcar 0).
//  - Constancia (20 %): % de los días trabajados en que anotó sus KPIs al salir.
//  - Producción (50 %): por cada KPI de su puesto, su total del período contra el mejor de su mismo puesto (el mejor = 100).
//  Puestos sin KPIs que reportar: el índice es solo la asistencia. Si un componente no aplica, los demás se reparten su peso.

export interface DiaRank {
  fecha: string;
  estado: string; // libre | pendiente | trabajando | a_tiempo | tarde | ausente
  puntaje: number | null; // asistencia del día
  minutosTarde: number;
  almuerzoMin: number | null;
  reporto: boolean; // anotó sus KPIs ese día
  datos: Record<string, number>;
}

export interface PersonaRank {
  id: string;
  nombre: string;
  puesto: string;
  puestoNombre: string;
  departamento: string;
  kpis: { id: string; nombre: string }[];
  dias: DiaRank[];
}

export interface FilaRanking {
  posicion: number;
  id: string;
  nombre: string;
  puestoNombre: string;
  departamento: string;
  indice: number;
  asistencia: number | null;
  constancia: number | null;
  produccion: number | null;
  totales: { id: string; nombre: string; total: number; lider: number }[];
  diasTrabajados: number;
  bueno: string[];
  malo: string[];
  mejorar: string[];
}

const TRABAJO = ["trabajando", "a_tiempo", "tarde"];
const tocaba = (d: DiaRank) => d.estado !== "libre" && d.estado !== "pendiente";
const trabajo = (d: DiaRank) => TRABAJO.includes(d.estado);
const prom = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const red = (x: number | null) => (x === null ? null : Math.round(x));

/** Un día "bajo": no marcó, llegó más de 30 min tarde, o tiene KPIs y no reportó / reportó todo en 0. */
export function diaBajo(d: DiaRank, tieneKpis: boolean): boolean {
  if (!tocaba(d)) return false;
  if (d.estado === "ausente") return true;
  if (d.minutosTarde > 30) return true;
  if (tieneKpis && d.estado !== "trabajando" && (!d.reporto || Object.values(d.datos).every((v) => !v))) return true;
  return false;
}

/** Racha de días bajos seguidos (los últimos días que le tocaba trabajar). Alerta desde 3. */
export function rachaBaja(p: PersonaRank, minimo = 3): { dias: number; motivo: string } | null {
  const tiene = p.kpis.length > 0;
  const laborables = p.dias.filter(tocaba);
  let n = 0;
  const motivos = new Set<string>();
  for (let i = laborables.length - 1; i >= 0; i--) {
    const d = laborables[i];
    if (d.estado === "trabajando") continue; // hoy, todavía no termina
    if (!diaBajo(d, tiene)) break;
    n++;
    motivos.add(d.estado === "ausente" ? "sin marcar" : d.minutosTarde > 30 ? "llegadas tarde" : "sin KPIs o en 0");
  }
  return n >= minimo ? { dias: n, motivo: [...motivos].join(", ") } : null;
}

export function rankingMes(personas: PersonaRank[]): FilaRanking[] {
  // Totales por KPI y el mejor de cada puesto (para comparar entre pares).
  const totales = new Map<string, Record<string, number>>();
  for (const p of personas) {
    const t: Record<string, number> = {};
    for (const k of p.kpis) t[k.id] = p.dias.reduce((s, d) => s + (d.datos[k.id] ?? 0), 0);
    totales.set(p.id, t);
  }
  const lider = (puesto: string, kpi: string) => Math.max(0, ...personas.filter((p) => p.puesto === puesto).map((p) => totales.get(p.id)![kpi] ?? 0));
  const pares = (puesto: string) => personas.filter((p) => p.puesto === puesto).length;

  const filas = personas.map((p): Omit<FilaRanking, "posicion"> => {
    const lab = p.dias.filter(tocaba);
    const trab = p.dias.filter(trabajo);
    const asistencia = red(prom(lab.map((d) => d.puntaje ?? (d.estado === "ausente" ? 0 : 100))));
    const tiene = p.kpis.length > 0;
    const cerrados = trab.filter((d) => d.estado !== "trabajando");
    const constancia = tiene && cerrados.length ? red((cerrados.filter((d) => d.reporto).length / cerrados.length) * 100) : null;
    const t = totales.get(p.id)!;
    const porKpi = p.kpis.map((k) => ({ id: k.id, nombre: k.nombre, total: t[k.id] ?? 0, lider: lider(p.puesto, k.id) }));
    const notas = porKpi.filter((k) => k.lider > 0).map((k) => (k.total / k.lider) * 100);
    const produccion = tiene ? red(prom(notas)) : null;
    const partes: [number | null, number][] = tiene ? [[asistencia, 30], [constancia, 20], [produccion, 50]] : [[asistencia, 100]];
    const validas = partes.filter(([v]) => v !== null) as [number, number][];
    const peso = validas.reduce((s, [, w]) => s + w, 0);
    const indice = peso ? Math.round(validas.reduce((s, [v, w]) => s + v * w, 0) / peso) : 0;

    // Lo bueno, lo malo y qué mejorar, en palabras.
    const bueno: string[] = [];
    const malo: string[] = [];
    const ausentes = lab.filter((d) => d.estado === "ausente").length;
    const tardes = trab.filter((d) => d.minutosTarde > 15);
    const almuerzos = p.dias.filter((d) => (d.almuerzoMin ?? 0) > 65).length;
    if (asistencia !== null && asistencia >= 95 && lab.length) bueno.push("Puntual todo el período");
    if (constancia === 100 && cerrados.length >= 3) bueno.push("Reportó sus KPIs todos los días");
    for (const k of porKpi) {
      if (k.total > 0 && k.total === k.lider && pares(p.puesto) > 1) bueno.push(`Líder en ${k.nombre.toLowerCase()} (${k.total})`);
      else if (k.total > 0 && pares(p.puesto) === 1) bueno.push(`${k.total} ${k.nombre.toLowerCase()}`);
    }
    if (ausentes) malo.push(`${ausentes} ${ausentes === 1 ? "día" : "días"} sin marcar`);
    if (tardes.length >= 2) malo.push(`Llegó tarde ${tardes.length} días (prom. ${Math.round(prom(tardes.map((d) => d.minutosTarde))!)} min)`);
    if (almuerzos >= 2) malo.push(`${almuerzos} almuerzos de más de 1 hora`);
    const sinReporte = cerrados.filter((d) => !d.reporto).length;
    if (tiene && sinReporte >= 2) malo.push(`No anotó sus KPIs ${sinReporte} días`);
    for (const k of porKpi) if (k.total === 0 && k.lider > 0) malo.push(`0 en ${k.nombre.toLowerCase()} (el mejor del puesto: ${k.lider})`);

    const mejorar: string[] = [];
    const flojos = ([["asistencia", asistencia], ["constancia", constancia], ["produccion", produccion]] as const).filter(([, v]) => v !== null && v < 80).sort((a, b) => (a[1] as number) - (b[1] as number));
    for (const [c] of flojos.slice(0, 2)) {
      if (c === "asistencia") mejorar.push("Puntualidad: marcar a su hora todos los días");
      if (c === "constancia") mejorar.push("Anotar sus KPIs cada día al marcar la salida");
      if (c === "produccion") {
        const peor = porKpi.filter((k) => k.lider > 0).sort((a, b) => a.total / a.lider - b.total / b.lider)[0];
        if (peor) mejorar.push(`Subir ${peor.nombre.toLowerCase()}: ${peor.total} vs. ${peor.lider} del mejor del puesto`);
      }
    }
    return { id: p.id, nombre: p.nombre, puestoNombre: p.puestoNombre, departamento: p.departamento, indice, asistencia, constancia, produccion, totales: porKpi, diasTrabajados: trab.length, bueno: bueno.slice(0, 3), malo: malo.slice(0, 3), mejorar };
  });
  return filas.sort((a, b) => b.indice - a.indice || a.nombre.localeCompare(b.nombre)).map((f, i) => ({ ...f, posicion: i + 1 }));
}

/** Mensaje de Slack del ranking del mes (RR.HH. y Carilin). */
export function textoRankingMes(filas: FilaRanking[], mesNombre: string, url: string, esc: (s: string) => string = (s) => s): string {
  const medalla = (n: number) => (n === 1 ? "🥇" : n === 2 ? "🥈" : n === 3 ? "🥉" : `${n}.`);
  const top = filas.map((f) => `${medalla(f.posicion)} *${esc(f.nombre)}* · ${f.indice}/100 · ${esc(f.puestoNombre)}${f.malo.length ? ` — ⚠️ ${esc(f.malo.join("; "))}` : ""}`);
  const atencion = filas.filter((f) => f.indice < 75 && f.mejorar.length).map((f) => `• *${esc(f.nombre)}*: ${esc(f.mejorar.join("; "))}`);
  return `🏆 *Ranking de productividad · ${mesNombre}*\n\n${top.join("\n")}${atencion.length ? `\n\n*Qué tienen que mejorar:*\n${atencion.join("\n")}` : ""}\n\n<${url}|Ver el ranking completo en Ritmo>`;
}

// ─── Alertas de rendimiento (30/sep, Elvin) ───────────────────────────────────────────────────
// "No catalogues baja producción un día malo; busca rachas: dos, tres días malos corridos ya levantan sospecha… cuatro
// días o más al mes malos, hay que tomar carta." Día malo = día bajo (sin marcar, muy tarde, sin KPIs o en 0) o baja
// producción: anotó, pero produjo menos de la mitad de lo normal SUYO (mediana de sus días con producción; hace falta
// historia de 5 días para comparar). 🟡 amarilla = 2+ días malos seguidos · 🔴 roja = 4+ días malos en el mes.

export const RACHA_AMARILLA = 2;
export const MALOS_ROJA = 4;
const BAJA_PRODUCCION = 0.5;
const HISTORIA_MINIMA = 5;

const sumaDia = (d: DiaRank) => Object.values(d.datos).reduce((s, v) => s + (Number(v) || 0), 0);

/** Mediana de lo que produce un día normal (solo días anotados con algo). null = todavía no hay con qué comparar. */
export function produccionNormal(p: PersonaRank): number | null {
  const xs = p.dias.filter((d) => trabajo(d) && d.estado !== "trabajando" && d.reporto).map(sumaDia).filter((x) => x > 0).sort((a, b) => a - b);
  if (xs.length < HISTORIA_MINIMA) return null;
  const m = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2;
}

/** Por qué un día fue malo (null = día normal). */
export function motivoDiaMalo(d: DiaRank, tieneKpis: boolean, normal: number | null): string | null {
  if (!tocaba(d) || d.estado === "trabajando") return null;
  if (d.estado === "ausente") return "sin marcar";
  if (d.minutosTarde > 30) return "llegó muy tarde";
  if (tieneKpis && (!d.reporto || Object.values(d.datos).every((v) => !v))) return "sin KPIs o en 0";
  if (tieneKpis && normal !== null && sumaDia(d) < normal * BAJA_PRODUCCION) return "baja producción";
  return null;
}

export interface AlertaRendimiento {
  nivel: "amarilla" | "roja";
  racha: number; // días malos seguidos hasta el último día completo
  malosMes: number;
  motivos: string[];
  /** El último día completo fue el que la disparó (para avisar una sola vez). */
  nueva: boolean;
}

export function alertaRendimiento(p: PersonaRank, mes: string): AlertaRendimiento | null {
  const tiene = p.kpis.length > 0;
  const normal = produccionNormal(p);
  const completos = p.dias.filter((d) => tocaba(d) && d.estado !== "trabajando").sort((a, b) => a.fecha.localeCompare(b.fecha));
  const malos = completos.map((d) => ({ d, motivo: motivoDiaMalo(d, tiene, normal) }));
  let racha = 0;
  for (let i = malos.length - 1; i >= 0 && malos[i].motivo; i--) racha++;
  const delMes = malos.filter((x) => x.d.fecha.startsWith(mes) && x.motivo);
  const malosMes = delMes.length;
  const nivel = malosMes >= MALOS_ROJA ? "roja" : racha >= RACHA_AMARILLA ? "amarilla" : null;
  if (!nivel) return null;
  const ultimoMalo = !!malos.at(-1)?.motivo && malos.at(-1)!.d.fecha.startsWith(mes);
  const nueva = nivel === "roja" ? ultimoMalo && malosMes === MALOS_ROJA : racha === RACHA_AMARILLA;
  const motivos = [...new Set((nivel === "roja" ? delMes : malos.slice(-racha)).map((x) => x.motivo!))];
  return { nivel, racha, malosMes, motivos, nueva };
}

/** Una línea legible: "🔴 Ana · 4 días malos este mes (baja producción, sin marcar)". */
export function textoAlerta(nombre: string, a: AlertaRendimiento): string {
  const que = a.nivel === "roja" ? `${a.malosMes} días malos este mes${a.racha >= 2 ? `, ${a.racha} seguidos` : ""}` : `${a.racha} días malos seguidos`;
  return `${a.nivel === "roja" ? "🔴" : "🟡"} ${nombre} · ${que} (${a.motivos.join(", ")})`;
}

/** Carilin: amarillas y rojas de Jessica, Ángela (Project Managers) y los estrategas; de los demás, solo rojas. */
export const PUESTOS_CARILIN = ["pm", "estratega"];
export function vaACarilin(puesto: string, a: AlertaRendimiento): boolean {
  return a.nivel === "roja" || PUESTOS_CARILIN.includes(puesto);
}
