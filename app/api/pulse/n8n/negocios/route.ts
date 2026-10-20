import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/pulse/db";
import { secretoValido } from "@/lib/pulse/seguridad";
import { pulseBoards, pulseColumns, pulseGroups, pulseItems } from "@/lib/pulse/schema";
import type { EtiquetaStatus } from "@/lib/pulse/types";

import { armarClientes } from "@/lib/pulse/puente-n8n";

// Para Cortex (editor de video, Elvin 12/oct: «que escojan qué negocio le están editando; la lista de clientes está en
// Pulse… cada cliente es una carpeta»): SOLO los datos para escoger el negocio — sin correo, teléfono, cuenta ni equipo.
// Mismo secreto que el puente de n8n (x-pulse-secret = PULSE_N8N_SECRET); proxy.ts deja pasar /api/pulse/n8n/*.
// 20/oct (María, solicitud #343: «también edito videos para IA Borinquen… DM Wireless no aparece»): se suman los clientes
// del tablero AI BORINQUEN con `marca: "ai_borinquen"` (los de LU llevan "level_up"); n8n no usa esta ruta.
export const dynamic = "force-dynamic";

const SLUG_AIB = "ai-borinquen";

async function negociosAib() {
  const d = await db();
  const board = await d.query.pulseBoards.findFirst({ where: eq(pulseBoards.slug, SLUG_AIB) });
  if (!board) return [];
  const [cols, grupos, items] = await Promise.all([
    d.select().from(pulseColumns).where(eq(pulseColumns.boardId, board.id)),
    d.select().from(pulseGroups).where(eq(pulseGroups.boardId, board.id)),
    d.select({ id: pulseItems.id, name: pulseItems.name, groupId: pulseItems.groupId, values: pulseItems.values }).from(pulseItems).where(eq(pulseItems.boardId, board.id)),
  ]);
  const col = (t: string) => cols.find((c) => c.title.trim().toLowerCase() === t);
  const cEmpresa = col("empresa");
  const cIndustria = col("industria");
  const etiquetas = new Map<string, string>(((cIndustria?.settings?.labels ?? []) as EtiquetaStatus[]).map((l) => [l.id, l.label]));
  const tituloGrupo = new Map(grupos.map((g) => [g.id, g.title]));
  const txt = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v)).trim();
  return items.map((i) => {
    const v = (i.values ?? {}) as Record<string, unknown>;
    const grupo = tituloGrupo.get(i.groupId) ?? "";
    return {
      pulseId: i.id,
      negocio: (cEmpresa ? txt(v[cEmpresa.id]) : "") || i.name.trim(),
      contacto: i.name.trim(),
      industria: cIndustria ? (etiquetas.get(txt(v[cIndustria.id])) ?? "") : "",
      activo: grupo.trim().toUpperCase() !== "OFFBOARDED",
      grupo,
      marca: "ai_borinquen" as const,
    };
  });
}

export async function GET(req: NextRequest) {
  if (!secretoValido(req.headers.get("x-pulse-secret"), process.env.PULSE_N8N_SECRET)) {
    return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  }
  const lu = (await armarClientes())
    .filter((c) => (c.empresa || c.nombre).trim())
    .map((c) => ({ pulseId: c.pulseId, negocio: (c.empresa || c.nombre).trim(), contacto: c.nombre.trim(), industria: c.industria, activo: c.activo, grupo: c.grupo, marca: "level_up" as const }));
  const aib = (await negociosAib().catch(() => [])).filter((n) => n.negocio);
  return NextResponse.json({ generadoEl: new Date().toISOString(), negocios: [...lu, ...aib] }, { headers: { "Cache-Control": "no-store" } });
}
