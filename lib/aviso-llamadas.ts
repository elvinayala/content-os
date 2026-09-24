// Aviso de cada llamada agendada en Calendly → el canal de llamadas del Slack DE ESA MARCA.
//   Level Up     → Slack de Level Up, #office-10-lum-calls (bot Command Center, SLACK_BOT_TOKEN)
//   AI Borinquen → Slack de AI Borinquen, #borinquenia-calls (webhook entrante SLACK_AIB_CALLS_WEBHOOK)
// Regla de Elvin (24/sep): cada marca en su propio Slack; una cita de AIB NUNCA va al Slack de LU.
// Nunca tira: si Slack falla, la agenda sigue su curso (Pipedrive, AC, onboarding).

export type MarcaLlamada = "level-up" | "ai-borinquen";

interface QA {
  question: string;
  answer: string;
}

// Lo mínimo del invitee de Calendly (los dos webhooks reciben el mismo payload).
export interface InviteeAviso {
  uri?: string;
  name: string;
  email?: string;
  text_reminder_number?: string | null;
  old_invitee?: string | null;
  questions_and_answers?: QA[];
  tracking?: { utm_source?: string | null } | null;
  scheduled_event: {
    name: string;
    start_time: string;
    event_memberships?: { user_name?: string; user_email?: string }[];
  };
}

const CANAL = () => process.env.SLACK_CALLS_CHANNEL_ID || "C08UMBSTJ03"; // #office-10-lum-calls (Slack de LU)
const TZ = "America/Puerto_Rico";

const ETIQUETA: Record<MarcaLlamada, string> = { "level-up": "Level Up", "ai-borinquen": "AI Borinquen" };

function fechaHora(iso: string) {
  const d = new Date(iso);
  const dia = new Intl.DateTimeFormat("es-PR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(d);
  const hora = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return `${dia.replace(",", "")}, ${hora}`;
}

const respuesta = (inv: InviteeAviso, re: RegExp) =>
  (inv.questions_and_answers?.find((q) => re.test(q.question))?.answer ?? "").trim();

// Slack interpreta <, > y & en el texto.
const limpio = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "‹", ">": "›", "&": "y" })[c]!).slice(0, 150);

export function textoAviso(marca: MarcaLlamada, inv: InviteeAviso, opts: { closer?: string; onboarding?: boolean } = {}): string {
  const ev = inv.scheduled_event;
  const closer = opts.closer || ev.event_memberships?.[0]?.user_name || "sin asignar";
  const telCrudo = inv.text_reminder_number || respuesta(inv, /tel[eé]fono|whatsapp|celular|phone|n[uú]mero/i);
  const telefono = (telCrudo.match(/\d/g)?.length ?? 0) >= 7 ? telCrudo : ""; // "." o "n/a" no es un teléfono
  const negocio = respuesta(inv, /negocio|empresa|compa[ñn][ií]a|business|company|cl[ií]nica|marca/i);
  const agendo = inv.tracking?.utm_source?.trim();
  const titulo = opts.onboarding
    ? `🎉 *Onboarding agendado · ${ETIQUETA[marca]}* (cliente nuevo)`
    : inv.old_invitee
      ? `🔁 *Llamada reagendada · ${ETIQUETA[marca]}*`
      : `📅 *Nueva llamada · ${ETIQUETA[marca]}*`;
  const lineas = [
    titulo,
    `*Cliente:* ${limpio(inv.name)}`,
    negocio ? `*Negocio:* ${limpio(negocio)}` : null,
    `*Cita:* ${fechaHora(ev.start_time)} · ${limpio(ev.name)}`,
    `*Closer:* ${limpio(closer)}`,
    `*Contacto:* ${[telefono, inv.email].filter(Boolean).map((x) => limpio(String(x))).join(" · ") || "—"}`,
    `*Agendó:* ${agendo ? limpio(agendo) : "directo (sin setter)"}`,
  ];
  return lineas.filter(Boolean).join("\n");
}

// Calendly reintenta el webhook si tardamos: no repetir el aviso del mismo invitee.
const avisados = new Map<string, number>();

export async function avisarLlamada(
  marca: MarcaLlamada,
  inv: InviteeAviso,
  opts: { closer?: string; onboarding?: boolean } = {},
): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  const webhookAib = process.env.SLACK_AIB_CALLS_WEBHOOK;
  if (marca === "level-up" ? !token : !webhookAib) return;
  const clave = inv.uri || `${inv.email}|${inv.scheduled_event.start_time}`;
  const ahora = Date.now();
  for (const [k, t] of avisados) if (ahora - t > 30 * 60_000) avisados.delete(k);
  if (avisados.has(clave)) return;
  avisados.set(clave, ahora);
  const text = textoAviso(marca, inv, opts);
  try {
    if (marca === "ai-borinquen") {
      const r = await fetch(webhookAib!, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ text, unfurl_links: false }),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) console.error("[aviso-llamadas] ai-borinquen", r.status, await r.text().catch(() => ""));
      return;
    }
    const r = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel: CANAL(), text, unfurl_links: false }),
      signal: AbortSignal.timeout(8000),
    });
    const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!d.ok) console.error("[aviso-llamadas]", marca, d.error);
  } catch (e) {
    console.error("[aviso-llamadas]", marca, e instanceof Error ? e.message : e);
  }
}
