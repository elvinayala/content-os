import { type NextRequest, NextResponse } from "next/server";

import { COOKIE_SESION, sesionValida } from "@/lib/auth";

export const runtime = "nodejs";

// Elvin pide más opciones o deja feedback sobre una pieza desde la bandeja de
// Entregas. El pedido cae en un canal de Slack (SLACK_CONTENIDO_WEBHOOK) que el
// agente de contenido lee: genera más/mejores guiones y aprende la preferencia
// (la guarda en vault/estilo/<marca>.md). Sin ese webhook → 503 con instrucción.

const MARCA_NOMBRE: Record<string, string> = {
  "shadow-operator": "Shadow Operator",
  "ai-borinquen": "AI Borinquen",
  "level-up": "Level Up Media",
};

interface Body {
  accion?: "mas" | "feedback" | "pedido";
  marca?: string;
  tipo?: string;
  titulo?: string;
  contenido?: string;
  texto?: string; // la sugerencia / nota de Elvin
}

// Pedido libre (urgente): se postea al DM bot↔Elvin con el bot token. El worker
// /atender-pedidos (tarea cada 30 min) lee ese DM, produce lo pedido, lo deja en
// la bandeja y marca el mensaje con ✅ para no repetirlo.
const CEO_SLACK_ID = process.env.CEO_SLACK_ID ?? "U08U9777PUY";
async function postearPedidoDM(texto: string): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: CEO_SLACK_ID, text: texto }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_SESION)?.value;
  if (!(await sesionValida(cookie))) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }

  let b: Body;
  try {
    b = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "body" }, { status: 400 });
  }

  // Pedido libre de Elvin (botón "Pedir contenido" en la bandeja).
  if (b.accion === "pedido") {
    const desc = (b.texto ?? "").trim().slice(0, 1500);
    if (!desc) {
      return NextResponse.json({ ok: false, error: "sin-texto" }, { status: 400 });
    }
    const ok = await postearPedidoDM(
      [
        ":rotating_light: *PEDIDO DE CONTENIDO (Elvin, desde la bandeja)*",
        desc,
        "\n_El worker lo produce en la próxima corrida (~30 min) y lo deja en Entregas. Cuando esté, este mensaje queda marcado con ✅._",
      ].join("\n"),
    );
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "No se pudo encolar el pedido (Slack)." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  // Canal propio de pedidos si existe; si no, cae al webhook de aprobados (ya
  // configurado) para que el botón funcione sin setup extra. Se etiqueta claro.
  const webhook =
    process.env.SLACK_CONTENIDO_WEBHOOK ?? process.env.SLACK_APROBADOS_WEBHOOK;
  const canalPropio = Boolean(process.env.SLACK_CONTENIDO_WEBHOOK);
  if (!webhook) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Falta SLACK_CONTENIDO_WEBHOOK (o SLACK_APROBADOS_WEBHOOK). Creá un Incoming Webhook y agregá la URL al entorno.",
      },
      { status: 503 },
    );
  }

  const marca = MARCA_NOMBRE[b.marca ?? ""] ?? b.marca ?? "—";

  let text: string;
  if (b.accion === "mas") {
    text = [
      `:heavy_plus_sign: *PEDIDO: más opciones de guiones* — ${marca}${b.tipo ? ` · ${b.tipo}` : ""}`,
      "*Para:* Sofi (jefa de contenido) → repartir a Cami (ideas) y Lauti (guiones).",
      b.texto ? `Nota de Elvin: ${b.texto}` : "Elvin quiere más y mejores opciones para elegir.",
      "\n_Sofi: generá 3-5 opciones nuevas para esta marca aplicando el estilo actual + los aprendizajes de Elvin/Heidy, y dejalas en la bandeja de Entregas._",
    ].join("\n");
  } else {
    text = [
      `:pencil2: *FEEDBACK de Elvin — mejorá el guión* — ${marca}${b.tipo ? ` · ${b.tipo}` : ""}`,
      "*Para:* Sofi (jefa de contenido).",
      b.titulo ? `Sobre: *${b.titulo}*` : "",
      b.texto ? `\n*Cómo lo quiere:* ${b.texto}` : "",
      b.contenido ? `\n_Guión original:_\n${b.contenido.slice(0, 800)}` : "",
      "\n_Sofi: (1) guardá esta preferencia en vault/estilo/<marca>.md para que TODO el equipo la aplique SIEMPRE (aprendizaje), (2) pasásela a Lauti/Cami y regenerá esta pieza (y similares) con el ajuste. Dejalas en Entregas._",
    ]
      .filter(Boolean)
      .join("\n");
  }

  // Si cae al canal de aprobados (fallback), avisar que NO es para publicar.
  const textoFinal = canalPropio
    ? text
    : `:wrench: _(pedido interno de contenido — NO publicar)_\n${text}`;

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textoFinal }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `slack ${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "fetch" },
      { status: 502 },
    );
  }
}
