"use server";

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { linkDeAcceso } from "@/lib/desempeno/acceso";
import * as datos from "@/lib/desempeno/datos";
import { puedeAprobar, PUESTOS, puestoPorId } from "@/lib/desempeno/reglas";
import { requiereGestor, requiereUsuario } from "@/lib/pulse/auth";
import { COOKIE_PULSE } from "@/lib/pulse/session";

type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function envolver<T extends object>(fn: () => Promise<T>): Promise<R<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    const m = e instanceof Error ? e.message : "Error";
    return { ok: false, error: m === "no-autorizado" ? "Tu sesión venció: vuelve a entrar" : m === "solo-admin" ? "Solo admin o editoras" : m };
  }
}

async function contexto() {
  const h = await headers();
  return { ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip"), ua: h.get("user-agent") };
}

// ─── Ponche (cada quien el suyo) ──────────────────────────────────────────────────────────────

export async function entrarAction() {
  return envolver(async () => {
    const u = await requiereUsuario();
    if (!(await datos.perfilDe(u.id))?.activo) throw new Error("No tienes perfil de ponche: pídeselo a Carilin");
    const p = await datos.entrar(u.id, await contexto());
    refresh();
    return { entradaAt: p.entradaAt.toISOString() };
  });
}

export async function salirAction(r: { bloqueos: string; datos: Record<string, number> }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    const perfil = await datos.perfilDe(u.id);
    const permitidos = new Set((puestoPorId(perfil?.puesto ?? "")?.manual ?? []).map((m) => m.id));
    const limpios: Record<string, number> = {};
    for (const [k, v] of Object.entries(r.datos ?? {})) if (permitidos.has(k) && Number.isFinite(v) && v >= 0 && v <= 50) limpios[k] = Math.round(v);
    await datos.salir(u.id, await contexto(), { bloqueos: r.bloqueos?.trim().slice(0, 1000) || null, datos: limpios });
    refresh();
    return {};
  });
}

/** Salida olvidada: `hora` = "HH:MM" en hora PR del día del ponche (si queda antes de la entrada, es el día siguiente). */
export async function corregirSalidaAction(p: { poncheId: string; hora: string; nota: string }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    if (!/^\d{2}:\d{2}$/.test(p.hora)) throw new Error("Hora inválida");
    const ponche = await datos.leerPonche(p.poncheId);
    if (!ponche) throw new Error("No existe");
    let salida = new Date(`${ponche.fecha}T${p.hora}:00-04:00`);
    if (salida <= ponche.entradaAt) salida = new Date(salida.getTime() + 86_400_000);
    await datos.corregirSalida(p.poncheId, salida, u.id, p.nota?.trim().slice(0, 300) || null);
    refresh();
    return {};
  });
}

export async function decidirCorreccionAction(p: { poncheId: string; aprobar: boolean }) {
  return envolver(async () => {
    const u = await requiereUsuario();
    const ponche = await datos.leerPonche(p.poncheId);
    if (!ponche || ponche.correccion !== "pendiente") throw new Error("Ya no está pendiente");
    const perfil = await datos.perfilDe(ponche.userId);
    if (!perfil || !puedeAprobar(u, perfil)) throw new Error("Solo su líder, Carilin o admin");
    await datos.decidirCorreccion(p.poncheId, p.aprobar, u.id);
    refresh();
    return {};
  });
}

// ─── Configuración (admin / editoras) ─────────────────────────────────────────────────────────

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function guardarPerfilAction(p: {
  userId: string;
  puesto: string;
  liderId: string | null;
  horaEntrada: string;
  horaSalida: string;
  diasLaborables: number[];
  tipoContrato: string;
  fechaIngreso: string | null;
  activo: boolean;
}) {
  return envolver(async () => {
    const u = await requiereGestor();
    if (!PUESTOS.some((x) => x.id === p.puesto)) throw new Error("Puesto inválido");
    if (!HORA.test(p.horaEntrada) || !HORA.test(p.horaSalida) || p.horaSalida <= p.horaEntrada) throw new Error("Horario inválido");
    if (!["contratista", "nomina", "eor"].includes(p.tipoContrato)) throw new Error("Contrato inválido");
    if (p.fechaIngreso && !/^\d{4}-\d{2}-\d{2}$/.test(p.fechaIngreso)) throw new Error("Fecha de ingreso inválida");
    if (p.liderId === p.userId) throw new Error("Nadie es su propio líder");
    const dias = [...new Set(p.diasLaborables.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    if (!dias.length) throw new Error("Escoge al menos un día");
    await datos.guardarPerfil({ ...p, diasLaborables: dias, fechaIngreso: p.fechaIngreso || null }, u.id);
    refresh();
    return {};
  });
}

export async function guardarMetaAction(m: { puesto: string; kpi: string; meta: number; peso: number }) {
  return envolver(async () => {
    const u = await requiereGestor();
    const kpi = puestoPorId(m.puesto)?.kpis.find((k) => k.id === m.kpi);
    if (!kpi) throw new Error("KPI inválido");
    if (!Number.isFinite(m.meta) || m.meta < 0 || !Number.isInteger(m.peso) || m.peso < 0 || m.peso > 10) throw new Error("Meta o peso inválido");
    await datos.guardarMeta(m, u.id);
    refresh();
    return {};
  });
}

export async function crearProduccionAction() {
  return envolver(async () => {
    await requiereGestor();
    const r = await datos.crearTableroProduccion();
    refresh();
    return r;
  });
}

export async function salirDeRitmoAction() {
  const jar = await cookies();
  jar.delete(COOKIE_PULSE);
  redirect("/ritmo/entrar");
}

/** Link de un solo uso (72 h) para que la persona cree su clave. Lo manda quien lo genera. */
export async function linkAccesoAction(userId: string) {
  return envolver(async () => {
    const u = await requiereGestor();
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    const r = await linkDeAcceso(userId, `${proto}://${host}`);
    await datos.evento({ userId, actorId: u.id, tipo: "link_acceso" });
    return r;
  });
}
