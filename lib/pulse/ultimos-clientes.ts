// "Últimos clientes" del Inicio de Pulse: los que acaban de entrar, cuánto pagaron, el nicho, cuándo pagaron
// y cuándo hicieron el onboarding. Lógica pura (tests en tests/pulse-ultimos-clientes.test.mjs).

export const ALTO_VALOR = 3000; // desde aquí la tarjeta se destaca

export interface ClienteReciente {
  itemId: string;
  boardSlug: string;
  marca: string; // "Level Up" | "AI Borinquen"
  nombre: string;
  empresa?: string;
  nicho?: string;
  monto?: number; // lo que pagó (o el total del acuerdo en cuotas)
  detallePago?: string; // "Done For You · 90 días" / "3 cuotas de $1,000"
  pagoEl?: string; // YYYY-MM-DD
  onboardingEl: string; // YYYY-MM-DD (cuando se creó la ficha con el formulario de onboarding)
  grupo: string;
}

// "$3.000 usd por 90 dias" → 3000 · "$3,500" → 3500 · "$1.500,50" → 1500.5 · "3 cuotas de $1.000" → 3000.
export function montoDePago(texto: string | null | undefined): number | undefined {
  if (!texto) return undefined;
  const m = texto.match(/\$\s*([\d.,]+)|([\d.,]+)\s*(?:usd|d[oó]lares)/i);
  if (!m) return undefined;
  const n = numero(m[1] ?? m[2]);
  if (n === undefined || n <= 0) return undefined;
  const cuotas = texto.match(/(\d+)\s*(?:cuotas|pagos)\s*de\s*\$/i);
  return cuotas ? n * Number(cuotas[1]) : n;
}

function numero(s: string): number | undefined {
  let t = s.replace(/[.,]$/, "");
  const dec = t.match(/[.,](\d{1,2})$/); // decimales: 2 dígitos o menos después del último separador
  let decimales = "";
  if (dec) {
    decimales = dec[1];
    t = t.slice(0, -dec[0].length);
  }
  const entero = t.replace(/[.,]/g, "");
  if (!/^\d+$/.test(entero)) return undefined;
  return Number(decimales ? `${entero}.${decimales}` : entero);
}

// Lo que acompaña al monto: el plan del closer y la duración si la dijo ("por 90 días").
export function detalleDePago(pago: string | undefined, plan: string | undefined): string | undefined {
  const dias = pago?.match(/(\d+)\s*d[ií]as/i)?.[1];
  const cuotas = pago?.match(/(\d+)\s*(?:cuotas|pagos)\s*de\s*\$\s*[\d.,]+/i)?.[0];
  const partes = [plan?.trim(), cuotas, dias && !cuotas ? `${dias} días` : undefined].filter(Boolean) as string[];
  return partes.length ? partes.join(" · ") : undefined;
}

// Permalink de Slack ".../p1790104735022819" o un ts "1790104735.022819" → día en Puerto Rico.
export function diaDeSlack(texto: string | null | undefined): string | undefined {
  if (!texto) return undefined;
  const m = texto.match(/\/p(\d{10})\d{6}/) ?? texto.match(/^(\d{10})\.\d+$/);
  if (!m) return undefined;
  return diaPR(new Date(Number(m[1]) * 1000));
}

export function diaPR(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
}

export const esAltoValor = (c: Pick<ClienteReciente, "monto">) => (c.monto ?? 0) >= ALTO_VALOR;

// Los duplicados de Monday ("(copy)") y las bajas no cuentan como clientes que entraron.
export function cuentaComoNuevo(nombre: string, grupo: string): boolean {
  return !/\(copy\)|\(copia\)/i.test(nombre) && !/offboard|baja/i.test(grupo);
}

// La etiqueta "Otro" no dice nada: si el cliente escribió su industria en el formulario, esa manda.
export function nichoDe(etiqueta: string | undefined, delFormulario: string | undefined): string | undefined {
  const form = delFormulario && delFormulario.length > 40 ? delFormulario.slice(0, 38) + "…" : delFormulario;
  if (!etiqueta || /^otr[oa]s?$/i.test(etiqueta.trim())) return form ?? etiqueta;
  return etiqueta;
}
