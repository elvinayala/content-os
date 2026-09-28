"use server";

import { refresh } from "next/cache";

import { usuarioRitmo } from "@/lib/desempeno/sesion";
import * as v from "@/lib/ventas/datos";
import { type Empresa, errorBono, errorDiario, MAX_NOTA_DIARIO } from "@/lib/ventas/reglas";

// Acciones de la Arena (ventas en Ritmo). Permisos: cada quien su diario y su meta; el director de ventas
// (y la dirección) crea bonos y marca ganadores; SOLO Elvin (admin) autoriza bonos y aprueba pagos.

type R = { ok: true } | { ok: false; error: string };

async function envolver(fn: () => Promise<void>): Promise<R> {
  try {
    await fn();
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

async function acceso() {
  const u = await usuarioRitmo();
  if (!u) throw new Error("Tu sesión venció: vuelve a entrar");
  return { u, a: await v.accesoArena(u) };
}

const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
const entero = (x: unknown) => Math.round(Number(x) || 0);

export async function guardarDiarioAction(p: { fecha: string; citas: number; presentaron: number; conversaciones: number; agendas: number; animo: number | null; nota: string }): Promise<R> {
  return envolver(async () => {
    const { u, a } = await acceso();
    if (!a.perfil) throw new Error("El diario es para el equipo de ventas");
    const hoy = hoyPR();
    const ayer = new Date(Date.parse(`${hoy}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
    // Hoy o ayer (cómo me fue ayer); más atrás lo corrige el director.
    if (p.fecha !== hoy && p.fecha !== ayer) throw new Error("Solo puedes llenar hoy o ayer");
    const fila = { fecha: p.fecha, citas: entero(p.citas), presentaron: entero(p.presentaron), conversaciones: entero(p.conversaciones), agendas: entero(p.agendas), animo: p.animo && p.animo >= 1 && p.animo <= 5 ? entero(p.animo) : null, nota: p.nota?.trim().slice(0, MAX_NOTA_DIARIO) || null };
    const err = errorDiario(fila);
    if (err) throw new Error(err);
    await v.guardarDiario(u.id, fila);
  });
}

export async function guardarGoalAction(monto: number): Promise<R> {
  return envolver(async () => {
    const { u, a } = await acceso();
    if (!a.perfil) throw new Error("La meta personal es para el equipo de ventas");
    const n = entero(monto);
    if (n < 100 || n > 5_000_000) throw new Error("Pon una meta entre $100 y $5,000,000");
    await v.guardarGoal(u.id, hoyPR().slice(0, 7), n);
  });
}

export async function crearBonoAction(p: { empresa: Empresa; titulo: string; detalle: string; monto: number; rol: string; desde: string; hasta: string }): Promise<R> {
  return envolver(async () => {
    const { u, a } = await acceso();
    const puede = (a.director || a.direccion) && a.empresas.includes(p.empresa);
    if (!puede) throw new Error("Los bonos los crea el director de ventas");
    const b = { empresa: p.empresa, titulo: p.titulo.trim().slice(0, 120), detalle: p.detalle?.trim().slice(0, 400) || null, monto: entero(p.monto), rol: ["closer", "setter", "chatter"].includes(p.rol) ? p.rol : null, desde: p.desde || hoyPR(), hasta: p.hasta || null };
    const err = errorBono(b);
    if (err) throw new Error(err);
    // Si lo crea Elvin, ya nace autorizado.
    await v.crearBono(b, u.id, a.autoriza);
  });
}

export async function decidirBonoAction(id: string, decision: "autorizar" | "rechazar" | "cerrar"): Promise<R> {
  return envolver(async () => {
    const { u, a } = await acceso();
    const b = await v.bono(id);
    if (!b || !a.empresas.includes(b.empresa as Empresa)) throw new Error("Bono no encontrado");
    if (decision === "cerrar") {
      if (!(a.director || a.direccion)) throw new Error("Solo el director o la dirección");
      await v.cambiarBono(id, { estado: "cerrado" }, u.id);
      return;
    }
    if (!a.autoriza) throw new Error("Solo Elvin autoriza los bonos");
    if (b.estado !== "propuesto") throw new Error("Ese bono ya se decidió");
    await v.cambiarBono(id, decision === "autorizar" ? { estado: "autorizado", autorizadoPor: u.id } : { estado: "rechazado", autorizadoPor: u.id }, u.id);
  });
}

export async function ganadorBonoAction(id: string, ganadorId: string): Promise<R> {
  return envolver(async () => {
    const { u, a } = await acceso();
    const b = await v.bono(id);
    if (!b || !a.empresas.includes(b.empresa as Empresa)) throw new Error("Bono no encontrado");
    if (!(a.director || a.direccion)) throw new Error("El ganador lo marca el director de ventas");
    if (b.estado !== "autorizado") throw new Error("Solo un bono autorizado puede tener ganador");
    const gente = await v.vendedores(b.empresa as Empresa);
    if (!gente.some((g) => g.userId === ganadorId && g.rol !== "director_ventas")) throw new Error("Escoge a alguien del equipo de ventas");
    await v.cambiarBono(id, { estado: "ganado", ganadorId, ganadoAt: new Date() }, u.id);
  });
}

export async function pagarBonoAction(id: string): Promise<R> {
  return envolver(async () => {
    const { u, a } = await acceso();
    if (!a.autoriza) throw new Error("Solo Elvin aprueba el pago de un bono");
    const [y, m] = hoyPR().split("-").map(Number);
    const siguiente = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    await v.pagarBono(id, u.id, siguiente);
  });
}
