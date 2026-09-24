import { after, NextResponse, type NextRequest } from "next/server";

import { esOnboarding, firmaCalendlyValida, onboardingDe, type InviteeCalendly } from "@/lib/aib-onboarding/calendly";
import { enviarPendiente, registrarOnboarding } from "@/lib/aib-onboarding/proceso";
import { avisarLlamada, type InviteeAviso } from "@/lib/aviso-llamadas";

// Webhook del Calendly de AI Borinquen (cuenta aparte de la de Level Up, que va a /api/calendly).
// Igual que en Level Up: agendar la llamada de onboarding = es cliente → se registra y sale la
// bienvenida por WhatsApp en el momento. Cancelar no lo saca (ya pagó); una reagenda no repite nada.
// Público en proxy.ts; se valida la firma con AIB_CALENDLY_WEBHOOK_SIGNING_KEY.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!firmaCalendlyValida(raw, req.headers.get("calendly-webhook-signature"))) {
    return NextResponse.json({ error: "firma-invalida" }, { status: 401 });
  }
  let hook: { event: string; payload: InviteeCalendly };
  try {
    hook = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "json-invalido" }, { status: 400 });
  }
  const inv = hook.payload;
  if (hook.event !== "invitee.created") return NextResponse.json({ ok: true, ignorado: hook.event });
  if (!inv?.scheduled_event?.name) return NextResponse.json({ error: "payload-incompleto" }, { status: 400 });
  // Toda cita de AIB (demo, llamada u onboarding) se avisa en el canal de llamadas.
  const onboarding = esOnboarding(inv.scheduled_event.name);
  after(() => avisarLlamada("ai-borinquen", inv as unknown as InviteeAviso, { onboarding }));
  if (!onboarding) return NextResponse.json({ ok: true, avisado: true, ignorado: `tipo-evento:${inv.scheduled_event.name}` });

  const o = onboardingDe(inv);
  if (!o.telefono) {
    console.warn("[aib-calendly] onboarding sin teléfono:", o.nombre, o.email);
    return NextResponse.json({ ok: true, sinTelefono: true });
  }
  after(async () => {
    try {
      const { cliente, nuevo } = await registrarOnboarding(o);
      const envio = cliente ? await enviarPendiente(cliente) : null;
      console.log("[aib-calendly]", o.nombre, JSON.stringify({ nuevo, envio }));
    } catch (e) {
      console.error("[aib-calendly]", e);
    }
  });
  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: true, servicio: "onboarding AI Borinquen (Calendly de AIB)" });
}
