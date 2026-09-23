import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/pulse/db";

// El buzón de los agentes. Elvin (20/sep/2026): "los agentes se tienen que poder hablar entre
// sí — Sofi le pide algo a Nico, Max le pide algo a Nico — y con mi equipo personal".
// Sofi, Nico, Max y Lola corren en contenedores distintos (Railway) sin disco compartido, así
// que el único punto en común es esta base (la de Pulse, Supabase). Cada puente consulta su
// buzón cada ~20 s (scripts/agentes.mjs) y atiende lo que le llegó como si fuera un mensaje de
// Telegram. Elvin lo ve todo en el Command Center (y cada mensaje se espeja en su DM de Slack).
//
//   GET  /api/agentes?para=nico&pendientes=1      → mensajes sin atender para ese agente
//   GET  /api/agentes?ultimos=50                   → historial (para el panel)
//   POST /api/agentes  { de, para, texto, hilo? } → deja un mensaje
//   POST /api/agentes  { id, estado, respuesta? } → marca atendido / responde
//   GET  /api/agentes?estado=esperando-ok          → solicitudes del equipo esperando OK de Elvin
//   GET  /api/agentes?id=123                        → un mensaje
// Auth: header x-cron-secret (o ?secret=) = CRON_SECRET, igual que /api/snapshot.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AGENTES = new Set(["sofi", "nico", "max", "lola", "jarvis", "elvin"]);
// Equipo humano que puede dejarle solicitudes a Nico desde Slack (Elvin, 23/sep/2026: "que Nico
// tenga un enlace directo con Carilin y Aure"). Solo como remitente: nadie les deja nada aquí.
const EQUIPO_REMITENTE = new Set(["carilin", "aure"]);
// esperando-ok: solicitud del equipo que Nico ya diagnosticó y espera el OK de Elvin.
// aprobado: Elvin dijo que sí y Nico la está ejecutando. rechazado: Elvin dijo que no.
const ESTADOS = ["pendiente", "en-curso", "esperando-ok", "aprobado", "atendido", "fallido", "rechazado"];

function autorizado(req: NextRequest): boolean {
  const secreto = process.env.CRON_SECRET;
  const dado = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  return Boolean(secreto) && dado === secreto;
}

// postgres.js devuelve un array (RowList); PGlite devuelve { rows }. Esto acepta los dos.
function filas<T = Record<string, unknown>>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  const o = r as { rows?: T[] };
  return o?.rows ?? [];
}

let tablaLista: Promise<void> | null = null;
async function asegurarTabla() {
  if (!tablaLista) {
    tablaLista = (async () => {
      const d = await db();
      await d.execute(sql`CREATE TABLE IF NOT EXISTS agentes_mensajes (
        id serial PRIMARY KEY,
        de text NOT NULL,
        para text NOT NULL,
        texto text NOT NULL,
        hilo integer,
        estado text NOT NULL DEFAULT 'pendiente',
        respuesta text,
        creado_el timestamptz NOT NULL DEFAULT now(),
        atendido_el timestamptz
      )`);
      await d.execute(sql`CREATE INDEX IF NOT EXISTS agentes_mensajes_para_estado ON agentes_mensajes (para, estado)`);
    })().catch((e) => { tablaLista = null; throw e; });
  }
  return tablaLista;
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  await asegurarTabla();
  const d = await db();
  const para = (req.nextUrl.searchParams.get("para") ?? "").toLowerCase();
  const pendientes = req.nextUrl.searchParams.get("pendientes") === "1";
  const ultimos = Math.min(200, Number(req.nextUrl.searchParams.get("ultimos") ?? 50));
  const id = Number(req.nextUrl.searchParams.get("id") ?? 0);
  if (id) {
    const r = await d.execute(sql`SELECT * FROM agentes_mensajes WHERE id = ${id}`);
    return NextResponse.json({ ok: true, mensajes: filas(r) });
  }
  const estado = req.nextUrl.searchParams.get("estado") ?? "";
  if (estado) {
    const r = para
      ? await d.execute(sql`SELECT * FROM agentes_mensajes WHERE estado = ${estado} AND para = ${para} ORDER BY id ASC LIMIT ${ultimos}`)
      : await d.execute(sql`SELECT * FROM agentes_mensajes WHERE estado = ${estado} ORDER BY id ASC LIMIT ${ultimos}`);
    return NextResponse.json({ ok: true, mensajes: filas(r) });
  }
  if (para && pendientes) {
    const r = await d.execute(sql`SELECT id, de, para, texto, hilo, estado, creado_el FROM agentes_mensajes WHERE para = ${para} AND estado = 'pendiente' ORDER BY id ASC LIMIT 20`);
    return NextResponse.json({ ok: true, mensajes: filas(r) });
  }
  const r = para
    ? await d.execute(sql`SELECT * FROM agentes_mensajes WHERE para = ${para} OR de = ${para} ORDER BY id DESC LIMIT ${ultimos}`)
    : await d.execute(sql`SELECT * FROM agentes_mensajes ORDER BY id DESC LIMIT ${ultimos}`);
  return NextResponse.json({ ok: true, mensajes: filas(r) });
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  let b: { de?: string; para?: string; texto?: string; hilo?: number; id?: number; estado?: string; respuesta?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "body" }, { status: 400 }); }
  await asegurarTabla();
  const d = await db();

  // Actualización de estado (atendido / respondido / fallido).
  if (b.id) {
    const estado = String(b.estado ?? "atendido");
    if (!ESTADOS.includes(estado)) return NextResponse.json({ error: "estado" }, { status: 400 });
    await d.execute(sql`UPDATE agentes_mensajes SET estado = ${estado}, respuesta = COALESCE(${b.respuesta ?? null}, respuesta), atendido_el = CASE WHEN ${estado} IN ('atendido','fallido','rechazado') THEN now() ELSE atendido_el END WHERE id = ${b.id}`);
    return NextResponse.json({ ok: true, id: b.id, estado });
  }

  const de = String(b.de ?? "").toLowerCase().trim();
  const para = String(b.para ?? "").toLowerCase().trim();
  const texto = String(b.texto ?? "").trim();
  if (!(AGENTES.has(de) || (EQUIPO_REMITENTE.has(de) && para === "nico")) || !AGENTES.has(para)) return NextResponse.json({ error: "agente-desconocido", agentes: [...AGENTES] }, { status: 400 });
  if (!texto || texto.length > 8000) return NextResponse.json({ error: "texto" }, { status: 400 });
  const r = await d.execute(sql`INSERT INTO agentes_mensajes (de, para, texto, hilo) VALUES (${de}, ${para}, ${texto}, ${b.hilo ?? null}) RETURNING id, creado_el`);
  const fila = filas<{ id: number; creado_el: string }>(r)[0];
  return NextResponse.json({ ok: true, id: fila.id, creadoEl: fila.creado_el });
}
