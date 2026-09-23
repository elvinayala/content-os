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

/** Tablero de Pulse con los clientes que pagan en AI Borinquen (agentes y marketing). */
export const SLUG_TABLERO = "ai-borinquen";
/** Grupos del tablero que NO son clientes activos. */
export const GRUPOS_FUERA = /offboarded|inner circle/i;

/** Días desde el pago en que corre cada paso (y hasta cuándo se reintenta si no salió). */
export const VENTANAS = {
  bienvenida: { desde: 0, hasta: 3 },
  encuesta10: { desde: 10, hasta: 20 },
  encuesta30: { desde: 30, hasta: 40 },
} as const;
/** Quien llega al sistema con más días que esto desde el pago queda "histórico": no se le escribe. */
export const DIAS_HISTORICO = 40;
