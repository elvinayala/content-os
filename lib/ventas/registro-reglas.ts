// Registro de ventas de la tesorera en la Arena (19/oct, Elvin: "María García sube ahí las ventas… de Carilin, de Roger,
// de Valentina, del closer que sea… cash collected y total del acuerdo… la fuente (UTM)… si es nueva venta, el enlace
// del anuncio; si es referido, de quién vino"). Puro: lo usan la pantalla, las acciones, la Arena y los tests.
// Mientras haya ventas registradas en el mes, la Arena cuenta con ellas (marcador, carrera y comisiones) en vez de la hoja.

import { norm, pasarelaDe, type Transaccion } from "./reglas.ts";

export const TIPOS_VENTA = [
  { id: "nueva", nombre: "Nueva venta", detalle: "lead nuevo", emoji: "✨" },
  { id: "referido", nombre: "Referido", detalle: "alguien nos lo recomendó", emoji: "🤝" },
  { id: "recurrente", nombre: "Recurrente", detalle: "mensualidad o renovación", emoji: "🔁" },
  { id: "balance", nombre: "Pago de balance", detalle: "deuda o balance pendiente cobrado", emoji: "💳" },
] as const;
export type TipoVenta = (typeof TIPOS_VENTA)[number]["id"];

/** De dónde vino (UTM source): sugerencias; también se puede escribir otra. */
export const FUENTES_VENTA = ["Anuncio de Meta", "Instagram orgánico", "Facebook orgánico", "TikTok", "WhatsApp", "Google", "YouTube", "Evento", "Llamada en frío", "Cliente actual", "Referido"] as const;

export const METODOS_PAGO = ["Stripe", "PayPal", "ATH Móvil", "Klarna", "FanBasis", "Transferencia", "Efectivo", "Zelle", "Otro"] as const;

/** Hasta cuántos días atrás se puede registrar (un cobro que entró y se anota tarde). */
export const DIAS_ATRAS_REGISTRO = 45;

export interface VentaNueva {
  fecha: string; // YYYY-MM-DD (día del cobro, PR)
  cliente: string;
  vendedor: string; // quien cerró (closer, o quien sea)
  agendo: string | null; // setter/chatter que la agendó (opcional)
  tipo: TipoVenta;
  fuente: string; // UTM source
  anuncio: string | null; // enlace del anuncio (nueva venta)
  referidoPor: string | null; // de quién vino (referido)
  cash: number; // cash collected hoy (0 vale)
  acuerdo: number; // total del acuerdo
  metodo: string | null;
  nota: string | null;
}

export interface Venta extends VentaNueva {
  id: string;
  registradoPor: string | null;
}

const texto = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const sumarDias = (f: string, n: number) => new Date(Date.parse(`${f}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** "$1,500.50" / "1500,5" / "1.500,50" → 1500.5. Vacío → null. */
export function montoDe(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  let s = String(v ?? "").replace(/[$\s]/g, "");
  if (!s) return null;
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); // 1.500,50
  else s = s.replace(/,/g, ""); // 1,500.50
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** Un enlace válido (http/https). Sin protocolo se le pone https://. */
export function enlaceDe(v: unknown): string | null {
  const s = texto(v, 600);
  if (!s) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Limpia y valida una venta. Devuelve la venta lista o el error para la persona. */
export function validarVenta(v: Partial<Record<keyof VentaNueva, unknown>>, hoy: string): { ok: true; v: VentaNueva } | { ok: false; error: string } {
  const fecha = texto(v.fecha, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha > hoy) return { ok: false, error: "Escoge el día del cobro (no puede ser en el futuro)" };
  if (fecha < sumarDias(hoy, -DIAS_ATRAS_REGISTRO)) return { ok: false, error: `Solo se registran ventas de los últimos ${DIAS_ATRAS_REGISTRO} días` };
  const cliente = texto(v.cliente, 120);
  if (cliente.length < 2) return { ok: false, error: "Escribe el cliente o negocio" };
  const vendedor = texto(v.vendedor, 80);
  if (vendedor.length < 2) return { ok: false, error: "¿Quién hizo la venta?" };
  const tipo = TIPOS_VENTA.find((t) => t.id === v.tipo)?.id;
  if (!tipo) return { ok: false, error: "Escoge el tipo de venta" };
  const referidoPor = texto(v.referidoPor, 120) || null;
  if (tipo === "referido" && !referidoPor) return { ok: false, error: "¿De quién vino el referido?" };
  const fuente = tipo === "referido" ? "Referido" : texto(v.fuente, 80);
  if (!fuente) return { ok: false, error: "¿De dónde vino la venta? (la fuente)" };
  let anuncio: string | null = null;
  if (tipo === "nueva" && texto(v.anuncio, 600)) {
    anuncio = enlaceDe(v.anuncio);
    if (!anuncio) return { ok: false, error: "El enlace del anuncio no es válido" };
  }
  const cash = montoDe(v.cash);
  if (cash === null || cash < 0 || cash > 1_000_000) return { ok: false, error: "Pon el cash collected (0 si no cobró nada)" };
  const acuerdo = montoDe(v.acuerdo);
  if (acuerdo === null || acuerdo < 0 || acuerdo > 1_000_000) return { ok: false, error: "Pon el total del acuerdo" };
  if (acuerdo < cash) return { ok: false, error: "El cash collected no puede ser mayor que el total del acuerdo" };
  if (cash === 0 && acuerdo === 0) return { ok: false, error: "El cash collected y el acuerdo no pueden estar los dos en 0" };
  return {
    ok: true,
    v: {
      fecha,
      cliente,
      vendedor,
      agendo: texto(v.agendo, 80) || null,
      tipo,
      fuente,
      anuncio,
      referidoPor: tipo === "referido" ? referidoPor : null,
      cash,
      acuerdo,
      metodo: texto(v.metodo, 40) || null,
      nota: texto(v.nota, 300) || null,
    },
  };
}

/**
 * Cada venta como transacción de la Arena (lo mismo que una fila de la hoja). Nueva/referido = "nueva"; recurrente y
 * balance = "cuota". El neto descuenta la pasarela. Quien agendó cuenta como chatter si está en la lista de chatters;
 * si no, como setter.
 */
export function aTransacciones(ventas: VentaNueva[], chatters: string[] = []): Transaccion[] {
  const esChatter = (n: string) => chatters.some((c) => norm(c) === norm(n) || norm(c).split(" ")[0] === norm(n));
  return ventas.map((v) => {
    const p = pasarelaDe(v.metodo ?? "");
    const agendo = v.agendo ?? "";
    return {
      fecha: v.fecha,
      tipo: v.tipo === "nueva" || v.tipo === "referido" ? "nueva" : "cuota",
      cliente: v.cliente,
      bruto: v.cash,
      neto: Math.round(v.cash * (1 - p.fee) * 100) / 100,
      pasarela: p.nombre,
      pasarelaDesconocida: p.desconocida,
      closer: v.vendedor,
      setter: agendo && !esChatter(agendo) ? agendo : "",
      chatter: agendo && esChatter(agendo) ? agendo : "",
    };
  });
}

/** Totales para la cabecera del registro: cobrado, acordado, por cobrar y cuántas por tipo y por fuente. */
export function resumenRegistro(ventas: VentaNueva[]) {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const porTipo = Object.fromEntries(TIPOS_VENTA.map((t) => [t.id, { n: 0, cash: 0 }])) as Record<TipoVenta, { n: number; cash: number }>;
  const porFuente = new Map<string, { n: number; cash: number }>();
  for (const v of ventas) {
    porTipo[v.tipo].n++;
    porTipo[v.tipo].cash = r2(porTipo[v.tipo].cash + v.cash);
    const f = porFuente.get(v.fuente) ?? { n: 0, cash: 0 };
    f.n++;
    f.cash = r2(f.cash + v.cash);
    porFuente.set(v.fuente, f);
  }
  const cash = r2(ventas.reduce((n, v) => n + v.cash, 0));
  // Por cobrar = lo acordado en ventas nuevas/referidos que todavía no ha entrado en ESTE registro.
  const acordadoNuevas = r2(ventas.filter((v) => v.tipo === "nueva" || v.tipo === "referido").reduce((n, v) => n + v.acuerdo, 0));
  const cobradoNuevas = r2(ventas.filter((v) => v.tipo === "nueva" || v.tipo === "referido").reduce((n, v) => n + v.cash, 0));
  return {
    ventas: ventas.length,
    cash,
    acordadoNuevas,
    porCobrarNuevas: r2(Math.max(0, acordadoNuevas - cobradoNuevas)),
    porTipo,
    porFuente: [...porFuente.entries()].map(([fuente, x]) => ({ fuente, ...x })).sort((a, b) => b.cash - a.cash),
  };
}
