// "Lo que hemos hecho por ti" (Elvin, 30/sep): la línea de tiempo del trabajo para el cliente. Puro; tests en
// tests/clientes-app.test.mjs. La bitácora interna (columna "Campaigns Level Up" de Pulse) la reescribe Claude en
// lenguaje de cliente (lib/clientes-app/bitacora.ts); aquí se valida lo que devuelve y se mezcla con lo entregado.

import type { TipoEntrega } from "./entregas-reglas";

export interface EntradaBitacora {
  fecha: string; // YYYY-MM-DD
  texto: string;
  tipo: "campana" | "entrega";
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
// Iniciales del equipo que a veces quedan pegadas ("… - SR", "MC", "-DB"): nunca se le muestran al cliente.
const INICIALES = /(\s*[-–|]\s*[A-ZÁÉÍÓÚÑ]{2,3}\.?\s*$)|(\s+[A-ZÁÉÍÓÚÑ]{2,3}\.?\s*$)/;

/** Valida lo que devolvió el modelo: fechas reales (no futuras), textos cortos, sin iniciales, más nuevo primero. */
export function limpiarEntradas(salida: unknown, hoy: string): EntradaBitacora[] {
  const lista = (salida as { entradas?: unknown })?.entradas;
  if (!Array.isArray(lista)) return [];
  const vistas = new Set<string>();
  const out: EntradaBitacora[] = [];
  for (const e of lista) {
    const fecha = typeof e?.fecha === "string" ? e.fecha.trim() : "";
    let texto = typeof e?.texto === "string" ? e.texto.trim() : "";
    texto = texto.replace(INICIALES, "").replace(/\s+/g, " ").trim();
    if (!FECHA.test(fecha) || fecha > hoy || texto.length < 8) continue;
    if (/\$\s?\d|\d+\s?(usd|dólares|dolares)/i.test(texto)) continue; // nada de montos
    const clave = `${fecha}|${texto.toLowerCase()}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    out.push({ fecha, texto: texto.length > 180 ? `${texto.slice(0, 179).trimEnd()}…` : texto, tipo: "campana" });
  }
  return out.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 80);
}

/** Lo que el equipo subió a la app también es trabajo hecho: una entrada por día y tipo. */
export function entradasDeEntregas(entregas: { tipo: TipoEntrega; creadoAt: string }[]): EntradaBitacora[] {
  const grupos = new Map<string, number>();
  for (const e of entregas) {
    const dia = new Date(e.creadoAt).toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
    grupos.set(`${dia}|${e.tipo}`, (grupos.get(`${dia}|${e.tipo}`) ?? 0) + 1);
  }
  return [...grupos.entries()].map(([k, n]) => {
    const [fecha, tipo] = k.split("|") as [string, TipoEntrega];
    const texto =
      tipo === "plan" ? "Te entregamos tu plan de marketing." : tipo === "video" ? (n > 1 ? `Te entregamos ${n} videos nuevos.` : "Te entregamos un video nuevo.") : n > 1 ? `Te entregamos ${n} creativos nuevos.` : "Te entregamos un creativo nuevo.";
    return { fecha, texto, tipo: "entrega" as const };
  });
}

/** Todo junto, lo más nuevo primero. */
export function lineaDeTiempo(campanas: EntradaBitacora[], entregas: EntradaBitacora[]): EntradaBitacora[] {
  return [...campanas, ...entregas].sort((a, b) => b.fecha.localeCompare(a.fecha) || (a.tipo === "entrega" ? -1 : 1));
}
