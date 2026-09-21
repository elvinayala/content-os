import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { PayloadPortal } from "./types";

// Arma el payload de un portal a partir de lo que la fábrica dejó en data/demos/<slug>/
// (config.json, generado.json, retell.json) y data/demos/index.json (urls de Netlify).
// Lo usa /borinquen/portales ("Crear portal" para un demo ya construido en esta máquina o en el
// bundle de Vercel). La fábrica en la Mac usa /api/autoflow/portales con el mismo formato.

const DEMOS = path.join(process.cwd(), "data", "demos");

function leerJSON<T>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

export interface DemoRegistrada {
  slug: string;
  negocio?: string;
  estado?: string;
  asistente?: string;
  agentId?: string;
  urls?: PayloadPortal["urls"];
  dealId?: number | string;
  deck?: string;
}

export function listarDemos(): DemoRegistrada[] {
  const idx = leerJSON<{ demos?: DemoRegistrada[] }>(path.join(DEMOS, "index.json"));
  return idx?.demos ?? [];
}

export function payloadDesdeDemo(slug: string): PayloadPortal | null {
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(slug)) return null;
  const dir = path.join(DEMOS, slug);
  const config = leerJSON<{ negocio: string; nicho?: string; contacto?: string; color?: string }>(path.join(dir, "config.json"));
  if (!config) return null;
  const generado = leerJSON<{ asistente?: string; sistema?: { leads?: PayloadPortal["leadsEjemplo"] } }>(path.join(dir, "generado.json"));
  const retell = leerJSON<{ agent_id?: string }>(path.join(dir, "retell.json"));
  const reg = listarDemos().find((d) => d.slug === slug);
  const urls = { ...(reg?.urls ?? {}) };
  if (reg?.deck && urls.propuesta) urls.deck = urls.propuesta.replace(/\/?$/, "/") + reg.deck;
  return {
    slug,
    negocio: config.negocio,
    nicho: config.nicho,
    contacto: config.contacto,
    color: config.color,
    asistente: generado?.asistente,
    agentIdVoz: retell?.agent_id ?? reg?.agentId ?? null,
    urls,
    pipedriveDealId: reg?.dealId != null ? String(reg.dealId) : null,
    leadsEjemplo: generado?.sistema?.leads ?? [],
  };
}
