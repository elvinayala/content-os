// Auth compartida del portal: proxy.ts (edge), app/login/actions.ts (node)
// y app/api/jarvis (node). Token de sesión = sha256(password + SAL) — no
// guarda la contraseña. Web Crypto disponible en ambos runtimes.

const SAL = "::ceo-portal-v1";
export const COOKIE_SESION = "ceo-session";
// Sesión del equipo de contenido (Valentina, Juan Diego, creadores): acceso
// SCOPEADO solo a /pedir (chat con el equipo), no al Command Center.
export const COOKIE_CONTENIDO = "contenido-session";

export async function tokenEsperado(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + SAL);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// true si la cookie corresponde al CEO_PORTAL_PASSWORD; si no hay password
// (dev local), el portal está abierto.
export async function sesionValida(
  cookie: string | undefined,
): Promise<boolean> {
  const password = process.env.CEO_PORTAL_PASSWORD;
  if (!password) return true;
  return !!cookie && cookie === (await tokenEsperado(password));
}

// true si la cookie corresponde al CONTENIDO_PORTAL_PASSWORD (equipo de contenido).
export async function sesionContenidoValida(
  cookie: string | undefined,
): Promise<boolean> {
  const password = process.env.CONTENIDO_PORTAL_PASSWORD;
  if (!password) return false;
  return !!cookie && cookie === (await tokenEsperado(password));
}
