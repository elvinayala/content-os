import "server-only";

import type { OpsUnidad, SituacionCritica, WinCliente } from "@/lib/types";

// Slack de Level Up en vivo (workspace levelupmediaespacio) vía la Web API con un
// token en .env.local (SLACK_LEVELUP_TOKEN). Reemplaza el snapshot ops-levelup.json
// del brief para que el Pulso de clientes sea en tiempo real. Sin token →
// conectado=false y la UI cae al snapshot/mock. Nunca tira.
//
// Canales (de data/fuentes.json):
//   #clientes-wins (C0B4K58DUSD) → wins de clientes (ventana 7 días)
//   #office-6-problemas-onboarding-clientes (C09ERUWPLJ2) → críticos
//   #office-5-fullfilment-csm (C08T8BWTH1P) → estado real de clientes (críticos/notas)

const CANALES = {
  wins: { id: "C0B4K58DUSD", nombre: "#clientes-wins" },
  criticos: { id: "C09ERUWPLJ2", nombre: "#office-6-problemas-onboarding-clientes" },
  csm: { id: "C08T8BWTH1P", nombre: "#office-5-fullfilment-csm" },
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
    next: { revalidate: 180 }, // pulso casi en vivo (3 min)
    signal: AbortSignal.timeout(5000),
  });
  const j = (await res.json()) as { ok: boolean; messages?: SlackMsg[] };
  if (!j.ok) return [];
  return (j.messages ?? []).filter(
    (m) => m.type === "message" && !m.subtype && (m.text ?? "").trim().length > 0,
  );
}

function tsToIso(ts?: string): string {
  return new Date(Number(ts ?? 0) * 1000).toISOString();
}

function limpiar(t: string): string {
  return t
    .replace(/<@[^>]+>/g, "")
    .replace(/<[^|>]+\|([^>]+)>/g, "$1")
    .replace(/<([^>]+)>/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/:[a-z_+-]+:/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface SlackLevelUp {
  conectado: boolean;
  ops: OpsUnidad | null;
  error?: string;
}

export async function leerSlackLevelUp(): Promise<SlackLevelUp> {
  const token = process.env.SLACK_LEVELUP_TOKEN;
  if (!token) return { conectado: false, ops: null };

  const ahora = Math.floor(Date.now() / 1000);
  try {
    const [msgWins, msgCrit, msgCsm] = await Promise.all([
      history(token, CANALES.wins.id, ahora - 7 * DIA),
      history(token, CANALES.criticos.id, ahora - 4 * DIA),
      history(token, CANALES.csm.id, ahora - 4 * DIA),
    ]);

    // --- WINS: "Cliente X - estratega Y 🎉" en los últimos 7 días ---
    const wins: WinCliente[] = [];
    for (const m of msgWins) {
      const t = limpiar(m.text ?? "");
      if (!/client[ae]/i.test(t)) continue; // "Cliente/Clienta ..."
      const mCli = t.match(/client[ae]:?\s*(.+?)(?:\s*[-,]\s*estratega|\s*$)/i);
      const cliente = mCli ? mCli[1].trim() : t.slice(0, 60);
      if (!cliente || cliente.length < 2) continue;
      const mEst = t.match(/estratega:?\s*(.+?)\s*$/i);
      wins.push({
        id: `win-${m.ts}`,
        cliente: cliente.slice(0, 60),
        estratega: mEst ? mEst[1].trim() : undefined,
        resumen: t.slice(0, 200),
        canal: CANALES.wins.nombre,
        canalId: CANALES.wins.id,
        ts: tsToIso(m.ts),
      });
    }

    // --- CRÍTICOS: mensajes de #problemas + #csm (últimos 4 días) ---
    const criticos: SituacionCritica[] = [];
    for (const [msgs, canal] of [
      [msgCrit, CANALES.criticos] as const,
      [msgCsm, CANALES.csm] as const,
    ]) {
      for (const m of msgs) {
        const t = limpiar(m.text ?? "");
        if (t.length < 25) continue;
        const cliente =
          t.match(/(?:cliente|empresa|negocio):?\s*(.+?)(?:\s+tel|\s+motivo|\s*[.,]|$)/i)?.[1]?.trim() ??
          t.split(" ").slice(0, 4).join(" ");
        // Severidad alta si hay señales de churn/cancelación/escalada.
        const alta = /cancel|se va|fin de contrato|no renov|molest|inconform|0\/10|dej[ae] las campa|reembolso|queja/i.test(t);
        criticos.push({
          id: `crit-${m.ts}`,
          cliente: cliente.slice(0, 60),
          resumen: t.slice(0, 240),
          severidad: alta ? "alta" : "media",
          canal: canal.nombre,
          canalId: canal.id,
          ts: tsToIso(m.ts),
        });
      }
    }
    criticos.sort((a, b) => b.ts.localeCompare(a.ts));

    const ops: OpsUnidad = {
      unidad: "level-up",
      actualizadoEl: new Date().toISOString(),
      ventanaHoras: 4 * 24,
      ventanaWinsDias: 7,
      wins,
      criticos: criticos.slice(0, 10),
      notas: [],
    };

    return { conectado: true, ops };
  } catch (e) {
    return {
      conectado: false,
      ops: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
