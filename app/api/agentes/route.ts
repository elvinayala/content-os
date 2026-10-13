import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/pulse/db";
import { remitentePermitido } from "@/lib/firma-aprobaciones.mjs";
import { secretoValido } from "@/lib/pulse/seguridad";

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

// "mac" = una sesión de Claude en la Mac (antes firmaba como Sofi; 28/sep).
// "leo" (13-oct) = el Director Creativo: solo recibe revisiones de AI Core; las atiende el puente de Sofi.
const AGENTES = new Set(["sofi", "nico", "max", "lola", "leo", "jarvis", "elvin", "mac", "aicore"]);
// AI Core (11-oct): su propio secreto (AICORE_AGENTES_SECRET) y lo MÍNIMO. Solo puede dejar tareas
// como "aicore" a estos agentes, sin hilo, y leer SUS filas por id. No puede marcar, listar ni ver
// lo de otros. CRON_SECRET sigue siendo la llave de los puentes y los crons.
// Piloto (11-oct): solo Sofi y Max. 13-oct (Elvin: "conecta ya todos los agentes"): también Nico, Lola y Leo.
// Sus puentes corren las tareas de AI Core en solo lectura (scripts/aicore-tareas.mjs, scripts/aicore-leo.mjs).
const AICORE_PARA = new Set(["sofi", "max", "nico", "lola", "leo"]);
// Equipo humano que puede dejarle solicitudes a Nico desde Slack (Elvin, 23/sep/2026: "que Nico
// tenga un enlace directo con Carilin y Aure"). Solo como remitente: nadie les deja nada aquí.
// Lis y Ángela (3/oct): solo desde el canal de cambios de Bori (SLACK_NICO_CANALES).
const EQUIPO_REMITENTE = new Set(["carilin", "aure", "lis", "angela"]);
// esperando-ok: solicitud del equipo que Nico ya diagnosticó y espera el OK de Elvin.
// aprobado: Elvin dijo que sí y Nico la está ejecutando. rechazado: Elvin dijo que no.
const ESTADOS = ["pendiente", "en-curso", "esperando-ok", "aprobado", "atendido", "fallido", "rechazado"];

function autorizado(req: NextRequest): boolean {
  const secreto = process.env.CRON_SECRET;
  const dado = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  return Boolean(secreto) && dado === secreto;
}

function esAicore(req: NextRequest): boolean {
  const secreto = process.env.AICORE_AGENTES_SECRET;
  return Boolean(secreto) && secretoValido(req.headers.get("x-aicore-secret"), secreto);
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
    // 12-oct: quién está VERIFICADO (firma del servidor por Elvin, firma de la Mac) y el nonce de esa firma, que solo se
    // puede usar una vez (si alguien reenvía el mismo mensaje firmado, choca con el índice único).
    await d.execute(sql`ALTER TABLE agentes_mensajes ADD COLUMN IF NOT EXISTS verificado text`);
    await d.execute(sql`ALTER TABLE agentes_mensajes ADD COLUMN IF NOT EXISTS firma_nonce text`);
    await d.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS agentes_mensajes_firma_nonce_ux ON agentes_mensajes (firma_nonce) WHERE firma_nonce IS NOT NULL`);
      // Costo (USD) de la corrida que atendió el mensaje: AI Core lo muestra por tarea (11-oct).
      await d.execute(sql`ALTER TABLE agentes_mensajes ADD COLUMN IF NOT EXISTS costo_usd numeric(12, 6)`);
    })().catch((e) => { tablaLista = null; throw e; });
  }
  return tablaLista;
}

export async function GET(req: NextRequest) {
  if (esAicore(req)) {
    // AI Core solo lee SUS tareas, de una en una.
    const id = Number(req.nextUrl.searchParams.get("id") ?? 0);
    if (!id) return NextResponse.json({ error: "solo-por-id" }, { status: 400 });
    await asegurarTabla();
    const d = await db();
    const r = await d.execute(sql`SELECT id, estado, respuesta, costo_usd, creado_el, atendido_el FROM agentes_mensajes WHERE id = ${id} AND de = 'aicore'`);
    return NextResponse.json({ ok: true, mensajes: filas(r) });
  }
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
    const r = await d.execute(sql`SELECT id, de, para, texto, hilo, estado, creado_el, verificado FROM agentes_mensajes WHERE para = ${para} AND estado = 'pendiente' ORDER BY id ASC LIMIT 20`);
    return NextResponse.json({ ok: true, mensajes: filas(r) });
  }
  const r = para
    ? await d.execute(sql`SELECT * FROM agentes_mensajes WHERE para = ${para} OR de = ${para} ORDER BY id DESC LIMIT ${ultimos}`)
    : await d.execute(sql`SELECT * FROM agentes_mensajes ORDER BY id DESC LIMIT ${ultimos}`);
  return NextResponse.json({ ok: true, mensajes: filas(r) });
}

export async function POST(req: NextRequest) {
  const aicore = esAicore(req);
  if (!aicore && !autorizado(req)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  let b: { de?: string; para?: string; texto?: string; hilo?: number; id?: number; estado?: string; respuesta?: string; costo?: number };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "body" }, { status: 400 }); }
  if (aicore && (b.id || b.hilo || b.de !== "aicore" || !AICORE_PARA.has(String(b.para ?? "")))) {
    return NextResponse.json({ error: "aicore-solo-deja-tareas", agentes: [...AICORE_PARA] }, { status: 403 });
  }
  await asegurarTabla();
  const d = await db();

  // Actualización de estado (atendido / respondido / fallido).
  if (b.id) {
    const estado = String(b.estado ?? "atendido");
    if (!ESTADOS.includes(estado)) return NextResponse.json({ error: "estado" }, { status: 400 });
    const costo = Number.isFinite(Number(b.costo)) && b.costo !== undefined ? Number(b.costo) : null;
    await d.execute(sql`UPDATE agentes_mensajes SET estado = ${estado}, respuesta = COALESCE(${b.respuesta ?? null}, respuesta), costo_usd = COALESCE(${costo}, costo_usd), atendido_el = CASE WHEN ${estado} IN ('atendido','fallido','rechazado') THEN now() ELSE atendido_el END WHERE id = ${b.id}`);
    return NextResponse.json({ ok: true, id: b.id, estado });
  }

  const de = String(b.de ?? "").toLowerCase().trim();
  const para = String(b.para ?? "").toLowerCase().trim();
  const texto = String(b.texto ?? "").trim();
  if (!(AGENTES.has(de) || (EQUIPO_REMITENTE.has(de) && para === "nico")) || !AGENTES.has(para)) return NextResponse.json({ error: "agente-desconocido", agentes: [...AGENTES] }, { status: 400 });
  if (!texto || texto.length > 8000) return NextResponse.json({ error: "texto" }, { status: 400 });
  // Nadie escribe como Elvin con CRON_SECRET (lo tienen todos los puentes y agentes): solo una aprobación firmada por
  // el servidor después de verificarlo (lib/firma-aprobaciones.mjs, 12-oct).
  // La Mac de Elvin firma con su propia llave (Llavero de la Mac): CRON_SECRET no basta para pasar por ella.
  const permiso = remitentePermitido({ de, para, texto, firmaMac: req.headers.get("x-mac-firma"), macObligatoria: process.env.BUZON_MAC_FIRMA === "obligatoria" });
  if (!permiso.ok) return NextResponse.json({ error: "suplantacion", motivo: permiso.motivo }, { status: 403 });
  let r;
  try {
    r = await d.execute(sql`INSERT INTO agentes_mensajes (de, para, texto, hilo, verificado, firma_nonce) VALUES (${de}, ${para}, ${texto}, ${b.hilo ?? null}, ${permiso.verificado ?? null}, ${permiso.nonce ?? null}) RETURNING id, creado_el`);
  } catch (e) {
    if (/firma_nonce/.test(String((e as Error)?.message ?? e))) return NextResponse.json({ error: "suplantacion", motivo: "esa firma ya se usó" }, { status: 409 });
    throw e;
  }
  const fila = filas<{ id: number; creado_el: string }>(r)[0];
  return NextResponse.json({ ok: true, id: fila.id, creadoEl: fila.creado_el });
}
