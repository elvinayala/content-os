import "server-only";

import { and, desc, eq, gt, sql } from "drizzle-orm";

import { notificarCEO } from "@/lib/notificar-ceo";
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
  await notificarCEO(`📤 ${u.nombre} pide exportar leads a Excel: ${describirFiltro(filtro, nombreMarca(marca))}.\nApruébalo o recházalo aquí: ${PAGINA}`).catch(() => null);
  return e.id;
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
