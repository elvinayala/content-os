import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { notificarCEO } from "../notificar-ceo";
import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { avisarPersona } from "./avisar";
import { aplicar, describir, type CambioCampo, type TipoCambio, valorLegible } from "./cambios-reglas";
import { evento, guardarPerfil, perfilDe, type Perfil } from "./datos";
import { guardarFicha, leerFicha } from "./fichas";
import { EMPRESAS, puestoPorId } from "./reglas";
import { desempenoCambios } from "./schema";

// Cambios sensibles que esperan a Elvin (28/sep). Reglas puras en cambios-reglas.ts.

const t = desempenoCambios;
const URL_AJUSTES = "https://ritmo.levelupmediapr.net/ritmo/ajustes";

export type Cambio = typeof desempenoCambios.$inferSelect & { persona: string; propuso: string | null };

async function nombres(): Promise<Map<string, string>> {
  const d = await db();
  return new Map((await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre }).from(pulseUsers)).map((u) => [u.id, u.nombre]));
}

function legible(n: Map<string, string>) {
  return (campo: string, v: unknown): string => {
    if (v === null || v === undefined || v === "") return "—";
    if (campo === "puesto") return puestoPorId(String(v))?.nombre ?? String(v);
    if (campo === "empresa" || campo === "tambienEn") return EMPRESAS.find((e) => e.id === v)?.nombre ?? String(v);
    if (campo === "liderId") return n.get(String(v)) ?? "—";
    if (campo === "tipoContrato") return ({ contratista: "Contratista", nomina: "Nómina", eor: "EOR" } as Record<string, string>)[String(v)] ?? String(v);
    return valorLegible(campo, v);
  };
}

/** Deja el cambio esperando a Elvin (reemplaza uno anterior de la misma persona y tipo) y le avisa. */
export async function proponerCambio(p: { tipo: TipoCambio; userId: string; cambios: CambioCampo[]; datos?: unknown; actorId: string }): Promise<string[]> {
  const d = await db();
  await d
    .update(t)
    .set({ estado: "reemplazado", decididoAt: new Date() })
    .where(and(eq(t.userId, p.userId), eq(t.tipo, p.tipo), eq(t.estado, "pendiente")));
  const [c] = await d.insert(t).values({ userId: p.userId, tipo: p.tipo, cambios: p.cambios, datos: p.datos ?? null, propuestoPor: p.actorId }).returning({ id: t.id });
  const n = await nombres();
  const lineas = p.cambios.map((x) => describir(x, legible(n)));
  await evento({ userId: p.userId, actorId: p.actorId, tipo: "cambio_propuesto", datos: { id: c.id, tipo: p.tipo, campos: p.cambios.map((x) => x.campo) } });
  await notificarCEO(
    `✋ ${n.get(p.actorId) ?? "Alguien"} quiere cambiar a ${n.get(p.userId) ?? "una persona"} en Ritmo:\n${lineas.map((l) => `• ${l}`).join("\n")}\nApruébalo o recházalo en Ritmo → Ajustes → Por aprobar: ${URL_AJUSTES}`,
  ).catch(() => null);
  return lineas;
}

export async function listarCambios(estado: "pendiente" | "todos" = "pendiente", limite = 50): Promise<Cambio[]> {
  const d = await db();
  const filas = await d
    .select()
    .from(t)
    .where(estado === "pendiente" ? eq(t.estado, "pendiente") : undefined)
    .orderBy(desc(t.createdAt))
    .limit(limite);
  const n = await nombres();
  return filas.map((f) => ({ ...f, persona: n.get(f.userId) ?? "—", propuso: f.propuestoPor ? (n.get(f.propuestoPor) ?? null) : null }));
}

/** Para la pantalla: cada cambio en palabras ("Puesto: Estratega → Tesorera"). */
export async function describirCambios(cs: Cambio[]): Promise<Record<string, string[]>> {
  const n = await nombres();
  return Object.fromEntries(cs.map((c) => [c.id, (c.cambios as CambioCampo[]).map((x) => describir(x, legible(n)))]));
}

/** Elvin decide. Aprobar aplica los cambios sobre cómo está HOY la persona (no pisa lo menor editado después). */
export async function decidirCambio(id: string, aprobar: boolean, actorId: string, nota?: string | null): Promise<void> {
  const d = await db();
  const [c] = await d.select().from(t).where(eq(t.id, id));
  if (!c || c.estado !== "pendiente") throw new Error("Ese cambio ya se decidió");
  const cambios = c.cambios as CambioCampo[];
  if (aprobar) {
    if (c.tipo === "perfil") {
      const actual = await perfilDe(c.userId);
      const base = (actual ?? (c.datos as Perfil | null)) as Record<string, unknown> | null;
      if (!base) throw new Error("No encontré el perfil");
      const p = aplicar(base, cambios) as unknown as Perfil;
      await guardarPerfil(
        {
          userId: c.userId,
          puesto: p.puesto,
          empresa: p.empresa,
          tambienEn: p.tambienEn ?? null,
          liderId: p.liderId ?? null,
          horaEntrada: p.horaEntrada,
          horaSalida: p.horaSalida,
          diasLaborables: p.diasLaborables,
          tipoContrato: p.tipoContrato,
          fechaIngreso: p.fechaIngreso ?? null,
          activo: p.activo,
          slackId: p.slackId ?? null,
          soloRitmo: p.soloRitmo,
        },
        actorId,
      );
    } else {
      const f = await leerFicha(c.userId);
      if (!f) throw new Error("No encontré la ficha");
      const nueva = aplicar(f as unknown as Record<string, unknown>, cambios) as unknown as typeof f;
      await guardarFicha(
        {
          userId: c.userId,
          telefono: nueva.telefono,
          telefonoAlterno: nueva.telefonoAlterno,
          ciudad: nueva.ciudad,
          pais: nueva.pais,
          documentoTipo: nueva.documentoTipo,
          documentoNumero: nueva.documentoNumero,
          salarioMensual: nueva.salarioMensual,
          notas: nueva.notas,
          contactoEmergencia: nueva.contactoEmergencia,
        },
        actorId,
      );
    }
  }
  await d.update(t).set({ estado: aprobar ? "aprobado" : "rechazado", decididoPor: actorId, decididoAt: new Date(), nota: nota?.trim() || null }).where(eq(t.id, id));
  await evento({ userId: c.userId, actorId, tipo: aprobar ? "cambio_aprobado" : "cambio_rechazado", datos: { id, campos: cambios.map((x) => x.campo) } });
  const n = await nombres();
  const lineas = cambios.map((x) => describir(x, legible(n)));
  await avisarPersona(
    c.propuestoPor,
    `${aprobar ? "✅ Elvin aprobó" : "❌ Elvin no aprobó"} el cambio de ${n.get(c.userId) ?? "la persona"} en Ritmo:\n${lineas.map((l) => `• ${l}`).join("\n")}${nota?.trim() ? `\nNota: ${nota.trim()}` : ""}`,
  ).catch(() => false);
}

/** Cambios que esperan a Elvin para una persona (para marcar su tarjeta en Ajustes). */
export async function pendientesPorPersona(): Promise<Record<string, number>> {
  const d = await db();
  const filas = await d.select({ userId: t.userId }).from(t).where(eq(t.estado, "pendiente"));
  const out: Record<string, number> = {};
  for (const f of filas) out[f.userId] = (out[f.userId] ?? 0) + 1;
  return out;
}
