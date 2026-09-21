// Acceso al Portal AutoFlow del prospecto. Solo Web Crypto: lo usa proxy.ts (edge) y las
// páginas (node). Token por portal DETERMINÍSTICO: k = HMAC(AUTOFLOW_PORTAL_SECRET, "portal:"+slug),
// así la fábrica (scripts/demo-cliente/demo.mjs) calcula el mismo link sin llamar a la app.
// Al entrar con ?k= válido, el proxy deja una cookie firmada (slug.exp.hmac) y limpia la URL.
// Revocar un portal = activo=false en la base (lo chequea la página, no el proxy).

export const COOKIE_PORTAL = "autoflow-portal";
export const TTL_PORTAL = 60 * 60 * 24 * 30; // 30 días
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function igualesTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// El token que va en el link del prospecto (32 hex).
export async function tokenPortal(slug: string, secret = process.env.AUTOFLOW_PORTAL_SECRET): Promise<string | null> {
  if (!secret || !SLUG_RE.test(slug)) return null;
  return (await hmacHex(secret, `portal:${slug}`)).slice(0, 32);
}

export async function tokenPortalValido(slug: string, k: string | null | undefined, secret = process.env.AUTOFLOW_PORTAL_SECRET): Promise<boolean> {
  if (!k) return false;
  const esperado = await tokenPortal(slug, secret);
  return !!esperado && igualesTiempoConstante(esperado, k);
}

export async function firmarAccesoPortal(slug: string, secret = process.env.AUTOFLOW_PORTAL_SECRET): Promise<string> {
  if (!secret) throw new Error("Falta AUTOFLOW_PORTAL_SECRET");
  const exp = Math.floor(Date.now() / 1000) + TTL_PORTAL;
  const payload = `${slug}.${exp}`;
  return `${payload}.${await hmacHex(secret, payload)}`;
}

export async function verificarAccesoPortal(cookie: string | undefined, secret = process.env.AUTOFLOW_PORTAL_SECRET): Promise<{ slug: string } | null> {
  if (!cookie || !secret) return null;
  const partes = cookie.split(".");
  if (partes.length !== 3) return null;
  const [slug, expStr, firma] = partes;
  const exp = Number(expStr);
  if (!SLUG_RE.test(slug) || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  const esperada = await hmacHex(secret, `${slug}.${exp}`);
  return igualesTiempoConstante(esperada, firma) ? { slug } : null;
}

// URL pública del portal (con token). null si no hay secreto configurado.
export async function urlPortal(slug: string, base = process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app"): Promise<string | null> {
  const k = await tokenPortal(slug);
  return k ? `${base.replace(/\/$/, "")}/portal/${slug}?k=${k}` : null;
}
