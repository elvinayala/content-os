// Sesión de Pulse: cookie `userId.exp.hmac` firmada con HMAC-SHA256 (Web Crypto), así
// proxy.ts la verifica sin tocar la base. Sin PULSE_SESSION_SECRET nunca hay sesión válida.

export const COOKIE_PULSE = "pulse-session";
export const TTL_SESION = 60 * 60 * 24 * 30; // 30 días

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function firmarSesion(
  userId: string,
  secret = process.env.PULSE_SESSION_SECRET,
): Promise<string> {
  if (!secret) throw new Error("Falta PULSE_SESSION_SECRET");
  const exp = Math.floor(Date.now() / 1000) + TTL_SESION;
  const payload = `${userId}.${exp}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verificarSesion(
  cookie: string | undefined,
  secret = process.env.PULSE_SESSION_SECRET,
): Promise<{ userId: string } | null> {
  if (!cookie || !secret) return null;
  const partes = cookie.split(".");
  if (partes.length !== 3) return null;
  const [userId, expStr, firma] = partes;
  const exp = Number(expStr);
  if (!userId || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  const esperada = await hmac(secret, `${userId}.${exp}`);
  if (esperada.length !== firma.length) return null;
  let diff = 0;
  for (let i = 0; i < esperada.length; i++) diff |= esperada.charCodeAt(i) ^ firma.charCodeAt(i);
  return diff === 0 ? { userId } : null;
}
