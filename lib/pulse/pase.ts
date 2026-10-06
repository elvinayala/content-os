import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Pase entre dominios con la misma sesión (6/oct, Elvin: "cuando estás en Pulse y quieres ir a Ritmo no te lleva").
// Leads (leads.levelupmediapr.net), Ritmo (ritmo.levelupmediapr.net) y Pulse (content-os…) son dominios distintos:
// la cookie de uno no viaja al otro. El botón pasa por /api/pase, que firma un pase de 60 s y UN solo uso para esa
// persona; /api/pase/recibir, ya en el otro dominio, lo canjea por la cookie de sesión normal.

export type DestinoPase = "ritmo" | "leads" | "pulse";
export const DESTINOS: Record<DestinoPase, { ruta: string; env: string; porDefecto: string }> = {
  ritmo: { ruta: "/ritmo", env: "RITMO_URL", porDefecto: "https://ritmo.levelupmediapr.net" },
  leads: { ruta: "/pulse/leads", env: "LEADS_URL", porDefecto: "https://leads.levelupmediapr.net" },
  pulse: { ruta: "/pulse", env: "CONTENT_OS_URL", porDefecto: "https://content-os-chi-seven.vercel.app" },
};
export const TTL_PASE_S = 60;

const firma = (secreto: string, payload: string) => createHmac("sha256", `pase|${secreto}`).update(payload).digest("hex");

export function firmarPase(userId: string, destino: DestinoPase, secreto: string, ahora = Date.now()): string {
  const exp = Math.floor(ahora / 1000) + TTL_PASE_S;
  const nonce = randomBytes(9).toString("base64url");
  const payload = `${userId}.${destino}.${exp}.${nonce}`;
  return `${payload}.${firma(secreto, payload)}`;
}

export function leerPase(t: string | null | undefined, secreto: string | undefined, ahora = Date.now()): { userId: string; destino: DestinoPase; nonce: string } | null {
  if (!t || !secreto || t.length > 300) return null;
  const partes = t.split(".");
  if (partes.length !== 5) return null;
  const [userId, destino, expStr, nonce, f] = partes;
  if (!(destino in DESTINOS) || !/^[\w-]{6,40}$/.test(nonce) || !/^[0-9a-f-]{20,60}$/i.test(userId)) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < ahora) return null;
  const esperada = Buffer.from(firma(secreto, `${userId}.${destino}.${exp}.${nonce}`));
  const dada = Buffer.from(f);
  if (esperada.length !== dada.length || !timingSafeEqual(esperada, dada)) return null;
  return { userId, destino: destino as DestinoPase, nonce };
}
