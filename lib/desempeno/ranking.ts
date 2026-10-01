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
