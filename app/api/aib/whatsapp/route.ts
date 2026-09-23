import { after, NextResponse, type NextRequest } from "next/server";

import { cuentaAib } from "@/lib/aib-onboarding/config";
import { atenderEntrante, marcarTomaHumana } from "@/lib/aib-onboarding/proceso";
import { firmaValida, parsearEntrante, tomaHumana } from "@/lib/zernio";

// Webhook de Zernio para el WhatsApp de onboarding de AI Borinquen (público en proxy.ts; se valida la
// firma x-zernio-signature). Responde 200 enseguida y el agente contesta en after(), para que Zernio
// no reintente mientras Claude piensa.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const cuenta = cuentaAib();
  if (!firmaValida(raw, req.headers.get("x-zernio-signature"), cuenta.webhookSecret)) {
    return NextResponse.json({ error: "firma-invalida" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "json-invalido" }, { status: 400 });
  }
  const humano = tomaHumana(body, cuenta.accountId);
  if (humano) {
    await marcarTomaHumana(humano.telefono);
    return NextResponse.json({ ok: true, humano: true });
  }
  const entrante = parsearEntrante(body, cuenta.accountId);
  if (!entrante) return NextResponse.json({ ok: true, ignorado: true });
  after(async () => {
    try {
      const r = await atenderEntrante(entrante);
      console.log("[aib-onboarding]", entrante.telefono, r);
    } catch (e) {
      console.error("[aib-onboarding] entrante", e);
    }
  });
  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: true, servicio: "onboarding AI Borinquen (Zernio)", cuenta: Boolean(cuentaAib().accountId) });
}
