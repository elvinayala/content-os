import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { after } from "next/server";

import { db } from "./db";
import { pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "./schema";
import type { EtiquetaStatus, ValorCelda } from "./types";

// Puente Pulse → n8n → NocoDB. Reemplaza el alimentador que hoy es Monday ("A-) Migracion de
// datos de monday v5"): los agentes de n8n (onboarding, monitoreo, alertas, cobros…) NO leen
// Monday, leen la tabla `clientes` de NocoDB, que solo tiene a los clientes del grupo
// CLIENTE ACTIVO. Acá se arma, por cada cliente del tablero LEVEL UP MEDIA, el mismo registro
// plano que n8n necesita para hacer el upsert (workflow "A-) Sync Pulse → NocoDB v1"):
//
//   - idMonday: la llave que ya usa NocoDB (`ID-monday`). Para items creados en Pulse (sin
//     monday_id) se usa `pulse:<uuid>`, así el día que Monday se apague nada cambia.
//   - admin = columna "Personas" de LEVEL UP MEDIA (el account manager); traffiker = columna
//     "Estratega" del item enlazado en "Asignación de Estrategas". Van con el monday id del
//     usuario (`ID-monday` de la tabla `equipo`) y con el email como respaldo.
//   - activo = está en el grupo CLIENTE ACTIVO. Si no está (o se borró), n8n elimina la fila.
//
// Dos caminos, los dos con el mismo payload:
//   1. En caliente: las server actions llaman avisarCambio() después de cada cambio (after()
//      para no frenar la respuesta). Pulse hace POST al webhook `pulse-cliente` de n8n.
//   2. Cada noche: n8n hace GET a /api/pulse/n8n/clientes (todos los clientes) y repasa.
//
// Sin PULSE_N8N_SECRET (o sin N8N_URL) el puente no hace nada: el resto de Pulse no se entera.
// Con PULSE_N8N_MODO distinto de "real" manda simulacion:true y n8n solo registra, no escribe.

export const SLUG_CLIENTES = "level-up-media";
export const SLUG_ESTRATEGAS = "asignacion-estrategas";
export const SLUG_EQUIPO = "cumpleanos"; // el tablero "Cumpleaños" de Monday = la gente del equipo
const GRUPO_ACTIVO_MONDAY = "grupo_nuevo__1"; // CLIENTE ACTIVO

// Columnas de Monday que alimentaban NocoDB (por monday_id; título como respaldo).
const COL = {
  personas: { monday: "personas__1", titulo: "Personas" },
  empresa: { monday: "text8", titulo: "Empresa" },
  industria: { monday: "estado__1", titulo: "Industria" },
  idCuenta: { monday: "text_mksx2nnx", titulo: "Id cuenta publicitaria" },
  asignacion: { monday: "board_relation_mktnkez8", titulo: "Asignación de Estrategas" },
  telefono: { monday: "contact_phone", titulo: "Teléfono" },
  email: { monday: "contact_email", titulo: "E-mail" },
  estratega: { monday: "person", titulo: "Estratega" },
} as const;

export interface PersonaSync {
  idMonday: string | null;
  nombre: string | null;
  email: string | null;
}

export interface ClienteSync {
  idMonday: string;
  pulseId: string;
  nombre: string;
  empresa: string;
  industria: string;
  idCuenta: string;
  email: string;
  telefono: string;
  admin: PersonaSync;
  traffiker: PersonaSync;
  activo: boolean;
  grupo: string;
  actualizadoEl: string;
}

export interface EnvioSync {
  origen: "pulse";
  motivo: string;
  simulacion: boolean;
  enviadoEl: string;
  clientes: ClienteSync[];
}

export function puenteActivo(): boolean {
  return Boolean(process.env.PULSE_N8N_SECRET && process.env.N8N_URL);
}

const texto = (v: ValorCelda | undefined): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const lista = (v: ValorCelda | undefined): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

type ColumnaFila = typeof pulseColumns.$inferSelect;
function columna(cols: ColumnaFila[], c: { monday: string; titulo: string }): ColumnaFila | undefined {
  return cols.find((x) => x.mondayId === c.monday) ?? cols.find((x) => x.title.trim().toLowerCase() === c.titulo.toLowerCase());
}

// Arma los registros de los clientes pedidos (o de todos si no se pasan ids).
export async function armarClientes(itemIds?: string[]): Promise<ClienteSync[]> {
  const d = await db();
  const board = await d.query.pulseBoards.findFirst({ where: eq(pulseBoards.slug, SLUG_CLIENTES) });
  if (!board) return [];
  const [cols, grupos, items] = await Promise.all([
    d.select().from(pulseColumns).where(eq(pulseColumns.boardId, board.id)),
    d.select().from(pulseGroups).where(eq(pulseGroups.boardId, board.id)),
    itemIds
      ? itemIds.length
        ? d.select().from(pulseItems).where(and(eq(pulseItems.boardId, board.id), inArray(pulseItems.id, itemIds)))
        : Promise.resolve([])
      : d.select().from(pulseItems).where(eq(pulseItems.boardId, board.id)),
  ]);
  if (!items.length) return [];

  const cPersonas = columna(cols, COL.personas);
  const cEmpresa = columna(cols, COL.empresa);
  const cIndustria = columna(cols, COL.industria);
  const cIdCuenta = columna(cols, COL.idCuenta);
  const cAsignacion = columna(cols, COL.asignacion);
  const cTelefono = columna(cols, COL.telefono);
  const cEmail = columna(cols, COL.email);
  const etiquetas = new Map<string, string>(((cIndustria?.settings?.labels ?? []) as EtiquetaStatus[]).map((l) => [l.id, l.label]));
  const grupoActivo = grupos.find((g) => g.mondayId === GRUPO_ACTIVO_MONDAY) ?? grupos.find((g) => g.title.trim().toUpperCase() === "CLIENTE ACTIVO");
  const tituloGrupo = new Map(grupos.map((g) => [g.id, g.title]));

  // Estratega: item enlazado en "Asignación de Estrategas" → su columna "Estratega" (people).
  const idsAsignacion = [...new Set(items.flatMap((i) => (cAsignacion ? lista(i.values?.[cAsignacion.id]) : [])))];
  const estrategaDe = new Map<string, string[]>(); // asignacionItemId → userIds
  if (idsAsignacion.length) {
    const boardE = await d.query.pulseBoards.findFirst({ where: eq(pulseBoards.slug, SLUG_ESTRATEGAS) });
    if (boardE) {
      const colsE = await d.select().from(pulseColumns).where(eq(pulseColumns.boardId, boardE.id));
      const cEstratega = columna(colsE, COL.estratega);
      const asignaciones = await d
        .select({ id: pulseItems.id, values: pulseItems.values })
        .from(pulseItems)
        .where(inArray(pulseItems.id, idsAsignacion));
      for (const a of asignaciones) estrategaDe.set(a.id, cEstratega ? lista(a.values?.[cEstratega.id]) : []);
    }
  }

  const userIds = new Set<string>();
  for (const i of items) for (const u of cPersonas ? lista(i.values?.[cPersonas.id]) : []) userIds.add(u);
  for (const us of estrategaDe.values()) for (const u of us) userIds.add(u);
  const usuarios = userIds.size
    ? await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre, email: pulseUsers.email, mondayId: pulseUsers.mondayId }).from(pulseUsers).where(inArray(pulseUsers.id, [...userIds]))
    : [];
  const porUsuario = new Map(usuarios.map((u) => [u.id, u]));
  const persona = (ids: string[]): PersonaSync => {
    const u = ids.map((id) => porUsuario.get(id)).find(Boolean);
    return u ? { idMonday: u.mondayId ?? null, nombre: u.nombre, email: u.email } : { idMonday: null, nombre: null, email: null };
  };

  return items.map((i) => {
    const v = i.values ?? {};
    const asignados = cAsignacion ? lista(v[cAsignacion.id]) : [];
    const estrategas = asignados.flatMap((a) => estrategaDe.get(a) ?? []);
    return {
      idMonday: i.mondayId ?? `pulse:${i.id}`,
      pulseId: i.id,
      nombre: i.name,
      empresa: cEmpresa ? texto(v[cEmpresa.id]) : "",
      industria: cIndustria ? (etiquetas.get(texto(v[cIndustria.id])) ?? "") : "",
      idCuenta: cIdCuenta ? texto(v[cIdCuenta.id]) : "",
      email: cEmail ? texto(v[cEmail.id]) : "",
      telefono: cTelefono ? texto(v[cTelefono.id]).replace(/[^\d+]/g, "") : "",
      admin: persona(cPersonas ? lista(v[cPersonas.id]) : []),
      traffiker: persona(estrategas),
      activo: Boolean(grupoActivo && i.groupId === grupoActivo.id),
      grupo: tituloGrupo.get(i.groupId) ?? "",
      actualizadoEl: i.updatedAt.toISOString(),
    };
  });
}

// Clientes de LEVEL UP MEDIA enlazados a estos items de "Asignación de Estrategas".
export async function clientesDeAsignaciones(asignacionIds: string[]): Promise<string[]> {
  if (!asignacionIds.length) return [];
  const d = await db();
  const board = await d.query.pulseBoards.findFirst({ where: eq(pulseBoards.slug, SLUG_CLIENTES) });
  if (!board) return [];
  const cols = await d.select().from(pulseColumns).where(eq(pulseColumns.boardId, board.id));
  const cAsignacion = columna(cols, COL.asignacion);
  if (!cAsignacion) return [];
  const filas = await d
    .select({ id: pulseItems.id })
    .from(pulseItems)
    .where(and(eq(pulseItems.boardId, board.id), sql`${pulseItems.values} -> ${cAsignacion.id} ?| ${asignacionIds}`));
  return filas.map((f) => f.id);
}

export async function enviarAN8n(clientes: ClienteSync[], motivo: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!puenteActivo() || !clientes.length) return { ok: false, error: "puente-inactivo-o-vacio" };
  const cuerpo: EnvioSync = {
    origen: "pulse",
    motivo,
    simulacion: process.env.PULSE_N8N_MODO !== "real",
    enviadoEl: new Date().toISOString(),
    clientes,
  };
  try {
    const r = await fetch(`${process.env.N8N_URL!.replace(/\/$/, "")}/webhook/pulse-cliente`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pulse-secret": process.env.PULSE_N8N_SECRET! },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) console.error(`[puente-n8n] ${r.status} al avisar (${motivo})`);
    return { ok: r.ok, status: r.status };
  } catch (e) {
    console.error(`[puente-n8n] ${e instanceof Error ? e.message : e}`);
    return { ok: false, error: String(e) };
  }
}

// Lo llaman las server actions después de escribir. Resuelve solo el tablero de los items:
// si son de LEVEL UP MEDIA manda esos clientes; si son de "Asignación de Estrategas" manda
// los clientes enlazados (les cambió el estratega); cualquier otro tablero se ignora.
// `bajas` son registros armados ANTES de un delete (se mandan con activo:false).
// Corre en after(): no bloquea la respuesta al usuario.
export function avisarCambio(p: { itemIds?: string[]; bajas?: ClienteSync[]; motivo: string }): void {
  if (!puenteActivo()) return;
  const ids = p.itemIds ?? [];
  const bajas = (p.bajas ?? []).map((c) => ({ ...c, activo: false }));
  if (!ids.length && !bajas.length) return;
  after(async () => {
    try {
      let objetivo: string[] = [];
      if (ids.length) {
        const d = await db();
        const [fila] = await d
          .select({ slug: pulseBoards.slug })
          .from(pulseItems)
          .innerJoin(pulseBoards, eq(pulseBoards.id, pulseItems.boardId))
          .where(eq(pulseItems.id, ids[0]));
        if (fila?.slug === SLUG_CLIENTES) objetivo = ids;
        else if (fila?.slug === SLUG_ESTRATEGAS) objetivo = await clientesDeAsignaciones(ids);
        else if (fila?.slug === SLUG_EQUIPO) {
          // Cambió alguien del equipo: n8n repasa la tabla `equipo` entera (son ~50 filas).
          await avisarEquipo(p.motivo);
          if (!bajas.length) return;
        }
      }
      const clientes = objetivo.length ? await armarClientes(objetivo) : [];
      await enviarAN8n([...clientes, ...bajas], p.motivo);
    } catch (e) {
      console.error(`[puente-n8n] ${e instanceof Error ? e.message : e}`);
    }
  });
}

// Antes de borrar items: registros de los clientes que se van (LEVEL UP MEDIA → baja) y los
// clientes afectados si lo borrado es una asignación de estratega (se re-mandan después).
export async function prepararBaja(itemIds: string[]): Promise<{ bajas: ClienteSync[]; afectados: string[] }> {
  if (!puenteActivo() || !itemIds.length) return { bajas: [], afectados: [] };
  try {
    const [bajas, afectados] = await Promise.all([armarClientes(itemIds), clientesDeAsignaciones(itemIds)]);
    return { bajas, afectados };
  } catch {
    return { bajas: [], afectados: [] };
  }
}


// Webhook `pulse-equipo`: n8n vuelve a leer /api/pulse/n8n/equipo y hace el upsert en NocoDB.
export async function avisarEquipo(motivo: string): Promise<void> {
  if (!puenteActivo()) return;
  try {
    const r = await fetch(`${process.env.N8N_URL!.replace(/\/$/, "")}/webhook/pulse-equipo`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pulse-secret": process.env.PULSE_N8N_SECRET! },
      body: JSON.stringify({ origen: "pulse", motivo, simulacion: process.env.PULSE_N8N_MODO !== "real", enviadoEl: new Date().toISOString() }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) console.error(`[puente-n8n] equipo ${r.status} (${motivo})`);
  } catch (e) {
    console.error(`[puente-n8n] equipo ${e instanceof Error ? e.message : e}`);
  }
}
