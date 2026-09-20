import "server-only";

import type {
  OnboardingNuevo,
  OpsUnidad,
  SituacionCritica,
} from "@/lib/types";

// Slack de AI Borinquen en vivo (workspace propio, aiborinquen.slack.com) vía
// la Web API con un token en .env.local — NO usa el conector MCP de Level Up,
// así que ninguno de los dos se pisa. Sin token → conectado=false y cae al mock.
//
// Canales (workspace T09LARF90H3):
//   office-2-onboarding (priv) → resúmenes de clientes nuevos (Ana + equipo)
//   office-5-csm        (priv) → clientes con temas / llamadas a hacer (críticos)

const CANALES = {
  onboarding: { id: "C09NRGFTSAF", nombre: "#office-2-onboarding" },
  csm: { id: "C0AE1FZ2E1J", nombre: "#office-5-csm" },
};

const DIA = 86_400;

interface SlackMsg {
  type?: string;
  subtype?: string;
  text?: string;
  user?: string;
  ts?: string;
}

async function history(
  token: string,
  channel: string,
  oldest: number,
  limit = 40,
): Promise<SlackMsg[]> {
  const url = `https://slack.com/api/conversations.history?channel=${channel}&oldest=${oldest}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(5000),
  });
  const j = (await res.json()) as { ok: boolean; messages?: SlackMsg[] };
  if (!j.ok) return [];
  return (j.messages ?? []).filter(
    (m) => m.type === "message" && !m.subtype && (m.text ?? "").trim().length > 0,
  );
}

// Cache de nombres de usuario (por request no importa; módulo lo persiste).
const nombreCache = new Map<string, string>();
async function nombreUsuario(token: string, id?: string): Promise<string | undefined> {
  if (!id) return undefined;
  if (nombreCache.has(id)) return nombreCache.get(id);
  try {
    const res = await fetch(`https://slack.com/api/users.info?user=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
    });
    const j = (await res.json()) as {
      ok: boolean;
      user?: { real_name?: string; name?: string };
    };
    const nombre = j.ok ? j.user?.real_name ?? j.user?.name : undefined;
    if (nombre) nombreCache.set(id, nombre);
    return nombre;
  } catch {
    return undefined;
  }
}

function tsToIso(ts?: string): string {
  const seg = Number(ts ?? 0);
  return new Date(seg * 1000).toISOString();
}

function limpiar(t: string): string {
  // Saca menciones <@U...>, links <url|txt> → txt, y colapsa espacios.
  return t
    .replace(/<@[^>]+>/g, "")
    .replace(/<[^|>]+\|([^>]+)>/g, "$1")
    .replace(/<([^>]+)>/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function primerCampo(texto: string, etiqueta: RegExp): string | undefined {
  const m = texto.match(etiqueta);
  return m ? m[1].trim() : undefined;
}

function primerMonto(texto: string): number {
  const m = texto.match(/\$\s?([\d.,]+)/);
  if (!m) return 0;
  const n = Number(m[1].replace(/\./g, "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export interface SlackBorinquen {
  conectado: boolean;
  ops: OpsUnidad | null;
  onboardings: OnboardingNuevo[];
  error?: string;
}

export async function leerSlackBorinquen(): Promise<SlackBorinquen> {
  const token = process.env.SLACK_BORINQUEN_TOKEN;
  if (!token) return { conectado: false, ops: null, onboardings: [] };

  const ahora = Math.floor(Date.now() / 1000);
  try {
    const [msgsOnb, msgsCsm] = await Promise.all([
      history(token, CANALES.onboarding.id, ahora - 30 * DIA),
      history(token, CANALES.csm.id, ahora - 14 * DIA),
    ]);

    // --- Onboardings: mensajes que traen "Cliente" + "Negocio" ---
    const onboardings: OnboardingNuevo[] = [];
    for (const m of msgsOnb) {
      const raw = m.text ?? "";
      if (!/cliente/i.test(raw) || !/negocio/i.test(raw)) continue;
      const t = limpiar(raw);
      // Exige la etiqueta "Cliente" como palabra (evita "21 clientes en su base")
      // y corta en "Negocio". Validamos que sea un nombre corto, no un párrafo.
      const cliente = primerCampo(t, /\bcliente\b:?\s*(.{2,45}?)\s+negocio\b/i);
      if (!cliente || cliente.split(" ").length > 6 || /[.:]/.test(cliente))
        continue;
      const negocio = primerCampo(
        t,
        /\bnegocio\b:?\s*(.{2,55}?)(?:\s+servicio|\s+pago|\s+tipo|\s+se dedica|\s+se llama|$)/i,
      );
      const dueno = await nombreUsuario(token, m.user);
      onboardings.push({
        id: `onb-borinquen-${m.ts}`,
        cliente,
        negocio,
        unidad: "ai-borinquen",
        valorMensual: primerMonto(t),
        dueno: dueno ?? "Ana",
        acuerdo: primerCampo(t, /servicio contratado:?\s*(.+?)(?:\s+pago|$)/i),
        resumen: t.slice(0, 500),
        ganadoEl: tsToIso(m.ts).slice(0, 10),
      });
    }

    // --- Críticos: mensajes del canal CSM ---
    const criticos: SituacionCritica[] = [];
    for (const m of msgsCsm) {
      const t = limpiar(m.text ?? "");
      if (t.length < 20) continue;
      const cliente =
        primerCampo(t, /empresa:?\s*(.+?)(?:\s+tel|\s+motivo|$)/i) ??
        primerCampo(t, /negocio:?\s*(.+?)(?:\s+tel|\s+motivo|$)/i) ??
        t.split(" ").slice(0, 4).join(" ");
      const estratega = await nombreUsuario(token, m.user);
      criticos.push({
        id: `crit-borinquen-${m.ts}`,
        cliente: cliente.slice(0, 60),
        estratega,
        resumen: t.slice(0, 240),
        severidad: "media",
        canal: CANALES.csm.nombre,
        canalId: CANALES.csm.id,
        ts: tsToIso(m.ts),
      });
    }

    const ops: OpsUnidad = {
      unidad: "ai-borinquen",
      actualizadoEl: new Date().toISOString(),
      ventanaHoras: 14 * 24,
      ventanaWinsDias: 7,
      wins: [], // Borinquen aún no tiene canal de wins dedicado
      criticos: criticos.slice(0, 8),
      notas:
        onboardings.length > 0
          ? [`${onboardings.length} onboardings nuevos en los últimos 30 días`]
          : [],
    };

    return { conectado: true, ops, onboardings };
  } catch (e) {
    return {
      conectado: false,
      ops: null,
      onboardings: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
