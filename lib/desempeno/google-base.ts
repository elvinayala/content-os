import "server-only";

import { headers } from "next/headers";

/** Dominio al que vuelve Google: uno solo en producción (RITMO_URL) para registrar un único redirect URI. */
export async function baseRitmo() {
  if (process.env.NODE_ENV === "production") return process.env.RITMO_URL || "https://ritmo.levelupmediapr.net";
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https"}://${host}`;
}
