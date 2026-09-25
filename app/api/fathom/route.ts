import { sql } from "drizzle-orm";
import { after, NextRequest, NextResponse } from "next/server";

import { EMAILS_CANAL_LLAMADAS, esOnboarding, firmaValida, mensajeSlack, type ReunionFathom, vaAlCanalDeLlamadas } from "@/lib/fathom";
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

  if (prueba) {
    if (!secretoCron(req)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  } else {
    // Un webhook por cuenta de Fathom (Elvin, Jessica…), cada uno con su secreto:
    // FATHOM_WEBHOOK_SECRET y FATHOM_WEBHOOK_SECRET_<CUENTA>. Vale si firma con cualquiera.
    const secretos = Object.entries(process.env).filter(([k, v]) => /^FATHOM_WEBHOOK_SECRET(_[A-Z0-9]+)?$/.test(k) && v).map(([, v]) => v as string);
    if (!secretos.length) return NextResponse.json({ error: "sin-configurar" }, { status: 503 });
    const cabeceras = { id: req.headers.get("webhook-id"), timestamp: req.headers.get("webhook-timestamp"), firma: req.headers.get("webhook-signature") };
    const ok = secretos.some((sec) => firmaValida(sec, cabeceras, cuerpo));
    if (!ok) return NextResponse.json({ error: "firma-invalida" }, { status: 401 });
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
  if (prueba && req.nextUrl.searchParams.get("max") === "1") return NextResponse.json({ prueba: true, esOnboarding: esOnboarding(r), max: await onboardingDesdeFathom(r, { prueba: true, motivo: esOnboarding(r) ?? undefined }) });
  if (prueba) return NextResponse.json({ prueba: true, canal: CANAL(), ...mensaje });

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
  const emailsOnboarding = (process.env.FATHOM_ONBOARDING_EMAILS || "jessica@levelupmediapr.net").split(",");
  const motivo = esOnboarding(r, emailsOnboarding);
  if (tomada[0].intentos === 1 && motivo) {
    after(() => onboardingDesdeFathom(r, { motivo }).catch((e) => console.error("[fathom → max]", e instanceof Error ? e.message : e)));
  }

  // Con la cuenta de equipo (webhook "shared_team_recordings", 24/sep) llegan las llamadas de todos.
  // Al canal de resúmenes van las de Elvin y las de los closers Roger y Laura; las demás solo sirven
  // para detectar onboardings de Jessica → Max. Se registran como 'omitido'.
  // Al canal: Elvin + los closers Roger y Laura (lib/fathom.ts). Override: FATHOM_SLACK_EMAILS.
  const alCanal = process.env.FATHOM_SLACK_EMAILS ? process.env.FATHOM_SLACK_EMAILS.split(",") : EMAILS_CANAL_LLAMADAS;
  if (!vaAlCanalDeLlamadas(r, alCanal)) {
    await d.execute(sql`UPDATE fathom_llamadas SET estado = 'omitido', actualizado_el = now() WHERE recording_id = ${id}`);
    return NextResponse.json({ ok: true, omitido: "no es de Elvin ni de los closers", onboarding: Boolean(motivo) });
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
