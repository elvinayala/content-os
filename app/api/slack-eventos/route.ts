import crypto from "crypto";

import { after, type NextRequest, NextResponse } from "next/server";

import { descargarDeSlack, responderDirector, type TurnoDirector } from "@/lib/director-creativo";
import {
  MARCADOR_BRIEF,
  pasarPedidoASlack,
  responderSofi,
  type MsgSofi,
} from "@/lib/sofi";

export const runtime = "nodejs";
export const maxDuration = 120; // el Director Creativo lee imágenes/PDF y piensa (~20-60 s)

// Slack two-way: el equipo de contenido le escribe a SOFI por DM (o la mencionan en un
// canal) y ella responde ahí mismo. Slack manda un evento acá; verificamos la firma,
// generamos la respuesta de Sofi y la posteamos con el bot token.
//
// Estudio UGC: en el canal SLACK_UGC_CHANNEL_ID Sofi además sigue los threads sin
// re-mención (intake multi-turno) y, cuando cierra un brief, postea el bloque
// "✅ BRIEF UGC LISTO" con reply_broadcast para que el worker /ugc-traffickers lo
// vea en conversations.history. Los briefs cerrados por DM se re-postean al canal.
//
// Config en la app de Slack (api.slack.com/apps):
//  - Event Subscriptions → Request URL: https://<dominio>/api/slack-eventos
//  - Subscribe to bot events: message.im (DMs), app_mention (menciones) y
//    message.channels (thread del canal UGC; si el canal es privado, message.groups)
//  - Scopes del bot: chat:write, im:history, app_mentions:read, channels:history
//    (groups:history si privado) y files:write (el worker sube los videos)
//  - Instalar la app y ponerla en el/los canal(es) que quieran usar.
//  - Env: SLACK_UGC_CHANNEL_ID (canal del estudio) y SLACK_BOT_USER_ID (auth.test).
//
// Director Creativo (22/sep): en SLACK_DIRECTOR_CHANNEL_ID el equipo sube flyers (imagen/PDF),
// guiones, hooks y CTAs; el bot responde en el hilo con el criterio de Elvin
// (lib/director-creativo.ts). Necesita además el scope files:read para abrir los adjuntos.

interface SlackEvent {
  type: string;
  subtype?: string;
  bot_id?: string;
  user?: string;
  text?: string;
  channel?: string;
  channel_type?: string;
  ts?: string;
  thread_ts?: string;
  files?: ArchivoSlack[];
}

interface ArchivoSlack {
  name?: string;
  mimetype?: string;
  size?: number;
  url_private?: string;
  url_private_download?: string;
}

function firmaValida(raw: string, req: NextRequest): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return false;
  const ts = req.headers.get("x-slack-request-timestamp");
  const sig = req.headers.get("x-slack-signature");
  if (!ts || !sig) return false;
  // Anti-replay: descartar timestamps de más de 5 min.
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 60 * 5) return false;
  const base = `v0:${ts}:${raw}`;
  const mine = "v0=" + crypto.createHmac("sha256", secret).update(base).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(mine), Buffer.from(sig));
  } catch {
    return false;
  }
}

// Nombre para mostrar del que escribe (para que Sofi sepa quién pide). No bloquea.
// Cache en módulo: el historial puede pedir el mismo nombre varias veces por request.
const nombresCache = new Map<string, string>();
async function nombreDeUsuario(userId: string): Promise<string> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || !userId) return "";
  const cacheado = nombresCache.get(userId);
  if (cacheado !== undefined) return cacheado;
  try {
    const res = await fetch(
      `https://slack.com/api/users.info?user=${encodeURIComponent(userId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(4000),
      },
    );
    const data = (await res.json()) as {
      ok?: boolean;
      user?: { real_name?: string; profile?: { display_name?: string } };
    };
    const nombre = (
      data.user?.profile?.display_name || data.user?.real_name || ""
    ).slice(0, 40);
    nombresCache.set(userId, nombre);
    return nombre;
  } catch {
    return "";
  }
}

// Historial del hilo → memoria de Sofi para el intake multi-turno. Si Slack falla,
// degrada al mensaje único (Sofi pierde memoria pero no se cae). Cada mensaje de
// persona lleva "Nombre (<@UID>): texto" para que Sofi pueda escribir pedido_por.
async function historialConversacion(
  channel: string,
  thread_ts: string | undefined,
  channel_type: string | undefined,
  actual: { user: string; texto: string; ts?: string },
): Promise<MsgSofi[]> {
  const token = process.env.SLACK_BOT_TOKEN;
  const botUser = process.env.SLACK_BOT_USER_ID;
  const nombreActual = await nombreDeUsuario(actual.user);
  const msgActual = `${nombreActual || "alguien"} (<@${actual.user}>): ${actual.texto}`;
  const fallback: MsgSofi[] = [{ role: "user", content: msgActual }];
  let url = "";
  if (thread_ts) {
    url = `https://slack.com/api/conversations.replies?channel=${encodeURIComponent(channel)}&ts=${encodeURIComponent(thread_ts)}&limit=30`;
  } else if (channel_type === "im") {
    url = `https://slack.com/api/conversations.history?channel=${encodeURIComponent(channel)}&limit=12`;
  } else {
    return fallback; // mensaje suelto de canal: sin historial previo
  }
  if (!token) return fallback;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      messages?: { user?: string; bot_id?: string; text?: string; ts?: string }[];
    };
    if (!data.ok || !data.messages?.length) return fallback;
    // replies viene viejo→nuevo; history viene nuevo→viejo.
    const orden = thread_ts ? data.messages : [...data.messages].reverse();
    const msgs: MsgSofi[] = [];
    for (const m of orden) {
      const texto = limpiar(m.text ?? "");
      if (!texto) continue;
      const esBot = Boolean(m.bot_id) || (botUser ? m.user === botUser : false);
      if (esBot) {
        msgs.push({ role: "assistant", content: texto });
      } else if (m.user) {
        const nombre = await nombreDeUsuario(m.user);
        msgs.push({
          role: "user",
          content: `${nombre || "alguien"} (<@${m.user}>): ${texto}`,
        });
      }
    }
    // Garantizar que el mensaje actual esté al final (puede faltar por carrera).
    const ultimo = orden[orden.length - 1];
    if (!actual.ts || ultimo?.ts !== actual.ts) {
      msgs.push({ role: "user", content: msgActual });
    }
    // La API exige empezar con user y alternar: recortar bots iniciales y fusionar
    // mensajes consecutivos del mismo rol.
    while (msgs.length && msgs[0].role === "assistant") msgs.shift();
    const fusionados: MsgSofi[] = [];
    for (const m of msgs) {
      const prev = fusionados[fusionados.length - 1];
      if (prev && prev.role === m.role) prev.content += `\n${m.content}`;
      else fusionados.push({ ...m });
    }
    const recorte = fusionados.slice(-12);
    while (recorte.length && recorte[0].role === "assistant") recorte.shift();
    return recorte.length ? recorte : fallback;
  } catch {
    return fallback;
  }
}

async function postearRespuesta(
  channel: string,
  text: string,
  thread_ts?: string,
  broadcast = false,
): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        thread_ts
          ? { channel, text, thread_ts, ...(broadcast ? { reply_broadcast: true } : {}) }
          : { channel, text },
      ),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // no romper si Slack falla
  }
}

// Quita la mención al bot (<@U...>) del texto de un app_mention.
function limpiar(texto: string): string {
  return texto.replace(/<@[^>]+>/g, "").trim();
}

// Director Creativo: arma el hilo completo (con adjuntos) y responde en él.
const CEO_SLACK = process.env.CEO_SLACK_ID || "U08U9777PUY";
const MAX_ADJUNTOS = 8;
async function atenderDirector(channel: string, raiz: string): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return;
  const r = await fetch(
    `https://slack.com/api/conversations.replies?channel=${encodeURIComponent(channel)}&ts=${encodeURIComponent(raiz)}&limit=50`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) },
  );
  const data = (await r.json()) as {
    ok?: boolean;
    messages?: { user?: string; bot_id?: string; text?: string; files?: ArchivoSlack[] }[];
  };
  const msgs = data.ok ? (data.messages ?? []) : [];
  const botUser = process.env.SLACK_BOT_USER_ID;

  // Los adjuntos más recientes primero hasta el tope; el resto solo se menciona.
  let cupo = MAX_ADJUNTOS;
  const turnos: TurnoDirector[] = [];
  for (const m of [...msgs].reverse()) {
    const esBot = Boolean(m.bot_id) || (botUser && m.user === botUser);
    if (esBot) {
      turnos.unshift({ rol: "director", texto: m.text ?? "" });
      continue;
    }
    const notas: string[] = [];
    const adjuntos = [];
    for (const f of m.files ?? []) {
      if (cupo <= 0) {
        notas.push(`[adjunto anterior no reenviado: ${f.name}]`);
        continue;
      }
      const a = await descargarDeSlack(f);
      if (a === "no-soportado") notas.push(`[adjunto que no puedes ver (${f.mimetype}): ${f.name}]`);
      else if (a === "muy-grande") notas.push(`[adjunto demasiado pesado para abrirlo: ${f.name}]`);
      else if (a === "error") notas.push(`[no se pudo abrir el adjunto: ${f.name}]`);
      else {
        adjuntos.push(a);
        cupo--;
      }
    }
    turnos.unshift({
      rol: "equipo",
      autor: m.user ? await nombreDeUsuario(m.user) : "",
      esCEO: m.user === CEO_SLACK,
      texto: [limpiar(m.text ?? ""), ...notas].filter(Boolean).join("\n"),
      adjuntos,
    });
  }
  const respuesta = await responderDirector(turnos);
  // Anuncios, saludos y conversación entre el equipo: el agente se queda callado.
  if (respuesta && !/^\W*NO_RESPONDER\W*$/.test(respuesta)) await postearRespuesta(channel, respuesta, raiz);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  let body: {
    type?: string;
    challenge?: string;
    event?: SlackEvent;
  };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }

  // 1) Handshake de verificación de URL (Slack lo manda al configurar el endpoint).
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // 2) Verificar firma para todo lo demás.
  if (!firmaValida(raw, req)) {
    return NextResponse.json({ error: "firma" }, { status: 401 });
  }

  // Ignorar reintentos de Slack (evita respuestas duplicadas si tardamos > 3s).
  if (req.headers.get("x-slack-retry-num")) {
    return NextResponse.json({ ok: true });
  }

  const ev = body.event;

  // Canal del Director Creativo: cada mensaje de persona (texto y/o archivos) se revisa en su
  // hilo. Solo `message` (llega por message.channels/groups); el app_mention se ignora aquí
  // para no responder dos veces.
  const canalDirector = process.env.SLACK_DIRECTOR_CHANNEL_ID;
  if (canalDirector && ev?.channel === canalDirector) {
    const humano = !ev.bot_id && ev.user && (!ev.subtype || ev.subtype === "file_share");
    const conContenido = (ev.text ?? "").trim().length >= 4 || (ev.files?.length ?? 0) > 0;
    if (ev.type === "message" && humano && conContenido) {
      const channel = ev.channel;
      const raiz = ev.thread_ts ?? ev.ts ?? "";
      after(async () => {
        try {
          await atenderDirector(channel, raiz);
        } catch (e) {
          console.error("[director] fallo", e instanceof Error ? e.message : e);
          await postearRespuesta(channel, "Se me trabó la revisión. Vuelve a mandarla en un momento.", raiz);
        }
      });
    }
    return NextResponse.json({ ok: true });
  }

  // Solo mensajes de personas: ignorar mensajes de bots (incluido el nuestro) y ediciones.
  const esMensaje = ev?.type === "message" || ev?.type === "app_mention";
  if (
    !ev ||
    !esMensaje ||
    ev.bot_id ||
    (ev.subtype && ev.subtype !== "") ||
    !ev.channel ||
    !ev.user
  ) {
    return NextResponse.json({ ok: true });
  }

  const canalUgc = process.env.SLACK_UGC_CHANNEL_ID;
  const esCanalUgc = Boolean(canalUgc && ev.channel === canalUgc);

  // Mensajes de canal (message.channels/groups) solo del canal UGC: ahí Sofi sigue
  // los threads sin re-mención. Cualquier otro canal se ignora (las menciones
  // llegan aparte como app_mention y se atienden como siempre).
  if (ev.type === "message" && ev.channel_type !== "im" && !esCanalUgc) {
    return NextResponse.json({ ok: true });
  }
  // Dedup: una mención en el canal UGC dispara app_mention Y message.channels;
  // atendemos solo el app_mention para no responder dos veces.
  const botUser = process.env.SLACK_BOT_USER_ID;
  if (
    ev.type === "message" &&
    esCanalUgc &&
    botUser &&
    (ev.text ?? "").includes(`<@${botUser}>`)
  ) {
    return NextResponse.json({ ok: true });
  }

  const texto = limpiar(ev.text ?? "");
  if (!texto) return NextResponse.json({ ok: true });

  // Slack exige un 200 en < 3s o reintenta (y termina desactivando la suscripción).
  // Generar la respuesta de Sofi tarda varios segundos, así que le contestamos a
  // Slack YA y procesamos en segundo plano con after() (sigue vivo tras el response).
  const channel = ev.channel;
  const user = ev.user;
  const thread_ts = ev.thread_ts;
  const ts = ev.ts;
  const channel_type = ev.channel_type;
  after(async () => {
    try {
      const historial = await historialConversacion(channel, thread_ts, channel_type, {
        user,
        texto,
        ts,
      });
      const respuesta = await responderSofi(historial);
      const esBrief = respuesta.includes(MARCADOR_BRIEF);

      if (esCanalUgc) {
        // En el canal UGC siempre en thread (anclado al primer mensaje); el brief
        // se broadcastea al nivel canal — es la cola que escanea el worker.
        await postearRespuesta(channel, respuesta, thread_ts ?? ts, esBrief);
        return;
      }

      await postearRespuesta(channel, respuesta, thread_ts);

      if (esBrief && canalUgc) {
        // Brief cerrado por DM/mención: re-postearlo top-level al canal UGC para
        // que entre a la cola, forzando origen: dm (la entrega vuelve por DM).
        const bloque = respuesta
          .slice(respuesta.indexOf(MARCADOR_BRIEF))
          .replace(/^origen:.*$/m, "")
          .trimEnd();
        await postearRespuesta(canalUgc, `${bloque}\norigen: dm`);
        return;
      }

      // Si es un pedido real (no-UGC), lo dejamos también en la bandeja del equipo.
      if (texto.length >= 15) {
        const usuario = await nombreDeUsuario(user);
        await pasarPedidoASlack(usuario || "equipo (Slack)", texto);
      }
    } catch {
      await postearRespuesta(
        channel,
        "Se me trabó la respuesta, probá de nuevo en un toque.",
        thread_ts,
      );
    }
  });

  return NextResponse.json({ ok: true });
}
