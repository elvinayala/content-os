import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { AGENTES_IA, ladoAgente } from "@/lib/desempeno/agentes-ia";
import { DIRECCION, reportesAgentesEntre } from "@/lib/desempeno/agentes-reportes";
import { tramosEntre } from "@/lib/desempeno/calendario";
import { listarVacantes } from "@/lib/desempeno/carreras";
import { actorRitmo, armarPanel, estadoPonche, modoScore } from "@/lib/desempeno/datos";
import { personasRank } from "@/lib/desempeno/ranking-datos";
import { rankingMes } from "@/lib/desempeno/ranking";
import { fechaPR, esMaestro } from "@/lib/desempeno/reglas";
import { reporteDeHoy } from "@/lib/desempeno/reporte-dia-datos";
import { aUsuario, tipoAcceso } from "@/lib/pulse/auth";
import { db } from "@/lib/pulse/db";
import { pendientesDe } from "@/lib/pulse/mi-dia-datos";
import { armarClientes } from "@/lib/pulse/puente-n8n";
import { actividadReciente, boardsVisibles, buscarItems, buscarUsuarioPorEmail, clientesInicio, listarBoards, ultimosClientes } from "@/lib/pulse/repo";
import { pulseBoards } from "@/lib/pulse/schema";
import { secretoValido } from "@/lib/pulse/seguridad";
import type { UsuarioPulse } from "@/lib/pulse/types";
import { limpiar } from "@/lib/aicore-datos";

// AI Core lee Pulse y Ritmo (13-oct, Elvin: "aliméntame de Ritmo y Pulse; Carilin y Aure igual deben recibir datos").
//   GET /api/aicore/datos?fuente=pulse|ritmo&vista=…&email=<persona>[&q=][&desde=&hasta=]
// SOLO LECTURA y con los permisos que esa persona YA tiene: tableros visibles (boardsVisibles, con privados y
// bloqueos), vistas de maestro en Ritmo y el score solo donde Ritmo lo muestra. Exclusiones aprobadas por Elvin
// (13-oct): nunca salarios, fichas ni documentos de personas; ni IPs/dispositivos; ni viajes; ni teléfonos o correos
// de clientes; ni el score para quien no lo ve hoy. Solo las 3 personas de dirección (DIRECCION); cualquier otra, 403.
// Auth: x-aicore-secret = AICORE_AGENTES_SECRET (el mismo de /api/agentes), en tiempo constante.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PERMITIDOS = new Set<string>(Object.values(DIRECCION));
const SLUG_CLIENTES = "level-up-media";

const json = (o: unknown, status = 200) => NextResponse.json(o, { status, headers: { "Cache-Control": "no-store" } });

const esFecha = (x: string | null) => (x && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : null);
const restarDias = (fecha: string, n: number) => new Date(Date.parse(`${fecha}T12:00:00Z`) - n * 864e5).toISOString().slice(0, 10);

async function vistaPulse(u: UsuarioPulse, vista: string, q: string) {
  const visibles = await boardsVisibles(u);
  const boardIds = [...visibles];
  if (!boardIds.length) return { error: "Esta persona no tiene tableros de Pulse.", status: 403 };
  switch (vista) {
    case "resumen": {
      const [tableros, inicio] = await Promise.all([listarBoards(u), clientesInicio(boardIds)]);
      const listas = Object.fromEntries(Object.entries(inicio ?? {}).map(([k, fichas]) => [k, { total: fichas.length, ejemplos: fichas.slice(0, 15).map((f) => ({ nombre: f.nombre, empresa: f.empresa, marca: f.marca, grupo: f.grupo })) }]));
      return { tableros, clientes: listas };
    }
    case "negocios": {
      const d = await db();
      const [b] = await d.select({ id: pulseBoards.id }).from(pulseBoards).where(eq(pulseBoards.slug, SLUG_CLIENTES));
      if (!b || !visibles.has(b.id)) return { error: "El tablero de clientes de Level Up no es visible para esta persona.", status: 403 };
      const clientes = await armarClientes();
      // Compacto (13-oct): los ~930 clientes completos pesan 150 KB. Conteos por grupo + la lista de ACTIVOS; el resto, con buscar.
      const porGrupo: Record<string, number> = {};
      for (const c of clientes) porGrupo[c.grupo || "(sin grupo)"] = (porGrupo[c.grupo || "(sin grupo)"] ?? 0) + 1;
      const activos = clientes.filter((c) => c.activo);
      return { total: clientes.length, activos: activos.length, porGrupo, clientesActivos: activos.map((c) => ({ negocio: c.empresa || c.nombre, contacto: c.nombre, industria: c.industria, admin: c.admin?.nombre ?? null, traffiker: c.traffiker?.nombre ?? null })), nota: "Para un cliente que no está activo, usa la vista buscar." };
    }
    case "mi-dia": {
      const { pendientes, hoy } = await pendientesDe(boardIds);
      const mios = pendientes.filter((p) => p.personas.includes(u.id));
      return { hoy, mios: mios.map(({ personas: _p, ...p }) => p), delEquipo: pendientes.length };
    }
    case "buscar": {
      if (q.length < 2) return { error: "Falta q (mínimo 2 letras).", status: 400 };
      return { resultados: (await buscarItems(boardIds, q, 20)).map(({ itemId: _i, ...r }) => r) };
    }
    case "actividad":
      return { eventos: (await actividadReciente(boardIds, 25)).map((e) => ({ tipo: e.tipo, at: e.at, quien: e.usuario?.nombre ?? null, item: e.item.nombre, tablero: e.board.nombre, columna: e.columna, grupo: e.grupo, texto: e.texto?.slice(0, 300) ?? null })) };
    case "ultimos":
      return { clientes: (await ultimosClientes(boardIds, 15)).map(({ itemId: _i, ...c }) => c) };
  }
  return { error: "Vista de Pulse desconocida.", status: 400 };
}

async function vistaRitmo(u: UsuarioPulse, vista: string, desdeQ: string | null, hastaQ: string | null) {
  const actor = { ...actorRitmo(u) };
  const maestro = esMaestro(actor);
  const score = modoScore(u.rol) !== "oculto";
  const hoy = fechaPR(Date.now());
  const hasta = hastaQ ?? hoy;
  switch (vista) {
    case "hoy":
      return { ponche: await estadoPonche(u.id, true) };
    case "equipo": {
      if (!maestro) return { error: "Equipo es solo para maestros en Ritmo.", status: 403 };
      const panel = await armarPanel(actor, desdeQ ?? hoy, hasta);
      const reporte = await reporteDeHoy(panel.filas);
      return {
        hoy: panel.hoy,
        personas: panel.filas.map((f) => ({ nombre: f.perfil.nombre, puesto: f.puestoNombre, departamento: f.departamento, empresa: f.perfil.empresa, hoy: { estado: f.hoy.asistencia.estado, minutosTarde: f.hoy.asistencia.minutosTarde, bloqueos: f.hoy.reporte?.bloqueos ?? null }, ...(score ? { scoreSemana: f.scoreSemana } : {}) })),
        reporte: score ? reporte : { ...reporte, rendimiento: undefined },
      };
    }
    case "ranking": {
      if (!maestro || !score) return { error: "El ranking usa el score, que hoy solo ve Elvin.", status: 403 };
      const panel = await armarPanel(actor, `${hoy.slice(0, 8)}01`, hoy);
      return { mes: hoy.slice(0, 7), ranking: rankingMes(personasRank(panel.filas)) };
    }
    case "calendario": {
      if (!maestro) return { error: "El calendario completo es solo para maestros en Ritmo.", status: 403 };
      return { tramos: await tramosEntre(desdeQ ?? hoy, hastaQ ?? restarDias(hoy, -30)) };
    }
    case "agentes": {
      if (!maestro || (u.rol !== "admin" && u.rol !== "editor")) return { error: "Los reportes de los agentes son para dirección.", status: 403 };
      const reportes = await reportesAgentesEntre(desdeQ ?? restarDias(hoy, 6), hasta);
      // Sin salarios ni el costo del lado humano (exclusión de Elvin): solo lo que hicieron los agentes.
      return { agentes: AGENTES_IA.map((a) => ({ id: a.id, nombre: a.nombre })), reportes, totales: ladoAgente(reportes as never).totales };
    }
    case "vacantes":
      return { vacantes: await listarVacantes(false) };
  }
  return { error: "Vista de Ritmo desconocida.", status: 400 };
}

export async function GET(req: NextRequest) {
  if (!secretoValido(req.headers.get("x-aicore-secret"), process.env.AICORE_AGENTES_SECRET)) return json({ error: "no-autorizado" }, 401);
  const p = req.nextUrl.searchParams;
  const fuente = p.get("fuente");
  const vista = p.get("vista") ?? "";
  const email = (p.get("email") ?? "").toLowerCase().trim();
  if (!PERMITIDOS.has(email)) return json({ error: "Esa persona no tiene acceso a Pulse ni Ritmo desde AI Core." }, 403);
  const fila = await buscarUsuarioPorEmail(email);
  if (!fila || !fila.activo) return json({ error: "Esa persona no tiene una cuenta activa en Pulse/Ritmo." }, 403);
  const u = aUsuario(fila);
  if ((await tipoAcceso(u.id, u.rol)) !== "completo" && fuente === "pulse") return json({ error: "Sin acceso a los tableros de Pulse." }, 403);
  try {
    const r = fuente === "pulse" ? await vistaPulse(u, vista, (p.get("q") ?? "").slice(0, 120)) : fuente === "ritmo" ? await vistaRitmo(u, vista, esFecha(p.get("desde")), esFecha(p.get("hasta"))) : { error: "fuente debe ser pulse o ritmo", status: 400 };
    if ("error" in r && typeof r.error === "string" && "status" in r) return json({ error: r.error }, Number(r.status));
    return json(limpiar({ fuente, vista, persona: u.nombre, generadoEl: new Date().toISOString(), ...r }));
  } catch (e) {
    return json({ error: `No pude armar la vista: ${e instanceof Error ? e.message.slice(0, 200) : "error"}` }, 500);
  }
}
