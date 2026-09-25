import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { inArray } from "drizzle-orm";

import { db } from "./db";
import { hoyPR } from "./motor-reglas";
import { consultar, type Consulta, type FilaPlana } from "./preguntar";
import { pulseBoards, pulseColumns, pulseGroups, pulseItems, pulseUsers } from "./schema";
import type { SettingsColumna, TipoColumna, ValorCelda } from "./types";
import { textoDeValor } from "./valores";

const MODELO = process.env.PULSE_PREGUNTAR_MODEL || "claude-opus-5";
const MAX_VUELTAS = 6;

export interface ItemRespuesta {
  id: string;
  nombre: string;
  slug: string;
  tablero: string;
  grupo: string;
  nota?: string;
}

export interface RespuestaCRM {
  respuesta: string;
  items: ItemRespuesta[];
}

interface Datos {
  filas: FilaPlana[];
  esquema: string;
}

// Aplana los tableros que esta persona puede ver. Nada de tableros ajenos entra al modelo.
async function cargar(boardIds: string[]): Promise<Datos> {
  const d = await db();
  const [boards, columns, groups, items, usuarios] = await Promise.all([
    d.select().from(pulseBoards).where(inArray(pulseBoards.id, boardIds)),
    d.select().from(pulseColumns).where(inArray(pulseColumns.boardId, boardIds)),
    d.select().from(pulseGroups).where(inArray(pulseGroups.boardId, boardIds)),
    d.select({ id: pulseItems.id, boardId: pulseItems.boardId, groupId: pulseItems.groupId, name: pulseItems.name, values: pulseItems.values }).from(pulseItems).where(inArray(pulseItems.boardId, boardIds)),
    d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre }).from(pulseUsers),
  ]);
  const nombresItems = items.map((i) => ({ id: i.id, name: i.name }));
  const grupoPorId = new Map(groups.map((g) => [g.id, g.title]));
  const filas: FilaPlana[] = [];
  const partes: string[] = [];
  for (const b of [...boards].sort((a, z) => a.position - z.position)) {
    const cols = columns.filter((c) => c.boardId === b.id).sort((a, z) => a.position - z.position);
    const suyos = items.filter((i) => i.boardId === b.id);
    for (const i of suyos) {
      const values = (i.values ?? {}) as Record<string, ValorCelda>;
      const campos: FilaPlana["campos"] = {};
      for (const c of cols) {
        const v = values[c.id];
        const s = (c.settings ?? {}) as SettingsColumna;
        if (c.type === "number") campos[c.title] = typeof v === "number" ? v : null;
        else campos[c.title] = textoDeValor(c.type as TipoColumna, v, { labels: s.labels, usuarios, items: nombresItems }) || null;
      }
      filas.push({ id: i.id, nombre: i.name, tablero: b.slug, tableroNombre: b.nombre, grupo: grupoPorId.get(i.groupId) ?? "", campos });
    }
    const gruposTxt = groups
      .filter((g) => g.boardId === b.id)
      .sort((a, z) => a.position - z.position)
      .map((g) => `${g.title} (${suyos.filter((i) => i.groupId === g.id).length})`)
      .join(" · ");
    const colsTxt = cols
      .map((c) => {
        const labels = ((c.settings ?? {}) as SettingsColumna).labels?.map((l) => l.label).filter(Boolean) ?? [];
        return `  - ${c.title} [${c.type}]${labels.length ? `: ${labels.slice(0, 40).join(" | ")}` : ""}`;
      })
      .join("\n");
    partes.push(`## ${b.nombre} (slug: ${b.slug}) — ${suyos.length} clientes\nGrupos: ${gruposTxt}\nColumnas:\n${colsTxt}`);
  }
  return { filas, esquema: partes.join("\n\n") };
}

const INSTRUCCIONES = `Eres el buscador del CRM Pulse de Level Up Media (una agencia de marketing en Puerto Rico). El equipo te pregunta en lenguaje natural por sus clientes y tú respondes con datos reales del CRM.

Cómo trabajas:
- Usa la herramienta "buscar" para consultar. Traduce la pregunta a condiciones sobre las columnas y etiquetas que aparecen en el esquema (usa los nombres de etiqueta tal cual; "contiene" sirve cuando la etiqueta es parecida pero no exacta). Puedes buscar varias veces para afinar.
- "Se fueron", "bajas", "cancelaron" = grupo OFFBOARDED (o columna Razón de Baja). "Activos" = grupo CLIENTE ACTIVO, salvo que la pregunta diga otra cosa.
- Si una etiqueta de la pregunta no existe tal cual, prueba la más parecida y dilo en la respuesta.
- Nunca inventes clientes, cifras ni fechas: todo sale de "buscar". Si no hay resultados, dilo.
- Termina SIEMPRE llamando a "responder" con una respuesta breve (1-3 oraciones, español de Puerto Rico con tuteo) y los clientes que respondan la pregunta (hasta 100). La lista se muestra aparte, así que en el texto NO repitas los nombres: da el total y lo que haya que destacar. A cada cliente ponle una nota corta (máx. ~8 palabras) con el dato que importa para la pregunta (p. ej. la empresa, el monto o la fecha).
- Si la pregunta es de conteo o resumen, da los números en el texto y lista los clientes solo cuando sean pocos.`;

const HERRAMIENTAS: Anthropic.Beta.BetaTool[] = [
  {
    name: "buscar",
    description:
      "Filtra los clientes de los tableros visibles. Todas las condiciones se combinan con Y. Las comparaciones ignoran mayúsculas y acentos. Devuelve el total, los primeros resultados (con las columnas usadas en condiciones + las de 'mostrar') y, si se pide, un conteo por columna.",
    input_schema: {
      type: "object",
      properties: {
        tableros: { type: "array", items: { type: "string" }, description: "Slugs o nombres de tablero. Vacío = todos." },
        grupos: { type: "array", items: { type: "string" }, description: "Títulos de grupo (coincidencia parcial). Vacío = todos." },
        excluir_grupos: { type: "array", items: { type: "string" } },
        condiciones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              columna: { type: "string", description: "Título exacto de la columna (o 'nombre')." },
              op: { type: "string", enum: ["es", "no_es", "contiene", "no_contiene", "vacio", "no_vacio", "mayor", "menor", "entre"] },
              valor: { type: ["string", "number"], description: "Etiqueta, texto, número o fecha YYYY-MM-DD." },
              valor2: { type: ["string", "number"], description: "Solo para 'entre'." },
            },
            required: ["columna", "op"],
          },
        },
        texto: { type: "string", description: "Búsqueda libre en el nombre y todos los campos." },
        contar_por: { type: "string", description: "Columna (o 'grupo') para devolver cuántos hay por valor." },
        mostrar: { type: "array", items: { type: "string" }, description: "Columnas extra a devolver por cliente." },
        limite: { type: "integer", description: "Máximo de clientes a devolver (1-100, por defecto 40)." },
      },
    },
  },
  {
    name: "responder",
    description: "Entrega la respuesta final a la persona. Llámala una sola vez, al final.",
    input_schema: {
      type: "object",
      properties: {
        respuesta: { type: "string", description: "Respuesta breve en español de Puerto Rico (tuteo)." },
        clientes: {
          type: "array",
          description: "Clientes a listar, en el orden a mostrar.",
          items: {
            type: "object",
            properties: { id: { type: "string" }, nota: { type: "string", description: "Dato corto relevante para la pregunta." } },
            required: ["id"],
          },
        },
      },
      required: ["respuesta", "clientes"],
    },
  },
];

export async function preguntarAlCRM(pregunta: string, boardIds: string[]): Promise<RespuestaCRM> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY en el servidor");
  if (!boardIds.length) return { respuesta: "No tienes tableros para consultar.", items: [] };
  const { filas, esquema } = await cargar(boardIds);
  const porId = new Map(filas.map((f) => [f.id, f]));
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: `Hoy es ${hoyPR()}.\n\nPregunta: ${pregunta}` }];
  let ultimosIds: string[] = [];

  // Solo se devuelven ids que existen en los tableros visibles (lo demás se descarta).
  const armar = (respuesta: string, lista: { id: string; nota?: string }[]): RespuestaCRM => {
    const vistos = new Set<string>();
    const items: ItemRespuesta[] = [];
    for (const { id, nota } of lista) {
      const f = porId.get(id);
      if (!f || vistos.has(id) || items.length >= 100) continue;
      vistos.add(id);
      items.push({ id: f.id, nombre: f.nombre, slug: f.tablero, tablero: f.tableroNombre, grupo: f.grupo, nota: nota?.slice(0, 120) || undefined });
    }
    return { respuesta, items };
  };
  const deIds = (ids: string[]) => ids.map((id) => ({ id }));

  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
    const params = {
      model: MODELO,
      max_tokens: 16000,
      thinking: { type: "adaptive" as const },
      output_config: { effort: (process.env.PULSE_PREGUNTAR_EFFORT || "low") as "low" | "medium" | "high" },
      system: [
        { type: "text" as const, text: INSTRUCCIONES },
        { type: "text" as const, text: `# Tableros que puedes consultar\n\n${esquema}`, cache_control: { type: "ephemeral" as const } },
      ],
      tools: HERRAMIENTAS,
      messages,
      // Si un clasificador declina, el servidor reintenta en el modelo de respaldo.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    };
    const resp = await anthropic.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
    if (resp.stop_reason === "refusal") return armar("No pude responder esa pregunta. Prueba con otras palabras.", []);
    messages.push({ role: "assistant", content: resp.content as Anthropic.Beta.BetaContentBlockParam[] });

    const usos = resp.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    const final = usos.find((u) => u.name === "responder");
    if (final) {
      const inp = final.input as { respuesta?: unknown; clientes?: unknown };
      const lista = Array.isArray(inp.clientes)
        ? inp.clientes
            .filter((c): c is { id: string; nota?: unknown } => !!c && typeof (c as { id?: unknown }).id === "string")
            .map((c) => ({ id: c.id, nota: typeof c.nota === "string" ? c.nota : undefined }))
        : deIds(ultimosIds);
      return armar(typeof inp.respuesta === "string" ? inp.respuesta : "", lista);
    }
    if (!usos.length) {
      const texto = resp.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return armar(texto || "No encontré una respuesta.", deIds(ultimosIds));
    }
    const resultados: Anthropic.Beta.BetaToolResultBlockParam[] = usos.map((u) => {
      try {
        const r = consultar(filas, u.input as Consulta);
        ultimosIds = r.items.map((i) => i.id);
        return { type: "tool_result", tool_use_id: u.id, content: JSON.stringify(r) };
      } catch (e) {
        return { type: "tool_result", tool_use_id: u.id, is_error: true, content: e instanceof Error ? e.message : "Consulta inválida" };
      }
    });
    messages.push({ role: "user", content: resultados });
  }
  return armar("La pregunta necesitó demasiadas búsquedas. Prueba a hacerla más concreta.", deIds(ultimosIds));
}
