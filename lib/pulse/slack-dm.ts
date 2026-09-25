import "server-only";

// DM de Slack con el bot Command Center (SLACK_BOT_TOKEN) a partir del e-mail de la persona.
// users.lookupByEmail necesita el scope users:read.email; si no está, cae a users.list.
const cache = new Map<string, string | null>();

async function api<T>(metodo: string, body?: Record<string, unknown>, query?: Record<string, string>): Promise<T | null> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  const url = `https://slack.com/api/${metodo}${query ? `?${new URLSearchParams(query)}` : ""}`;
  try {
    const r = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json; charset=utf-8" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function slackIdPorEmail(email: string): Promise<string | null> {
  const clave = email.toLowerCase();
  if (cache.has(clave)) return cache.get(clave) ?? null;
  const r = await api<{ ok: boolean; user?: { id: string } }>("users.lookupByEmail", undefined, { email: clave });
  let id = r?.ok ? (r.user?.id ?? null) : null;
  if (!id) {
    let cursor = "";
    for (let i = 0; i < 10 && !id; i++) {
      const l = await api<{ ok: boolean; members?: { id: string; deleted?: boolean; profile?: { email?: string } }[]; response_metadata?: { next_cursor?: string } }>("users.list", undefined, { limit: "200", ...(cursor ? { cursor } : {}) });
      if (!l?.ok) break;
      id = l.members?.find((m) => !m.deleted && m.profile?.email?.toLowerCase() === clave)?.id ?? null;
      cursor = l.response_metadata?.next_cursor ?? "";
      if (!cursor) break;
    }
  }
  cache.set(clave, id);
  return id;
}

export async function dmSlack(email: string, texto: string): Promise<boolean> {
  const id = await slackIdPorEmail(email);
  if (!id) return false;
  const r = await api<{ ok: boolean }>("chat.postMessage", { channel: id, text: texto, unfurl_links: false });
  return Boolean(r?.ok);
}
