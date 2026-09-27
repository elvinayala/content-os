/**
 * Entrada a "Resuelto Pro" (la app de los plomeros) con su número de teléfono + un código de 6 dígitos por texto
 * (26/sep/2026, Elvin: "los plomeros son personas mayores; todo tiene que ser simple"). Sin links que se pierdan ni
 * claves: pone su número, le llega el código desde el 787-956-1111, y queda conectado en ese celular.
 * La sesión es la misma firma que ya usa la app (p + k); el código solo sirve para obtenerla.
 * Reglas: solo plomeros activos; el código vale 10 min y 5 intentos; máx. 3 códigos por número cada 15 min.
 */
import crypto from "node:crypto";

const DIEZ_MIN = 10 * 60_000, QUINCE_MIN = 15 * 60_000;
export type Pendiente = { hash: string; vence: number; intentos: number };
const codigos = new Map<string, Pendiente>();
const envios = new Map<string, number[]>();

/** 10 dígitos de PR/EE. UU. sin el 1 del principio. Pura. */
export const soloDiez = (t: unknown) => String(t ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
const hashDe = (tel: string, codigo: string) => crypto.createHash("sha256").update(tel + ":" + codigo).digest("hex");

/** ¿Puede pedir otro código ahora? Pura (tests). */
export function puedePedir(historial: number[], ahora: number): boolean { return historial.filter((t) => ahora - t < QUINCE_MIN).length < 3; }

export function nuevoCodigo(tel: string, ahora = Date.now()): string | null {
  const h = (envios.get(tel) ?? []).filter((t) => ahora - t < QUINCE_MIN);
  if (!puedePedir(h, ahora)) return null;
  envios.set(tel, [...h, ahora]);
  const codigo = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  codigos.set(tel, { hash: hashDe(tel, codigo), vence: ahora + DIEZ_MIN, intentos: 0 });
  return codigo;
}

/** Verifica y consume el código. Pura respecto al mapa que recibe (tests). */
export function verificar(mapa: Map<string, Pendiente>, tel: string, codigo: string, ahora = Date.now()): "ok" | "vencido" | "incorrecto" | "bloqueado" {
  const p = mapa.get(tel);
  if (!p || p.vence < ahora) { mapa.delete(tel); return "vencido"; }
  if (p.intentos >= 5) { mapa.delete(tel); return "bloqueado"; }
  const bien = crypto.timingSafeEqual(Buffer.from(p.hash), Buffer.from(hashDe(tel, String(codigo).replace(/\D/g, ""))));
  if (!bien) { p.intentos++; return "incorrecto"; }
  mapa.delete(tel); return "ok";
}
export const verificarCodigo = (tel: string, codigo: string) => verificar(codigos, tel, codigo);
export const _codigos = codigos; // para tests
