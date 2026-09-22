/** Publicación por Zernio (Instagram + Facebook). Detecta las cuentas conectadas en cada corrida. */
import { config } from "../config.js";

const BASE = "https://zernio.com/api/v1";
const H = () => ({ Authorization: `Bearer ${process.env.ZERNIO_API_KEY ?? ""}`, "Content-Type": "application/json" });

export interface CuentaSocial { accountId: string; platform: "instagram" | "facebook"; username?: string }

export async function cuentasSociales(): Promise<CuentaSocial[]> {
  const r = await fetch(`${BASE}/accounts/health`, { headers: H() });
  if (!r.ok) return [];
  const j = (await r.json()) as { accounts?: { accountId: string; platform: string; username?: string; canPost?: boolean }[] };
  return (j.accounts ?? []).filter((a) => (a.platform === "instagram" || a.platform === "facebook") && a.canPost !== false).map((a) => ({ accountId: a.accountId, platform: a.platform as "instagram" | "facebook", username: a.username }));
}

export interface PostZernio {
  content: string;
  mediaItems: { url: string; type: "image" | "video" }[];
  /** "reel" fuerza Reels en IG y Facebook Reels. */
  formato: "post" | "carrusel" | "reel";
  scheduledFor?: string; // ISO; si falta y publishNow=false → borrador
  publishNow?: boolean;
  isDraft?: boolean;
  title?: string;
  metadata?: Record<string, string>;
}

export async function crearPost(p: PostZernio): Promise<{ ok: boolean; id?: string; urls?: string[]; error?: string; draft?: boolean }> {
  const cuentas = await cuentasSociales();
  const platforms = cuentas.map((c) => {
    const psd: Record<string, unknown> = {};
    if (p.formato === "reel" && c.platform === "instagram") psd.instagramSettings = { postType: "reel", shareToFeed: true };
    if (p.formato === "reel" && c.platform === "facebook") psd.facebookSettings = { postType: "reel" };
    return { platform: c.platform, accountId: c.accountId, ...(Object.keys(psd).length ? { platformSpecificData: psd } : {}) };
  });
  const draft = p.isDraft || platforms.length === 0;
  const body: Record<string, unknown> = {
    title: p.title, content: p.content, mediaItems: p.mediaItems, metadata: { agente: "nina", ...(p.metadata ?? {}) },
    timezone: config.zonaHoraria,
    ...(draft ? { isDraft: true } : p.publishNow ? { publishNow: true, platforms } : { scheduledFor: p.scheduledFor, platforms }),
  };
  const r = await fetch(`${BASE}/posts`, { method: "POST", headers: H(), body: JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as any;
  if (!r.ok) return { ok: false, error: `${r.status} ${JSON.stringify(j).slice(0, 300)}` };
  const post = j.post ?? j;
  const urls: string[] = (post.platforms ?? post.platformResults ?? []).map((x: any) => x.platformPostUrl).filter(Boolean);
  return { ok: true, id: post._id ?? post.id, urls, draft };
}
