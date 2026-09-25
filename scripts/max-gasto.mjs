// Max: qué modelo usa en cada tarea y cuánto puede gastar (Elvin, 24/sep/2026).
//   "Ponle a Max el modelo más barato para mensajes; para planeación e investigación, Opus 5.5 para que dé
//    los mejores resultados. Pero que no gaste sin límite: máximo $10 al día y $25 a la semana. Poco a poco le
//    vamos dando más límite mientras tenga más clientes."
// Puro (sin red): lo usa scripts/telegram-puente.mjs y lo prueba tests/max-gasto.test.mjs.

export const MODELO_PLAN = process.env.MAX_MODELO_PLAN || "claude-opus-5-5";
export const MODELO_BARATO = process.env.MAX_MODELO_BARATO || "claude-haiku-4-5-20251001";
export const TOPE_DIA = Number(process.env.MAX_TOPE_DIA || 10);
export const TOPE_SEMANA = Number(process.env.MAX_TOPE_SEMANA || 25);

const TIPOS_DE_TRABAJO = /tipo (plan|creativos|campana)\b/;

// Lo que llega de Slack al buzón de Max → modelo. Planear/investigar/producir = Opus; mensajes,
// confirmaciones y trámites = el barato.
export function modeloParaSlack(texto) {
  const t = String(texto || "");
  const cabecera = t.split("\n")[0];
  if (/^\[Onboarding nuevo/.test(cabecera)) return MODELO_PLAN; // investigar + estrategia
  if (/^\[Max aprobación/.test(cabecera)) {
    if (/evento (rechazado|ok-con-cambio|montar)\b/.test(cabecera) && TIPOS_DE_TRABAJO.test(cabecera)) return MODELO_PLAN; // rehacer un plan / montar campañas
    if (/evento enviado\b/.test(cabecera) && /tipo (plan|creativos)\b/.test(cabecera)) return MODELO_PLAN; // siguiente etapa: producir
    return MODELO_BARATO; // publicar (correr un script), ok de algo interno, correcciones de mensajes
  }
  if (/^\[Max canal/.test(cabecera)) {
    // El equipo le habla en #max-aprobaciones: un resumen largo (p. ej. el de Jessica) arma un plan.
    const cuerpo = t.slice(cabecera.length).trim();
    return cuerpo.length > 400 ? MODELO_PLAN : MODELO_BARATO;
  }
  return MODELO_BARATO; // [Slack cliente …] y lo demás: mensajes
}

// Elvin por Telegram: si pide estrategia/análisis, Opus; si es una pregunta o un trámite, el barato.
export function modeloParaTelegram(texto) {
  return /\b(estrategia|plan|campa[ñn]a|investiga|competencia|analiza|an[aá]lisis|creativ|guion|escal|diagn[oó]stico|embudo|presupuesto|optimiza)/i.test(String(texto || "")) ? MODELO_PLAN : MODELO_BARATO;
}

// Fechas en hora de Puerto Rico; la semana va de lunes a domingo.
export function diaPR(fecha = new Date()) {
  return fecha.toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
}
export function lunesPR(fecha = new Date()) {
  const [y, m, d] = diaPR(fecha).split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const dow = (base.getUTCDay() + 6) % 7; // 0 = lunes
  base.setUTCDate(base.getUTCDate() - dow);
  return base.toISOString().slice(0, 10);
}

export function registrarGasto(gastos, usd, fecha = new Date()) {
  const g = { ...(gastos || {}) };
  const dia = diaPR(fecha);
  g[dia] = Math.round(((g[dia] || 0) + (Number(usd) || 0)) * 10000) / 10000;
  // Solo se guardan ~5 semanas.
  for (const k of Object.keys(g).sort().slice(0, Math.max(0, Object.keys(g).length - 35))) delete g[k];
  return g;
}

export function gastoHoy(gastos, fecha = new Date()) {
  return Number((gastos || {})[diaPR(fecha)] || 0);
}
export function gastoSemana(gastos, fecha = new Date()) {
  const desde = lunesPR(fecha);
  const hasta = diaPR(fecha);
  return Object.entries(gastos || {}).filter(([d]) => d >= desde && d <= hasta).reduce((s, [, v]) => s + Number(v || 0), 0);
}

// ¿Puede trabajar sola una tarea más? (lo de Slack/buzón). Lo que Elvin pide directo por Telegram no se
// frena: cuenta para el tope, pero él es el dueño y decide.
export function dentroDelTope(gastos, fecha = new Date(), topes = { dia: TOPE_DIA, semana: TOPE_SEMANA }) {
  const hoy = gastoHoy(gastos, fecha);
  const semana = gastoSemana(gastos, fecha);
  if (hoy >= topes.dia) return { ok: false, motivo: `tope diario ($${topes.dia}) alcanzado: hoy van $${hoy.toFixed(2)}`, hoy, semana };
  if (semana >= topes.semana) return { ok: false, motivo: `tope semanal ($${topes.semana}) alcanzado: esta semana van $${semana.toFixed(2)}`, hoy, semana };
  return { ok: true, hoy, semana };
}
