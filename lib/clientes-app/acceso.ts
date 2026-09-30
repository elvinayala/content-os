// Acceso a la app de clientes de Level Up (app.levelupmediapr.net). Solo Web Crypto: lo usan proxy.ts (edge) y las
// páginas (node). Tests en tests/clientes-app.test.mjs.
//
// Link personal: /cliente/entrar?k=<itemId>.<version>.<firma>  (firma = HMAC("cliente:<itemId>:<version>"), 32 hex).
// Al entrar, el proxy deja la cookie `lu-cliente` = <itemId>.<version>.<exp>.<firma> (90 días) y limpia la URL.
// El proxy solo valida firmas; cada página confirma en la base que el cliente siga activo y que la versión sea la
// vigente (lib/clientes-app/sesion.ts): así "cambiar link" (version+1) y "desactivar" cortan también las sesiones abiertas.

export const COOKIE_CLIENTE = "lu-cliente";
export const TTL_CLIENTE = 60 * 60 * 24 * 90; // 90 días
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface AccesoCliente {
  itemId: string;
  version: number;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const valido = (itemId: string, version: number) => UUID_RE.test(itemId) && Number.isInteger(version) && version > 0 && version < 1_000_000;

/** El valor de `k` del link personal. null sin secreto o con datos inválidos. */
export async function tokenCliente(itemId: string, version: number, secret = process.env.CLIENTES_APP_SECRET): Promise<string | null> {
  if (!secret || !valido(itemId, version)) return null;
  const firma = (await hmacHex(secret, `cliente:${itemId}:${version}`)).slice(0, 32);
  return `${itemId}.${version}.${firma}`;
}

/** Lee y verifica el `k` del link. */
export async function leerTokenCliente(k: string | null | undefined, secret = process.env.CLIENTES_APP_SECRET): Promise<AccesoCliente | null> {
  if (!k || !secret) return null;
  const [itemId, v, firma] = k.split(".");
  const version = Number(v);
  if (!firma || !valido(itemId, version)) return null;
  const esperado = await tokenCliente(itemId, version, secret);
  return esperado && iguales(esperado, k) ? { itemId, version } : null;
}

/** Cookie de sesión: <itemId>.<version>.<exp>.<firma>. */
export async function firmarCookieCliente(a: AccesoCliente, secret = process.env.CLIENTES_APP_SECRET, ahora = Date.now()): Promise<string> {
  if (!secret) throw new Error("Falta CLIENTES_APP_SECRET");
  const exp = Math.floor(ahora / 1000) + TTL_CLIENTE;
  const payload = `${a.itemId}.${a.version}.${exp}`;
  return `${payload}.${await hmacHex(secret, `sesion:${payload}`)}`;
}

export async function verificarCookieCliente(cookie: string | null | undefined, secret = process.env.CLIENTES_APP_SECRET, ahora = Date.now()): Promise<AccesoCliente | null> {
  if (!cookie || !secret) return null;
  const partes = cookie.split(".");
  if (partes.length !== 4) return null;
  const [itemId, v, expStr, firma] = partes;
  const version = Number(v);
  const exp = Number(expStr);
  if (!valido(itemId, version) || !Number.isFinite(exp) || exp < Math.floor(ahora / 1000)) return null;
  const esperada = await hmacHex(secret, `sesion:${itemId}.${version}.${exp}`);
  return iguales(esperada, firma) ? { itemId, version } : null;
}

/** Link completo que el equipo le manda al cliente. */
export async function linkCliente(itemId: string, version: number, base = process.env.CLIENTES_APP_URL || "https://app.levelupmediapr.net"): Promise<string | null> {
  const k = await tokenCliente(itemId, version);
  return k ? `${base.replace(/\/$/, "")}/cliente/entrar?k=${k}` : null;
}
