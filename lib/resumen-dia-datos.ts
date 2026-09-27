import "server-only";

import { type Agendas, contarAgendas, type EventoCalendly, inicioDiaPR, type MarcaResumen, pestanasDelMes, type ResumenMarca, ventasDelDia, type VentasDia } from "@/lib/resumen-dia";

// Junta los datos del resumen del día (lib/resumen-dia.ts): Calendly de cada marca (su propia cuenta:
// CALENDLY_TOKEN / CALENDLY_TOKEN_AIB) y las hojas de ventas de tesorería, que son privadas y se leen
// con el Apps Script de scripts/drive/ventas-hoy.gs (VENTAS_SCRIPT_URL + VENTAS_SCRIPT_SECRETO).

const TOKENS: Record<MarcaResumen, string | undefined> = {
  level_up: process.env.CALENDLY_TOKEN,
  ai_borinquen: process.env.CALENDLY_TOKEN_AIB,
};
// Si no se puede saber por los datos, cómo escribe las fechas cada hoja (AIB: 24/10/2025).
const ORDEN_FECHA: Record<MarcaResumen, "dmy" | "mdy"> = { level_up: "mdy", ai_borinquen: "dmy" };
const ONBOARDING = new RegExp(process.env.CALENDLY_IGNORAR_REGEX || "onboarding", "i");

async function eventosCalendly(token: string, dia: string, status: "active" | "canceled"): Promise<EventoCalendly[]> {
  const h = { Authorization: `Bearer ${token}` };
  const me = (await (await fetch("https://api.calendly.com/users/me", { headers: h, signal: AbortSignal.timeout(15000) })).json()) as { resource?: { current_organization?: string } };
  const org = me.resource?.current_organization;
  if (!org) throw new Error("calendly-sin-org");
  // Lo reservado hoy es para hoy en adelante: ventana de citas desde hoy hasta 4 meses.
  const desde = inicioDiaPR(dia);
  const hasta = new Date(desde.getTime() + 120 * 86_400_000);
  let url: string | null =
    `https://api.calendly.com/scheduled_events?organization=${encodeURIComponent(org)}&status=${status}&count=100` +
    `&min_start_time=${desde.toISOString()}&max_start_time=${hasta.toISOString()}`;
  const out: EventoCalendly[] = [];
  for (let i = 0; url && i < 20; i++) {
    const r = (await (await fetch(url, { headers: h, signal: AbortSignal.timeout(15000) })).json()) as { collection?: EventoCalendly[]; pagination?: { next_page?: string | null } };
    out.push(...(r.collection ?? []));
    url = r.pagination?.next_page ?? null;
  }
  return out;
}

export async function agendasDelDia(marca: MarcaResumen, dia: string): Promise<Agendas | null> {
  const token = TOKENS[marca];
  if (!token) return null;
  try {
    const [activos, cancelados] = await Promise.all([eventosCalendly(token, dia, "active"), eventosCalendly(token, dia, "canceled")]);
    return contarAgendas([...activos, ...cancelados], dia, (n) => ONBOARDING.test(n));
  } catch (e) {
    console.error(`[resumen-dia] calendly ${marca}`, e instanceof Error ? e.message : e);
    return null;
  }
}

export const hojasConectadas = () => Boolean(process.env.VENTAS_SCRIPT_URL && process.env.VENTAS_SCRIPT_SECRETO);

export async function ventasDeMarca(marca: MarcaResumen, dia: string): Promise<VentasDia | null> {
  if (!hojasConectadas()) return null;
  try {
    const r = await fetch(process.env.VENTAS_SCRIPT_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "hoja", marca, buscar: pestanasDelMes(marca, dia), secreto: process.env.VENTAS_SCRIPT_SECRETO }),
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; filas?: string[][]; error?: string };
    if (!j.ok || !j.filas) return { nuevas: { monto: 0, n: 0 }, renovaciones: { monto: 0, n: 0 }, error: j.error ?? `HTTP ${r.status}` };
    return ventasDelDia(j.filas, dia, ORDEN_FECHA[marca]);
  } catch (e) {
    return { nuevas: { monto: 0, n: 0 }, renovaciones: { monto: 0, n: 0 }, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function resumenDelDia(dia: string): Promise<ResumenMarca[]> {
  const marcas: MarcaResumen[] = ["level_up", "ai_borinquen"];
  return Promise.all(marcas.map(async (marca) => ({ marca, agendas: await agendasDelDia(marca, dia), ventas: await ventasDeMarca(marca, dia) })));
}
