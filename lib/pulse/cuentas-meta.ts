import "server-only";

import { and, eq, inArray, notInArray, sql } from "drizzle-orm";

import { notificarCEO } from "@/lib/notificar-ceo";

import { usuarioSistema } from "./alta-typeform";
import { clasificar, decidir, emparejaAsignacion, esProblema, limpiarId, onboardingHecho, repartirAvisos, textoAviso, textoFicha, type EstadoCuenta, type Linea, type RespuestaMeta } from "./cuentas-meta-reglas";
import { db } from "./db";
import { desempenoPerfiles } from "@/lib/desempeno/schema";

import { pulseActivity, pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "./schema";
import { dmSlack } from "./slack-dm";
import type { ValorCelda } from "./types";

// Verifica que Bori (el token META_ADS_TOKEN, app Hey Bori) lea la cuenta publicitaria de cada cliente de Level Up.
// Corre al crearse la ficha (onboarding), cada hora sobre las fichas nuevas o con problema, y una vez al día (7 AM PR)
// sobre todas. Escribe en la ficha SOLO cuando cambia el estado y avisa en un DM por persona y pasada a quien le toca
// (Carilin, 12/oct): compartir la cuenta con el portafolio = onboarding (Jessica); el ID en Pulse, pagos y cuentas
// caídas = el estratega asignado en "Asignación de Estrategas"; cliente sin estratega → Jessica (los asigna) + Carilin.

const TABLERO = "level-up-media";
const lista = (v: string | undefined, def: string) => (v || def).split(",").map((s) => s.trim()).filter(Boolean);
const AVISAR_A = lista(process.env.PULSE_CUENTAS_AVISAR, "jessica@levelupmediapr.net"); // onboarding
// Carilin (12/oct): "los que no tienen estratega envíaselos a Jessica, ella los asigna; a mí en copia".
const SIN_ESTRATEGA = lista(process.env.PULSE_CUENTAS_SIN_ESTRATEGA, "jessica@levelupmediapr.net,carilin@levelupmediapr.net");

/** Estratega asignado por ficha de LEVEL UP MEDIA (la asignación más reciente del tablero Asignación de Estrategas). */
export async function estrategas(clientes: { id: string; name: string; empresa: string | null }[]): Promise<Map<string, { email: string; nombre: string; slackId: string | null }>> {
  const d = await db();
  const out = new Map<string, { email: string; nombre: string; slackId: string | null }>();
  const [b] = await d.select({ id: pulseBoards.id }).from(pulseBoards).where(eq(pulseBoards.slug, "asignacion-estrategas"));
  if (!b) return out;
  const cols = await d.select({ id: pulseColumns.id, title: pulseColumns.title, type: pulseColumns.type }).from(pulseColumns).where(eq(pulseColumns.boardId, b.id));
  const cRel = cols.find((c) => c.type === "relation");
  const cEst = cols.find((c) => c.type === "people" && /estratega/i.test(c.title));
  if (!cRel || !cEst) return out;
  const asign = await d.select({ name: pulseItems.name, values: pulseItems.values }).from(pulseItems).where(eq(pulseItems.boardId, b.id)).orderBy(sql`${pulseItems.createdAt} asc`);
  const porCliente = new Map<string, string>(); // el orden asc deja la asignación más reciente
  for (const a of asign) {
    const v = a.values as Record<string, ValorCelda>;
    const est = ((v[cEst.id] as string[] | undefined) ?? [])[0];
    if (est) for (const cliente of (v[cRel.id] as string[] | undefined) ?? []) porCliente.set(cliente, est);
  }
  // Asignaciones sin el vínculo al cliente: se emparejan por nombre solo donde el vínculo no dijo nada.
  for (const a of asign) {
    const v = a.values as Record<string, ValorCelda>;
    const est = ((v[cEst.id] as string[] | undefined) ?? [])[0];
    if (!est || ((v[cRel.id] as string[] | undefined) ?? []).length) continue;
    for (const c of clientes) if (!porCliente.has(c.id) && emparejaAsignacion(a.name, c)) porCliente.set(c.id, est);
  }
  const ids = [...new Set(porCliente.values())];
  if (!ids.length) return out;
  const personas = await d
    .select({ id: pulseUsers.id, email: pulseUsers.email, nombre: pulseUsers.nombre, slackId: desempenoPerfiles.slackId })
    .from(pulseUsers)
    .leftJoin(desempenoPerfiles, eq(desempenoPerfiles.userId, pulseUsers.id))
    .where(inArray(pulseUsers.id, ids));
  const porId = new Map(personas.map((x) => [x.id, x]));
  for (const [cliente, est] of porCliente) {
    const x = porId.get(est);
    if (x) out.set(cliente, { email: x.email, nombre: x.nombre, slackId: x.slackId ?? null });
  }
  return out;
}
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
  muestraError?: string;
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
    d.select({ id: pulseColumns.id, title: pulseColumns.title, type: pulseColumns.type, settings: pulseColumns.settings }).from(pulseColumns).where(eq(pulseColumns.boardId, board.id)),
    d.select({ id: pulseGroups.id, title: pulseGroups.title }).from(pulseGroups).where(eq(pulseGroups.boardId, board.id)),
  ]);
  const cId = columnas.find((c) => /^id cuenta publicitaria$/i.test(c.title));
  if (!cId) return { ...vacio, error: "sin-columna-id" };
  const cEmpresa = columnas.find((c) => /^empresa$/i.test(c.title));
  const cPersonas = columnas.find((c) => c.type === "people");
  const cSetup = columnas.find((c) => /status del set ?up/i.test(c.title));
  const cProgreso = columnas.find((c) => /^progreso$/i.test(c.title));
  // Solo los grupos de clientes con servicio de anuncios (no bajas ni los programas Inner Circle / Accelerator).
  const fuera = grupos.filter((g) => !/cliente activo|onboarding|an[aá]lisis/i.test(g.title)).map((g) => g.id);

  const items = await d
    .select({ id: pulseItems.id, name: pulseItems.name, groupId: pulseItems.groupId, values: pulseItems.values, createdAt: pulseItems.createdAt })
    .from(pulseItems)
    .where(and(eq(pulseItems.boardId, board.id), fuera.length ? notInArray(pulseItems.groupId, fuera) : undefined, o.itemId ? eq(pulseItems.id, o.itemId) : undefined));

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

  const grupoDe = new Map(grupos.map((g) => [g.id, g.title]));
  // Texto de una celda status/dropdown (guardan el id de la etiqueta) o de texto.
  const etiqueta = (c: (typeof columnas)[number] | undefined, v: Record<string, ValorCelda>): string | null => {
    if (!c) return null;
    const x = v[c.id];
    const ids = Array.isArray(x) ? x : [x];
    const labels = ((c.settings as { labels?: { id: string; label: string }[] } | null)?.labels ?? []);
    return ids.map((y) => labels.find((l) => l.id === y)?.label ?? (typeof y === "string" ? y : "")).join(" ") || null;
  };
  const ahora = Date.now();
  const objetivo = items.filter((i) => {
    if (o.itemId || o.completo) return true;
    const reciente = ahora - new Date(i.createdAt).getTime() < DIAS_NUEVA * 86_400_000;
    return reciente || esProblema(ultimo.get(i.id));
  });

  const usuario = await usuarioSistema("cuentas");
  const estrategaDe = await estrategas(items.map((i) => ({ id: i.id, name: i.name, empresa: cEmpresa ? ((i.values as Record<string, ValorCelda>)[cEmpresa.id] as string | null) ?? null : null })));
  type LineaD = Linea & { destino: string | null };
  const nuevos: LineaD[] = [];
  const recuperados: LineaD[] = [];
  const pendientesTodos: LineaD[] = []; // para el recordatorio del lunes
  const res: ResultadoCuentas = { ...vacio };

  const procesar = async (i: (typeof items)[number]) => {
    const v = i.values as Record<string, ValorCelda>;
    const id = limpiarId(v[cId.id]);
    const horas = (ahora - new Date(i.createdAt).getTime()) / 3_600_000;
    let estado: EstadoCuenta;
    let detalle: string;
    if (!id) {
      if (horas < HORAS_SIN_ID) return;
      if (!onboardingHecho({ grupo: grupoDe.get(i.groupId) ?? "", setup: etiqueta(cSetup, v), progreso: etiqueta(cProgreso, v) })) return; // el ID se pide en la reunión
      estado = "sin-id";
      detalle = "falta el ID de la cuenta publicitaria";
    } else {
      ({ estado, detalle } = clasificar(await consultarMeta(id)));
    }
    res.revisadas++;
    const est = estrategaDe.get(i.id);
    const linea: LineaD = {
      destino: est?.email ?? null,
      nombre: i.name,
      empresa: cEmpresa ? ((v[cEmpresa.id] as string) ?? null) : null,
      id,
      estado,
      detalle,
      admin: est?.nombre ?? (cPersonas ? (((v[cPersonas.id] as string[] | undefined) ?? []).map((u) => nombres.get(u)).filter(Boolean)[0] ?? null) : null),
    };
    if (estado === "transitorio") { res.transitorios++; res.muestraError ??= detalle; return; }
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
    const slackDe = new Map([...estrategaDe.values()].map((e) => [e.email.toLowerCase(), e.slackId]));
    const grupos = repartirAvisos({ nuevos: recordatorio ? pendientesTodos : nuevos, recuperados }, AVISAR_A, SIN_ESTRATEGA);
    for (const g of grupos) {
      const texto = textoAviso({ nuevos: g.nuevos, recuperados: g.recuperados, recordatorio: !!recordatorio, rol: g.rol });
      if (texto && (await dmSlack(g.email, texto, slackDe.get(g.email.toLowerCase())))) res.avisados++;
    }
  }
  // Si Meta/el token falla en masa en la pasada diaria, es problema nuestro, no de los clientes: se le avisa a Elvin.
  if (o.completo && o.avisar !== false && res.transitorios >= 5) {
    await notificarCEO(`⚠️ La revisión de cuentas publicitarias no pudo leer ${res.transitorios} cuentas por un error de Meta o del token (META_ADS_TOKEN). Probablemente venció: renuévalo desde Bori.`).catch(() => null);
  }
  return res;
}
