"use server";

import { revalidatePath } from "next/cache";

import { COOKIE_SESION, sesionValida } from "@/lib/auth";
import { cookies } from "next/headers";

import { notificarCEO } from "@/lib/notificar-ceo";
import { actualizarPortal, cambiarEstadoSolicitud, leerPortalPorSlug, upsertPortal } from "@/lib/portal/repo";
import { importarHistorial, prepararAgenteParaPortal } from "@/lib/portal/retell";
import { payloadDesdeDemo } from "@/lib/portal/sembrar";
import { ESTADOS_SOLICITUD, type EstadoSolicitud, type ModoPortal } from "@/lib/portal/types";

// Acciones del closer / CEO sobre los portales (solo con cookie CEO).

async function esCloser(): Promise<boolean> {
  const jar = await cookies();
  return sesionValida(jar.get(COOKIE_SESION)?.value);
}
function revalidar(slug?: string) {
  revalidatePath("/borinquen/portales");
  if (slug) {
    revalidatePath(`/borinquen/portales/${slug}`);
    revalidatePath(`/portal/${slug}`);
  }
}

// Crea (o refresca) el portal de un demo que la fábrica ya construyó en data/demos/<slug>.
export async function crearPortalDesdeDemoAction(slug: string) {
  if (!(await esCloser())) return { ok: false as const, error: "Sin permiso." };
  const payload = payloadDesdeDemo(slug);
  if (!payload) return { ok: false as const, error: `No encuentro data/demos/${slug}/config.json.` };
  const portal = await upsertPortal(payload);
  let agente: boolean | null = null;
  if (portal.agentIdVoz && process.env.RETELL_API_KEY) {
    agente = await prepararAgenteParaPortal(portal.agentIdVoz).catch(() => false);
  }
  revalidar(slug);
  return { ok: true as const, agentePreparado: agente };
}

export async function cambiarEstadoSolicitudAction(slug: string, id: string, estado: EstadoSolicitud, respuesta?: string) {
  if (!(await esCloser())) return { ok: false as const, error: "Sin permiso." };
  if (!ESTADOS_SOLICITUD.some((e) => e.estado === estado)) return { ok: false as const, error: "Estado inválido." };
  const portal = await leerPortalPorSlug(slug);
  if (!portal) return { ok: false as const, error: "Portal no existe." };
  await cambiarEstadoSolicitud(portal.id, id, estado, respuesta?.trim().slice(0, 1000) || undefined);
  revalidar(slug);
  return { ok: true as const };
}

export async function cambiarPortalAction(slug: string, patch: { modo?: ModoPortal; activo?: boolean; agentIdVoz?: string | null }) {
  if (!(await esCloser())) return { ok: false as const, error: "Sin permiso." };
  if (patch.agentIdVoz && !/^agent_[a-z0-9]+$/i.test(patch.agentIdVoz)) return { ok: false as const, error: "agent_id inválido." };
  await actualizarPortal(slug, patch);
  if (patch.agentIdVoz && process.env.RETELL_API_KEY) await prepararAgenteParaPortal(patch.agentIdVoz).catch(() => null);
  revalidar(slug);
  return { ok: true as const };
}

// Trae el historial de llamadas del agente del portal (backfill / producción).
export async function importarHistorialAction(slug: string) {
  if (!(await esCloser())) return { ok: false as const, error: "Sin permiso." };
  const portal = await leerPortalPorSlug(slug);
  if (!portal?.agentIdVoz) return { ok: false as const, error: "El portal no tiene agente de voz." };
  if (!process.env.RETELL_API_KEY) return { ok: false as const, error: "Falta RETELL_API_KEY." };
  const r = await importarHistorial(portal.agentIdVoz);
  revalidar(slug);
  return { ok: true as const, ...r };
}

export async function avisarLinkEnviadoAction(slug: string, canal: string) {
  if (!(await esCloser())) return { ok: false as const, error: "Sin permiso." };
  const portal = await leerPortalPorSlug(slug);
  if (!portal) return { ok: false as const, error: "Portal no existe." };
  void notificarCEO(`📨 Portal de ${portal.negocio} enviado por ${canal}.`).catch(() => null);
  return { ok: true as const };
}
