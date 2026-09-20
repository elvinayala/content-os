import { notificarCEO } from "@/lib/notificar-ceo";
import Anthropic from "@anthropic-ai/sdk";

import { leerVentasEAlive } from "@/lib/ea-market";
import { leerEntregas } from "@/lib/entregas";
import { leerGranola } from "@/lib/granola";
import { leerPipeline } from "@/lib/pipedrive";
import { leerSlackBorinquen } from "@/lib/slack-borinquen";
import { leerSlackLevelUp } from "@/lib/slack-levelup";
import { leerZoomIntel } from "@/lib/zoom";

// Board meeting diario de 5 AM — versión 100% NUBE (Vercel Cron). No depende de la
// compu de Elvin: junta las fuentes en vivo (Slack LU/AIB, Pipedrive, Zoom, EA
// Market) + snapshots bundleados (entregas, granola), sintetiza con la Anthropic
// API (rol: deep orchestrator) y publica el plan del día en el DM de Elvin.
//
// Nota: en serverless no se puede escribir data/*.json (fs read-only). El acta del
// dashboard la refrescan las tareas locales (/brief-ceo, /board-meeting) cuando la
// app está abierta; el PLAN de las 5 AM llega SIEMPRE por Slack.

const MODEL = "claude-sonnet-5";
const CEO_SLACK_ID = process.env.CEO_SLACK_ID ?? "U08U9777PUY";

// Serializa un resultado de reader a texto acotado (el modelo no necesita todo).
function resumen(nombre: string, r: PromiseSettledResult<unknown>): string {
  if (r.status === "rejected") return `${nombre}: FUENTE CAÍDA (${String(r.reason).slice(0, 120)})`;
  try {
    return `${nombre}: ${JSON.stringify(r.value).slice(0, 4500)}`;
  } catch {
    return `${nombre}: (no serializable)`;
  }
}

async function postearDM(texto: string): Promise<boolean> {
  // Telegram (si está configurado) + espejo en Slack. Ver lib/notificar-ceo.ts.
  const r = await notificarCEO(texto);
  return r.telegram || r.slack;
}

export interface ResultadoBoard {
  ok: boolean;
  publicado: boolean;
  fuentesCaidas: string[];
  error?: string;
}

export async function correrBoardMeeting(): Promise<ResultadoBoard> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, publicado: false, fuentesCaidas: [], error: "sin-api-key" };
  }

  // 1) Juntar todas las fuentes en paralelo — resiliente: lo caído se reporta.
  const [slackLU, slackAIB, pipeline, zoom, ventas, entregas, granola] =
    await Promise.allSettled([
      leerSlackLevelUp(),
      leerSlackBorinquen(),
      leerPipeline(),
      leerZoomIntel("7d"),
      leerVentasEAlive(),
      leerEntregas(),
      leerGranola(),
    ]);

  const nombres = [
    "SLACK LEVEL UP (wins/críticos/csm)",
    "SLACK AI BORINQUEN (producto/ventas)",
    "PIPEDRIVE (pipeline 2 agencias)",
    "ZOOM INTELLIGENCE (demos)",
    "EA MARKET (cash collected)",
    "ENTREGAS (bandeja de contenido)",
    "GRANOLA (reuniones/pendientes)",
  ];
  const resultados = [slackLU, slackAIB, pipeline, zoom, ventas, entregas, granola];
  const fuentesCaidas = nombres.filter((_, i) => resultados[i].status === "rejected");
  const contexto = resultados.map((r, i) => resumen(nombres[i], r)).join("\n\n");

  const hoy = new Date().toLocaleDateString("es-PR", {
    timeZone: "America/Puerto_Rico",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // 2) Sintetizar con el modelo (deep orchestrator).
  const system = `Eres el DEEP ORCHESTRATOR del CEO Command Center de Elvin Ayala (Level Up Media = agencia Meta Ads; AI Borinquen = agencia de IA, producto AutoFlow; Shadow Operator = marca personal). Cada día a las 5 AM presides el board meeting de agentes: CEO agent (qué cambió en la noche), Data analyst (métricas), Sales rep (pipeline y demos), Contenido & mercado (bandeja/tendencias). Tu salida es EL PLAN DEL DÍA para Elvin, listo para leer en Slack en 60 segundos.

Reglas:
- Español de Puerto Rico con TUTEO (tú/tienes). NUNCA voseo (vos/tenés).
- Elvin DECIDE, no ejecuta: si algo es operativo, la acción es "delegar a" (Carilin=operaciones, Aure=asistente+comercial, Yaileen=tesorería AIB, María=tesorería LUM, Juan Diego=tráfico, María del Carmen=creativos, Heidy=CM, equipo de Sofi=contenido).
- Usa SOLO los datos del contexto; si una fuente está caída, dilo en una línea. No inventes números.
- Formato Slack (sin markdown de #): asteriscos para negritas, bullets con •. Breve y escaneable.

Estructura EXACTA del mensaje:
:sunrise: *Board meeting 5 AM — ${hoy}*
*Titular:* <2 frases: lo más importante de la noche + el foco del día>

*🎯 Acciones de hoy (decide/delega):*
• <máx 3, cada una con el porqué en pocas palabras>

*📊 Lo que movió la aguja:* <2-3 bullets con números y deltas>

*✍️ Necesita contenido:* <qué mandar a producir al equipo de Sofi, o "nada nuevo">
*🔎 Necesita investigación:* <qué encargar, o "nada">
*⏸️ Puede esperar:* <1-2 cosas pospuestas con cuándo revisarlas>

<si hay fuentes caídas: una línea "⚠️ Fuentes caídas: ...">`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1600,
    // sonnet-5: sin thinking (consumiría los tokens antes del texto) + effort medium.
    thinking: { type: "disabled" },
    output_config: { effort: "medium" },
    system,
    messages: [
      {
        role: "user",
        content: `Datos en vivo del negocio (ahora, hora PR):\n\n${contexto}`,
      },
    ],
  });
  const plan =
    resp.content.find((b) => b.type === "text")?.text ??
    "No pude armar el plan de hoy.";

  // 3) Publicar en el DM de Elvin.
  const publicado = await postearDM(plan);
  return { ok: true, publicado, fuentesCaidas };
}
