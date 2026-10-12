import { createHmac, timingSafeEqual } from "node:crypto";

// Enlace temporal para que quien tiene el teléfono vincule el WhatsApp de Level Up (12/oct/2026): /vincular-whatsapp?e=<exp>&k=<hmac>.
// El HMAC usa CRON_SECRET y la hora de vencimiento: sin el secreto no se puede inventar, y se vence solo.
const firma = (exp: number) => createHmac("sha256", process.env.CRON_SECRET ?? "").update(`wa-qr:${exp}`).digest("hex");

export function crearEnlace(minutos = 60, base = "https://content-os-chi-seven.vercel.app"): string {
  const exp = Date.now() + minutos * 60_000;
  return `${base}/vincular-whatsapp?e=${exp}&k=${firma(exp)}`;
}

export function enlaceValido(e: string | null, k: string | null, ahora = Date.now()): "ok" | "vencido" | "invalido" {
  const exp = Number(e);
  if (!process.env.CRON_SECRET || !k || !Number.isFinite(exp)) return "invalido";
  const a = Buffer.from(firma(exp));
  const b = Buffer.from(k);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "invalido";
  return ahora > exp ? "vencido" : "ok";
}
