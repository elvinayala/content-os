// Resultados de anuncios que ve el CLIENTE (puro; tests en tests/clientes-app.test.mjs). Recibe las filas de la
// Marketing API de Meta (insights) y devuelve solo números reales: si algo no está, queda en null y la app pone "—".
// "Resultado" = lo que el cliente entiende como contacto: leads (formulario o pixel) + conversaciones por mensaje.
// Las compras van aparte con su ROAS, solo si hay ventas medidas.

export type Periodo = "7d" | "30d" | "mes";
export const PERIODOS: { id: Periodo; nombre: string; preset: string }[] = [
  { id: "7d", nombre: "7 días", preset: "last_7d" },
  { id: "30d", nombre: "30 días", preset: "last_30d" },
  { id: "mes", nombre: "Este mes", preset: "this_month" },
];

export interface FilaMeta {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  unique_ctr?: string;
  frequency?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
  purchase_roas?: { action_type: string; value: string }[];
  date_start?: string;
  ad_id?: string;
  ad_name?: string;
}

export interface Numeros {
  inversion: number;
  alcance: number;
  impresiones: number;
  clics: number;
  leads: number;
  mensajes: number;
  resultados: number;
  costoResultado: number | null;
  ventas: number;
  ingresos: number;
  roas: number | null;
  frecuencia: number | null; // veces que cada persona vio los anuncios
  ctrUnico: number | null; // % de personas que hicieron clic (Meta: unique_ctr)
}

const num = (x: string | undefined) => (x && Number.isFinite(Number(x)) ? Number(x) : 0);
const accion = (f: FilaMeta, ...tipos: string[]) => {
  for (const t of tipos) {
    const v = f.actions?.find((a) => a.action_type === t)?.value;
    if (v) return num(v);
  }
  return 0;
};

export function numerosDe(f: FilaMeta): Numeros {
  const leads = accion(f, "lead", "offsite_conversion.fb_pixel_lead", "onsite_conversion.lead_grouped");
  const mensajes = accion(f, "onsite_conversion.messaging_conversation_started_7d", "onsite_conversion.total_messaging_connection");
  const ventas = accion(f, "purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase");
  const ingresos = num(f.action_values?.find((a) => /purchase/.test(a.action_type))?.value);
  const inversion = num(f.spend);
  const resultados = leads + mensajes;
  const roasMeta = num(f.purchase_roas?.find((a) => /purchase/.test(a.action_type))?.value);
  return {
    inversion,
    alcance: num(f.reach),
    impresiones: num(f.impressions),
    clics: num(f.clicks),
    leads,
    mensajes,
    resultados,
    costoResultado: resultados && inversion ? inversion / resultados : null,
    ventas,
    ingresos,
    roas: ventas ? roasMeta || (ingresos && inversion ? ingresos / inversion : null) : null,
    frecuencia: num(f.frequency) || null,
    ctrUnico: f.unique_ctr !== undefined && num(f.impressions) ? num(f.unique_ctr) : null,
  };
}

/** Suma varias filas (p. ej. si Meta parte la cuenta en varias). */
export function sumar(filas: FilaMeta[]): Numeros {
  const n = filas.map(numerosDe);
  const t = (k: keyof Numeros) => n.reduce((s, x) => s + ((x[k] as number) || 0), 0);
  const inversion = t("inversion");
  const resultados = t("resultados");
  const ingresos = t("ingresos");
  const ventas = t("ventas");
  return {
    inversion,
    alcance: t("alcance"),
    impresiones: t("impresiones"),
    clics: t("clics"),
    leads: t("leads"),
    mensajes: t("mensajes"),
    resultados,
    costoResultado: resultados && inversion ? inversion / resultados : null,
    ventas,
    ingresos,
    roas: ventas && ingresos && inversion ? ingresos / inversion : null,
    // Frecuencia y CTR único no se suman: con una fila (la cuenta) van tal cual; con varias, promedio por impresiones.
    frecuencia: n.length === 1 ? n[0].frecuencia : promedio(n, "frecuencia"),
    ctrUnico: n.length === 1 ? n[0].ctrUnico : promedio(n, "ctrUnico"),
  };
}

function promedio(n: Numeros[], k: "frecuencia" | "ctrUnico"): number | null {
  const con = n.filter((x) => x[k] != null && x.impresiones);
  const imp = con.reduce((s, x) => s + x.impresiones, 0);
  return imp ? con.reduce((s, x) => s + (x[k] as number) * x.impresiones, 0) / imp : null;
}

/** Serie por día para el gráfico: inversión y resultados. */
export function serieDiaria(filas: FilaMeta[]): { fecha: string; inversion: number; resultados: number }[] {
  return filas
    .filter((f) => f.date_start)
    .map((f) => {
      const n = numerosDe(f);
      return { fecha: f.date_start!, inversion: n.inversion, resultados: n.resultados };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Los anuncios que mejor van: más resultados (o ventas); a igualdad, el más barato. Solo los que gastaron. */
export function mejoresAnuncios(filas: FilaMeta[], n = 3): { id: string; nombre: string; numeros: Numeros }[] {
  return filas
    .filter((f) => f.ad_id && num(f.spend) > 0)
    .map((f) => ({ id: f.ad_id!, nombre: f.ad_name ?? "Anuncio", numeros: numerosDe(f) }))
    .filter((a) => a.numeros.resultados > 0 || a.numeros.ventas > 0)
    .sort((a, b) => b.numeros.resultados + b.numeros.ventas - (a.numeros.resultados + a.numeros.ventas) || (a.numeros.costoResultado ?? 1e9) - (b.numeros.costoResultado ?? 1e9))
    .slice(0, n);
}

/** ¿El error de Meta es de token (vencido/sin permiso) y no de la cuenta del cliente? */
export const esErrorDeToken = (codigo: number | undefined, subcodigo?: number) => codigo === 190 || codigo === 102 || subcodigo === 463 || subcodigo === 460;

// ---- Recomendación breve (Elvin, 30/sep): precisa, no "recomendaciones por recomendaciones" ----
// CTR único ≥ 2 % bien, < 2 % alerta · frecuencia > 1.8 = rotar creativos · costo por resultado < $2 bien, $2-5 sin
// alerta, > $5 ajustar creativo · anuncio ganador = listo para escalar (subir 10-20 % el presupuesto, método de Max).
export const UMBRALES = { ctrUnicoMin: 2, frecuenciaMax: 1.8, costoBueno: 2, costoAlerta: 5, ganadorMinResultados: 10, ganadorMinInversion: 15 };

export type Semaforo = "bien" | "normal" | "alerta";
export interface Salud {
  ctrUnico: Semaforo | null;
  frecuencia: Semaforo | null;
  costo: Semaforo | null;
}

export function salud(t: Numeros): Salud {
  return {
    ctrUnico: t.ctrUnico == null ? null : t.ctrUnico >= UMBRALES.ctrUnicoMin ? "bien" : "alerta",
    frecuencia: t.frecuencia == null ? null : t.frecuencia > UMBRALES.frecuenciaMax ? "alerta" : "bien",
    costo: t.costoResultado == null ? null : t.costoResultado < UMBRALES.costoBueno ? "bien" : t.costoResultado <= UMBRALES.costoAlerta ? "normal" : "alerta",
  };
}

/** El anuncio listo para escalar: barato (< $2), engancha (CTR único ≥ 2 %), no quemado (frecuencia ≤ 1.8) y con datos suficientes. */
export function anuncioParaEscalar<T extends { nombre: string; numeros: Numeros }>(anuncios: T[]): T | null {
  const u = UMBRALES;
  const ok = anuncios.filter(
    (a) =>
      a.numeros.resultados >= u.ganadorMinResultados &&
      a.numeros.inversion >= u.ganadorMinInversion &&
      a.numeros.costoResultado != null &&
      a.numeros.costoResultado < u.costoBueno &&
      (a.numeros.ctrUnico == null || a.numeros.ctrUnico >= u.ctrUnicoMin) &&
      (a.numeros.frecuencia == null || a.numeros.frecuencia <= u.frecuenciaMax),
  );
  return ok.sort((a, b) => (a.numeros.costoResultado ?? 0) - (b.numeros.costoResultado ?? 0) || b.numeros.resultados - a.numeros.resultados)[0] ?? null;
}

export interface Recomendacion {
  tipo: "costo" | "ctr" | "frecuencia" | "escalar" | "bien";
  texto: string;
}

const usd = (n: number) => `$${n.toFixed(2)}`;

/** Una o dos líneas, lo más importante primero. Siempre devuelve al menos una. */
export function recomendar<T extends { nombre: string; numeros: Numeros }>(t: Numeros, anuncios: T[]): Recomendacion[] {
  const u = UMBRALES;
  const r: Recomendacion[] = [];
  if (t.costoResultado != null && t.costoResultado > u.costoAlerta) r.push({ tipo: "costo", texto: `Cada resultado está costando ${usd(t.costoResultado)}: recomendamos ajustar el creativo.` });
  if (t.ctrUnico != null && t.ctrUnico < u.ctrUnicoMin) r.push({ tipo: "ctr", texto: `Solo ${t.ctrUnico.toFixed(1)} % de las personas hace clic (lo sano es 2 % o más): hay que mejorar el gancho del anuncio.` });
  if (t.frecuencia != null && t.frecuencia > u.frecuenciaMax) r.push({ tipo: "frecuencia", texto: `Tu público ya vio tus anuncios ${t.frecuencia.toFixed(1)} veces en promedio: toca rotar creativos.` });
  // El anuncio para escalar siempre sale (es la oportunidad); con alertas, junto a la más importante.
  const ganador = anuncioParaEscalar(anuncios);
  const escalar: Recomendacion | null = ganador ? { tipo: "escalar", texto: `«${ganador.nombre}» está listo para escalar (${usd(ganador.numeros.costoResultado!)} por resultado): recomendamos subirle 10-20 % al presupuesto.` } : null;
  if (escalar) return [...r.slice(0, 1), escalar];
  if (!r.length) r.push({ tipo: "bien", texto: t.costoResultado != null && t.costoResultado < u.costoBueno ? `Vas bien: ${usd(t.costoResultado)} por resultado. Seguimos optimizando.` : "Todo en orden: seguimos optimizando tus anuncios." });
  return r.slice(0, 2);
}
