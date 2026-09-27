import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq, gt, sql } from "drizzle-orm";

import { usuarioSistema } from "./alta-typeform";
import { archivoCoincide, elegirContrato, emparejar, leerVenta, resumenVenta, ultimos10, type ArchivoSlack, type VentaSlack } from "./contratos";
import { db } from "./db";
import { actualizarValor, registrarArchivo } from "./repo";
import { pulseActivity, pulseBoards, pulseColumns, pulseGroups, pulseItems } from "./schema";
import { dmSlack } from "./slack-dm";
import { subirArchivo } from "./storage";
import type { ValorCelda } from "./types";

// Cuando se crea la ficha de un cliente de Level Up, busca su venta en #office-2-ventas-contrato,
// baja el PDF del contrato del hilo y lo sube a la columna "Acuerdo firmado". Si no hay contrato,
// le avisa a Jessica (una vez por ficha) y el cron sigue buscando; cuando aparece, lo adjunta.
// El bot Command Center tiene que estar en el canal (es privado).

const CANAL = process.env.SLACK_CONTRATOS_CHANNEL_ID || "C08SV6GJLPQ";
const NOMBRE_CANAL = "#office-2-ventas-contrato";
const TABLERO = "level-up-media";
export const COLUMNA_ACUERDO = "Acuerdo firmado";
const AVISAR_A = (process.env.PULSE_CONTRATOS_AVISAR || "jessica@levelupmediapr.net").split(",").map((s) => s.trim()).filter(Boolean);
const BASE = process.env.PULSE_URL ?? "https://pulse-eamarket.vercel.app";
let avisarActivo = true;
const DIAS_VENTAS = 60; // cuánto hacia atrás se leen ventas del canal
export const DIAS_PENDIENTES = 14;
// Las fichas creadas antes de arrancar esto reciben su contrato si aparece, pero sin avisos (no llenarle el Slack a Jessica).
const AVISOS_DESDE = new Date(process.env.PULSE_CONTRATOS_AVISOS_DESDE || "2026-09-27T12:00:00-04:00"); // cuánto tiempo sigue buscando el contrato de una ficha nueva

type EstadoContrato = "adjuntado" | "falta" | "sospechoso";
export type ResultadoContrato = { estado: EstadoContrato | "ya-tenia" | "sin-columna" | "sin-canal"; detalle?: string };

async function slack<T>(metodo: string, params: Record<string, string>): Promise<T & { ok: boolean; error?: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "sin-token" } as T & { ok: boolean; error?: string };
  const r = await fetch(`https://slack.com/api/${metodo}?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
  return r.json();
}

interface MensajeSlack {
  ts: string;
  text?: string;
  user?: string;
  subtype?: string;
  files?: ArchivoSlack[];
  reply_count?: number;
}

// Las ventas de los últimos DIAS_VENTAS días (solo mensajes principales con correo o teléfono).
export async function leerVentas(): Promise<{ ok: true; ventas: VentaSlack[] } | { ok: false; error: string }> {
  const oldest = String(Math.floor(Date.now() / 1000) - DIAS_VENTAS * 86400);
  const ventas: VentaSlack[] = [];
  let cursor = "";
  for (let i = 0; i < 10; i++) {
    const r = await slack<{ messages?: MensajeSlack[]; response_metadata?: { next_cursor?: string } }>("conversations.history", { channel: CANAL, oldest, limit: "200", ...(cursor ? { cursor } : {}) });
    if (!r.ok) return { ok: false, error: r.error ?? "slack" };
    for (const m of r.messages ?? []) {
      if (m.subtype && m.subtype !== "file_share") continue;
      const v = leerVenta(m.ts, m.text ?? "", m.user);
      if (v) ventas.push(v);
    }
    cursor = r.response_metadata?.next_cursor ?? "";
    if (!cursor) break;
  }
  return { ok: true, ventas };
}

async function archivosDelHilo(ts: string): Promise<ArchivoSlack[]> {
  const r = await slack<{ messages?: MensajeSlack[] }>("conversations.replies", { channel: CANAL, ts, limit: "100" });
  return r.ok ? (r.messages ?? []).flatMap((m) => m.files ?? []) : [];
}

async function enlace(ts: string): Promise<string | null> {
  const r = await slack<{ permalink?: string }>("chat.getPermalink", { channel: CANAL, message_ts: ts });
  return r.ok ? (r.permalink ?? null) : null;
}

async function yaAvisado(itemId: string): Promise<EstadoContrato | null> {
  const d = await db();
  const [a] = await d
    .select({ estado: sql<EstadoContrato>`${pulseActivity.after}->'contrato'->>'estado'` })
    .from(pulseActivity)
    .where(and(eq(pulseActivity.itemId, itemId), sql`${pulseActivity.after} ? 'contrato'`))
    .orderBy(sql`${pulseActivity.at} desc`)
    .limit(1);
  return a?.estado ?? null;
}

async function ventaGuardada(itemId: string): Promise<boolean> {
  const d = await db();
  const [a] = await d.select({ id: pulseActivity.id }).from(pulseActivity).where(and(eq(pulseActivity.itemId, itemId), sql`${pulseActivity.after} ? 'venta'`)).limit(1);
  return !!a;
}

async function anotar(itemId: string, boardId: string, userId: string, estado: EstadoContrato, texto: string) {
  const d = await db();
  await d.insert(pulseActivity).values({ itemId, boardId, tipo: "comentario", after: { texto, contrato: { estado } }, userId });
}

async function avisar(texto: string) {
  if (!avisarActivo) return;
  for (const email of AVISAR_A) await dmSlack(email, texto).catch(() => false);
}

// Busca y adjunta el contrato de UNA ficha. `ventas` se puede pasar para no leer el canal por cada ficha.
export async function adjuntarContrato(itemId: string, opciones: { ventas?: VentaSlack[]; avisar?: boolean } = {}): Promise<ResultadoContrato> {
  const d = await db();
  const [item] = await d.select().from(pulseItems).where(eq(pulseItems.id, itemId));
  if (!item) return { estado: "sin-columna", detalle: "no existe" };
  const [board] = await d.select().from(pulseBoards).where(eq(pulseBoards.id, item.boardId));
  if (board?.slug !== TABLERO) return { estado: "sin-columna", detalle: "otro tablero" };
  const cols = await d.select().from(pulseColumns).where(eq(pulseColumns.boardId, item.boardId));
  const cAcuerdo = cols.find((c) => c.title === COLUMNA_ACUERDO && c.type === "file");
  if (!cAcuerdo) return { estado: "sin-columna" };
  const values = item.values as Record<string, ValorCelda>;
  const tieneArchivo = Array.isArray(values[cAcuerdo.id]) && (values[cAcuerdo.id] as string[]).length > 0;
  const tieneVenta = await ventaGuardada(itemId);
  if (tieneArchivo && tieneVenta) return { estado: "ya-tenia" };

  avisarActivo = opciones.avisar !== false;
  let ventas = opciones.ventas;
  if (!ventas) {
    const r = await leerVentas();
    if (!r.ok) return { estado: "sin-canal", detalle: r.error };
    ventas = r.ventas;
  }
  const texto = (tipo: string) => String(values[cols.find((c) => c.type === tipo)?.id ?? ""] ?? "");
  const venta = emparejar({ nombre: item.name, emails: [texto("email").toLowerCase()].filter(Boolean), telefonos: [ultimos10(texto("phone"))].filter(Boolean) }, ventas);
  const userId = await usuarioSistema("contratos");
  // Resumen de la venta (cuánto pagó, qué compró, closer) en la ficha: lo lee Mi día.
  if (venta && !tieneVenta) {
    const resumen = resumenVenta(venta.detalle);
    if (resumen) {
      const link = await enlace(venta.ts);
      await d.insert(pulseActivity).values({ itemId, boardId: item.boardId, tipo: "comentario", after: { texto: `${resumen}${venta.detalle?.metodo ? ` · ${venta.detalle.metodo}` : ""} (venta en ${NOMBRE_CANAL}${link ? `: ${link}` : ""})`, venta: venta.detalle }, userId });
    }
  }
  if (tieneArchivo) return { estado: "ya-tenia" };
  const archivo = venta ? elegirContrato(await archivosDelHilo(venta.ts)) : null;
  const ficha = `<${BASE}/pulse/${TABLERO}?item=${itemId}|${item.name}>`;
  const previo = await yaAvisado(itemId);

  if (!venta || !archivo?.url_private_download) {
    if (previo !== "falta") {
      const motivo = !venta ? `no encontré su venta en ${NOMBRE_CANAL}` : `su venta está en ${NOMBRE_CANAL} pero el hilo no tiene el PDF del contrato`;
      await anotar(itemId, item.boardId, userId, "falta", `⚠️ Sin acuerdo firmado: ${motivo}. Se le avisó a Jessica; Pulse lo adjunta solo cuando aparezca.`);
      const link = venta ? await enlace(venta.ts) : null;
      await avisar(`⚠️ *Acuerdo sin firmar* · ${ficha}\nSe creó la ficha, pero ${motivo}${link ? ` (<${link}|ver la venta>)` : ""}. Pídele al closer el contrato firmado. Cuando lo suban al hilo, Pulse lo adjunta solo y te aviso.\n— Pulse`);
    }
    return { estado: "falta", detalle: venta ? "sin PDF" : "sin venta" };
  }

  const bin = await fetch(archivo.url_private_download, { headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }, signal: AbortSignal.timeout(30000) });
  const tipo = bin.headers.get("content-type") ?? "";
  if (!bin.ok || tipo.startsWith("text/html")) return { estado: "sin-canal", detalle: `no pude bajar el PDF (${bin.status})` };
  const datos = Buffer.from(await bin.arrayBuffer());
  if (datos.length > 10 * 1024 * 1024) return { estado: "sin-canal", detalle: "PDF de más de 10 MB" };
  const nombre = archivo.name.replace(/[^\w.\-() ]+/g, "_").slice(0, 150) || "contrato.pdf";
  const storagePath = `${item.boardId}/${itemId}/${randomUUID()}-${nombre}`;
  await subirArchivo(storagePath, datos, "application/pdf");
  const reg = await registrarArchivo({ itemId, columnId: cAcuerdo.id, nombre: archivo.name.slice(0, 200), storagePath, mime: "application/pdf", bytes: datos.length, userId });
  await actualizarValor({ itemId, columnId: cAcuerdo.id, value: [reg.id], userId });

  const link = await enlace(venta.ts);
  const coincide = archivoCoincide(item.name, archivo.name);
  const estado: EstadoContrato = coincide ? "adjuntado" : "sospechoso";
  await anotar(
    itemId,
    item.boardId,
    userId,
    estado,
    `📄 Acuerdo firmado adjuntado desde ${NOMBRE_CANAL}${link ? ` (${link})` : ""}.${coincide ? "" : ` ⚠️ Ojo: el PDF se llama "${archivo.name}" y no menciona a ${item.name}; confirma que sea el contrato correcto.`}`,
  );
  if (!coincide) {
    await avisar(`⚠️ *Revisa el acuerdo* · ${ficha}\nAdjunté el PDF del hilo de su venta, pero se llama "${archivo.name}" y no menciona al cliente. Puede ser el contrato de otra persona${link ? ` (<${link}|ver la venta>)` : ""}.\n— Pulse`);
  } else if (previo === "falta") {
    await avisar(`✅ *Llegó el acuerdo firmado* · ${ficha}\nYa está adjunto en la columna "${COLUMNA_ACUERDO}".\n— Pulse`);
  }
  return { estado, detalle: archivo.name };
}

// Cron: fichas nuevas de Level Up (últimos DIAS_PENDIENTES días, fuera de bajas) que todavía no tienen acuerdo.
export async function revisarPendientes(opciones: { dias?: number; avisar?: boolean } = {}): Promise<{ revisadas: number; resultados: Record<string, string> } | { error: string }> {
  const d = await db();
  const [board] = await d.select().from(pulseBoards).where(eq(pulseBoards.slug, TABLERO));
  if (!board) return { error: "sin tablero" };
  const [col] = await d.select().from(pulseColumns).where(and(eq(pulseColumns.boardId, board.id), eq(pulseColumns.title, COLUMNA_ACUERDO)));
  if (!col) return { error: `falta la columna ${COLUMNA_ACUERDO}` };
  const dias = opciones.dias ?? DIAS_PENDIENTES;
  const items = await d
    .select({ id: pulseItems.id, name: pulseItems.name, grupo: pulseGroups.title, createdAt: pulseItems.createdAt })
    .from(pulseItems)
    .innerJoin(pulseGroups, eq(pulseGroups.id, pulseItems.groupId))
    .where(
      and(
        eq(pulseItems.boardId, board.id),
        gt(pulseItems.createdAt, sql`now() - make_interval(days => ${dias})`),
        // sin acuerdo, o sin el resumen de la venta
        sql`(coalesce(jsonb_array_length(case when jsonb_typeof(${pulseItems.values} -> ${col.id}) = 'array' then ${pulseItems.values} -> ${col.id} end), 0) = 0
          or not exists (select 1 from pulse_activity a where a.item_id = ${pulseItems.id} and a.after ? 'venta'))`,
      ),
    );
  const pendientes = items.filter((i) => !/offboard|baja|inactiv/i.test(i.grupo));
  if (!pendientes.length) return { revisadas: 0, resultados: {} };
  const r = await leerVentas();
  if (!r.ok) return { error: `Slack: ${r.error}` };
  const resultados: Record<string, string> = {};
  for (const i of pendientes) {
    try {
      const x = await adjuntarContrato(i.id, { ventas: r.ventas, avisar: opciones.avisar !== false && new Date(i.createdAt) >= AVISOS_DESDE });
      resultados[i.name] = x.estado + (x.detalle ? ` · ${x.detalle}` : "");
    } catch (e) {
      resultados[i.name] = `error · ${e instanceof Error ? e.message : e}`;
    }
  }
  return { revisadas: pendientes.length, resultados };
}
