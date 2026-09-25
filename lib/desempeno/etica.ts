import "server-only";

import { desc, eq } from "drizzle-orm";

import { notificarCEO } from "../notificar-ceo";
import { db } from "../pulse/db";
import { desempenoEtica } from "./schema";

// Canal ético de Ritmo: SOLO Elvin (admin) lo lee. El aviso a Elvin no lleva el contenido (solo la
// categoría), para que el detalle viva únicamente dentro de Ritmo.

export const CATEGORIAS_ETICA = [
  { id: "acoso", nombre: "Acoso o maltrato" },
  { id: "discriminacion", nombre: "Discriminación" },
  { id: "fraude", nombre: "Fraude, robo o mal uso de dinero" },
  { id: "clientes", nombre: "Trato indebido a un cliente" },
  { id: "datos", nombre: "Mal uso de información o accesos" },
  { id: "conflicto", nombre: "Conflicto de interés / trabajo externo sin autorización" },
  { id: "otro", nombre: "Otro" },
] as const;

export type ReporteEtico = typeof desempenoEtica.$inferSelect;

export async function crearReporteEtico(p: { userId: string | null; categoria: string; descripcion: string; involucrados: string | null }) {
  const d = await db();
  await d.insert(desempenoEtica).values(p);
  const cat = CATEGORIAS_ETICA.find((c) => c.id === p.categoria)?.nombre ?? p.categoria;
  const base = process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app";
  await notificarCEO(`🛡️ Nuevo reporte en el canal ético de Ritmo (${cat}${p.userId ? "" : ", anónimo"}). Solo tú lo ves: ${base}/ritmo/etica`).catch(() => {});
}

export async function listarReportesEticos(): Promise<ReporteEtico[]> {
  const d = await db();
  return d.select().from(desempenoEtica).orderBy(desc(desempenoEtica.createdAt));
}

export async function actualizarReporteEtico(id: string, p: { estado: string; notaInterna: string | null }) {
  const d = await db();
  await d.update(desempenoEtica).set({ ...p, updatedAt: new Date() }).where(eq(desempenoEtica.id, id));
}
