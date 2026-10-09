import "server-only";

import { and, desc, eq, gt, sql } from "drizzle-orm";

import { notificarPorNico } from "@/lib/notificar-ceo";
import { db } from "@/lib/pulse/db";
import { pulseUsers } from "@/lib/pulse/schema";
import { dmSlack } from "@/lib/pulse/slack-dm";
import type { UsuarioPulse } from "@/lib/pulse/types";

import { describirFiltro, HORAS_DESCARGA, type FiltroExport } from "./exportar";
import { MARCAS, slugDeMarca, type Marca } from "./reglas";
import { leadsExportaciones } from "./schema";

// Exportaciones de leads con aprobación de Elvin (28/sep): Nahuel y Aure piden → Elvin aprueba → se baja UNA vez en 24 h.

const t = leadsExportaciones;
const BASE = process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app";
const PAGINA = `${BASE}/pulse/leads/exportaciones`;

const nombreMarca = (m: string) => MARCAS[slugDeMarca(m as Marca)]?.nombre ?? m;

export async function pedirExportacion(u: UsuarioPulse, marca: Marca, filtro: FiltroExport): Promise<string> {
  const d = await db();
  const [e] = await d.insert(t).values({ userId: u.id, marca, filtro: filtro as unknown as Record<string, unknown> }).returning({ id: t.id });
  const c = codigoExportacion(e.id);
  // Se aprueba con Nico (9/oct, Elvin): "ok exp <código>" en su Telegram o "nico ok exp <código>" en Slack.
  await notificarPorNico(`📤 ${u.nombre} pide exportar leads a Excel: ${describirFiltro(filtro, nombreMarca(marca))}.\n\n👉 Para aprobar: ok exp ${c}\n✋ Para no: no exp ${c}\n(o en la página: ${PAGINA})`).catch(() => null);
  return e.id;
}

/** Código corto para aprobar por Telegram/Slack: las primeras 6 letras del id. */
export const codigoExportacion = (id: string) => id.slice(0, 6);

/** El actor de las aprobaciones que llegan por Nico: Elvin (el admin de Pulse). */
async function elvin(): Promise<UsuarioPulse | null> {
  const d = await db();
  const email = (process.env.PULSE_ADMIN_EMAIL ?? "elvin@levelupmediapr.net").toLowerCase();
  const [u] = await d
    .select({ id: pulseUsers.id, email: pulseUsers.email, nombre: pulseUsers.nombre })
    .from(pulseUsers)
    .where(and(eq(pulseUsers.rol, "admin"), eq(pulseUsers.activo, true), sql`lower(${pulseUsers.email}) = ${email}`))
    .limit(1);
  return u ? { ...u, rol: "admin", activo: true, color: null, tieneClave: true } : null;
}

/** Elvin decide desde Telegram (Nico) o Slack con el código corto. */
export async function decidirPorCodigo(codigo: string, aprobar: boolean, nota?: string | null): Promise<{ ok: boolean; mensaje: string }> {
  const c = codigo.trim().toLowerCase();
  if (!/^[0-9a-f]{4,8}$/.test(c)) return { ok: false, mensaje: `"${codigo}" no es un código de exportación.` };
  const pendientes = (await listarExportaciones({ limite: 100 })).filter((e) => e.estado === "pendiente" && e.id.startsWith(c));
  if (!pendientes.length) {
    const otra = (await listarExportaciones({ limite: 100 })).find((e) => e.id.startsWith(c));
    return { ok: false, mensaje: otra ? `Esa exportación (${otra.persona}) ya está ${otra.estado}.` : `No encuentro la exportación ${c}.` };
  }
  if (pendientes.length > 1) return { ok: false, mensaje: `Hay ${pendientes.length} con ese código; usa uno más largo.` };
  const actor = await elvin();
  if (!actor) return { ok: false, mensaje: "No encontré la cuenta de Elvin en Pulse para firmar la decisión." };
  const e = pendientes[0];
  await decidirExportacion(e.id, aprobar, actor, nota);
  return { ok: true, mensaje: aprobar ? `✅ Aprobada la exportación de ${e.persona} (${e.descripcion}). Ya le avisé: tiene ${HORAS_DESCARGA} h para bajarla, una sola vez.` : `✋ No va la exportación de ${e.persona}. Ya le avisé.` };
}

export async function pendientesParaNico(): Promise<string[]> {
  return (await listarExportaciones({ limite: 50 })).filter((e) => e.estado === "pendiente").map((e) => `📤 ${e.persona}: ${e.descripcion}\n→ ok exp ${codigoExportacion(e.id)} · no exp ${codigoExportacion(e.id)}`);
}

export interface Exportacion {
  id: string;
  userId: string;
  persona: string;
  email: string;
  marca: string;
  filtro: FiltroExport;
  descripcion: string;
  estado: string;
  createdAt: Date;
  decididaAt: Date | null;
  expiraAt: Date | null;
  descargadaAt: Date | null;
  filas: number | null;
  nota: string | null;
}

export async function listarExportaciones(p: { userId?: string; limite?: number } = {}): Promise<Exportacion[]> {
  const d = await db();
  const filas = await d
    .select({ e: t, persona: pulseUsers.nombre, email: pulseUsers.email })
    .from(t)
    .innerJoin(pulseUsers, eq(pulseUsers.id, t.userId))
    .where(p.userId ? eq(t.userId, p.userId) : undefined)
    .orderBy(desc(t.createdAt))
    .limit(p.limite ?? 60);
  return filas.map(({ e, persona, email }) => {
    const filtro = e.filtro as unknown as FiltroExport;
    return { id: e.id, userId: e.userId, persona, email, marca: e.marca, filtro, descripcion: describirFiltro(filtro, nombreMarca(e.marca)), estado: e.estado, createdAt: e.createdAt, decididaAt: e.decididaAt, expiraAt: e.expiraAt, descargadaAt: e.descargadaAt, filas: e.filas, nota: e.nota };
  });
}

export async function pendientesDeExportar(): Promise<number> {
  const d = await db();
  const [r] = await d.select({ n: sql<number>`count(*)::int` }).from(t).where(eq(t.estado, "pendiente"));
  return Number(r?.n ?? 0);
}

export async function decidirExportacion(id: string, aprobar: boolean, actor: UsuarioPulse, nota?: string | null): Promise<void> {
  const d = await db();
  const [e] = await d
    .update(t)
    .set({ estado: aprobar ? "aprobada" : "rechazada", decididaPor: actor.id, decididaAt: new Date(), expiraAt: aprobar ? new Date(Date.now() + HORAS_DESCARGA * 3_600_000) : null, nota: nota?.trim() || null })
    .where(and(eq(t.id, id), eq(t.estado, "pendiente")))
    .returning();
  if (!e) throw new Error("Esa exportación ya se decidió");
  const [quien] = await d.select({ email: pulseUsers.email }).from(pulseUsers).where(eq(pulseUsers.id, e.userId));
  const desc = describirFiltro(e.filtro as unknown as FiltroExport, nombreMarca(e.marca));
  if (quien?.email) {
    await dmSlack(
      quien.email,
      aprobar
        ? `✅ Elvin aprobó tu exportación de leads (${desc}). Bájala aquí en las próximas ${HORAS_DESCARGA} horas; el link sirve una sola vez: ${PAGINA}`
        : `❌ Elvin no aprobó tu exportación de leads (${desc}).${nota?.trim() ? ` Nota: ${nota.trim()}` : ""}`,
    ).catch(() => false);
  }
}

/** La descarga consume la aprobación (una sola vez, dentro de 24 h, solo quien la pidió). */
export async function tomarDescarga(id: string, u: UsuarioPulse): Promise<{ marca: Marca; filtro: FiltroExport } | null> {
  const d = await db();
  const [e] = await d
    .update(t)
    .set({ estado: "descargada", descargadaAt: new Date() })
    .where(and(eq(t.id, id), eq(t.userId, u.id), eq(t.estado, "aprobada"), gt(t.expiraAt, new Date())))
    .returning();
  return e ? { marca: e.marca as Marca, filtro: e.filtro as unknown as FiltroExport } : null;
}

export async function anotarFilas(id: string, filas: number): Promise<void> {
  const d = await db();
  await d.update(t).set({ filas }).where(eq(t.id, id));
}
