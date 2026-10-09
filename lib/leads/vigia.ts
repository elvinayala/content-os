import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { notificarPorNico } from "@/lib/notificar-ceo";
import { db } from "@/lib/pulse/db";

import { decisionVigia, horarioVigia, MARCAS, problemaTimelines, slugDeMarca, type Marca } from "./reglas";
import { registrarWebhook } from "./repo";
import { leadsWebhookLog } from "./schema";
import { cuentasTimelines, timelinesListo, webhooksTimelines } from "./timelines";

// Vigía del WhatsApp de Leads (9/oct, Elvin): cada 30 min pregunta a Timelines si la API, el número y los
// webhooks de cada marca están bien, y mira cuánto hace que no entra un mensaje. Avisa por el Telegram de Nico
// UNA vez por problema y otra cuando se arregla. El estado queda en leads_webhook_log (fuente "vigia").

type Fila = Record<string, unknown>;
const lista = (x: unknown, k: string): Fila[] => {
  const d = (x as Fila)?.data ?? x;
  const v = Array.isArray(d) ? d : (d as Fila)?.[k];
  return Array.isArray(v) ? (v as Fila[]) : [];
};

async function revisarMarca(marca: Marca, horaPR: number) {
  const d = await db();
  const [ultimo] = await d.select({ at: leadsWebhookLog.createdAt }).from(leadsWebhookLog).where(and(eq(leadsWebhookLog.marca, marca), eq(leadsWebhookLog.fuente, "timelines"))).orderBy(desc(leadsWebhookLog.createdAt)).limit(1);
  const [previo] = await d.select({ r: leadsWebhookLog.resultado }).from(leadsWebhookLog).where(and(eq(leadsWebhookLog.marca, marca), eq(leadsWebhookLog.fuente, "vigia"))).orderBy(desc(leadsWebhookLog.createdAt)).limit(1);
  const [cu, wh] = await Promise.all([cuentasTimelines(marca), webhooksTimelines(marca)]);
  const chequeo = {
    apiStatus: cu.ok ? 200 : cu.status,
    cuentas: lista(cu.data, "whatsapp_accounts").map((a) => ({ phone: String(a.phone ?? a.id ?? "?"), status: String(a.status ?? "") })),
    webhooks: wh.ok ? lista(wh.data, "webhooks").map((w) => ({ event_type: String(w.event_type ?? ""), enabled: w.enabled !== false, url: String(w.url ?? "") })) : [
      // Si solo falló la lectura de webhooks, no se inventa que faltan.
      { event_type: "message:received:new", enabled: true, url: `/api/leads/timelines?marca=${slugDeMarca(marca)}` },
      { event_type: "message:sent:new", enabled: true, url: `/api/leads/timelines?marca=${slugDeMarca(marca)}` },
    ],
    slug: slugDeMarca(marca),
    horasSilencio: ultimo ? (Date.now() - ultimo.at.getTime()) / 3_600_000 : null,
  };
  const problema = problemaTimelines(chequeo);
  const accion = decisionVigia(previo?.r ?? null, problema, horarioVigia(horaPR));
  const nombre = Object.values(MARCAS).find((m) => m.marca === marca)?.nombre ?? marca;
  if (accion === "alertar" && problema) {
    await notificarPorNico(`🚨 WhatsApp de ${nombre} → Leads: ${problema.texto}\nMientras tanto los leads nuevos de ${nombre} NO están entrando a Leads.\n— Nico`);
    await registrarWebhook("vigia", marca, "chequeo", `alerta:${problema.clave}`, chequeo);
  } else if (accion === "recuperado") {
    await notificarPorNico(`✅ WhatsApp de ${nombre} → Leads volvió a funcionar. Lo que llegó en el hueco Timelines lo reenvía solo; si algo no aparece, avísame.\n— Nico`);
    await registrarWebhook("vigia", marca, "chequeo", "ok", chequeo);
  }
  return { marca, problema: problema?.clave ?? null, accion, horasSilencio: chequeo.horasSilencio && Math.round(chequeo.horasSilencio * 10) / 10 };
}

export async function vigilarWhatsapp() {
  const horaPR = Number(new Date().toLocaleString("en-US", { timeZone: "America/Puerto_Rico", hour: "numeric", hour12: false })) % 24;
  const marcas = (["level_up", "ai_borinquen"] as Marca[]).filter(timelinesListo);
  return Promise.all(marcas.map((m) => revisarMarca(m, horaPR).catch((e) => ({ marca: m, error: e instanceof Error ? e.message : String(e) }))));
}
