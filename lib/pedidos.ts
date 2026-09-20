// Cola de pedidos de contenido de Elvin (botón "Pedir contenido" de la bandeja).
// La cola VIVE en Slack (DM bot↔Elvin): este reader la lee en vivo con el bot
// token, así el portal muestra qué se pidió y su estatus sin base de datos.
// Marcador de atendido = RESPUESTA EN EL HILO con "✅ Listo" (el bot no tiene
// scope reactions:write, así que no se usa la reacción):
//  - en-cola → sin respuesta "✅ Listo" en el hilo
//  - listo   → hay respuesta "✅ Listo" (se muestra el resumen)

const DM_PEDIDOS = process.env.SLACK_PEDIDOS_DM ?? "D0BGHLQVABA";

export interface PedidoContenido {
  ts: string;
  fecha: string; // ISO
  texto: string; // lo que pidió Elvin (sin encabezado ni pie)
  estado: "en-cola" | "listo";
  resultado?: string; // respuesta del worker en el hilo ("✅ Listo — N piezas…")
}

export interface PedidosSnapshot {
  ok: boolean;
  pedidos: PedidoContenido[];
}

interface SlackMsg {
  ts: string;
  text?: string;
  user?: string;
  bot_id?: string;
  reactions?: { name: string }[];
  reply_count?: number;
}

async function slackGet(
  token: string,
  method: string,
  qs: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`https://slack.com/api/${method}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8000),
  });
  return (await res.json()) as Record<string, unknown>;
}

function limpiarTexto(t: string): string {
  return t
    .replace(/:rotating_light:\s*\*PEDIDO DE CONTENIDO[^*]*\*\s*/i, "")
    .replace(/_El worker lo produce[\s\S]*$/i, "")
    .trim();
}

export async function leerPedidos(dias = 14): Promise<PedidosSnapshot> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, pedidos: [] };
  try {
    const oldest = Math.floor(Date.now() / 1000 - dias * 86400).toString();
    const hist = await slackGet(
      token,
      "conversations.history",
      `channel=${DM_PEDIDOS}&oldest=${oldest}&limit=100`,
    );
    if (!hist.ok) return { ok: false, pedidos: [] };

    const msgs = (hist.messages as SlackMsg[]).filter((m) =>
      /PEDIDO DE CONTENIDO/i.test(m.text || ""),
    );

    const pedidos: PedidoContenido[] = [];
    for (const m of msgs) {
      // Atendido = respuesta en el hilo que empiece con "✅" o diga "Listo".
      let resultado: string | undefined;
      if ((m.reply_count ?? 0) > 0) {
        const reps = await slackGet(
          token,
          "conversations.replies",
          `channel=${DM_PEDIDOS}&ts=${m.ts}&limit=10`,
        );
        if (reps.ok) {
          const rep = (reps.messages as SlackMsg[]).find(
            (r) => r.ts !== m.ts && /^✅|listo/i.test((r.text || "").trim()),
          );
          resultado = rep?.text?.slice(0, 300);
        }
      }
      pedidos.push({
        ts: m.ts,
        fecha: new Date(parseFloat(m.ts) * 1000).toISOString(),
        texto: limpiarTexto(m.text || ""),
        estado: resultado ? "listo" : "en-cola",
        resultado,
      });
    }
    // más nuevos primero
    pedidos.sort((a, b) => b.ts.localeCompare(a.ts));
    return { ok: true, pedidos };
  } catch {
    return { ok: false, pedidos: [] };
  }
}
