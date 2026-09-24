import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "./db";
import { avisarCambio } from "./puente-n8n";
import { actualizarValor, crearItem } from "./repo";
import { pulseActivity, pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "./schema";
import { type DatosOnboarding, resumenOnboarding } from "./typeform";
import type { SettingsColumna, TipoColumna, ValorCelda } from "./types";
import { validarValor } from "./valores";

// Alta automática del cliente en Pulse cuando llena el onboarding (después de pagar): sirve al
// Typeform viejo (vlfCgUUP) y al formulario propio de Level Up (/onboarding/level-up).
// Idempotente por `token`; si el cliente ya existe (mismo e-mail o teléfono) completa solo lo
// vacío en vez de duplicarlo. Deja TODAS las respuestas como comentario en la ficha.

const USUARIOS_SISTEMA = {
  typeform: { email: "typeform@pulse.sistema", nombre: "Typeform (automático)" },
  formulario: { email: "onboarding@pulse.sistema", nombre: "Onboarding (automático)" },
} as const;
export type OrigenOnboarding = keyof typeof USUARIOS_SISTEMA;

async function usuarioSistema(origen: OrigenOnboarding): Promise<string> {
  const d = await db();
  const { email, nombre } = USUARIOS_SISTEMA[origen];
  const [u] = await d.select({ id: pulseUsers.id }).from(pulseUsers).where(eq(pulseUsers.email, email));
  if (u) return u.id;
  // Usuario de sistema: inactivo y sin clave, nadie puede entrar con él. Solo firma la actividad.
  const [n] = await d.insert(pulseUsers).values({ email, nombre, rol: "miembro", activo: false, passwordHash: null, color: "purple" }).returning({ id: pulseUsers.id });
  return n.id;
}

const soloDigitos = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Convierte una respuesta en texto al valor que guarda esa columna. null = no aplica.
function aValorColumna(tipo: TipoColumna, settings: SettingsColumna, crudo: string): ValorCelda {
  const labels = settings.labels ?? [];
  try {
    if (tipo === "status" || tipo === "dropdown") {
      const buscado = crudo.startsWith("Otra:") ? "otro" : norm(crudo);
      const l = labels.find((x) => norm(x.label) === buscado) ?? (crudo.startsWith("Otra:") ? labels.find((x) => norm(x.label) === "otro") : undefined);
      if (!l) return null;
      return validarValor(tipo, tipo === "dropdown" ? [l.id] : l.id, settings);
    }
    return validarValor(tipo, crudo, settings);
  } catch {
    return null;
  }
}

export interface EntradaOnboarding {
  token: string;
  nombreCompleto: string;
  email: string | null;
  telefono: string | null;
  columnas: Record<string, string>; // título de columna en Pulse → respuesta en texto
  resumen: string; // comentario con todas las respuestas
}

export interface ResultadoAlta {
  estado: "creado" | "actualizado" | "repetido";
  itemId: string;
  nombre: string;
  tablero: string;
}

export async function altaOnboarding(e: EntradaOnboarding, opciones: { tablero?: string; origen: OrigenOnboarding }): Promise<ResultadoAlta> {
  const d = await db();
  const slug = opciones.tablero ?? process.env.PULSE_TYPEFORM_BOARD ?? "level-up-media";
  const [board] = await d.select().from(pulseBoards).where(eq(pulseBoards.slug, slug));
  if (!board) throw new Error(`No existe el tablero ${slug}`);

  // Idempotencia (reintentos de Typeform, doble click en el formulario).
  const [yaVisto] = await d
    .select({ itemId: pulseActivity.itemId })
    .from(pulseActivity)
    .where(and(eq(pulseActivity.boardId, board.id), sql`${pulseActivity.after}->>'typeform' = ${e.token}`))
    .limit(1);
  if (yaVisto) return { estado: "repetido", itemId: yaVisto.itemId, nombre: e.nombreCompleto, tablero: slug };

  const columnas = await d.select().from(pulseColumns).where(eq(pulseColumns.boardId, board.id));
  const cTel = columnas.find((c) => c.type === "phone");
  const cEmail = columnas.find((c) => c.type === "email");

  // Valores a escribir, ya convertidos al tipo de cada columna.
  const deseados: { id: string; valor: ValorCelda }[] = [];
  const entradas: [string, string | null][] = [...Object.entries(e.columnas), [cTel?.title ?? "", e.telefono], [cEmail?.title ?? "", e.email]];
  for (const [titulo, crudo] of entradas) {
    if (!titulo || crudo == null || !String(crudo).trim()) continue;
    const c = columnas.find((x) => norm(x.title) === norm(titulo));
    if (!c) continue;
    const valor = aValorColumna(c.type as TipoColumna, (c.settings ?? {}) as SettingsColumna, String(crudo).trim());
    if (valor != null && valor !== "") deseados.push({ id: c.id, valor });
  }

  // ¿Ya existe? mismo e-mail o mismo teléfono en este tablero.
  const items = await d.select({ id: pulseItems.id, name: pulseItems.name, values: pulseItems.values }).from(pulseItems).where(eq(pulseItems.boardId, board.id));
  const tel = e.telefono ? soloDigitos(e.telefono) : null;
  const existente = items.find((i) => {
    const v = i.values as Record<string, ValorCelda>;
    const em = cEmail ? String(v[cEmail.id] ?? "").toLowerCase() : "";
    const t = cTel ? soloDigitos(String(v[cTel.id] ?? "")) : "";
    return (e.email && em === e.email) || (tel && tel.length >= 10 && t === tel);
  });

  const userId = await usuarioSistema(opciones.origen);
  let itemId: string;
  let estado: ResultadoAlta["estado"];
  let nombre = e.nombreCompleto;

  if (existente) {
    itemId = existente.id;
    nombre = existente.name;
    estado = "actualizado";
    const v = existente.values as Record<string, ValorCelda>;
    // Solo completa lo vacío: nunca pisa lo que el equipo ya cargó a mano.
    for (const { id, valor } of deseados) {
      const actual = v[id];
      if (actual != null && actual !== "" && !(Array.isArray(actual) && actual.length === 0)) continue;
      await actualizarValor({ itemId, columnId: id, value: valor, userId });
    }
  } else {
    const grupos = await d.select().from(pulseGroups).where(eq(pulseGroups.boardId, board.id)).orderBy(asc(pulseGroups.position));
    const grupo = grupos.find((g) => /onboarding/i.test(g.title)) ?? grupos[0];
    if (!grupo) throw new Error(`El tablero ${slug} no tiene grupos`);
    const values: Record<string, ValorCelda> = Object.fromEntries(deseados.map((x) => [x.id, x.valor]));
    const item = await crearItem({ boardId: board.id, groupId: grupo.id, name: e.nombreCompleto, userId, values, alInicio: true });
    itemId = item.id;
    estado = "creado";
  }

  await d.insert(pulseActivity).values({ itemId, boardId: board.id, tipo: "comentario", after: { texto: e.resumen, typeform: e.token }, userId });
  if (slug === "level-up-media") avisarCambio({ itemIds: [itemId], motivo: `onboarding:${opciones.origen}` });
  return { estado, itemId, nombre, tablero: slug };
}

// Typeform viejo (vlfCgUUP) → misma alta.
export async function altaDesdeTypeform(datos: DatosOnboarding, opciones: { tablero?: string } = {}): Promise<ResultadoAlta> {
  return altaOnboarding(
    {
      token: datos.token,
      nombreCompleto: datos.nombreCompleto,
      email: datos.email,
      telefono: datos.telefono,
      columnas: { Empresa: datos.campos.negocio ?? "", "Pueblo / ubicación": datos.campos.ubicacion ?? "" },
      resumen: resumenOnboarding(datos),
    },
    { tablero: opciones.tablero, origen: "typeform" },
  );
}
