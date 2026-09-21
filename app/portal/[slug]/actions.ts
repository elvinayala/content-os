"use server";

import { revalidatePath } from "next/cache";

import { notificarCEO } from "@/lib/notificar-ceo";
import { quienMira } from "@/lib/portal/acceso-server";
import { crearSolicitud, leerPortalPorSlug, listarLlamadas, moverLead } from "@/lib/portal/repo";
import { sincronizarLlamada } from "@/lib/portal/retell";
import { ETAPAS_LEAD, type EtapaLeadCliente } from "@/lib/portal/types";

// Acciones que puede hacer quien mira el portal (el prospecto/cliente con su cookie, o el
// closer con la cookie CEO). Todas verifican el acceso otra vez: la UI solo esconde.

function revalidar(slug: string) {
  revalidatePath(`/portal/${slug}`);
  revalidatePath(`/borinquen/portales/${slug}`);
  revalidatePath("/borinquen/portales");
}

async function portalAutorizado(slug: string) {
  const quien = await quienMira(slug);
  if (!quien) return { error: "Tu acceso venció. Pídele el enlace otra vez a tu asesor." } as const;
  const portal = await leerPortalPorSlug(slug);
  if (!portal || !portal.activo) return { error: "Este portal no está disponible." } as const;
  return { portal, quien } as const;
}

export async function crearSolicitudAction(slug: string, texto: string, autor: string) {
  const r = await portalAutorizado(slug);
  if ("error" in r) return { ok: false as const, error: r.error };
  const t = texto.trim().slice(0, 2000);
  if (t.length < 5) return { ok: false as const, error: "Cuéntanos un poco más qué quieres cambiar." };
  const a = autor.trim().slice(0, 80) || null;
  const s = await crearSolicitud(r.portal.id, t, a);
  const base = (process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
  void notificarCEO(
    `🛠 Solicitud de cambio · ${r.portal.negocio}${a ? ` (${a})` : ""}\n${t}\n→ ${base}/borinquen/portales/${slug}`,
  ).catch(() => null);
  revalidar(slug);
  return { ok: true as const, solicitud: s };
}

export async function moverLeadAction(slug: string, leadId: string, etapa: EtapaLeadCliente) {
  const r = await portalAutorizado(slug);
  if ("error" in r) return { ok: false as const, error: r.error };
  if (!ETAPAS_LEAD.some((e) => e.etapa === etapa)) return { ok: false as const, error: "Etapa inválida." };
  await moverLead(r.portal.id, leadId, etapa);
  revalidar(slug);
  return { ok: true as const };
}

// Re-lee de Retell las llamadas del portal que todavía no están analizadas (máx. 10).
export async function resincronizarLlamadasAction(slug: string) {
  const r = await portalAutorizado(slug);
  if ("error" in r) return { ok: false as const, error: r.error };
  if (!process.env.RETELL_API_KEY) return { ok: false as const, error: "La voz real no está conectada en este ambiente." };
  const llamadas = await listarLlamadas(r.portal.id, 30);
  const pendientes = llamadas.filter((l) => l.estado !== "analizada" && l.estado !== "error").slice(0, 10);
  let actualizadas = 0;
  for (const l of pendientes) {
    try {
      if ((await sincronizarLlamada(l.callId)) === "guardada") actualizadas++;
    } catch (e) {
      console.error("[portal resync]", l.callId, e);
    }
  }
  revalidar(slug);
  return { ok: true as const, actualizadas, pendientes: pendientes.length };
}
