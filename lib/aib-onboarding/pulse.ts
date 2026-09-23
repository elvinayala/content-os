import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/pulse/db";
import { pulseBoards, pulseColumns, pulseGroups, pulseItems } from "@/lib/pulse/schema";
import type { ValorCelda } from "@/lib/pulse/types";

import { GRUPOS_FUERA, SLUG_TABLERO } from "./config";

// Clientes que pagan en AI Borinquen = items del tablero AI BORINQUEN de Pulse fuera de OFFBOARDED.
// Las columnas se buscan por título (Jessica/Ángela pueden reordenarlas sin romper nada).

export interface ClientePulseAib {
  pulseItemId: string;
  nombre: string;
  empresa: string | null;
  telefono: string | null; // solo dígitos, con código de país
  email: string | null;
  servicio: string; // título del grupo
  fechaPago: string; // YYYY-MM-DD
}

const texto = (v: ValorCelda | undefined) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

/** Teléfono de PR/EE.UU. a dígitos con código de país (10 dígitos → antepone 1). */
export function normalizarTelefono(v: string): string | null {
  const d = v.replace(/\D/g, "");
  if (d.length === 10) return `1${d}`;
  if (d.length >= 11 && d.length <= 15) return d;
  return null;
}

export async function clientesAibDePulse(): Promise<{ clientes: ClientePulseAib[]; sinTelefono: string[]; tieneColumnaTelefono: boolean }> {
  const d = await db();
  const board = await d.query.pulseBoards.findFirst({ where: eq(pulseBoards.slug, SLUG_TABLERO) });
  if (!board) return { clientes: [], sinTelefono: [], tieneColumnaTelefono: false };
  const [cols, grupos, items] = await Promise.all([
    d.select().from(pulseColumns).where(eq(pulseColumns.boardId, board.id)),
    d.select().from(pulseGroups).where(eq(pulseGroups.boardId, board.id)),
    d.select().from(pulseItems).where(eq(pulseItems.boardId, board.id)),
  ]);
  const col = (...titulos: string[]) => cols.find((c) => titulos.some((t) => c.title.trim().toLowerCase() === t.toLowerCase()));
  const cEmpresa = col("Empresa");
  const cTel = col("Teléfono", "Telefono", "WhatsApp");
  const cEmail = col("E-mail", "Email", "Correo");
  const cPago = col("Fecha del pago inicial");
  const cPago2 = col("Fecha de pago");
  const grupo = new Map(grupos.map((g) => [g.id, g.title]));

  const clientes: ClientePulseAib[] = [];
  const sinTelefono: string[] = [];
  for (const i of items) {
    const servicio = grupo.get(i.groupId) ?? "";
    if (GRUPOS_FUERA.test(servicio)) continue;
    const v = i.values ?? {};
    const telefono = cTel ? normalizarTelefono(texto(v[cTel.id])) : null;
    if (!telefono) {
      sinTelefono.push(i.name);
      continue;
    }
    const fechaPago = (cPago && texto(v[cPago.id])) || (cPago2 && texto(v[cPago2.id])) || i.createdAt.toISOString().slice(0, 10);
    clientes.push({
      pulseItemId: i.id,
      nombre: i.name.trim(),
      empresa: (cEmpresa && texto(v[cEmpresa.id])) || null,
      telefono,
      email: (cEmail && texto(v[cEmail.id]).toLowerCase()) || null,
      servicio,
      fechaPago: fechaPago.slice(0, 10),
    });
  }
  return { clientes, sinTelefono, tieneColumnaTelefono: Boolean(cTel) };
}
