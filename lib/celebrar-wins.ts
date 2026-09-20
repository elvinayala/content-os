// Celebra los wins de clientes en los canales #clientes-wins de Level Up y AI
// Borinquen (cada workspace con su propio user token). Pensado para Vercel Cron
// (serverless): NO usa archivo de cursor. La idempotencia es por HILO: antes de
// celebrar, mira si ese hilo ya tiene una respuesta nuestra con cohete.

const MENSAJES = [
  "¡Vamos! 🚀🚀 Nos alegra un montón este win. ¡A seguir así! 🔥",
  "¡Eso es! 🚀 Felicidades, nos alegramos muchísimo. 🙌",
  "🚀🚀 ¡Qué gran win! Nos pone bien contentos. ¡Sigue así!",
  "¡Tremendo! 🚀 Nos alegramos mucho por este resultado. 👏",
  "¡A celebrar! 🚀🎉 Nos encanta ver esto. ¡Duro!",
  "🚀 ¡Excelente! Nos alegra muchísimo. ¡Pa'lante! 💪",
  "¡Wepa! 🚀🚀 Otro win pa'l equipo. Nos alegra un montón. 🙌",
];

// Workspaces con su token (env) y su canal de wins. Overridable por env.
const WORKSPACES = [
  {
    clave: "levelup",
    nombre: "Level Up",
    tokenEnv: "SLACK_LEVELUP_TOKEN",
    canal: process.env.SLACK_WINS_LEVELUP || "C0B4K58DUSD",
  },
  {
    clave: "borinquen",
    nombre: "AI Borinquen",
    tokenEnv: "SLACK_BORINQUEN_TOKEN",
    canal: process.env.SLACK_WINS_BORINQUEN || "C0BFLDQ8ME1",
  },
];

interface SlackMsg {
  ts: string;
  text?: string;
  user?: string;
  bot_id?: string;
  subtype?: string;
  thread_ts?: string;
  files?: unknown[];
}

async function slack(
  token: string,
  method: string,
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(8000),
  });
  return (await res.json()) as Record<string, unknown>;
}

// ¿Es un win a celebrar? Top-level (no respuesta), de persona (no bot), con señal:
// empieza con "Cliente", menciona "estratega", trae emoji de celebración, o es un
// post con imagen (screenshot de resultado, típico de un win).
function esWin(m: SlackMsg): boolean {
  if (m.subtype && m.subtype !== "") return false;
  if (m.bot_id) return false;
  if (m.thread_ts && m.thread_ts !== m.ts) return false;
  const t = (m.text || "").trim();
  const conImagen = Array.isArray(m.files) && m.files.length > 0;
  if (t.length < 12 && !conImagen) return false;
  return (
    /^\s*cliente\b/i.test(t) ||
    /\bestratega\b/i.test(t) ||
    /:tada:|:partying_face:|:tada_?|🎉|🥳|🎊/i.test(t) ||
    conImagen
  );
}

interface ResultadoWorkspace {
  nombre: string;
  revisados: number;
  celebrados: number;
  error?: string;
}

export interface ResultadoCelebracion {
  ok: boolean;
  celebrados: number;
  porWorkspace: ResultadoWorkspace[];
}

async function celebrarUno(
  token: string,
  canal: string,
  ventanaHoras: number,
): Promise<{ revisados: number; celebrados: number; error?: string }> {
  const auth = await slack(token, "auth.test", {});
  if (!auth.ok) return { revisados: 0, celebrados: 0, error: `auth:${auth.error}` };
  const yo = (auth.user_id as string) || "";

  const oldest = Math.floor(Date.now() / 1000 - ventanaHoras * 3600).toString();
  const hist = await slack(token, "conversations.history", {
    channel: canal,
    oldest,
    limit: 60,
  });
  if (!hist.ok) return { revisados: 0, celebrados: 0, error: `history:${hist.error}` };

  const wins = (hist.messages as SlackMsg[]).filter(esWin);
  let celebrados = 0;

  for (const win of wins) {
    const reps = await slack(token, "conversations.replies", {
      channel: canal,
      ts: win.ts,
      limit: 30,
    });
    const mensajes = (reps.ok ? (reps.messages as SlackMsg[]) : []) || [];
    const yaCelebrado = mensajes.some(
      (r) => r.ts !== win.ts && r.user === yo && /🚀/.test(r.text || ""),
    );
    if (yaCelebrado) continue;

    const msg = MENSAJES[Math.floor(Math.random() * MENSAJES.length)];
    const r = await slack(token, "chat.postMessage", {
      channel: canal,
      thread_ts: win.ts,
      text: msg,
    });
    if (r.ok) {
      celebrados++;
      await slack(token, "reactions.add", {
        channel: canal,
        timestamp: win.ts,
        name: "rocket",
      }).catch(() => ({}));
    }
  }

  return { revisados: wins.length, celebrados };
}

// Recorre los workspaces configurados (los que tengan token) y celebra. Si se pasa
// `claves`, corre solo esos (ej. ["levelup"] o ["borinquen"]).
export async function celebrarWinsNuevos(
  ventanaHoras = 6,
  claves?: string[],
): Promise<ResultadoCelebracion> {
  const porWorkspace: ResultadoWorkspace[] = [];
  const lista = claves?.length
    ? WORKSPACES.filter((w) => claves.includes(w.clave))
    : WORKSPACES;
  for (const ws of lista) {
    const token = process.env[ws.tokenEnv];
    if (!token) {
      porWorkspace.push({
        nombre: ws.nombre,
        revisados: 0,
        celebrados: 0,
        error: "sin-token",
      });
      continue;
    }
    try {
      const r = await celebrarUno(token, ws.canal, ventanaHoras);
      porWorkspace.push({ nombre: ws.nombre, ...r });
    } catch (e) {
      porWorkspace.push({
        nombre: ws.nombre,
        revisados: 0,
        celebrados: 0,
        error: e instanceof Error ? e.message : "error",
      });
    }
  }
  const celebrados = porWorkspace.reduce((a, w) => a + w.celebrados, 0);
  return { ok: true, celebrados, porWorkspace };
}
