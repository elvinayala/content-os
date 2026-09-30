import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseAppClientes, pulseColumns, pulseFiles, pulseGroups, pulseItems, pulseUsers } from "../pulse/schema";
import type { SettingsColumna, ValorCelda } from "../pulse/types";
import { carpetaDeUrl } from "./archivos-reglas";
import { etapaDe, type Etapa } from "./etapa";

// Lo que el CLIENTE ve de su ficha de LEVEL UP MEDIA. Lista cerrada a propósito: nada de pagos, montos, comentarios,
// notas internas, vendedor ni teléfono/correo de otros. Si se agrega algo aquí, lo ve el cliente.

export interface PersonaEquipo {
  rol: string;
  nombre: string;
  agenda: string | null; // Calendly
}

export interface FichaCliente {
  itemId: string;
  negocio: string;
  contacto: string;
  etapa: Etapa;
  servicio: string | null;
  plan: string | null;
  ubicacion: string | null;
  inicio: string | null; // YYYY-MM-DD
  ultimoReporte: string | null;
  proximoReporte: string | null;
  equipo: PersonaEquipo[];
  cuentaAnuncios: string | null;
  acuerdo: { id: string; nombre: string } | null;
  slackUrl: string | null;
  /** Carpeta de Drive del cliente (columna Contenido o el expediente de Max). Interno: nunca se muestra el link. */
  carpetaId: string | null;
}

/** Calendly de cada persona del equipo: CLIENTES_APP_AGENDA = {"correo":"https://calendly.com/…"}. */
function agendas(): Record<string, string> {
  try {
    const m = JSON.parse(process.env.CLIENTES_APP_AGENDA || "{}") as Record<string, string>;
    return Object.fromEntries(Object.entries(m).map(([k, v]) => [k.toLowerCase(), v]).filter(([, v]) => /^https:\/\//.test(v)));
  } catch {
    return {};
  }
}

const fecha = (v: ValorCelda | undefined) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);
const texto = (v: ValorCelda | undefined) => (typeof v === "string" && v.trim() ? v.trim() : null);
const ids = (v: ValorCelda | undefined) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export async function fichaCliente(itemId: string): Promise<FichaCliente | null> {
  const d = await db();
  const [it] = await d
    .select({ id: pulseItems.id, boardId: pulseItems.boardId, name: pulseItems.name, values: pulseItems.values, grupo: pulseGroups.title })
    .from(pulseItems)
    .innerJoin(pulseGroups, eq(pulseGroups.id, pulseItems.groupId))
    .where(eq(pulseItems.id, itemId));
  if (!it) return null;
  const values = (it.values ?? {}) as Record<string, ValorCelda>;
  const cols = await d.select({ id: pulseColumns.id, title: pulseColumns.title, type: pulseColumns.type, settings: pulseColumns.settings }).from(pulseColumns).where(eq(pulseColumns.boardId, it.boardId));
  const col = (re: RegExp) => cols.find((c) => re.test(c.title));
  const valor = (re: RegExp) => {
    const c = col(re);
    return c ? values[c.id] : undefined;
  };
  const etiqueta = (re: RegExp) => {
    const c = col(re);
    if (!c) return null;
    const v = values[c.id];
    const id = Array.isArray(v) ? v[0] : v;
    return ((c.settings ?? {}) as SettingsColumna).labels?.find((l) => l.id === id)?.label ?? null;
  };

  // Equipo: account manager (Personas) + estratega y diseñador (tablero Asignación de Estrategas).
  const asignacion = ids(valor(/^asignaci[oó]n de estrategas$/i));
  const personas: { rol: string; id: string }[] = ids(valor(/^personas$/i)).map((id) => ({ rol: "Account manager", id }));
  if (asignacion.length) {
    const [asig] = await d.select({ boardId: pulseItems.boardId, values: pulseItems.values }).from(pulseItems).where(eq(pulseItems.id, asignacion[0]));
    if (asig) {
      const colsAsig = await d.select({ id: pulseColumns.id, title: pulseColumns.title }).from(pulseColumns).where(eq(pulseColumns.boardId, asig.boardId));
      const va = (asig.values ?? {}) as Record<string, ValorCelda>;
      for (const [re, rol] of [
        [/^estratega$/i, "Estratega"],
        [/^dise[nñ]ador$/i, "Diseñador"],
      ] as const) {
        const c = colsAsig.find((x) => re.test(x.title));
        for (const id of c ? ids(va[c.id]) : []) personas.push({ rol, id });
      }
    }
  }
  const usuarios = personas.length ? await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre, email: pulseUsers.email }).from(pulseUsers).where(inArray(pulseUsers.id, [...new Set(personas.map((p) => p.id))])) : [];
  const cal = agendas();
  const equipo: PersonaEquipo[] = [];
  for (const p of personas) {
    const u = usuarios.find((x) => x.id === p.id);
    if (u && !equipo.some((e) => e.nombre === u.nombre && e.rol === p.rol)) equipo.push({ rol: p.rol, nombre: u.nombre, agenda: cal[u.email.toLowerCase()] ?? null });
  }
  // Primero el estratega (es con quien más habla), después el account manager y el diseñador.
  const orden = ["Estratega", "Account manager", "Diseñador"];
  equipo.sort((a, b) => orden.indexOf(a.rol) - orden.indexOf(b.rol));

  const colAcuerdo = col(/^acuerdo firmado$/i);
  const [acuerdo] = colAcuerdo
    ? await d.select({ id: pulseFiles.id, nombre: pulseFiles.nombre }).from(pulseFiles).where(and(eq(pulseFiles.itemId, itemId), eq(pulseFiles.columnId, colAcuerdo.id))).limit(1)
    : [];
  const [app] = await d.select({ slackUrl: pulseAppClientes.slackUrl }).from(pulseAppClientes).where(eq(pulseAppClientes.itemId, itemId));
  const cuenta = texto(valor(/^id cuenta publicitaria$/i))?.replace(/^act_/, "") ?? null;
  const contenido = valor(/^contenido$/i);
  const urlContenido = contenido && typeof contenido === "object" && !Array.isArray(contenido) ? (contenido as { url?: string }).url : typeof contenido === "string" ? contenido : null;
  const carpetaId = carpetaDeUrl(urlContenido) ?? (await carpetaDeMax(itemId));

  return {
    itemId,
    negocio: texto(valor(/^empresa$/i)) ?? it.name,
    contacto: it.name,
    etapa: etapaDe(it.grupo, etiqueta(/^progreso$/i)),
    servicio: etiqueta(/^tipo de servicio$/i),
    plan: etiqueta(/^paquete$/i),
    ubicacion: texto(valor(/^pueblo/i)),
    inicio: fecha(valor(/^fecha de inicio$/i)),
    ultimoReporte: fecha(valor(/^fecha de [uú]ltimo reporte$/i)),
    proximoReporte: fecha(valor(/^fecha pr[oó]ximo reporte$/i)),
    equipo,
    cuentaAnuncios: cuenta && /^\d{5,20}$/.test(cuenta) ? cuenta : null,
    acuerdo: acuerdo ?? null,
    slackUrl: app?.slackUrl ?? null,
    carpetaId,
  };
}

/** La carpeta estándar que Max le creó (si tiene expediente vinculado a esta ficha). */
async function carpetaDeMax(itemId: string): Promise<string | null> {
  try {
    const d = await db();
    const r = (await d.execute(sql`select meta->'drive'->>'id' as id from max_clientes where pulse_item = ${itemId} limit 1`)) as unknown;
    const filas = Array.isArray(r) ? r : ((r as { rows?: unknown[] })?.rows ?? []);
    const id = (filas[0] as { id?: string } | undefined)?.id;
    return id && /^[\w-]{10,}$/.test(id) ? id : null;
  } catch {
    return null; // sin tabla de Max (dev local) o sin expediente
  }
}

/** ¿Este archivo es el acuerdo firmado de este cliente? (lo único de Pulse que el cliente puede bajar) */
export async function esAcuerdoDe(itemId: string, fileId: string): Promise<boolean> {
  const f = await fichaCliente(itemId);
  return !!f?.acuerdo && f.acuerdo.id === fileId;
}
