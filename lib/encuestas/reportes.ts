import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { sql } from "drizzle-orm";

import { db } from "@/lib/pulse/db";

import { digitosTelefono, huella, leerExtraccion, listoParaPublicar, plantilla, responsables, type Evento, type Extraccion, type TipoEvento, VENTANA_HORAS } from "./reglas";

// Reportes del agente de encuestas (n8n "D-) Tools encuestador v1") → UN reporte por conversación en
// #office-6-problemas-onboarding-clientes. n8n manda cada aviso aquí (POST), y cada minuto pregunta qué hay
// listo para publicar (GET) y confirma con el ts de Slack (POST confirmar). Publica n8n porque el bot de
// Content OS no está en ese canal; el texto lo arma este código. Ver lib/encuestas/reglas.ts.

const MODELO = process.env.ENCUESTAS_MODEL || "claude-opus-5";
const ETIQUETA_NO_IA = "no-contactar-ia";

function filas<T = Record<string, unknown>>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  return (r as { rows?: T[] })?.rows ?? [];
}

let lista: Promise<void> | null = null;
function asegurarTabla(): Promise<void> {
  if (!lista) {
    lista = (async () => {
      const d = await db();
      await d.execute(sql`CREATE TABLE IF NOT EXISTS encuesta_reportes (
        id serial PRIMARY KEY,
        telefono text,
        nombre text,
        eventos jsonb NOT NULL DEFAULT '[]'::jsonb,
        version integer NOT NULL DEFAULT 1,
        publicada integer NOT NULL DEFAULT 0,
        pendiente boolean NOT NULL DEFAULT true,
        bloqueado_hasta timestamptz,
        slack_ts text,
        texto text,
        huella text,
        datos jsonb NOT NULL DEFAULT '{}'::jsonb,
        creado_el timestamptz NOT NULL DEFAULT now(),
        actualizado_el timestamptz NOT NULL DEFAULT now(),
        publicado_el timestamptz
      )`);
      await d.execute(sql`CREATE INDEX IF NOT EXISTS encuesta_reportes_tel ON encuesta_reportes (telefono, creado_el)`);
      await d.execute(sql`CREATE INDEX IF NOT EXISTS encuesta_reportes_pend ON encuesta_reportes (pendiente)`);
    })().catch((e) => {
      lista = null;
      throw e;
    });
  }
  return lista;
}

interface Fila {
  id: number;
  telefono: string | null;
  nombre: string | null;
  eventos: Evento[];
  version: number;
  publicada: number;
  slack_ts: string | null;
  huella: string | null;
  datos: { etiquetado?: boolean };
}

/** Un aviso del agente. Se junta con los demás del mismo teléfono (ventana de 24 h). */
export async function registrarEvento(p: { tipo: TipoEvento; telefono?: string | null; destinatario?: string | null; mensaje?: string | null; nombre?: string | null }): Promise<{ id: number }> {
  await asegurarTabla();
  const d = await db();
  const tel = digitosTelefono(p.telefono);
  const ev: Evento = { tipo: p.tipo, destinatario: p.destinatario ?? null, mensaje: p.mensaje?.slice(0, 4000) ?? null, at: new Date().toISOString() };
  const [abierto] = tel
    ? filas<{ id: number }>(await d.execute(sql`SELECT id FROM encuesta_reportes WHERE telefono = ${tel} AND creado_el > now() - make_interval(hours => ${VENTANA_HORAS}) ORDER BY id DESC LIMIT 1`))
    : [];
  if (abierto) {
    await d.execute(sql`UPDATE encuesta_reportes SET eventos = eventos || ${JSON.stringify([ev])}::jsonb, version = version + 1, pendiente = true,
      nombre = COALESCE(nombre, ${p.nombre ?? null}), actualizado_el = now() WHERE id = ${abierto.id}`);
    return { id: abierto.id };
  }
  // "finalizar" sin avisos antes: no abre reporte (no hay nada que contar).
  if (p.tipo === "finalizar") return { id: 0 };
  const [n] = filas<{ id: number }>(await d.execute(sql`INSERT INTO encuesta_reportes (telefono, nombre, eventos) VALUES (${tel}, ${p.nombre ?? null}, ${JSON.stringify([ev])}::jsonb) RETURNING id`));
  return { id: n.id };
}

// ─── Chatwoot (la conversación real, para citar al cliente y ver su última palabra) ─────────────────

const CW = () => ({ base: (process.env.CHATWOOT_LU_URL || "").replace(/\/$/, ""), token: process.env.CHATWOOT_LU_TOKEN || "", cuenta: process.env.CHATWOOT_LU_CUENTA || "2" });

async function cw(ruta: string, init?: RequestInit): Promise<any> {
  const { base, token, cuenta } = CW();
  if (!base || !token) return null;
  const r = await fetch(`${base}/api/v1/accounts/${cuenta}${ruta}`, { ...init, headers: { api_access_token: token, "Content-Type": "application/json", ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`Chatwoot ${r.status} en ${ruta}`);
  return r.json();
}

async function conversacion(tel: string | null): Promise<{ id: number | null; nombre: string | null; texto: string }> {
  if (!tel) return { id: null, nombre: null, texto: "" };
  try {
    const c = await cw(`/contacts/search?q=${encodeURIComponent(tel)}`);
    const contacto = c?.payload?.[0];
    if (!contacto) return { id: null, nombre: null, texto: "" };
    const convs = ((await cw(`/contacts/${contacto.id}/conversations`))?.payload ?? []) as { id: number; last_activity_at?: number }[];
    const conv = convs.sort((a, b) => (b.last_activity_at ?? 0) - (a.last_activity_at ?? 0))[0];
    if (!conv) return { id: null, nombre: contacto.name ?? null, texto: "" };
    const msgs = ((await cw(`/conversations/${conv.id}/messages`))?.payload ?? []) as { content?: string; message_type?: number; created_at?: number; private?: boolean }[];
    const desde = Date.now() / 1000 - VENTANA_HORAS * 3600;
    const texto = msgs
      .filter((m) => !m.private && m.content && (m.created_at ?? 0) >= desde && (m.message_type === 0 || m.message_type === 1))
      .slice(-40)
      .map((m) => `${m.message_type === 0 ? "CLIENTE" : "AGENTE"}: ${m.content!.slice(0, 600)}`)
      .join("\n");
    return { id: conv.id, nombre: contacto.name ?? null, texto };
  } catch {
    return { id: null, nombre: null, texto: "" };
  }
}

/** Pone la etiqueta que hace que el agente de onboarding deje de contestarle (filtro "is-inbound?"). */
async function etiquetarNoIA(convId: number): Promise<boolean> {
  try {
    const actuales = ((await cw(`/conversations/${convId}/labels`))?.payload ?? []) as string[];
    if (actuales.includes(ETIQUETA_NO_IA)) return true;
    await cw(`/conversations/${convId}/labels`, { method: "POST", body: JSON.stringify({ labels: [...actuales, ETIQUETA_NO_IA] }) });
    return true;
  } catch {
    return false;
  }
}

// ─── Extracción (la IA solo saca datos; el formato lo pone plantilla()) ─────────────────────────────

const INSTRUCCIONES = `Eres quien arma el reporte interno de una encuesta a un cliente de Level Up Media (agencia de marketing en Puerto Rico).
Te paso la conversación de WhatsApp (CLIENTE / AGENTE) y los avisos que el agente de IA le mandó al equipo durante la encuesta (pueden estar repetidos o contradecirse).
Responde SOLO con JSON:
{"cliente": "<nombre>", "negocio": "<negocio o null>", "tipo": "Encuesta 10 días|Encuesta 30 días|Queja|Reembolso|Contacto urgente|Referido|Otro", "calificacion": "<como la dio: p. ej. 'Regular · recomendaría 4/10', o null>", "comentario": "<lo que dijo el CLIENTE, textual, una sola vez, máx. 300 caracteres, o null>", "quiereLlamada": true|false|null, "accion": "<qué tiene que hacer el equipo, 1 oración>", "prioridad": "alta|media|baja", "noContactarIA": true|false, "preferencia": "<cómo pidió que lo contacten, textual, o null>"}
Reglas:
- Si el cliente cambió de opinión, vale SOLO su ÚLTIMA palabra (p. ej. primero aceptó la llamada y después dijo que no → quiereLlamada false). Lo que dice el CLIENTE manda sobre lo que dicen los avisos del agente.
- comentario: palabras del cliente, no un resumen del agente. Nada inventado: si no hay, null.
- prioridad: alta = queja, mala experiencia, reembolso, urgencia o pide que no le hable la IA; media = experiencia regular o dudas; baja = todo bien.
- noContactarIA: true si pidió hablar con una persona, que le manden audio en vez de IA, o que no le escriba el bot.
- No pongas el teléfono en ningún campo.`;

async function extraer(eventos: Evento[], conv: string, nombre: string | null): Promise<Extraccion | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const avisos = eventos
    .filter((e) => e.tipo !== "finalizar")
    .map((e, i) => `Aviso ${i + 1} (${e.tipo}${e.destinatario ? ` → ${e.destinatario}` : ""}): ${e.mensaje ?? ""}`)
    .join("\n");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const params = {
    model: MODELO,
    max_tokens: 2048,
    thinking: { type: "adaptive" as const },
    output_config: { effort: "low" as const },
    system: INSTRUCCIONES,
    messages: [{ role: "user" as const, content: `Nombre en Chatwoot: ${nombre ?? "—"}\n\nConversación:\n${conv || "(no disponible)"}\n\nAvisos del agente:\n${avisos}` }],
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };
  try {
    const resp = await anthropic.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
    if (resp.stop_reason === "refusal") return null;
    return leerExtraccion(resp.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join(""));
  } catch {
    return null;
  }
}

/** Sin IA: lo mínimo seguro (el último aviso manda, sin inventar decisión). */
function respaldo(eventos: Evento[]): Extraccion {
  const ultimo = [...eventos].reverse().find((e) => e.tipo !== "finalizar");
  return { cliente: null, negocio: null, tipo: "Otro", calificacion: null, comentario: null, quiereLlamada: null, accion: `Leer la conversación en Chatwoot. Último aviso del agente: ${(ultimo?.mensaje ?? "").slice(0, 300)}`, prioridad: "media", noContactarIA: false, preferencia: null };
}

export interface Listo {
  id: number;
  version: number;
  texto: string;
  thread_ts: string | null;
}

/** Lo que ya terminó y hay que publicar (o actualizar en el hilo). Bloquea 3 min para no duplicar. */
export async function listos(ahora = new Date()): Promise<Listo[]> {
  await asegurarTabla();
  const d = await db();
  const cand = filas<Fila>(
    await d.execute(sql`SELECT id, telefono, nombre, eventos, version, publicada, slack_ts, huella, datos FROM encuesta_reportes
      WHERE pendiente AND (bloqueado_hasta IS NULL OR bloqueado_hasta < now()) AND actualizado_el < now() - interval '1 minute'
      ORDER BY actualizado_el LIMIT 5`),
  ).filter((f) => listoParaPublicar(f.eventos, ahora));
  const out: Listo[] = [];
  for (const f of cand) {
    // Toma el reporte (si otra corrida ya lo tomó, sigue de largo).
    const tomado = filas(await d.execute(sql`UPDATE encuesta_reportes SET bloqueado_hasta = now() + interval '3 minutes' WHERE id = ${f.id} AND (bloqueado_hasta IS NULL OR bloqueado_hasta < now()) RETURNING id`));
    if (!tomado.length) continue;
    const conv = await conversacion(f.telefono);
    const x = (await extraer(f.eventos, conv.texto, conv.nombre ?? f.nombre)) ?? respaldo(f.eventos);
    const h = huella(x);
    let datos = f.datos ?? {};
    if (x.noContactarIA && conv.id && !datos.etiquetado) datos = { ...datos, etiquetado: await etiquetarNoIA(conv.id) };
    const nombre = conv.nombre ?? f.nombre;
    if (f.slack_ts && f.huella === h) {
      // Ya salió y no cambió nada que importe: no se repite en el hilo.
      await d.execute(sql`UPDATE encuesta_reportes SET pendiente = (version <> ${f.version}), publicada = ${f.version}, bloqueado_hasta = NULL, datos = ${JSON.stringify(datos)}::jsonb, nombre = COALESCE(nombre, ${nombre}) WHERE id = ${f.id}`);
      continue;
    }
    const texto = plantilla({ x, telefono: f.telefono, nombreChatwoot: nombre, responsables: responsables(f.eventos), actualizacion: !!f.slack_ts, iaApagada: !!datos.etiquetado });
    await d.execute(sql`UPDATE encuesta_reportes SET texto = ${texto}, huella = ${h}, datos = ${JSON.stringify(datos)}::jsonb, nombre = COALESCE(nombre, ${nombre}) WHERE id = ${f.id}`);
    out.push({ id: f.id, version: f.version, texto, thread_ts: f.slack_ts });
  }
  return out;
}

/** n8n ya lo publicó: guarda el ts del reporte original y lo marca al día (si no llegó nada nuevo mientras). */
export async function confirmar(p: { id: number; version: number; ts?: string | null }): Promise<boolean> {
  await asegurarTabla();
  const d = await db();
  const r = filas(
    await d.execute(sql`UPDATE encuesta_reportes SET slack_ts = COALESCE(slack_ts, ${p.ts ?? null}), publicada = ${p.version}, pendiente = (version <> ${p.version}),
      bloqueado_hasta = NULL, publicado_el = COALESCE(publicado_el, now()) WHERE id = ${p.id} RETURNING id`),
  );
  return r.length > 0;
}

/** Vista previa sin tocar la base ni Chatwoot (no etiqueta): para probar con un caso real. */
export async function previsualizar(p: { telefono: string; eventos: Evento[] }): Promise<string> {
  const tel = digitosTelefono(p.telefono);
  const conv = await conversacion(tel);
  const x = (await extraer(p.eventos, conv.texto, conv.nombre)) ?? respaldo(p.eventos);
  return plantilla({ x, telefono: tel, nombreChatwoot: conv.nombre, responsables: responsables(p.eventos), iaApagada: false });
}
