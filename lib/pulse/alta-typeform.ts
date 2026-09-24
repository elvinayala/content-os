import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "./db";
import { avisarCambio } from "./puente-n8n";
import { actualizarValor, crearItem } from "./repo";
import { pulseActivity, pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "./schema";
import { type DatosOnboarding, resumenOnboarding } from "./typeform";
import type { ValorCelda } from "./types";

// Alta automática del cliente en Pulse cuando llena el Typeform de onboarding (después de
// pagar). Reemplaza la integración Typeform → Monday. Idempotente por el token de la
// respuesta; si el cliente ya existe (mismo e-mail o teléfono) completa lo vacío en vez de
// duplicarlo. Deja TODAS las respuestas como comentario en la ficha.

const EMAIL_SISTEMA = "typeform@pulse.sistema";

async function usuarioTypeform(): Promise<string> {
  const d = await db();
  const [u] = await d.select({ id: pulseUsers.id }).from(pulseUsers).where(eq(pulseUsers.email, EMAIL_SISTEMA));
  if (u) return u.id;
  // Usuario de sistema: inactivo y sin clave, nadie puede entrar con él. Solo firma la actividad.
  const [n] = await d.insert(pulseUsers).values({ email: EMAIL_SISTEMA, nombre: "Typeform (automático)", rol: "miembro", activo: false, passwordHash: null, color: "purple" }).returning({ id: pulseUsers.id });
  return n.id;
}

const soloDigitos = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

export interface ResultadoAlta {
  estado: "creado" | "actualizado" | "repetido";
  itemId: string;
  nombre: string;
  tablero: string;
}

export async function altaDesdeTypeform(datos: DatosOnboarding, opciones: { tablero?: string } = {}): Promise<ResultadoAlta> {
  const d = await db();
  const slug = opciones.tablero ?? process.env.PULSE_TYPEFORM_BOARD ?? "level-up-media";
  const [board] = await d.select().from(pulseBoards).where(eq(pulseBoards.slug, slug));
  if (!board) throw new Error(`No existe el tablero ${slug}`);

  // Idempotencia: Typeform reintenta si no contestamos 2xx a tiempo.
  const [yaVisto] = await d
    .select({ itemId: pulseActivity.itemId })
    .from(pulseActivity)
    .where(and(eq(pulseActivity.boardId, board.id), sql`${pulseActivity.after}->>'typeform' = ${datos.token}`))
    .limit(1);
  if (yaVisto) return { estado: "repetido", itemId: yaVisto.itemId, nombre: datos.nombreCompleto, tablero: slug };

  const columnas = await d.select().from(pulseColumns).where(eq(pulseColumns.boardId, board.id));
  const col = (re: RegExp) => columnas.find((c) => re.test(c.title));
  const cEmpresa = col(/^empresa$/i);
  const cTel = columnas.find((c) => c.type === "phone") ?? col(/tel[eé]fono/i);
  const cEmail = columnas.find((c) => c.type === "email") ?? col(/e-?mail/i);
  const cUbic = col(/pueblo|ubicaci[oó]n/i);

  const deseados: [typeof cEmpresa, ValorCelda][] = [
    [cEmpresa, datos.campos.negocio ?? null],
    [cTel, datos.telefono],
    [cEmail, datos.email],
    [cUbic, datos.campos.ubicacion ?? null],
  ];

  // ¿Ya existe? mismo e-mail o mismo teléfono en este tablero.
  const items = await d.select({ id: pulseItems.id, name: pulseItems.name, values: pulseItems.values }).from(pulseItems).where(eq(pulseItems.boardId, board.id));
  const tel = datos.telefono ? soloDigitos(datos.telefono) : null;
  const existente = items.find((i) => {
    const v = i.values as Record<string, ValorCelda>;
    const e = cEmail ? String(v[cEmail.id] ?? "").toLowerCase() : "";
    const t = cTel ? soloDigitos(String(v[cTel.id] ?? "")) : "";
    return (datos.email && e === datos.email) || (tel && tel.length >= 10 && t === tel);
  });

  const userId = await usuarioTypeform();
  let itemId: string;
  let estado: ResultadoAlta["estado"];
  let nombre = datos.nombreCompleto;

  if (existente) {
    itemId = existente.id;
    nombre = existente.name;
    estado = "actualizado";
    const v = existente.values as Record<string, ValorCelda>;
    // Solo completa lo vacío: nunca pisa lo que el equipo ya cargó a mano.
    for (const [c, valor] of deseados) {
      if (!c || valor == null || valor === "") continue;
      if (v[c.id] != null && v[c.id] !== "") continue;
      await actualizarValor({ itemId, columnId: c.id, value: valor, userId });
    }
  } else {
    const grupos = await d.select().from(pulseGroups).where(eq(pulseGroups.boardId, board.id)).orderBy(asc(pulseGroups.position));
    const grupo = grupos.find((g) => /onboarding/i.test(g.title)) ?? grupos[0];
    if (!grupo) throw new Error(`El tablero ${slug} no tiene grupos`);
    const values: Record<string, ValorCelda> = {};
    for (const [c, valor] of deseados) if (c && valor != null && valor !== "") values[c.id] = valor;
    const item = await crearItem({ boardId: board.id, groupId: grupo.id, name: datos.nombreCompleto, userId, values, alInicio: true });
    itemId = item.id;
    estado = "creado";
  }

  await d.insert(pulseActivity).values({
    itemId,
    boardId: board.id,
    tipo: "comentario",
    after: { texto: resumenOnboarding(datos), typeform: datos.token },
    userId,
  });
  if (slug === "level-up-media") avisarCambio({ itemIds: [itemId], motivo: "typeform" });
  return { estado, itemId, nombre, tablero: slug };
}
