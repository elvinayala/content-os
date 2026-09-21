// Sesión de Pulse: cookie `userId.exp.iat.hmac` firmada con HMAC-SHA256 (Web Crypto), así
// proxy.ts la verifica sin tocar la base. `iat` permite cerrar sesiones viejas: si el
// usuario cambió la clave (pulse_users.sesiones_desde > iat) la sesión ya no vale (eso lo
// chequea usuarioActual, que sí toca la base). Sin PULSE_SESSION_SECRET nunca hay sesión.

export const COOKIE_PULSE = "pulse-session";
export const TTL_SESION = 60 * 60 * 24 * 14; // 14 días (sin "recordarme")
export const TTL_SESION_LARGA = 60 * 60 * 24 * 90; // 90 días (con "recordarme")

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function firmarSesion(userId: string, secret = process.env.PULSE_SESSION_SECRET, ttl = TTL_SESION): Promise<string> {
  if (!secret) throw new Error("Falta PULSE_SESSION_SECRET");
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttl;
  const payload = `${userId}.${exp}.${iat}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verificarSesion(cookie: string | undefined, secret = process.env.PULSE_SESSION_SECRET): Promise<{ userId: string; iat: number } | null> {
  if (!cookie || !secret) return null;
  const partes = cookie.split(".");
  if (partes.length !== 4) return null;
  const [userId, expStr, iatStr, firma] = partes;
  const exp = Number(expStr);
  const iat = Number(iatStr);
  const ahora = Math.floor(Date.now() / 1000);
  if (!userId || !Number.isFinite(exp) || !Number.isFinite(iat) || exp < ahora || iat > ahora + 60) return null;
  const esperada = await hmac(secret, `${userId}.${exp}.${iat}`);
  if (esperada.length !== firma.length) return null;
  let diff = 0;
  for (let i = 0; i < esperada.length; i++) diff |= esperada.charCodeAt(i) ^ firma.charCodeAt(i);
  return diff === 0 ? { userId, iat } : null;
}
