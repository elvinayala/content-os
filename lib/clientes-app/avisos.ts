import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseAppClientes } from "../pulse/schema";
import { fichaCliente } from "./datos";
import { avisarCliente, avisosClientesReales, clientesConPush } from "./push";
import { resultadosCliente } from "./resultados";

// Aviso push "Anuncio listo para escalar" (Elvin, 30/sep): una vez al día se revisan los últimos 7 días de cada cliente
// con la app y avisos activos; si hay un anuncio ganador, le llega UN aviso (el mismo anuncio no se repite en 7 días).
// Sale solo con CLIENTES_APP_AVISOS=real; si no, devuelve lo que habría mandado.

async function asegurarTabla() {
  const d = await db();
  await d.execute(sql`create table if not exists pulse_app_avisos (
    item_id uuid not null references pulse_items(id) on delete cascade,
    clave text not null,
    enviado_at timestamptz not null default now(),
    primary key (item_id, clave)
  )`);
  return d;
}

export interface AvisoEscalar {
  itemId: string;
  negocio: string;
  anuncio: string;
  costo: number | null;
  enviado: number;
  motivo?: string;
}

export async function revisarEscalar(opciones: { real?: boolean } = {}): Promise<AvisoEscalar[]> {
  const real = (opciones.real ?? true) && avisosClientesReales();
  const d = await asegurarTabla();
  const activos = await d.select({ itemId: pulseAppClientes.itemId }).from(pulseAppClientes).where(eq(pulseAppClientes.activo, true));
  const conPush = await clientesConPush(activos.map((a) => a.itemId));
  const out: AvisoEscalar[] = [];
  for (const { itemId } of activos) {
    if (!conPush.has(itemId)) continue;
    const f = await fichaCliente(itemId).catch(() => null);
    if (!f?.cuentaAnuncios || f.etapa === "baja") continue;
    const r = await resultadosCliente(f.cuentaAnuncios, "7d");
    const a = r.escalar ? r.anuncios.find((x) => x.id === r.escalar) : null;
    if (!a) continue;
    const clave = `escalar:${a.id}`;
    const ya = (await d.execute(sql`select 1 from pulse_app_avisos where item_id = ${itemId} and clave = ${clave} and enviado_at > now() - interval '7 days'`)) as unknown;
    const filas = Array.isArray(ya) ? ya : ((ya as { rows?: unknown[] }).rows ?? []);
    if (filas.length) {
      out.push({ itemId, negocio: f.negocio, anuncio: a.nombre, costo: a.numeros.costoResultado, enviado: 0, motivo: "ya avisado esta semana" });
      continue;
    }
    const costo = a.numeros.costoResultado != null ? `$${a.numeros.costoResultado.toFixed(2)}` : "";
    const enviado = real ? await avisarCliente(itemId, { titulo: "🚀 Anuncio listo para escalar", texto: `«${a.nombre.slice(0, 60)}» va ganando${costo ? ` a ${costo} por resultado` : ""}. Recomendamos subirle 10-20 % al presupuesto.`, url: "/cliente/resultados", tag: "lu-escalar" }) : 0;
    if (enviado) await d.execute(sql`insert into pulse_app_avisos (item_id, clave) values (${itemId}, ${clave}) on conflict (item_id, clave) do update set enviado_at = now()`);
    out.push({ itemId, negocio: f.negocio, anuncio: a.nombre, costo: a.numeros.costoResultado, enviado, ...(real ? {} : { motivo: "simulación (CLIENTES_APP_AVISOS apagado)" }) });
  }
  return out;
}
