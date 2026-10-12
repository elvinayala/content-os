import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";

import { asegurarSemilla, ingestarLead } from "../leads/repo";
import { leadsTratos } from "../leads/schema";
import { notificarCEO } from "../notificar-ceo";
import { db } from "../pulse/db";
import { TOPE_REFERIDOS_DIA, type ReferidoNuevo } from "./referidos-reglas";

// Los referidos entran como lead a Leads de Level Up (embudo WHATSAPP, origen "referido") con el cliente que lo refirió
// en datos.referidoPor (el item de LEVEL UP MEDIA). Así el equipo de ventas lo trabaja como cualquier lead y el cliente
// ve el estado real (abierto → ganado/perdido). A Elvin le llega un aviso por cada referido.

export async function referidosDe(itemId: string) {
  const d = await db();
  return d
    .select({ id: leadsTratos.id, negocio: leadsTratos.negocio, nombre: leadsTratos.nombre, estado: leadsTratos.estado, createdAt: leadsTratos.createdAt })
    .from(leadsTratos)
    .where(and(eq(leadsTratos.marca, "level_up"), sql`${leadsTratos.datos}->>'referidoPor' = ${itemId}`))
    .orderBy(desc(leadsTratos.createdAt))
    .limit(50);
}

export async function crearReferido(itemId: string, negocioCliente: string, r: ReferidoNuevo): Promise<void> {
  const d = await db();
  const hoy = new Date(Date.now() - 24 * 3600_000);
  const [{ n }] = await d
    .select({ n: sql<number>`count(*)::int` })
    .from(leadsTratos)
    .where(and(eq(leadsTratos.marca, "level_up"), sql`${leadsTratos.datos}->>'referidoPor' = ${itemId}`, gte(leadsTratos.createdAt, hoy)));
  if (n >= TOPE_REFERIDOS_DIA) throw new Error("Ya enviaste varios referidos hoy. Mañana puedes enviar más.");
  await asegurarSemilla("level_up");
  await ingestarLead({
    marca: "level_up",
    embudo: "WHATSAPP",
    nombre: r.contacto,
    negocio: r.negocio,
    telefono: r.telefono,
    origen: "referido",
    moverSiExiste: false,
    nota: `🤝 Referido por ${negocioCliente} (cliente de Level Up, desde su app).${r.nota ? ` Nota: ${r.nota}` : ""}`,
    datos: { referidoPor: itemId, referidoPorNegocio: negocioCliente },
  });
  await notificarCEO(`🤝 Nuevo referido desde la app: ${r.negocio} (${r.contacto}) — lo refirió ${negocioCliente}. Ya está en Leads → WHATSAPP.`).catch(() => null);
}
