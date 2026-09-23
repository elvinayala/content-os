import "server-only";

import type { CuentaZernio } from "@/lib/zernio";

// Configuración del agente de onboarding de AI Borinquen. Todo por env (Vercel):
//   AIB_ZERNIO_ACCOUNT_ID   número de WhatsApp de AIB conectado en Zernio (obligatorio para enviar)
//   AIB_ZERNIO_API_KEY      key del equipo de Zernio (si falta, usa ZERNIO_API_KEY)
//   AIB_ZERNIO_WEBHOOK_SECRET  secreto del webhook (si falta, ZERNIO_WEBHOOK_SECRET)
//   AIB_ONBOARDING_MODO     "real" para mandar plantillas; cualquier otra cosa = simulación
//   AIB_ONBOARDING_SLACK_CANAL  canal donde avisa a Ángela (default #bori-clientes)
//   ANGELA_SLACK_ID         para mencionarla en los avisos (Ángela aún no está en Slack)
//   AIB_ONBOARDING_MODEL    override del modelo (default claude-opus-5)
//   CALENDLY_TOKEN_AIB      personal access token del Calendly de AI Borinquen (NO es el de Level Up)
//   AIB_CALENDLY_WEBHOOK_SIGNING_KEY  signing key del webhook de ese Calendly (/api/aib/calendly)
//   AIB_CALENDLY_ONBOARDING_REGEX  qué tipos de evento son "onboarding" (default /onboarding/i)

export function cuentaAib(): CuentaZernio {
  return {
    apiKey: process.env.AIB_ZERNIO_API_KEY || process.env.ZERNIO_API_KEY || "",
    accountId: process.env.AIB_ZERNIO_ACCOUNT_ID || "",
    webhookSecret: process.env.AIB_ZERNIO_WEBHOOK_SECRET || process.env.ZERNIO_WEBHOOK_SECRET || undefined,
  };
}

export const canalListo = () => Boolean(cuentaAib().apiKey && cuentaAib().accountId);
export const modoReal = () => process.env.AIB_ONBOARDING_MODO === "real";
export const MODELO = process.env.AIB_ONBOARDING_MODEL || "claude-opus-5";
export const SLACK_CANAL = process.env.AIB_ONBOARDING_SLACK_CANAL || "C0C2YN5199B";
export const HUMANO_HORAS = Number(process.env.AIB_HUMANO_HORAS || 3);

// Igual que Level Up: quien agenda el onboarding en el Calendly de AI Borinquen ya es cliente.
export const CALENDLY_TOKEN = () => process.env.CALENDLY_TOKEN_AIB || "";
export const CALENDLY_SIGNING_KEY = () => process.env.AIB_CALENDLY_WEBHOOK_SIGNING_KEY || "";
export const EVENTO_ONBOARDING = new RegExp(process.env.AIB_CALENDLY_ONBOARDING_REGEX || "onboarding", "i");

/** Días desde que agendó el onboarding en que corre cada paso (y hasta cuándo se reintenta si no salió). */
export const VENTANAS = {
  bienvenida: { desde: 0, hasta: 3 },
  encuesta10: { desde: 10, hasta: 20 },
  encuesta30: { desde: 30, hasta: 40 },
} as const;
/** Quien llega al sistema con más días que esto desde que agendó queda "histórico": no se le escribe. */
export const DIAS_HISTORICO = 40;
