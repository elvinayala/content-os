import { sql } from "drizzle-orm";
import { after, NextRequest, NextResponse } from "next/server";

import { CLOSERS_FATHOM, esDeCloser, esOnboarding, esPrivadaDeElvin, PRIVADOS_FATHOM, firmaValida, mensajeSlack, type ReunionFathom } from "@/lib/fathom";
import { onboardingDesdeFathom } from "@/lib/max/onboarding";
import { notificarCEO } from "@/lib/notificar-ceo";
import { db } from "@/lib/pulse/db";

// Fathom → Slack (Solicitud de Aure #29, aprobada por Elvin el 24/sep/2026): cuando Fathom termina
// de procesar una llamada del Fathom de elvin@levelupmediapr.net, manda el webhook aquí y el
// resumen sale en el canal de Aure (FATHOM_SLACK_CHANNEL_ID, bot Command Center).
//   POST /api/fathom                  → webhook de Fathom (firma con FATHOM_WEBHOOK_SECRET)
//   POST /api/fathom?prueba=1         → con x-cron-secret: arma el mensaje y lo devuelve, sin enviar
//   GET  /api/fathom?secret=CRON      → registro de las últimas llamadas (enviadas y fallidas)
// No repite: tabla fathom_llamadas con recording_id único. Si Slack falla queda `error` con el
// motivo, se avisa a Elvin (1 vez por llamada) y se responde 500 para que Fathom reintente.
// Registro del webhook: node scripts/fathom.mjs crear (necesita FATHOM_API_KEY).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CANAL = () => process.env.FATHOM_SLACK_CHANNEL_ID || "C0C3TCGCA07";

function filas<T = Record<string, unknown>>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  return (r as { rows?: T[] })?.rows ?? [];
}

let tablaLista: Promise<void> | null = null;
function asegurarTabla() {
  if (!tablaLista) {
    tablaLista = (async () => {
      const d = await db();
      await d.execute(sql`CREATE TABLE IF NOT EXISTS fathom_llamadas (
        recording_id bigint PRIMARY KEY,
        titulo text,
        estado text NOT NULL DEFAULT 'procesando',
        error text,
        slack_ts text,
        intentos integer NOT NULL DEFAULT 1,
        creado_el timestamptz NOT NULL DEFAULT now(),
        actualizado_el timestamptz NOT NULL DEFAULT now()
      )`);
    })().catch((e) => { tablaLista = null; throw e; });
  }
  return tablaLista;
}

const secretoCron = (req: NextRequest) => {
  const s = process.env.CRON_SECRET;
  return Boolean(s) && (req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret")) === s;
};

export async function GET(req: NextRequest) {
  if (!secretoCron(req)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  await asegurarTabla();
  const d = await db();
  const r = await d.execute(sql`SELECT recording_id, titulo, estado, error, intentos, creado_el, actualizado_el
    FROM fathom_llamadas ORDER BY actualizado_el DESC LIMIT 50`);
  return NextResponse.json({ canal: CANAL(), llamadas: filas(r) });
}

export async function POST(req: NextRequest) {
  const cuerpo = await req.text();
  const prueba = req.nextUrl.searchParams.get("prueba") === "1";
  // true = llegó por el webhook de EQUIPO (FATHOM_WEBHOOK_SECRET_EQUIPO u otra cuenta): de ahí solo
  // interesan los onboardings de Jessica para Max; nada se publica en el canal de resúmenes.
  let desdeEquipo = false;

  if (prueba) {
    if (!secretoCron(req)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  } else {
    // Un webhook por cuenta de Fathom (Elvin, Jessica…), cada uno con su secreto:
    // FATHOM_WEBHOOK_SECRET y FATHOM_WEBHOOK_SECRET_<CUENTA>. Vale si firma con cualquiera.
    const secretos = Object.entries(process.env).filter(([k, v]) => /^FATHOM_WEBHOOK_SECRET(_[A-Z0-9]+)?$/.test(k) && v) as [string, string][];
    if (!secretos.length) return NextResponse.json({ error: "sin-configurar" }, { status: 503 });
    const cabeceras = { id: req.headers.get("webhook-id"), timestamp: req.headers.get("webhook-timestamp"), firma: req.headers.get("webhook-signature") };
    const valido = secretos.find(([, sec]) => firmaValida(sec, cabeceras, cuerpo));
    if (!valido) return NextResponse.json({ error: "firma-invalida" }, { status: 401 });
    desdeEquipo = valido[0] !== "FATHOM_WEBHOOK_SECRET";
  }

  let r: ReunionFathom;
  try {
    r = JSON.parse(cuerpo);
  } catch {
    return NextResponse.json({ error: "json-invalido" }, { status: 400 });
  }
  const id = Number(r?.recording_id);
  if (!Number.isFinite(id) || id <= 0) {
    console.error("[fathom] payload sin recording_id", cuerpo.slice(0, 300));
    return NextResponse.json({ error: "sin-recording_id" }, { status: 400 });
  }

  const mensaje = mensajeSlack(r);
  // ?prueba=1&max=1: además corre el arranque de Max en modo prueba (sin mención ni buzón).
  // ?prueba=1&max=1 → arranque de Max en modo prueba (sin mención ni buzón); max=completo → Max trabaja.
  const modoMax = req.nextUrl.searchParams.get("max");
  if (prueba && modoMax) return NextResponse.json({ prueba: true, esOnboarding: esOnboarding(r), max: esOnboarding(r) ? await onboardingDesdeFathom(r, { prueba: true, completo: modoMax === "completo" }) : null });
  if (prueba) return NextResponse.json({ prueba: true, canal: CANAL(), ...mensaje });

  // Privacidad de Elvin (regla dura, 24/sep): nada de su cuenta de Fathom y ninguna reunión donde él
  // esté sale de aquí — ni al canal ni a Max — sin su autorización. Se descarta sin guardar nada.
  const privados = process.env.FATHOM_PRIVADOS_EMAILS ? process.env.FATHOM_PRIVADOS_EMAILS.split(",") : PRIVADOS_FATHOM;
  if (!desdeEquipo || esPrivadaDeElvin(r, privados)) return NextResponse.json({ ok: true, ignorada: "privada" });

  // Del equipo solo entran dos cosas: las llamadas de cierre de Roger y Laura (van al canal) y los
  // onboardings etiquetados (van a Max). Lo demás se descarta sin guardar nada.
  const onboarding = esOnboarding(r);
  const closers = process.env.FATHOM_CLOSERS_EMAILS ? process.env.FATHOM_CLOSERS_EMAILS.split(",") : CLOSERS_FATHOM;
  const deCloser = desdeEquipo && esDeCloser(r, closers);
  if (desdeEquipo && !onboarding && !deCloser) return NextResponse.json({ ok: true, ignorada: "ni cierre ni onboarding" });

  const titulo = (r.meeting_title || r.title || "").slice(0, 300);
  await asegurarTabla();
  const d = await db();
  // Toma la llamada solo si es nueva, si falló antes o si quedó colgada en 'procesando' (>10 min).
  // Si ya se envió (o la está enviando otro reintento), no se repite.
  const tomada = filas<{ intentos: number }>(await d.execute(sql`
    INSERT INTO fathom_llamadas (recording_id, titulo) VALUES (${id}, ${titulo})
    ON CONFLICT (recording_id) DO UPDATE
      SET estado = 'procesando', intentos = fathom_llamadas.intentos + 1, actualizado_el = now()
      WHERE fathom_llamadas.estado = 'error'
         OR (fathom_llamadas.estado = 'procesando' AND fathom_llamadas.actualizado_el < now() - interval '10 minutes')
    RETURNING intentos`));
  if (!tomada.length) return NextResponse.json({ ok: true, repetida: true });

  // Onboarding de un cliente (Elvin, 24/sep): Max arranca al instante, sin esperar a Slack.
  if (tomada[0].intentos === 1 && onboarding) {
    after(() => onboardingDesdeFathom(r).catch((e) => console.error("[fathom → max]", e instanceof Error ? e.message : e)));
  }
  // Los onboardings del equipo son solo para Max. Al canal de resúmenes: SOLO las llamadas de cierre de
  // Roger y Laura (Elvin, 24/sep). Las de Elvin nunca (ver privacidad arriba).
  if (desdeEquipo && !deCloser) {
    await d.execute(sql`UPDATE fathom_llamadas SET estado = 'max', actualizado_el = now() WHERE recording_id = ${id}`);
    return NextResponse.json({ ok: true, max: true });
  }

  let error: string | null = null;
  let ts: string | null = null;
  try {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) throw new Error("falta SLACK_BOT_TOKEN");
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel: CANAL(), ...mensaje, unfurl_links: false }),
      signal: AbortSignal.timeout(10_000),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; ts?: string };
    if (!j.ok) throw new Error(`slack: ${j.error ?? res.status}`);
    ts = j.ts ?? null;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  await d.execute(sql`UPDATE fathom_llamadas
    SET estado = ${error ? "error" : "enviado"}, error = ${error}, slack_ts = ${ts}, actualizado_el = now()
    WHERE recording_id = ${id}`);

  if (error) {
    console.error("[fathom]", id, titulo, error);
    if (tomada[0].intentos === 1) {
      await notificarCEO(`⚠️ Fathom → Slack: no pude publicar la llamada "${titulo || id}" (recording ${id}): ${error}. Fathom reintenta solo; registro en /api/fathom.`).catch(() => {});
    }
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, recording_id: id });
}
