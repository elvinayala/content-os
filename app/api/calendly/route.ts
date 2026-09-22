import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { upsertContacto } from "@/lib/activecampaign";

// Webhook de Calendly (Level Up Media) → Pipedrive de Level Up, pipeline
// "CLOSERS" (id 15). Cada cita agendada cae como deal en "Llamada agendada",
// asignada al closer dueño del evento en Calendly, con una actividad (call)
// a la hora de la llamada y una nota con las respuestas del invitado.
//
//   invitee.created  → persona (buscar/crear) + deal en stage 145 + actividad + nota
//                       (si es reagenda: reusa el deal, stage 146, actualiza fecha)
//   invitee.canceled → deal a stage 147 "Llamada cancelada" (o 146 si fue reagendado;
//                       el invitee.created que sigue trae la fecha nueva)
//
// Se registra con `scripts/calendly-webhook.mjs` (scope organization, eventos
// invitee.created + invitee.canceled). Firma: CALENDLY_WEBHOOK_SIGNING_KEY.
// Sin la key el endpoint acepta todo (solo para probar en local).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN = process.env.PIPEDRIVE_LEVELUP_TOKEN;
const SIGNING_KEY = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

const PIPELINE_CLOSERS = 15;
const STAGE = {
  agendada: 145,
  reprogramada: 146,
  cancelada: 147,
} as const;

// Campos custom del deal (creados vía API el 15/sep/2026).
const CAMPO = {
  eventoUri: "ed6f63814132206c5fa906e91ceb3e0ae94d6316", // Calendly · Evento (URI)
  fecha: "a81760a662b204bfab9df09f45eff0ba84cc6473", // Llamada · Fecha
  tipoEvento: "67169c96635a3d51860c8d7170466d9a4c444170", // Llamada · Tipo de evento
  origen: "588aa0143f470cff94212dcd1211423d6e26d87e", // Origen (UTM)
  reagendas: "41e3dc368b8068357f4889299fedb8b683d6560e", // Calendly · Reagendas
  closer: "2200631bd303e5cf54f5ee2a4402d7af06c2b3e2", // Closer (Calendly) — nombre del host
  agendo: "eca80966ed18f95e6ee59c971d8a0b56b585382e", // Agendó (utm_source) — setter/canal
} as const;

// Tipos de evento que NO son llamadas de venta (no entran al pipeline).
// Override: CALENDLY_IGNORAR_REGEX="onboarding|entrevista"
const IGNORAR = new RegExp(process.env.CALENDLY_IGNORAR_REGEX ?? "onboarding", "i");

// Closer en Calendly → usuario de Pipedrive. Por defecto se cruza por email;
// si el closer usa otro email en Pipedrive, mapealo acá:
//   CALENDLY_OWNER_MAP="nahuel@levelupmediapr.net=26975574,otro@x.com=123"
function ownerMapEnv(): Map<string, number> {
  const m = new Map<string, number>();
  for (const par of (process.env.CALENDLY_OWNER_MAP ?? "").split(",")) {
    const [email, id] = par.split("=").map((s) => s?.trim().toLowerCase());
    if (email && Number(id)) m.set(email, Number(id));
  }
  return m;
}

// --- Tipos del payload de Calendly ------------------------------------------

interface CalendlyQA {
  question: string;
  answer: string;
  position?: number;
}

interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  status: "active" | "canceled";
  timezone?: string;
  created_at: string;
  rescheduled?: boolean;
  old_invitee?: string | null;
  new_invitee?: string | null;
  cancel_url?: string;
  reschedule_url?: string;
  text_reminder_number?: string | null;
  questions_and_answers?: CalendlyQA[];
  tracking?: {
    utm_campaign?: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
    salesforce_uuid?: string | null;
  };
  cancellation?: { canceled_by?: string; reason?: string | null; canceler_type?: string };
  scheduled_event: {
    uri: string;
    name: string;
    status: string;
    start_time: string;
    end_time: string;
    event_type: string;
    location?: { type?: string; location?: string | null; join_url?: string | null };
    event_memberships?: { user: string; user_email?: string; user_name?: string }[];
    event_guests?: { email: string }[];
  };
}

interface CalendlyWebhook {
  event: "invitee.created" | "invitee.canceled" | string;
  created_at: string;
  created_by: string;
  payload: CalendlyInvitee;
}

// --- Firma -------------------------------------------------------------------

function firmaValida(raw: string, header: string | null): boolean {
  if (!SIGNING_KEY) return true; // sin key: abierto (local)
  if (!header) return false;
  const partes = Object.fromEntries(
    header.split(",").map((p) => p.trim().split("=") as [string, string]),
  );
  const t = partes.t;
  const v1 = partes.v1;
  if (!t || !v1) return false;
  // Rechazar firmas de más de 5 min (replay).
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const esperado = createHmac("sha256", SIGNING_KEY).update(`${t}.${raw}`).digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- Pipedrive ----------------------------------------------------------------

async function pd<T = unknown>(
  method: "GET" | "POST" | "PUT",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://api.pipedrive.com/v1/${path}${sep}api_token=${TOKEN}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T; error?: string };
  if (!res.ok || data.success === false) {
    throw new Error(`Pipedrive ${method} ${path.split("?")[0]}: ${data.error ?? res.status}`);
  }
  return data.data as T;
}

async function buscarPersona(email: string): Promise<number | null> {
  const r = await pd<{ items?: { item: { id: number } }[] }>(
    "GET",
    `persons/search?term=${encodeURIComponent(email)}&fields=email&exact_match=true&limit=1`,
  );
  return r?.items?.[0]?.item?.id ?? null;
}

// Deal ya creado para este evento de Calendly (idempotencia: Calendly reintenta).
async function buscarDealPorEvento(eventoUri: string): Promise<number | null> {
  const r = await pd<{ items?: { item: { id: number } }[] }>(
    "GET",
    `deals/search?term=${encodeURIComponent(eventoUri)}&fields=custom_fields&exact_match=true&limit=1`,
  );
  return r?.items?.[0]?.item?.id ?? null;
}

// Deal abierto del CLOSERS pipeline de esta persona (para reagendas y cancelaciones).
async function buscarDealAbiertoCloser(personId: number): Promise<{ id: number; [k: string]: unknown } | null> {
  const r = await pd<{ id: number; pipeline_id: number; status: string; [k: string]: unknown }[]>(
    "GET",
    `persons/${personId}/deals?status=open&limit=50`,
  );
  return (r ?? []).find((d) => d.pipeline_id === PIPELINE_CLOSERS) ?? null;
}

// Marca como hechas las llamadas pendientes del deal (la cita se movió o se
// canceló; la actividad vieja no tiene que seguir en la agenda del closer).
async function cerrarLlamadasPendientes(dealId: number) {
  const acts = await pd<{ id: number; type: string; done: boolean }[]>("GET", `deals/${dealId}/activities?done=0&limit=50`);
  for (const a of acts ?? []) {
    if (a.type === "call") await pd("PUT", `activities/${a.id}`, { done: 1 });
  }
}

// Usuarios de Pipedrive (cache en memoria del worker; cambian poco).
let usuariosCache: { at: number; lista: { id: number; email: string; name: string; active_flag: boolean }[] } | null = null;
async function usuarios() {
  if (usuariosCache && Date.now() - usuariosCache.at < 10 * 60_000) return usuariosCache.lista;
  const lista = await pd<{ id: number; email: string; name: string; active_flag: boolean }[]>("GET", "users");
  usuariosCache = { at: Date.now(), lista: lista ?? [] };
  return usuariosCache.lista;
}

async function resolverOwner(inv: CalendlyInvitee): Promise<{ id?: number; nombre?: string; email?: string }> {
  const host = inv.scheduled_event.event_memberships?.[0];
  const email = host?.user_email?.toLowerCase();
  if (!email) return {};
  const manual = ownerMapEnv().get(email);
  if (manual) return { id: manual, nombre: host?.user_name, email };
  const lista = await usuarios();
  const porEmail = lista.find((u) => u.active_flag && u.email?.toLowerCase() === email);
  if (porEmail) return { id: porEmail.id, nombre: porEmail.name, email };
  // Fallback: primer nombre coincide (Nahuel usa gmail en Pipedrive, p. ej.).
  const primerNombre = (host?.user_name ?? "").split(/\s+/)[0]?.toLowerCase();
  const porNombre = primerNombre
    ? lista.find((u) => u.active_flag && u.name.toLowerCase().startsWith(primerNombre))
    : undefined;
  if (porNombre) return { id: porNombre.id, nombre: porNombre.name, email };
  return { nombre: host?.user_name, email };
}

// --- Helpers de formato ------------------------------------------------------

const esc = (s: unknown) =>
  String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

const TZ = "America/Puerto_Rico";

function fechaPR(iso: string) {
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d); // YYYY-MM-DD
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d); // HH:MM
  return { fecha: f, hora: h };
}

function fechaLegible(iso: string) {
  return new Intl.DateTimeFormat("es-PR", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function telefonoDe(inv: CalendlyInvitee): string {
  if (inv.text_reminder_number) return inv.text_reminder_number;
  const qa = inv.questions_and_answers?.find((q) =>
    /tel[eé]fono|whatsapp|celular|phone|n[uú]mero/i.test(q.question),
  );
  return (qa?.answer ?? "").trim().slice(0, 40);
}

function negocioDe(inv: CalendlyInvitee): string {
  const qa = inv.questions_and_answers?.find((q) =>
    /negocio|empresa|compa[ñn][ií]a|business|company|cl[ií]nica|marca/i.test(q.question),
  );
  return (qa?.answer ?? "").trim().slice(0, 120);
}

function origenDe(inv: CalendlyInvitee): string {
  const t = inv.tracking ?? {};
  return ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
    .map((k) => t[k as keyof typeof t])
    .filter(Boolean)
    .join(" / ")
    .slice(0, 250);
}

function notaAgenda(inv: CalendlyInvitee, owner: { nombre?: string }, reagenda: boolean) {
  const ev = inv.scheduled_event;
  const t = inv.tracking ?? {};
  const telefono = telefonoDe(inv);
  const negocio = negocioDe(inv);
  // Respuestas del formulario que no sean el teléfono/negocio (ya van arriba), cortas.
  const extras = (inv.questions_and_answers ?? [])
    .filter((q) => q.answer?.trim() && !/tel[eé]fono|whatsapp|celular|phone|n[uú]mero|negocio|empresa|compa[ñn][ií]a|business|company|cl[ií]nica|marca/i.test(q.question))
    .map((q) => `${esc(q.question.replace(/[¿?]/g, "").trim())}: ${esc(q.answer.trim().slice(0, 160))}`)
    .join(" · ");
  const link = ev.location?.join_url ?? ev.location?.location ?? "";
  return (
    `<b>${reagenda ? "Reagendó" : "Agendó"} por Calendly</b> · ${esc(ev.name)} · ${esc(fechaLegible(ev.start_time))} PR<br>` +
    `Closer: ${esc(owner.nombre ?? "sin asignar")} · Agendó: ${esc(t.utm_source ?? "directo")}` +
    (t.utm_medium || t.utm_campaign ? ` (${esc([t.utm_medium, t.utm_campaign].filter(Boolean).join(" / "))})` : "") + `<br>` +
    `Lead: ${esc(inv.name)} · ${esc(inv.email)}${telefono ? ` · ${esc(telefono)}` : ""}${negocio ? ` · ${esc(negocio)}` : ""}` +
    (extras ? `<br>${extras}` : "") +
    (link ? `<br>Zoom: ${esc(link)}` : "")
  );
}

// --- Handler -----------------------------------------------------------------

// Guardia en memoria contra reintentos inmediatos (el índice de búsqueda de
// Pipedrive tarda unos segundos en ver un deal recién creado).
const recientes = new Map<string, number>();
function vistoRecien(uri: string): boolean {
  const ahora = Date.now();
  for (const [k, t] of recientes) if (ahora - t > 10 * 60_000) recientes.delete(k);
  if (recientes.has(uri)) return true;
  recientes.set(uri, ahora);
  return false;
}

// Marca del lead según el tipo de evento o el closer (Juan David = AI Borinquen). Override
// con CALENDLY_MARCA_AIB_REGEX. Default: Level Up.
const MARCA_AIB = new RegExp(process.env.CALENDLY_MARCA_AIB_REGEX ?? "borinquen|autoflow|automatiz|juan david", "i");
function marcaDe(inv: CalendlyInvitee): "level-up" | "ai-borinquen" {
  const host = inv.scheduled_event.event_memberships?.[0];
  const texto = `${inv.scheduled_event.name} ${host?.user_name ?? ""} ${host?.user_email ?? ""}`;
  return MARCA_AIB.test(texto) ? "ai-borinquen" : "level-up";
}

// Webhook `onboarding-cita` de n8n (workflow "A-) Cita de onboarding v1", generado por
// scripts/n8n-sync-pulse.mjs crear-citas). Mismo secreto que el puente de Pulse. No-op sin env.
async function avisarOnboardingN8n(inv: CalendlyInvitee): Promise<{ enviado: boolean; status?: number; motivo?: string }> {
  const base = process.env.N8N_URL?.replace(/\/$/, "");
  const secreto = process.env.PULSE_N8N_SECRET;
  if (!base || !secreto) return { enviado: false, motivo: "sin N8N_URL/PULSE_N8N_SECRET" };
  const ev = inv.scheduled_event;
  const partes = inv.name.trim().split(/\s+/);
  const cuerpo = {
    nombre: inv.first_name?.trim() || partes[0] || "",
    apellido: inv.last_name?.trim() || partes.slice(1).join(" "),
    email: inv.email.trim().toLowerCase(),
    telefono: telefonoDe(inv),
    fecha: ev.start_time,
    eventName: ev.name,
    zoomLink: ev.location?.join_url || ev.location?.location || "",
    uri: ev.uri,
    reagenda: Boolean(inv.old_invitee),
  };
  try {
    const r = await fetch(`${base}/webhook/onboarding-cita`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pulse-secret": secreto },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) console.error("[calendly] onboarding n8n", r.status);
    return { enviado: r.ok, status: r.status };
  } catch (e) {
    console.error("[calendly] onboarding n8n", e instanceof Error ? e.message : e);
    return { enviado: false, motivo: String(e).slice(0, 120) };
  }
}

async function procesarCreado(inv: CalendlyInvitee) {
  const ev = inv.scheduled_event;
  const email = inv.email.trim().toLowerCase();
  const nombre = inv.name.trim().slice(0, 120) || email;
  const telefono = telefonoDe(inv);
  const negocio = negocioDe(inv);
  const owner = await resolverOwner(inv);
  const { fecha, hora } = fechaPR(ev.start_time);
  const duracionMin = Math.max(
    15,
    Math.round((new Date(ev.end_time).getTime() - new Date(ev.start_time).getTime()) / 60_000),
  );
  const esReagenda = Boolean(inv.old_invitee);

  // Onboarding (cliente que ya pagó): no es un lead para CLOSERS, pero sí arranca su experiencia
  // por WhatsApp. Se le avisa a n8n para que cree el evento en el Calendar de agenteia@ y la fila
  // en la base de onboarding (bienvenida, PDFs, encuestas 10/30 días). Antes lo hacía "citas
  // automáticas v4" leyendo los correos de Calendly en Gmail; dejó de correr en agosto 2026.
  if (IGNORAR.test(ev.name)) {
    if (vistoRecien(ev.uri)) return { ok: true, duplicado: true };
    const onb = await avisarOnboardingN8n(inv);
    return { ok: true, onboarding: onb, ignoradoPipedrive: `tipo-evento:${ev.name}` };
  }

  // Idempotencia: Calendly reintenta si no respondemos 2xx a tiempo.
  if (vistoRecien(ev.uri)) return { ok: true, duplicado: true };

  // ActiveCampaign: el que agenda entra a la base con `etapa:agendo` (dispara la
  // pre-llamada y corta lead→agenda). No-op sin ACTIVECAMPAIGN_*.
  void upsertContacto({
    email, nombre, telefono, marca: marcaDe(inv),
    tags: ["origen:calendly", esReagenda ? "etapa:reagendo" : "etapa:agendo", ...(inv.tracking?.utm_source ? [`agendo-por:${String(inv.tracking.utm_source).slice(0, 30)}`] : [])],
  });
  const yaExiste = await buscarDealPorEvento(ev.uri);
  if (yaExiste) return { ok: true, dealId: yaExiste, duplicado: true };

  // Persona
  let personId = await buscarPersona(email);
  if (!personId) {
    personId = (
      await pd<{ id: number }>("POST", "persons", {
        name: nombre,
        email: [{ value: email, primary: true, label: "work" }],
        phone: telefono ? [{ value: telefono, primary: true, label: "mobile" }] : [],
        ...(owner.id ? { owner_id: owner.id } : {}),
      })
    ).id;
  } else if (telefono) {
    // Completar teléfono si la persona no tenía.
    const p = await pd<{ phone?: { value: string }[] }>("GET", `persons/${personId}`);
    if (!p?.phone?.some((x) => x.value)) {
      await pd("PUT", `persons/${personId}`, { phone: [{ value: telefono, primary: true, label: "mobile" }] });
    }
  }

  // Deal: reagenda → reusar el abierto del pipeline CLOSERS; si no, crear.
  const abierto = esReagenda ? await buscarDealAbiertoCloser(personId) : null;
  const campos = {
    [CAMPO.eventoUri]: ev.uri,
    [CAMPO.fecha]: fecha,
    [CAMPO.tipoEvento]: ev.name.slice(0, 250),
    ...(origenDe(inv) ? { [CAMPO.origen]: origenDe(inv) } : {}),
    ...(inv.tracking?.utm_source ? { [CAMPO.agendo]: inv.tracking.utm_source.slice(0, 250) } : {}),
    ...(owner.nombre ? { [CAMPO.closer]: owner.nombre.slice(0, 250) } : {}),
  };
  let dealId: number;
  let creado = false;
  if (abierto) {
    dealId = abierto.id;
    await cerrarLlamadasPendientes(dealId);
    const reagendas = Number(abierto[CAMPO.reagendas] ?? 0) + 1;
    await pd("PUT", `deals/${dealId}`, {
      stage_id: STAGE.reprogramada,
      ...campos,
      [CAMPO.reagendas]: reagendas,
      ...(owner.id ? { user_id: owner.id } : {}),
    });
  } else {
    dealId = (
      await pd<{ id: number }>("POST", "deals", {
        title: `${nombre}${negocio ? ` — ${negocio}` : ""} · ${ev.name}`.slice(0, 250),
        person_id: personId,
        stage_id: STAGE.agendada,
        ...(owner.id ? { user_id: owner.id } : {}),
        ...campos,
        [CAMPO.reagendas]: 0,
      })
    ).id;
    creado = true;
  }

  // Actividad (call) a la hora de la llamada, asignada al closer.
  await pd("POST", "activities", {
    subject: `Llamada ${esReagenda ? "reagendada" : "agendada"} — ${nombre}`,
    type: "call",
    due_date: fecha,
    due_time: hora,
    duration: `${String(Math.floor(duracionMin / 60)).padStart(2, "0")}:${String(duracionMin % 60).padStart(2, "0")}`,
    deal_id: dealId,
    person_id: personId,
    ...(owner.id ? { user_id: owner.id } : {}),
    note: notaAgenda(inv, owner, esReagenda),
    ...(ev.location?.join_url ? { location: ev.location.join_url } : {}),
  });

  await pd("POST", "notes", {
    content: notaAgenda(inv, owner, esReagenda),
    deal_id: dealId,
    person_id: personId,
    pinned_to_deal_flag: 1,
  });

  return { ok: true, dealId, personId, creado, reagenda: esReagenda, owner: owner.id ?? null };
}

async function procesarCancelado(inv: CalendlyInvitee) {
  const ev = inv.scheduled_event;
  if (IGNORAR.test(ev.name)) return { ok: true, ignorado: `tipo-evento:${ev.name}` };
  let dealId = await buscarDealPorEvento(ev.uri);
  if (!dealId) {
    const personId = await buscarPersona(inv.email.trim().toLowerCase());
    if (personId) dealId = (await buscarDealAbiertoCloser(personId))?.id ?? null;
  }
  if (!dealId) return { ok: true, dealId: null, ignorado: "sin-deal" };

  const reagendado = Boolean(inv.rescheduled);
  if (!reagendado) {
    void upsertContacto({ email: inv.email.trim().toLowerCase(), nombre: inv.name, marca: marcaDe(inv), tags: ["etapa:cancelo"] });
  }
  // Reagenda: el invitee.created siguiente mueve a 146 y pone la fecha nueva;
  // acá solo dejamos rastro. Cancelación real: stage 147.
  if (!reagendado) {
    await pd("PUT", `deals/${dealId}`, { stage_id: STAGE.cancelada });
    await cerrarLlamadasPendientes(dealId);
  }
  const razon = inv.cancellation?.reason?.trim();
  await pd("POST", "notes", {
    content:
      `<b>${reagendado ? "Reagendó" : "Canceló"} por Calendly</b> · ${esc(ev.name)} · era ${esc(fechaLegible(ev.start_time))} PR` +
      ` · por ${esc(inv.cancellation?.canceled_by ?? "invitado")}` +
      (razon ? ` · motivo: ${esc(razon.slice(0, 200))}` : ""),
    deal_id: dealId,
  });
  return { ok: true, dealId, cancelado: !reagendado, reagendado };
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!firmaValida(raw, req.headers.get("calendly-webhook-signature"))) {
    return NextResponse.json({ error: "firma-invalida" }, { status: 401 });
  }
  if (!TOKEN) return NextResponse.json({ error: "sin-token-pipedrive" }, { status: 503 });

  let hook: CalendlyWebhook;
  try {
    hook = JSON.parse(raw) as CalendlyWebhook;
  } catch {
    return NextResponse.json({ error: "json-invalido" }, { status: 400 });
  }
  const inv = hook.payload;
  if (!inv?.email || !inv?.scheduled_event?.uri) {
    return NextResponse.json({ error: "payload-incompleto" }, { status: 400 });
  }

  try {
    const r =
      hook.event === "invitee.created"
        ? await procesarCreado(inv)
        : hook.event === "invitee.canceled"
          ? await procesarCancelado(inv)
          : { ok: true, ignorado: hook.event };
    console.log("[calendly]", hook.event, inv.email, JSON.stringify(r));
    return NextResponse.json(r);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[calendly] pipedrive:", msg.replace(/api_token=[^&\s]+/g, "api_token=***"));
    // 502 → Calendly reintenta; el deal no se duplica gracias a buscarDealPorEvento.
    return NextResponse.json({ error: "pipedrive", detalle: msg.slice(0, 200) }, { status: 502 });
  }
}

export function GET() {
  return NextResponse.json({ ok: true, servicio: "calendly→pipedrive closers", firma: Boolean(SIGNING_KEY) });
}
