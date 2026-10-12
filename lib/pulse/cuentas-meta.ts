import "server-only";

import { and, eq, inArray, notInArray, sql } from "drizzle-orm";

import { notificarCEO } from "@/lib/notificar-ceo";

import { usuarioSistema } from "./alta-typeform";
import { clasificar, decidir, esProblema, limpiarId, textoAviso, textoFicha, type EstadoCuenta, type Linea, type RespuestaMeta } from "./cuentas-meta-reglas";
import { db } from "./db";
import { pulseActivity, pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "./schema";
import { dmSlack } from "./slack-dm";
import type { ValorCelda } from "./types";

// Verifica que Bori (el token META_ADS_TOKEN, app Hey Bori) lea la cuenta publicitaria de cada cliente de Level Up.
// Corre al crearse la ficha (onboarding), cada hora sobre las fichas nuevas o con problema, y una vez al día (7 AM PR)
// sobre todas. Escribe en la ficha SOLO cuando cambia el estado y le avisa a Jessica en un solo DM por pasada.

const TABLERO = "level-up-media";
const AVISAR_A = (process.env.PULSE_CUENTAS_AVISAR || "jessica@levelupmediapr.net").split(",").map((s) => s.trim()).filter(Boolean);
const DIAS_NUEVA = 14;
const HORAS_SIN_ID = 24; // una ficha recién creada tiene un día para traer el ID antes de marcarla "sin ID"

async function consultarMeta(id: string): Promise<RespuestaMeta> {
  const token = process.env.META_ADS_TOKEN;
  if (!token) return { error: { code: 190, message: "sin META_ADS_TOKEN" } };
  try {
    const r = await fetch(`https://graph.facebook.com/v23.0/act_${id}?fields=name,account_status&access_token=${token}`, { signal: AbortSignal.timeout(12000) });
    return (await r.json()) as RespuestaMeta;
  } catch (e) {
    return { error: { code: -1, message: e instanceof Error ? e.message : "red" } };
  }
}

export interface ResultadoCuentas {
  revisadas: number;
  conProblema: number;
  escritas: number;
  avisados: number;
  transitorios: number;
  detalle: Linea[];
  error?: string;
}

const horaPR = () => {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Puerto_Rico", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date());
  return { dia: p.find((x) => x.type === "weekday")?.value ?? "", hora: Number(p.find((x) => x.type === "hour")?.value ?? 0) % 24 };
};

export async function revisarCuentasMeta(o: { itemId?: string; completo?: boolean; avisar?: boolean; recordatorio?: boolean } = {}): Promise<ResultadoCuentas> {
  const vacio: ResultadoCuentas = { revisadas: 0, conProblema: 0, escritas: 0, avisados: 0, transitorios: 0, detalle: [] };
  const d = await db();
  const [board] = await d.select().from(pulseBoards).where(eq(pulseBoards.slug, TABLERO));
  if (!board) return { ...vacio, error: "sin-tablero" };
  const [columnas, grupos] = await Promise.all([
    d.select({ id: pulseColumns.id, title: pulseColumns.title, type: pulseColumns.type }).from(pulseColumns).where(eq(pulseColumns.boardId, board.id)),
    d.select({ id: pulseGroups.id, title: pulseGroups.title }).from(pulseGroups).where(eq(pulseGroups.boardId, board.id)),
  ]);
  const cId = columnas.find((c) => /^id cuenta publicitaria$/i.test(c.title));
  if (!cId) return { ...vacio, error: "sin-columna-id" };
  const cEmpresa = columnas.find((c) => /^empresa$/i.test(c.title));
  const cPersonas = columnas.find((c) => c.type === "people");
  const bajas = grupos.filter((g) => /offboard|baja|inactiv/i.test(g.title)).map((g) => g.id);

  const items = await d
    .select({ id: pulseItems.id, name: pulseItems.name, groupId: pulseItems.groupId, values: pulseItems.values, createdAt: pulseItems.createdAt })
    .from(pulseItems)
    .where(and(eq(pulseItems.boardId, board.id), bajas.length ? notInArray(pulseItems.groupId, bajas) : undefined, o.itemId ? eq(pulseItems.id, o.itemId) : undefined));

  // Último estado guardado por ficha.
  const previos = await d
    .select({ itemId: pulseActivity.itemId, estado: sql<EstadoCuenta>`${pulseActivity.after}->'cuentaMeta'->>'estado'` })
    .from(pulseActivity)
    .where(and(eq(pulseActivity.boardId, board.id), sql`${pulseActivity.after} ? 'cuentaMeta'`))
    .orderBy(sql`${pulseActivity.at} asc`);
  const ultimo = new Map<string, EstadoCuenta>();
  for (const p of previos) ultimo.set(p.itemId, p.estado); // el orden asc deja el más reciente

  // Nombre del responsable (columna people) para la línea del aviso.
  const idsPersonas = new Set<string>();
  if (cPersonas) for (const i of items) for (const u of ((i.values as Record<string, ValorCelda>)[cPersonas.id] as string[] | undefined) ?? []) idsPersonas.add(u);
  const nombres = new Map<string, string>();
  if (idsPersonas.size) for (const u of await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre }).from(pulseUsers).where(inArray(pulseUsers.id, [...idsPersonas]))) nombres.set(u.id, u.nombre);

  const ahora = Date.now();
  const objetivo = items.filter((i) => {
    if (o.itemId || o.completo) return true;
    const reciente = ahora - new Date(i.createdAt).getTime() < DIAS_NUEVA * 86_400_000;
    return reciente || esProblema(ultimo.get(i.id));
  });

  const usuario = await usuarioSistema("cuentas");
  const nuevos: Linea[] = [];
  const recuperados: Linea[] = [];
  const pendientesTodos: Linea[] = []; // para el recordatorio del lunes
  const res: ResultadoCuentas = { ...vacio };

  const procesar = async (i: (typeof items)[number]) => {
    const v = i.values as Record<string, ValorCelda>;
    const id = limpiarId(v[cId.id]);
    const horas = (ahora - new Date(i.createdAt).getTime()) / 3_600_000;
    let estado: EstadoCuenta;
    let detalle: string;
    if (!id) {
      if (horas < HORAS_SIN_ID) return;
      estado = "sin-id";
      detalle = "falta el ID de la cuenta publicitaria";
    } else {
      ({ estado, detalle } = clasificar(await consultarMeta(id)));
    }
    res.revisadas++;
    const linea: Linea = {
      nombre: i.name,
      empresa: cEmpresa ? ((v[cEmpresa.id] as string) ?? null) : null,
      id,
      estado,
      detalle,
      admin: cPersonas ? (((v[cPersonas.id] as string[] | undefined) ?? []).map((u) => nombres.get(u)).filter(Boolean)[0] ?? null) : null,
    };
    if (estado === "transitorio") { res.transitorios++; return; }
    if (esProblema(estado)) { res.conProblema++; pendientesTodos.push(linea); }
    const { escribir, avisar } = decidir(ultimo.get(i.id) ?? null, estado);
    if (!escribir) return;
    await d.insert(pulseActivity).values({ itemId: i.id, boardId: board.id, tipo: "comentario", after: { texto: textoFicha(estado, id, detalle), cuentaMeta: { estado, id } }, userId: usuario });
    res.escritas++;
    if (avisar === "nuevo") nuevos.push(linea);
    if (avisar === "recuperado") recuperados.push(linea);
  };

  // De a 5 en paralelo (son ~85 consultas en la pasada completa).
  for (let k = 0; k < objetivo.length; k += 5) await Promise.all(objetivo.slice(k, k + 5).map(procesar));
  res.detalle = pendientesTodos;

  const { dia, hora } = horaPR();
  const recordatorio = o.recordatorio ?? (o.completo && dia === "Mon" && hora < 10);
  if (o.avisar !== false) {
    const lista = recordatorio ? pendientesTodos : nuevos;
    const texto = textoAviso({ nuevos: lista, recuperados, recordatorio: !!recordatorio });
    if (texto) for (const email of AVISAR_A) if (await dmSlack(email, texto)) res.avisados++;
  }
  // Si Meta/el token falla en masa en la pasada diaria, es problema nuestro, no de los clientes: se le avisa a Elvin.
  if (o.completo && o.avisar !== false && res.transitorios >= 5) {
    await notificarCEO(`⚠️ La revisión de cuentas publicitarias no pudo leer ${res.transitorios} cuentas por un error de Meta o del token (META_ADS_TOKEN). Probablemente venció: renuévalo desde Bori.`).catch(() => null);
  }
  return res;
}
