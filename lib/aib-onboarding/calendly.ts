import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { CALENDLY_SIGNING_KEY, CALENDLY_TOKEN, DIAS_HISTORICO, EVENTO_ONBOARDING } from "./config";

// El Calendly de AI Borinquen (cuenta aparte de la de Level Up). Igual que en Level Up: quien agenda la
// llamada de onboarding ya es cliente. Entra por webhook (/api/aib/calendly) y, como red, el cron
// relee por API las citas de onboarding de los últimos DIAS_HISTORICO días.

interface QA {
  question: string;
  answer: string;
}

export interface InviteeCalendly {
  uri: string;
  email: string;
  name: string;
  status: "active" | "canceled";
  created_at: string;
  rescheduled?: boolean;
  text_reminder_number?: string | null;
  questions_and_answers?: QA[];
  scheduled_event: { uri: string; name: string; start_time: string };
}

export interface OnboardingAib {
  calendlyInvitee: string;
  nombre: string;
  email: string | null;
  telefono: string | null; // solo dígitos, con código de país
  empresa: string | null;
  servicio: string | null;
  evento: string;
  citaAt: Date;
  fechaPago: string; // YYYY-MM-DD en hora de PR del día que agendó = día 0
}

const TZ = "America/Puerto_Rico";
export const fechaPR = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });

/** Teléfono de PR/EE.UU. a dígitos con código de país (10 dígitos → antepone 1). */
export function normalizarTelefono(v: string): string | null {
  const d = v.replace(/\D/g, "");
  if (d.length === 10) return `1${d}`;
  if (d.length >= 11 && d.length <= 15) return d;
  return null;
}

const respuesta = (inv: InviteeCalendly, re: RegExp) => (inv.questions_and_answers?.find((q) => re.test(q.question))?.answer ?? "").trim() || null;

export const esOnboarding = (nombreEvento: string) => EVENTO_ONBOARDING.test(nombreEvento);

export function onboardingDe(inv: InviteeCalendly): OnboardingAib {
  const tel = inv.text_reminder_number || respuesta(inv, /tel[eé]fono|whatsapp|celular|phone|n[uú]mero/i) || "";
  return {
    calendlyInvitee: inv.uri,
    nombre: inv.name.trim(),
    email: inv.email?.trim().toLowerCase() || null,
    telefono: normalizarTelefono(tel),
    empresa: respuesta(inv, /negocio|empresa|compa[ñn][ií]a|business|company|cl[ií]nica|marca/i)?.slice(0, 120) ?? null,
    servicio: respuesta(inv, /servicio|plan|paquete|contrat|agente|producto/i)?.slice(0, 120) ?? null,
    evento: inv.scheduled_event.name,
    citaAt: new Date(inv.scheduled_event.start_time),
    fechaPago: fechaPR(inv.created_at),
  };
}

/** Firma de Calendly ("t=…,v1=…", HMAC-SHA256 de `${t}.${raw}`). Sin signing key: abierto solo fuera de prod. */
export function firmaCalendlyValida(raw: string, header: string | null): boolean {
  const key = CALENDLY_SIGNING_KEY();
  if (!key) return process.env.NODE_ENV !== "production";
  if (!header) return false;
  const partes = Object.fromEntries(header.split(",").map((p) => p.trim().split("=") as [string, string]));
  if (!partes.t || !partes.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(partes.t)) > 300) return false;
  const a = Buffer.from(createHmac("sha256", key).update(`${partes.t}.${raw}`).digest("hex"));
  const b = Buffer.from(partes.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function api<T>(ruta: string): Promise<T> {
  const url = ruta.startsWith("http") ? ruta : `https://api.calendly.com${ruta}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${CALENDLY_TOKEN()}` }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`Calendly ${r.status} ${ruta.slice(0, 80)}`);
  return (await r.json()) as T;
}

/**
 * Citas de onboarding agendadas en el Calendly de AIB en los últimos DIAS_HISTORICO días (activas y
 * futuras incluidas). Sin CALENDLY_TOKEN_AIB devuelve null: la corrida sigue solo con lo que ya entró.
 */
export async function onboardingsRecientes(): Promise<OnboardingAib[] | null> {
  if (!CALENDLY_TOKEN()) return null;
  const { resource: yo } = await api<{ resource: { current_organization: string } }>("/users/me");
  const desde = new Date(Date.now() - DIAS_HISTORICO * 86_400_000).toISOString();
  type Ev = InviteeCalendly["scheduled_event"];
  const eventos: Ev[] = [];
  let pagina: string | null =
    `/scheduled_events?organization=${encodeURIComponent(yo.current_organization)}&min_start_time=${encodeURIComponent(desde)}&status=active&count=100`;
  while (pagina) {
    const r: { collection: Ev[]; pagination: { next_page: string | null } } = await api(pagina);
    eventos.push(...r.collection.filter((e) => esOnboarding(e.name)));
    pagina = r.pagination.next_page;
  }
  const salida: OnboardingAib[] = [];
  for (const e of eventos) {
    const { collection } = await api<{ collection: Omit<InviteeCalendly, "scheduled_event">[] }>(`${e.uri.replace("https://api.calendly.com", "")}/invitees?count=100`);
    for (const inv of collection) {
      if (inv.status !== "active") continue;
      salida.push(onboardingDe({ ...inv, scheduled_event: e }));
    }
  }
  return salida;
}
