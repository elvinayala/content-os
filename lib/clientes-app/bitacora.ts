import "server-only";

import { createHash } from "node:crypto";

import Anthropic from "@anthropic-ai/sdk";
import { and, eq, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseColumns, pulseItems } from "../pulse/schema";
import { limpiarEntradas, type EntradaBitacora } from "./bitacora-reglas";
import { hoyPR } from "./formato";

// "Lo que hemos hecho por ti": la bitácora interna del equipo (columna "Campaigns Level Up" de LEVEL UP MEDIA, con
// iniciales, jerga y notas internas) reescrita por Claude para el cliente. Se genera UNA vez por versión del texto
// (hash) y se guarda; si el equipo edita la columna en Pulse, se vuelve a generar sola. Sin API key → lista vacía
// (nunca se muestra el texto crudo). Modelo: Sonnet 5, tarea breve (gasto de IA, 28/sep).
const MODELO = process.env.CLIENTES_APP_BITACORA_MODEL || "claude-sonnet-5";

const INSTRUCCIONES = `Eres el equipo de Level Up Media, una agencia de anuncios en Meta (Facebook/Instagram) de Puerto Rico. Te paso la bitácora INTERNA de un cliente: notas cortas del equipo con fechas en formato día/mes (sin año), iniciales de quien lo hizo y jerga.

Conviértela en una línea de tiempo para que la lea EL CLIENTE en su app: "lo que hemos hecho por ti".

Reglas:
- Una entrada por día. Junta lo que pasó el mismo día en una sola frase.
- Español de Puerto Rico, tuteo ("tu campaña", "creamos"), nunca voseo. Frases cortas (máximo ~110 caracteres), en primera persona del equipo ("Lanzamos…", "Creamos…", "Agregamos…").
- Traduce la jerga: "fase 1 reconocimiento/alcance" = campaña para que más gente conozca tu negocio; "visitas/tráfico a IG" = campaña para llevar gente a tu Instagram; "fase 2 ventas" / "ventas wpp" = campaña para que te escriban por WhatsApp; "llamadas" = para que te llamen; "fase 3 rmkt / remarketing" = campaña para volver a impactar a quien ya te vio; "fase 4 / thruplay" = campaña de video para que más gente vea tus videos; "fase 5" = escalar lo que mejor funciona; "anexar/agregar anuncio, video o creativo" = agregamos anuncios nuevos.
- NO incluyas: iniciales o nombres del equipo, montos de dinero o presupuesto, notas internas, quejas o culpas ("porque el cliente no…"), cosas que NO se hicieron, ni nada que no sea trabajo hecho para el cliente.
- No inventes nada que no diga la bitácora. Si una nota no se entiende, omítela.
- Año: las notas van más o menos en orden. Usa la fecha de inicio del cliente y la de hoy para deducir el año de cada fecha. Ninguna fecha puede ser después de hoy.`;

const ESQUEMA = {
  type: "object",
  properties: {
    entradas: {
      type: "array",
      items: {
        type: "object",
        properties: { fecha: { type: "string", description: "YYYY-MM-DD" }, texto: { type: "string" } },
        required: ["fecha", "texto"],
        additionalProperties: false,
      },
    },
  },
  required: ["entradas"],
  additionalProperties: false,
};

let lista = false;
async function tabla() {
  const d = await db();
  if (!lista) {
    await d.execute(sql`create table if not exists pulse_app_bitacora (
      item_id uuid primary key references pulse_items(id) on delete cascade,
      hash text not null,
      entradas jsonb not null,
      generado_at timestamptz not null default now()
    )`);
    await d.execute(sql`select pulse_papelera_proteger()`).catch(() => null);
    lista = true;
  }
  return d;
}

async function bitacoraCruda(itemId: string): Promise<{ texto: string; inicio: string | null } | null> {
  const d = await db();
  const [it] = await d.select({ boardId: pulseItems.boardId, values: pulseItems.values }).from(pulseItems).where(eq(pulseItems.id, itemId));
  if (!it) return null;
  const cols = await d.select({ id: pulseColumns.id, title: pulseColumns.title }).from(pulseColumns).where(and(eq(pulseColumns.boardId, it.boardId)));
  const v = (it.values ?? {}) as Record<string, unknown>;
  const col = (re: RegExp) => cols.find((c) => re.test(c.title));
  const texto = v[col(/^campaigns level up$/i)?.id ?? ""];
  const inicio = v[col(/^fecha de inicio$/i)?.id ?? ""];
  return typeof texto === "string" && texto.trim() ? { texto: texto.trim().slice(0, 12000), inicio: typeof inicio === "string" ? inicio.slice(0, 10) : null } : null;
}

async function reescribir(texto: string, inicio: string | null, hoy: string): Promise<EntradaBitacora[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const resp = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA } },
    system: INSTRUCCIONES,
    messages: [{ role: "user", content: `Fecha de inicio del cliente: ${inicio ?? "desconocida"}\nHoy: ${hoy}\n\nBitácora interna:\n${texto}` }],
  } as unknown as Anthropic.MessageCreateParamsNonStreaming);
  if (resp.stop_reason === "refusal" || resp.stop_reason === "max_tokens") return [];
  const salida = resp.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  try {
    return limpiarEntradas(JSON.parse(salida), hoy);
  } catch {
    return [];
  }
}

/** La línea de tiempo de campañas del cliente (sin lo entregado; eso se mezcla en la página). */
export async function bitacoraCliente(itemId: string): Promise<EntradaBitacora[]> {
  const cruda = await bitacoraCruda(itemId);
  if (!cruda) return [];
  const hash = createHash("sha256").update(`${MODELO}|${cruda.inicio}|${cruda.texto}`).digest("hex").slice(0, 32);
  const d = await tabla();
  const r = (await d.execute(sql`select hash, entradas from pulse_app_bitacora where item_id = ${itemId}`)) as unknown;
  const [g] = (Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? [])) as { hash: string; entradas: EntradaBitacora[] }[];
  if (g?.hash === hash) return g.entradas;
  if (!process.env.ANTHROPIC_API_KEY) return g?.entradas ?? [];
  const entradas = await reescribir(cruda.texto, cruda.inicio, hoyPR()).catch((e) => {
    console.error("bitácora cliente", itemId, e instanceof Error ? e.message : e);
    return null;
  });
  if (!entradas) return g?.entradas ?? [];
  await d.execute(
    sql`insert into pulse_app_bitacora (item_id, hash, entradas) values (${itemId}, ${hash}, ${JSON.stringify(entradas)}::jsonb) on conflict (item_id) do update set hash = excluded.hash, entradas = excluded.entradas, generado_at = now()`,
  );
  return entradas;
}
