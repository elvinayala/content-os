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
  };
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
