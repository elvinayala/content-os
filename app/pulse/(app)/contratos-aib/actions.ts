"use server";

import { revalidatePath } from "next/cache";

import { validarOferta } from "@/lib/aib-contratos/documento";
import { enlaceContrato } from "@/lib/aib-contratos/firmar";
import { anularContrato, contratoPorId, crearContrato, puedeContratosAib, puedeEmitirContratoAib } from "@/lib/aib-contratos/repo";
import { usuarioVerificado } from "@/lib/pulse/auth";

async function quien() {
  const u = await usuarioVerificado();
  return u && (await puedeContratosAib(u)) ? u : null;
}

async function quienPuedeCrear() {
  const u = await usuarioVerificado();
  return u && (await puedeEmitirContratoAib(u)) ? u : null;
}

/** El equipo llena a mano lo que se le ofreció y el costo → link para que el cliente complete y firme. */
export async function crearContratoAction(v: Record<string, string>): Promise<{ ok: true; link: string; codigo: string } | { ok: false; error: string }> {
  const u = await quienPuedeCrear();
  if (!u) return { ok: false, error: "Sin permiso" };
  const r = validarOferta(v);
  if (!r.ok) return r;
  const c = await crearContrato(r.v, u);
  revalidatePath("/pulse/contratos-aib");
  return { ok: true, link: enlaceContrato(c), codigo: c.codigo };
}

export async function anularContratoAction(id: number): Promise<{ ok: boolean; error?: string }> {
  const u = await quien();
  if (!u) return { ok: false, error: "Sin permiso" };
  const c = await contratoPorId(id);
  if (!c || !(await anularContrato(id, u))) return { ok: false, error: "Solo se anulan contratos pendientes." };
  revalidatePath("/pulse/contratos-aib");
  return { ok: true };
}
