/**
 * Cobros: link de pago con tarjeta (Stripe Checkout) + instrucciones de ATH Móvil Business.
 * El cliente SIEMPRE le paga a Resuelto; el plomero se liquida el viernes.
 */
import Stripe from "stripe";
import { config } from "../config.js";

let stripe: Stripe | null = null;
function cliente(): Stripe | null {
  if (!config.tiene.stripe()) return null;
  return (stripe ??= new Stripe(config.cobros.stripeKey));
}

export interface LinkPago { url?: string; athMovil: string; total: number; simulado: boolean }

export async function crearLinkPago(args: { trabajoId: string; concepto: string; montoCentavos: number; telefono?: string; proyectoId?: string }): Promise<LinkPago> {
  const total = args.montoCentavos / 100;
  const athMovil = `ATH Móvil Business ${config.cobros.athMovil} · referencia ${args.trabajoId} · $${total.toFixed(2)}`;
  const s = cliente();
  if (!s) return { athMovil, total, simulado: true, url: `${config.urlPublica}/pagar/${args.trabajoId}` };

  const session = await s.checkout.sessions.create({
    mode: "payment",
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: args.montoCentavos, product_data: { name: `Resuelto · ${args.concepto}`, description: `Trabajo ${args.trabajoId}. Garantía de 12 meses en mano de obra.` } } }],
    metadata: { trabajoId: args.trabajoId, telefono: args.telefono ?? "", proyectoId: args.proyectoId ?? "" },
    success_url: `${config.urlPublica}/gracias?trabajo=${args.trabajoId}`,
    cancel_url: `${config.urlPublica}/pagar/${args.trabajoId}`,
  });
  return { url: session.url ?? undefined, athMovil, total, simulado: false };
}

/** Webhook de Stripe: marca el trabajo como cobrado. Se registra en index.ts. */
export function verificarEventoStripe(payload: Buffer, firma: string, secret: string): Stripe.Event | null {
  const s = cliente();
  if (!s) return null;
  try { return s.webhooks.constructEvent(payload, firma, secret); } catch { return null; }
}
