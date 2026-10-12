import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseActivity, pulseColumns, pulseItems } from "../pulse/schema";
import { dmSlack } from "../pulse/slack-dm";
import type { ValorCelda } from "../pulse/types";
import { montoDePago } from "../pulse/ultimos-clientes";
import { avisarCliente } from "./push";
import { esAltoValor, mesPR, textoAvisoEquipo, textoHorario, type OpcionHorario } from "./reunion-reglas";

// Reunión de estrategia mensual (Elvin, 30/sep). Tabla creada desde el código (como las demás de la app de clientes).
// A quién le llega la solicitud: CLIENTES_APP_REUNION_AVISAR (correos; por defecto Jessica y Carilin), por DM del bot.

export interface Reunion {
  id: string;
  mes: string;
  opciones: OpcionHorario[];
  tema: string;
  estado: "pedida" | "agendada" | "cancelada";
  agendadaPara: string | null; // ISO
  enlace: string | null;
  creadoAt: string;
}

let lista = false;
async function tabla() {
  const d = await db();
  if (!lista) {
    await d.execute(sql`create table if not exists pulse_app_reuniones (
      id uuid primary key default gen_random_uuid(),
      item_id uuid not null references pulse_items(id) on delete cascade,
      mes text not null,
      opciones jsonb not null,
      tema text not null default '',
      estado text not null default 'pedida',
      agendada_para timestamptz,
      enlace text,
      decidido_por uuid references pulse_users(id) on delete set null,
      creado_at timestamptz not null default now()
    )`);
    await d.execute(sql`create index if not exists pulse_app_reuniones_item on pulse_app_reuniones (item_id, mes)`);
    await d.execute(sql`select pulse_papelera_proteger()`).catch(() => null);
    lista = true;
  }
  return d;
}

const filas = <T>(r: unknown): T[] => (Array.isArray(r) ? r : ((r as { rows?: T[] }).rows ?? [])) as T[];

/** ¿Pagó $3,000 o más (pago inicial, acuerdo, venta de Slack) o está marcado "Alto"? Dato interno. */
export async function altoValorCliente(itemId: string): Promise<boolean> {
  const d = await db();
  const [it] = await d.select({ boardId: pulseItems.boardId, values: pulseItems.values }).from(pulseItems).where(eq(pulseItems.id, itemId));
  if (!it) return false;
  const cols = await d.select({ id: pulseColumns.id, title: pulseColumns.title, settings: pulseColumns.settings }).from(pulseColumns).where(eq(pulseColumns.boardId, it.boardId));
  const v = (it.values ?? {}) as Record<string, ValorCelda>;
  const col = (re: RegExp) => cols.find((c) => re.test(c.title));
  const alto = col(/^alto valor$/i);
  const etiqueta = alto ? ((alto.settings ?? {}) as { labels?: { id: string; label: string }[] }).labels?.find((l) => l.id === v[alto.id])?.label : undefined;
  const pagoInicial = v[col(/^pago inicial$/i)?.id ?? ""];
  const acuerdo = v[col(/^acuerdo de pago$/i)?.id ?? ""];
  const ventas = await d
    .select({ after: pulseActivity.after })
    .from(pulseActivity)
    .where(sql`${pulseActivity.itemId} = ${itemId} and ${pulseActivity.after} ? 'venta'`);
  return esAltoValor({
    marcadoAlto: /alto/i.test(etiqueta ?? ""),
    montos: [typeof pagoInicial === "number" ? pagoInicial : undefined, montoDePago(typeof acuerdo === "string" ? acuerdo : null), ...ventas.map((x) => montoDePago((x.after as { venta?: { pago?: string } })?.venta?.pago))],
  });
}

function aReunion(r: { id: string; mes: string; opciones: OpcionHorario[]; tema: string; estado: Reunion["estado"]; agendada_para: string | Date | null; enlace: string | null; creado_at: string | Date }): Reunion {
  return { id: r.id, mes: r.mes, opciones: r.opciones, tema: r.tema, estado: r.estado, agendadaPara: r.agendada_para ? new Date(r.agendada_para).toISOString() : null, enlace: r.enlace, creadoAt: new Date(r.creado_at).toISOString() };
}

/** La reunión de este mes (la que no está cancelada), si hay. */
export async function reunionDelMes(itemId: string): Promise<Reunion | null> {
  const d = await tabla();
  const [r] = filas<Parameters<typeof aReunion>[0]>(
    await d.execute(sql`select * from pulse_app_reuniones where item_id = ${itemId} and mes = ${mesPR(new Date())} and estado <> 'cancelada' order by creado_at desc limit 1`),
  );
  return r ? aReunion(r) : null;
}

const linkFicha = (itemId: string) => `${(process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "")}/pulse/level-up-media?item=${itemId}`;

export async function solicitarReunion(itemId: string, cliente: { negocio: string; contacto: string }, p: { opciones: OpcionHorario[]; tema: string }): Promise<void> {
  if (!(await altoValorCliente(itemId))) throw new Error("No disponible");
  if (await reunionDelMes(itemId)) throw new Error("Ya pediste tu reunión de este mes.");
  const d = await tabla();
  await d.execute(sql`insert into pulse_app_reuniones (item_id, mes, opciones, tema) values (${itemId}, ${mesPR(new Date())}, ${JSON.stringify(p.opciones)}::jsonb, ${p.tema})`);
  const texto = textoAvisoEquipo({ negocio: cliente.negocio, contacto: cliente.contacto, opciones: p.opciones, tema: p.tema, linkFicha: linkFicha(itemId) });
  const destinos = (process.env.CLIENTES_APP_REUNION_AVISAR || "jessica@levelupmediapr.net,carilin@levelupmediapr.net").split(",").map((x) => x.trim()).filter(Boolean);
  await Promise.all(destinos.map((e) => dmSlack(e, texto).catch(() => false)));
}

/** El equipo la confirma (fecha y hora de PR + enlace de Meet/Zoom); al cliente le llega el aviso si están encendidos. */
export async function agendarReunion(itemId: string, id: string, fechaHora: string, enlace: string, userId: string): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fechaHora)) throw new Error("Escoge día y hora");
  const limpio = enlace.trim();
  if (limpio && !/^https:\/\//.test(limpio)) throw new Error("El enlace tiene que empezar con https://");
  const d = await tabla();
  const r = filas(await d.execute(sql`update pulse_app_reuniones set estado = 'agendada', agendada_para = ${`${fechaHora}:00-04:00`}::timestamptz, enlace = ${limpio || null}, decidido_por = ${userId} where id = ${id} and item_id = ${itemId} returning id`));
  if (!r.length) throw new Error("No encontré la solicitud");
  const [fecha, hora] = fechaHora.split("T");
  await avisarCliente(itemId, { titulo: "📅 Tu reunión de estrategia está confirmada", texto: textoHorario({ fecha, hora }) + " (hora de PR).", url: "/cliente", tag: "lu-reunion" }).catch(() => 0);
}

export async function cancelarReunion(itemId: string, id: string, userId: string): Promise<void> {
  const d = await tabla();
  await d.execute(sql`update pulse_app_reuniones set estado = 'cancelada', decidido_por = ${userId} where id = ${id} and item_id = ${itemId}`);
}
