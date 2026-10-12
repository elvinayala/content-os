import "server-only";

import crypto from "node:crypto";

import { eq, sql } from "drizzle-orm";

import { notificarCEO } from "../notificar-ceo";
import { usuarioSistema } from "../pulse/alta-typeform";
import { db } from "../pulse/db";
import { pulseActivity, pulseBoards, pulseColumns, pulseItems } from "../pulse/schema";
import { dmSlack } from "../pulse/slack-dm";
import type { Respuestas } from "../formularios/reglas";
import {
  esEventoOnboarding,
  evaluar,
  linkEncuesta,
  telefonoWhatsApp,
  textoAviso,
  textoWhatsApp,
  tocaEnviar,
} from "./encuesta-reglas";

// Encuesta de fin de onboarding (11/oct/2026). El cron mira en el Calendly de Level Up las llamadas de onboarding
// que acaban de terminar y le manda al cliente, por el WhatsApp de Level Up (vía n8n), el link de la encuesta.
// Cada envío se registra ANTES de mandarlo (llave única por invitado de Calendly) y nunca se reintenta solo:
// la lección del 25/sep (mensajes repetidos) está en la memoria n8n-envios-sin-repetir.

const CARILIN = process.env.ENCUESTA_ONBOARDING_ALERTAR || "carilin@levelupmediapr.net";
const modoReal = () => process.env.ENCUESTA_ONBOARDING_MODO === "real";

let lista = false;
async function d() {
  const x = await db();
  if (!lista) {
    await x.execute(sql`CREATE TABLE IF NOT EXISTS onboarding_encuestas (
      id serial PRIMARY KEY,
      ref text NOT NULL UNIQUE,
      invitee_uri text NOT NULL UNIQUE,
      evento_uri text,
      nombre text NOT NULL,
      email text,
      telefono text,
      host text,
      fin_at timestamptz NOT NULL,
      estado text NOT NULL DEFAULT 'enviando',
      enviado_at timestamptz,
      wa_id text,
      error text,
      respuesta jsonb,
      nivel text,
      nota int,
      respondida_at timestamptz,
      creada_el timestamptz NOT NULL DEFAULT now()
    )`);
    await x.execute(sql`SELECT pulse_papelera_proteger()`).catch(() => null);
    lista = true;
  }
  return x;
}

// ---------- Calendly ----------

interface Invitado {
  uri: string;
  name: string;
  email: string;
  status: string;
  text_reminder_number?: string | null;
  questions_and_answers?: { question: string; answer: string }[];
}
interface Evento {
  uri: string;
  name: string;
  start_time: string;
  end_time: string;
  event_memberships?: { user_name?: string }[];
}

async function calendly<T>(ruta: string): Promise<T> {
  const url = ruta.startsWith("http") ? ruta : `https://api.calendly.com${ruta}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.CALENDLY_TOKEN}` }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`Calendly ${r.status} ${ruta.slice(0, 70)}`);
  return (await r.json()) as T;
}

const telefonoDe = (i: Invitado) =>
  telefonoWhatsApp(i.text_reminder_number) ?? telefonoWhatsApp(i.questions_and_answers?.find((q) => /tel[eé]fono|whatsapp|celular|phone|n[uú]mero/i.test(q.question))?.answer);

// ---------- WhatsApp (n8n → Evolution) ----------

async function enviarWhatsApp(telefono: string, texto: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const base = process.env.N8N_URL?.replace(/\/$/, "");
  const secreto = process.env.PULSE_N8N_SECRET;
  if (!base || !secreto) return { ok: false, error: "sin N8N_URL/PULSE_N8N_SECRET" };
  try {
    const r = await fetch(`${base}/webhook/enviar-whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pulse-secret": secreto },
      body: JSON.stringify({ telefono, texto }),
      signal: AbortSignal.timeout(30_000),
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
    return r.ok && j.ok ? { ok: true, id: j.id } : { ok: false, error: j.error || `n8n ${r.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------- Cron: ¿terminó algún onboarding? ----------

export interface Pendiente {
  nombre: string;
  host: string;
  fin: string;
  telefono: string | null;
  resultado: string;
}

export async function revisarOnboardingsTerminados(opciones: { real?: boolean; ahora?: Date } = {}): Promise<{ modo: "real" | "simulacion"; revisados: number; envios: Pendiente[]; error?: string }> {
  const real = opciones.real ?? modoReal();
  const ahora = opciones.ahora ?? new Date();
  const salida: { modo: "real" | "simulacion"; revisados: number; envios: Pendiente[]; error?: string } = { modo: real ? "real" : "simulacion", revisados: 0, envios: [] };
  if (!process.env.CALENDLY_TOKEN) return { ...salida, error: "sin CALENDLY_TOKEN" };
  try {
    const yo = (await calendly<{ resource: { current_organization: string } }>("/users/me")).resource;
    const desde = new Date(ahora.getTime() - 24 * 3_600_000).toISOString();
    const hasta = ahora.toISOString();
    const eventos = (
      await calendly<{ collection: Evento[] }>(`/scheduled_events?organization=${encodeURIComponent(yo.current_organization)}&min_start_time=${encodeURIComponent(desde)}&max_start_time=${encodeURIComponent(hasta)}&status=active&count=100`)
    ).collection.filter((e) => esEventoOnboarding(e.name) && tocaEnviar(e.end_time, ahora).ok);
    salida.revisados = eventos.length;

    for (const ev of eventos) {
      const invitados = (await calendly<{ collection: Invitado[] }>(`${ev.uri.replace("https://api.calendly.com", "")}/invitees?count=20`)).collection.filter((i) => i.status === "active");
      for (const inv of invitados) {
        const item: Pendiente = { nombre: inv.name, host: ev.event_memberships?.[0]?.user_name ?? "", fin: ev.end_time, telefono: telefonoDe(inv), resultado: "" };
        // Si quien atiende marcó "no se presentó" en Calendly, no se le manda la encuesta.
        const noShow = await calendly<{ collection: unknown[] }>(`/invitee_no_shows?invitee=${encodeURIComponent(inv.uri)}`).then((r) => r.collection.length > 0).catch(() => false);
        if (noShow) { item.resultado = "no-show (Calendly)"; salida.envios.push(item); continue; }
        const x = await d();
        const [ya] = (await x.execute(sql`SELECT id FROM onboarding_encuestas WHERE invitee_uri = ${inv.uri}`)) as unknown as { id: number }[];
        if (ya) continue;
        if (!item.telefono) {
          item.resultado = "sin teléfono";
          if (real) await x.execute(sql`INSERT INTO onboarding_encuestas (ref, invitee_uri, evento_uri, nombre, email, host, fin_at, estado, error) VALUES (${crypto.randomBytes(4).toString("hex")}, ${inv.uri}, ${ev.uri}, ${inv.name}, ${inv.email}, ${item.host}, ${ev.end_time}, 'sin-telefono', 'el invitado no dejó teléfono') ON CONFLICT DO NOTHING`);
          salida.envios.push(item);
          continue;
        }
        const ref = crypto.randomBytes(4).toString("hex");
        const texto = textoWhatsApp({ nombre: inv.name, host: item.host, link: linkEncuesta(ref) });
        if (!real) { item.resultado = "simulación (no se manda)"; salida.envios.push(item); continue; }
        // 1) se registra (llave única), 2) se manda UNA vez, 3) se anota cómo salió. Nunca se reintenta solo.
        const [fila] = (await x.execute(sql`INSERT INTO onboarding_encuestas (ref, invitee_uri, evento_uri, nombre, email, telefono, host, fin_at, estado) VALUES (${ref}, ${inv.uri}, ${ev.uri}, ${inv.name}, ${inv.email.toLowerCase()}, ${item.telefono}, ${item.host}, ${ev.end_time}, 'enviando') ON CONFLICT DO NOTHING RETURNING id`)) as unknown as { id: number }[];
        if (!fila) continue;
        const r = await enviarWhatsApp(item.telefono, texto);
        await x.execute(r.ok
          ? sql`UPDATE onboarding_encuestas SET estado = 'enviada', enviado_at = now(), wa_id = ${r.id ?? null} WHERE id = ${fila.id}`
          : sql`UPDATE onboarding_encuestas SET estado = 'fallo', error = ${r.error ?? "?"} WHERE id = ${fila.id}`);
        item.resultado = r.ok ? "enviada" : `FALLO: ${r.error}`;
        if (!r.ok) await notificarCEO(`⚠️ No pude mandar la encuesta de onboarding a ${inv.name}: ${r.error}. No se reintenta sola; si quieres que salga, avísame.`).catch(() => null);
        salida.envios.push(item);
      }
    }
  } catch (e) {
    return { ...salida, error: e instanceof Error ? e.message : String(e) };
  }
  return salida;
}

// ---------- Cuando contestan ----------

const texto = (v: Respuestas[string]) => (typeof v === "string" ? v.trim() : "");

/** Acción del formulario `onboarding-experiencia`: guarda el resultado, deja nota en la ficha y avisa. */
export async function procesarRespuestaOnboarding(origen: string | null, respuestas: Respuestas): Promise<{ nivel: string; ref: string | null }> {
  const ev = evaluar(respuestas);
  const ref = /^ob-([a-f0-9]{8})$/.exec(origen ?? "")?.[1] ?? null;
  const x = await d();
  const [fila] = ref
    ? ((await x.execute(sql`UPDATE onboarding_encuestas SET estado = 'respondida', respuesta = ${JSON.stringify(respuestas)}::jsonb, nivel = ${ev.nivel}, nota = ${ev.nota}, respondida_at = now() WHERE ref = ${ref} RETURNING nombre, email, telefono, host`)) as unknown as { nombre: string; email: string | null; telefono: string | null; host: string | null }[])
    : [];

  const nombre = fila?.nombre ?? "Un cliente (link sin identificar)";
  const negocio = fila ? await anotarEnFicha(fila.email, fila.telefono, `Encuesta de onboarding (${ev.nivel === "verde" ? "🟢" : ev.nivel === "ambar" ? "🟡" : "🔴"}): ${ev.resumen}${ev.motivos.length ? ` — ${ev.motivos.join(" · ")}` : ""}${texto(respuestas.mejora) ? `\nMejora sugerida: ${texto(respuestas.mejora)}` : ""}`) : null;

  const aviso = textoAviso({ nombre, negocio, host: fila?.host, ev, mejora: texto(respuestas.mejora) });
  await notificarCEO(aviso).catch((e) => console.error("[encuesta-onboarding] aviso", e));
  if (ev.nivel !== "verde") await dmSlack(CARILIN, `${aviso}\n_(Encuesta de fin de onboarding de Level Up)_`).catch(() => false);
  return { nivel: ev.nivel, ref };
}

/** Comentario en la ficha de LEVEL UP MEDIA (mismo e-mail o teléfono). Devuelve la empresa. */
async function anotarEnFicha(email: string | null, telefono: string | null, comentario: string): Promise<string | null> {
  try {
    const x = await db();
    const [board] = await x.select().from(pulseBoards).where(eq(pulseBoards.slug, "level-up-media"));
    if (!board) return null;
    const cols = await x.select().from(pulseColumns).where(eq(pulseColumns.boardId, board.id));
    const cEmail = cols.find((c) => c.type === "email");
    const cTel = cols.find((c) => c.type === "phone");
    const cEmpresa = cols.find((c) => c.title.trim().toLowerCase() === "empresa");
    const dig = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
    const items = await x.select({ id: pulseItems.id, values: pulseItems.values }).from(pulseItems).where(eq(pulseItems.boardId, board.id));
    const it = items.find((i) => {
      const v = i.values as Record<string, unknown>;
      return (email && cEmail && String(v[cEmail.id] ?? "").toLowerCase() === email.toLowerCase()) || (telefono && cTel && dig(telefono).length >= 10 && dig(String(v[cTel.id] ?? "")) === dig(telefono));
    });
    if (!it) return null;
    const userId = await usuarioSistema("formulario");
    await x.insert(pulseActivity).values({ itemId: it.id, boardId: board.id, tipo: "comentario", after: { texto: comentario, encuestaOnboarding: true }, userId });
    return cEmpresa ? String((it.values as Record<string, unknown>)[cEmpresa.id] ?? "") || null : null;
  } catch (e) {
    console.error("[encuesta-onboarding] ficha", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function estadoEncuestas(dias = 14) {
  const x = await d();
  return (await x.execute(sql`SELECT nombre, host, estado, nivel, nota, fin_at, respondida_at FROM onboarding_encuestas WHERE creada_el > now() - (${dias} || ' days')::interval ORDER BY creada_el DESC`)) as unknown as Record<string, unknown>[];
}

