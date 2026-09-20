// Helpers de formato (locale es-AR).

import type { LocaleNumero } from "@/lib/types";

const nf = new Intl.NumberFormat("es-AR");

export function fmtNumero(n: number): string {
  return nf.format(n);
}

export function fmtCompacto(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function fmtPorcentaje(n: number): string {
  return `${n.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
}

export function fmtDelta(n: number): string {
  const signo = n > 0 ? "+" : "";
  return `${signo}${n.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
}

// Fecha de hoy como "YYYY-MM-DD" en hora LOCAL (toISOString usa UTC y
// corre el día de noche en zonas UTC-negativas como Puerto Rico).
export function hoyISO(offsetDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function fmtFecha(iso: string): string {
  // Fecha sin desfase de zona horaria (interpretamos como fecha local).
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

export function fmtFechaLarga(iso: string): string {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

// Parsea un monto de una hoja de ventas según el locale de la agencia.
//  - "US": "$1,234.56"  → miles con coma, decimal con punto
//  - "EU": "$1.234,56"  → miles con punto, decimal con coma
// Devuelve 0 si no hay número (celdas vacías, "N/A", etc.).
export function parseMoney(raw: string, locale: LocaleNumero): number {
  if (!raw) return 0;
  // deja solo dígitos y separadores
  let s = raw.replace(/[^\d.,-]/g, "");
  if (!s || s === "-") return 0;
  if (locale === "EU") {
    // punto = miles, coma = decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // coma = miles, punto = decimal
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

// Formatea un número como USD ($1,234.56). Toda la data de las agencias es en USD.
export function formatUSD(n: number): string {
  return usd.format(n);
}
