import { type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { COOKIE_SESION, sesionValida } from "@/lib/auth";
import { leerNegocio } from "@/lib/negocio";
import { crearEncargo } from "@/lib/encargos";
import { listarSkills, leerSkill } from "@/lib/jarvis/skills";
import {
  frescura,
  leerDebriefReal,
  leerInsightsIG,
  leerOps,
} from "@/lib/ops";
import { buscarNotas, leerNota, listarNotas } from "@/lib/vault";
import {
  entidadesMasConectadas,
  leerEntidad,
  leerSintesisDoc,
  SINTESIS,
} from "@/lib/memoria";
import { leerGanchos } from "@/lib/ganchos";
import { buscarVideoYoutube } from "@/lib/video";
import { leerPipeline } from "@/lib/pipedrive";
import { leerZoomIntel } from "@/lib/zoom";
import { leerVentasEAlive } from "@/lib/ea-market";
import { leerSlackBorinquen } from "@/lib/slack-borinquen";
import { leerTareas } from "@/lib/tareas";
import { leerOnboardings } from "@/lib/onboardings";
import { leerPrioridades } from "@/lib/prioridades";
import { leerEmails } from "@/lib/emails";
import { leerGranola } from "@/lib/granola";
import { hoyISO } from "@/lib/format";
import { resumen, bombazos } from "@/lib/mock/metricas";
import type { LeadPipeline, TipoEncargo, UnidadOps } from "@/lib/types";

// Jarvis-live: el agente del HUD. Solo LEE (snapshots, vault, skills) y genera
// texto; los trabajos pesados van a la cola de encargos del worker local.

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-5";
const MAX_ITERACIONES = 6;
const MAX_MENSAJES = 16;

// Rate limit básico por instancia (suficiente para 1 usuario).
const ventanas = new Map<string, number[]>();
function rateLimitOk(clave: string): boolean {
  const ahora = Date.now();
  const ventana = (ventanas.get(clave) ?? []).filter(
    (t) => ahora - t < 5 * 60_000,
  );
  ventana.push(ahora);
  ventanas.set(clave, ventana);
  return ventana.length <= 20;
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "leer_metricas",
    description:
      "Métricas de contenido de Shadow Operator: resumen semanal (views, guardados, seguidores, DMs), bombazos, e insights de IG si existen.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "leer_ops",
    description:
      "Operaciones de una agencia desde Slack: wins de clientes y situaciones críticas con severidad. También el debrief consolidado del día.",
    input_schema: {
      type: "object",
      properties: {
        unidad: {
          type: "string",
          enum: ["level-up", "ai-borinquen"],
          description: "Qué agencia consultar",
        },
      },
      required: ["unidad"],
    },
  },
  {
    name: "leer_vault",
    description:
      "La memoria del sistema (notas de reuniones, Slack, ideas, estilo, decisiones). Sin argumento devuelve el índice; con slug devuelve la nota completa.",
    input_schema: {
      type: "object",
      properties: {
        nota: {
          type: "string",
          description: 'Slug de la nota, ej. "reuniones/2026-07-02-alejo-ai"',
        },
      },
    },
  },
  {
    name: "buscar_memoria",
    description:
      "Busca en TODA la memoria histórica: notas diarias de Slack (vault/slack), reuniones de Granola con decisiones y clientes mencionados (vault/reuniones), ideas y decisiones. Usala SIEMPRE para preguntas de rango temporal ('últimos 7 días', 'la semana pasada'), para historial de un cliente, o para saber qué se habló en reuniones.",
    input_schema: {
      type: "object",
      properties: {
        consulta: {
          type: "string",
          description: "Términos a buscar, ej. 'Joaquín González' o 'AutoFlow precios'",
        },
      },
      required: ["consulta"],
    },
  },
  {
    name: "leer_entidad",
    description:
      "La memoria COMPUESTA de una entidad (cliente, persona, tema, objeción): su nota acumulada + TODO lo que la menciona en reuniones, Slack y llamadas, con fechas. Usala para '¿qué sabemos de X?', el historial completo de un cliente, o para juntar todo lo dicho sobre un tema/objeción. Sin argumento devuelve las entidades más conectadas de la memoria.",
    input_schema: {
      type: "object",
      properties: {
        entidad: {
          type: "string",
          description: "Nombre de la entidad, ej. 'Yaritza Amaral', 'AutoFlow', 'precio'",
        },
      },
    },
  },
  {
    name: "sintesis",
    description:
      "La memoria destilada en DATA accionable: 'angulos-ganadores' (ángulos que están funcionando), 'objeciones-reales' (objeciones de las llamadas), 'ideas-de-data' (ideas de contenido de temas recurrentes), 'decisiones-negocio' (decisiones del CEO). Usala cuando pidan ideas/ángulos/objeciones basados en DATA real, no en intuición. Sin argumento lista qué síntesis hay.",
    input_schema: {
      type: "object",
      properties: {
        tipo: {
          type: "string",
          enum: [
            "angulos-ganadores",
            "objeciones-reales",
            "ideas-de-data",
            "decisiones-negocio",
          ],
          description: "Cuál síntesis leer",
        },
      },
    },
  },
  {
    name: "reproducir_video",
    description:
      "Pone un video en la PANTALLA del HUD (busca el mejor video de YouTube sobre el tema y lo reproduce). Usalo cuando el boss te pida ver/poner/darle play a un video sobre algo (ej. 'ponme un video del nuevo modelo de GPT', 'muéstrame ese anuncio'). Después del video, comentá en 1 frase qué pusiste.",
    input_schema: {
      type: "object",
      properties: {
        consulta: {
          type: "string",
          description: "Qué buscar, ej. 'nuevo modelo GPT OpenAI 2026 demo'",
        },
      },
      required: ["consulta"],
    },
  },
  {
    name: "listar_skills",
    description:
      "Lista las skills disponibles (los empleados entrenados: guionar reels, carruseles, historias, análisis, ideas).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "usar_skill",
    description:
      "Carga una skill (empleado entrenado) + el estilo de la marca para ejecutar una tarea de contenido. Usala SIEMPRE antes de escribir guiones, carruseles, historias, ideas o análisis.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: 'Ej. "guionar-reel"' },
        marca: {
          type: "string",
          enum: ["shadow-operator", "level-up", "ai-borinquen"],
          description: "Para qué marca se va a usar",
        },
      },
      required: ["nombre"],
    },
  },
  {
    name: "leer_pipeline",
    description:
      "Pipeline de ventas EN VIVO desde Pipedrive (Level Up + AI Borinquen): leads nuevos por día (hoy/ayer/7/15/30 días), leads abiertos por etapa, valor de retainer y onboardings (deals ganados). Usala para CUALQUIER pregunta de leads, ventas, prospectos o pipeline.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "leer_llamadas",
    description:
      "Zoom Intelligence EN VIVO. Trae las métricas de HOY (demos de closers, llamadas de setters, oportunidades calientes del día — se actualiza cada ~60s) Y el acumulado de los últimos 7 días, más objeciones frecuentes y alertas. Usala para '¿cuántos demos/llamadas hoy?', '¿cómo van los closers hoy?', etc.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "leer_ventas",
    description:
      "EA Market EN VIVO: ventas netas cerradas por mes y por agencia (Level Up + AI Borinquen) desde las hojas de Google Sheets. Usala para ingresos, facturación, revenue real cerrado.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "leer_granola",
    description:
      "Las reuniones de HOY del CEO desde Granola: resumen del día, qué habló en cada reunión, las decisiones que tomó y los pendientes/action items abiertos. Es la fuente que recoge el criterio de Elvin en crudo. Usala para '¿qué hablé hoy?', '¿qué quedó pendiente de mis reuniones?', '¿qué hablé con Aure/Heidy/el videógrafo?', o el resumen del día.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "leer_prioridades",
    description:
      "Las decisiones y prioridades estratégicas del CEO más allá de la salud de clientes: churn, estrategia de ventas/reactivación, temas administrativos, finanzas, equipo y producto. Incluye tareas pendientes del CEO y onboardings recientes. Usala cuando te pregunten qué es lo importante, qué decidir, o para dar recomendaciones estratégicas.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "leer_emails",
    description:
      "Lo importante de los correos del CEO (elvin@levelupmediapr.net, aiborinquen@gmail.com, info@levelupmediapr.net) ya resumido por el orquestador: ventas, cobros, clientes, temas urgentes. Usala para 'qué hay en el correo', 'algo importante en los emails', o para dar contexto de lo que llegó.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "leer_ganchos",
    description:
      "El Baúl de Ganchos: hooks guardados con transcripto y plantilla reutilizable.",
    input_schema: {
      type: "object",
      properties: {
        filtro: { type: "string", description: "Texto a buscar (opcional)" },
      },
    },
  },
  {
    name: "encargar_trabajo",
    description:
      "Encola un trabajo PESADO para el worker local (transcribir un perfil entero de IG, batch de ideas, análisis profundo de competidor). El resultado aparece en el vault en ~30-60 min.",
    input_schema: {
      type: "object",
      properties: {
        tipo: {
          type: "string",
          enum: [
            "transcribir-perfil",
            "ideas-ganadoras-batch",
            "analizar-competidor",
          ],
        },
        params: {
          type: "object",
          description: 'Ej. { "handle": "@perfil", "limite": "30" }',
        },
      },
      required: ["tipo"],
    },
  },
];

async function ejecutarTool(
  nombre: string,
  input: Record<string, unknown>,
): Promise<string> {
  try {
    switch (nombre) {
      case "leer_metricas": {
        const ig = await leerInsightsIG();
        return JSON.stringify({
          resumenSemanal: resumen.map(({ series: _s, ...m }) => m),
          bombazos,
          instagramShadow: ig
            ? { ...ig, frescura: frescura(ig.actualizadoEl) }
            : "sin snapshot de IG todavía (encargá transcribir-perfil o esperá el brief del lunes)",
        });
      }
      case "leer_ops": {
        const unidad = input.unidad as UnidadOps;
        const [ops, debrief, borinquen] = await Promise.all([
          leerOps(unidad),
          leerDebriefReal(),
          unidad === "ai-borinquen" ? leerSlackBorinquen() : Promise.resolve(null),
        ]);
        // AI Borinquen se lee EN VIVO por Slack API (no depende del snapshot).
        const opsFinal =
          unidad === "ai-borinquen" && borinquen?.conectado
            ? borinquen.ops
            : ops;
        return JSON.stringify({
          ops: opsFinal ?? "sin snapshot (corré /brief-ceo)",
          frescura: frescura(opsFinal?.actualizadoEl),
          debriefDelDia: debrief?.debrief ?? null,
        });
      }
      case "leer_pipeline": {
        const pipe = await leerPipeline();
        const abiertas = ["nuevo", "contactado", "calificado", "propuesta"];
        const hoy = hoyISO();
        const contar = (ls: LeadPipeline[], desde: string, hasta: string) =>
          ls.filter((l) => l.creadoEl && l.creadoEl >= desde && l.creadoEl <= hasta)
            .length;
        const porUnidad = (u: string) => {
          const ls = pipe.leads.filter((l) => l.unidad === u);
          return {
            hoy: contar(ls, hoy, hoy),
            ayer: contar(ls, hoyISO(-1), hoyISO(-1)),
            en7dias: contar(ls, hoyISO(-7), hoy),
            en30dias: contar(ls, hoyISO(-30), hoy),
            abiertos: ls.filter((l) => abiertas.includes(l.etapa)).length,
          };
        };
        return JSON.stringify({
          fuente: pipe.fuente,
          enVivo: pipe.fuente === "pipedrive",
          levelUp: porUnidad("level-up"),
          aiBorinquen: porUnidad("ai-borinquen"),
          onboardingsRecientes: pipe.onboardings.slice(0, 8),
          errores: pipe.errores,
        });
      }
      case "leer_llamadas": {
        const z = await leerZoomIntel();
        if (!z.conectado)
          return JSON.stringify({ conectado: false, error: z.error });
        return JSON.stringify({
          conectado: true,
          hoy: z.hoy, // demos de closers, setters, calientes DE HOY (tiempo real)
          ultimos7dias: z.metrics,
          objecionesTop: z.objecionesTop,
          alertas: z.alertas.slice(0, 6),
        });
      }
      case "leer_ventas": {
        const v = await leerVentasEAlive();
        return v
          ? JSON.stringify({ enVivo: true, fuente: v.fuente, meses: v.meses })
          : "EA Market no disponible ahora mismo.";
      }
      case "leer_granola": {
        const g = await leerGranola();
        return g
          ? JSON.stringify(g)
          : "Sin reuniones de Granola sincronizadas hoy todavía (lo actualiza /sync-granola).";
      }
      case "leer_prioridades": {
        const [prio, tareas, onbs] = await Promise.all([
          leerPrioridades(),
          leerTareas(),
          leerOnboardings(),
        ]);
        return JSON.stringify({
          prioridades: prio.prioridades,
          tareasCEO: tareas.tareas
            .filter((t) => t.requiereCEO && t.estado !== "hecha")
            .slice(0, 10),
          onboardingsRecientes: onbs.onboardings.slice(0, 6),
        });
      }
      case "leer_vault": {
        if (typeof input.nota === "string" && input.nota) {
          const nota = await leerNota(input.nota);
          return nota
            ? JSON.stringify(nota)
            : `No existe la nota "${input.nota}". Pedí el índice sin argumento.`;
        }
        return JSON.stringify(await listarNotas());
      }
      case "buscar_memoria": {
        const resultados = await buscarNotas(String(input.consulta ?? ""));
        return resultados.length
          ? JSON.stringify(resultados) +
              "\n(Para el contenido completo de una nota: leer_vault con su slug.)"
          : "Sin resultados en la memoria para esa búsqueda. La memoria crece día a día con /brief-ceo y /sync-vault.";
      }
      case "leer_entidad": {
        if (typeof input.entidad === "string" && input.entidad.trim()) {
          const v = await leerEntidad(input.entidad.trim());
          return JSON.stringify({
            nombre: v.nombre,
            resumen: v.notaPropia?.cuerpo ?? null,
            menciones: v.menciones.slice(0, 15),
            total_menciones: v.menciones.length,
          });
        }
        return JSON.stringify(await entidadesMasConectadas(15));
      }
      case "sintesis": {
        if (typeof input.tipo === "string" && input.tipo) {
          const doc = await leerSintesisDoc(input.tipo);
          return (
            doc ??
            `La síntesis "${input.tipo}" todavía no está destilada. Se genera con /destilar-memoria.`
          );
        }
        return JSON.stringify(SINTESIS.map((s) => ({ tipo: s.tipo, que: s.que })));
      }
      case "reproducir_video": {
        const video = await buscarVideoYoutube(String(input.consulta ?? ""));
        if (!video) return "No encontré un video para esa búsqueda.";
        // El loop de streaming detecta esta clave y emite la acción al HUD.
        return JSON.stringify({ _accion: "video", video });
      }
      case "listar_skills":
        return JSON.stringify(await listarSkills());
      case "usar_skill": {
        const skill = await leerSkill(String(input.nombre ?? ""));
        if (!skill) return `No existe la skill "${input.nombre}".`;
        if (skill.ejecucion === "worker") {
          return `La skill "${skill.nombre}" es un trabajo pesado: usá la tool encargar_trabajo en su lugar.`;
        }
        const marca = String(input.marca ?? "");
        const estilo = marca
          ? await leerNota(`estilo/${marca}`)
          : null;
        const estrategia = await leerNota("estilo/estrategia");
        return JSON.stringify({
          skill: skill.cuerpo,
          estrategia: estrategia?.cuerpo ?? null,
          estiloMarca: estilo?.cuerpo ?? "marca no especificada — preguntá cuál",
        });
      }
      case "leer_emails": {
        const snap = await leerEmails();
        return snap.emails.length
          ? JSON.stringify(snap)
          : "Sin resumen de correos todavía (lo arma /brief-ceo con el MCP de Gmail).";
      }
      case "leer_ganchos": {
        const todos = await leerGanchos();
        const filtro = String(input.filtro ?? "").toLowerCase();
        const lista = filtro
          ? todos.filter((g) =>
              `${g.titulo} ${g.nicho} ${g.tipo} ${g.transcripto}`
                .toLowerCase()
                .includes(filtro),
            )
          : todos;
        return JSON.stringify(lista.slice(0, 20));
      }
      case "encargar_trabajo": {
        const tipo = input.tipo as TipoEncargo;
        const params = (input.params ?? {}) as Record<string, string>;
        try {
          const encargo = await crearEncargo(tipo, params);
          return JSON.stringify({
            ok: true,
            encargo,
            nota: "El worker local lo procesa en su próxima pasada (cada 30 min). El resultado aparece en el vault y en el Baúl de Ganchos.",
          });
        } catch {
          return JSON.stringify({
            ok: false,
            nota: `No pude escribir la cola desde acá (entorno read-only). Decile a Claude Code: "/worker-encargos ${tipo} ${JSON.stringify(params)}" y lo ejecuta directo.`,
          });
        }
      }
      default:
        return `Tool desconocida: ${nombre}`;
    }
  } catch (e) {
    return `Error ejecutando ${nombre}: ${e instanceof Error ? e.message : "desconocido"}`;
  }
}

async function armarSystem(): Promise<Anthropic.TextBlockParam[]> {
  const [negocio, skills] = await Promise.all([leerNegocio(), listarSkills()]);
  const estable = `Sos JARVIS, el agente del Content OS de Elvin Ayala — CEO de Level Up Media (agencia de Meta Ads), AI Borinquen (agencia de IA, producto AutoFlow) y Shadow Operator (marca personal + curso).

MODO ASISTENTE DE VOZ (manos libres, tipo Jarvis de película):
- A Elvin le decís SIEMPRE "boss". Tono seguro, futurista, al grano — nunca servil ni con relleno.
- El input llega por TRANSCRIPCIÓN de voz y PUEDE TENER ERRORES. Interpretá la INTENCIÓN, no te trabes con palabras mal transcritas (ej. "javis"/"jarbis" = Jarvis; nombres de clientes o modelos pueden venir mal). Si algo es realmente ambiguo, pedí una aclaración corta; si se entiende, actuá.
- Respuestas para ESCUCHAR: cortas, habladas, sin markdown, sin listas largas ni URLs. 1-4 frases. Si hay mucho, dá lo esencial y ofrecé el detalle.
- Si el boss pide ver/poner/darle play a un video sobre algo → usá reproducir_video (lo pone en su pantalla) y comentá en 1 frase.

Sos el copiloto del CEO: sabés de TODO el negocio, no solo de contenido. Podés responder sobre ventas y leads (Pipedrive), llamadas y objeciones (Zoom Intelligence), ingresos cerrados (EA Market), operaciones y clientes (Slack de ambas agencias), prioridades y decisiones estratégicas (churn, reactivación, admin, finanzas), memoria del negocio (vault) y contenido con el estilo de cada marca.

QUÉ TOOL USAR SEGÚN LA PREGUNTA:
- Leads / prospectos / pipeline / "cuántos leads llegaron hoy" → leer_pipeline (Pipedrive en vivo, tiene hoy/ayer/7/15/30 por agencia). NUNCA digas que no tenés un contador de leads: SÍ lo tenés, usá leer_pipeline.
- Llamadas / setters / closers / objeciones / demos → leer_llamadas (Zoom Intelligence).
- Ingresos / ventas cerradas / facturación / revenue → leer_ventas (EA Market).
- Qué hablé hoy / mis reuniones / qué quedó pendiente / qué hablé con Aure/Heidy/el equipo / resumen del día → leer_granola (reuniones de Granola de hoy: es donde queda el criterio del CEO).
- Qué es lo importante / qué decidir / churn / estrategia / prioridades → leer_prioridades.
- Correo / emails / "algo importante en el mail" / cobros → leer_emails (resumen de las 3 cuentas).
- Wins y críticos de clientes de una agencia → leer_ops (Level Up o AI Borinquen; Borinquen se lee en vivo por Slack).
- Historial, reuniones, "qué pasó con X", rango temporal → buscar_memoria + leer_vault.
- "Qué sabemos de X" / todo el historial de un cliente/persona/tema/objeción → leer_entidad (junta su nota acumulada + todo lo que la menciona).
- Ideas/ángulos/objeciones BASADOS EN DATA (no intuición) → sintesis (angulos-ganadores | objeciones-reales | ideas-de-data | decisiones-negocio).
- Contenido (guion/carrusel/historias/ideas/análisis) → usar_skill primero.

Reglas:
- Respondé en español, directo y sin relleno (estilo del negocio). Andá al dato.
- Cuando te pregunten algo del negocio, LLAMÁ A LA TOOL correspondiente antes de responder. Tenés los datos reales — usalos, no te disculpes por no tenerlos.
- CÓMO ESTÁ ORGANIZADA TU MEMORIA: leer_ops = las últimas 24h de Slack (el snapshot del día). La HISTORIA vive en el vault: vault/slack/<fecha> = resumen de cada día, vault/reuniones/ = las reuniones de Granola (Zoom, llamadas, decisiones, clientes mencionados). Para preguntas de rango ("últimos 7 días", "esta semana", "qué pasó con X") usá buscar_memoria PRIMERO y después leer_vault de las notas relevantes. Nunca digas "solo tengo 24h" sin haber buscado en la memoria.
- MEMORIA COMPUESTA: el vault también tiene vault/entidades/ (una nota por cliente/persona/tema/objeción, que se enriquece con cada conversación) y síntesis destilada (vault/estilo/angulos-ganadores, objeciones-reales, ideas-de-data, decisiones-negocio). Para "todo lo que sabemos de X" usá leer_entidad; para producir/pensar con DATA real usá sintesis en vez de inventar. El equipo de contenido produce con estos ángulos y objeciones reales, no por intuición.
- Señales de clientes insatisfechos pueden aparecer en CUALQUIER fuente: Slack (leer_ops), reuniones de Zoom/Granola (buscar_memoria) — cruzalas. Un cliente problemático mencionado en una reunión cuenta igual que uno escalado en Slack.
- SEÑAL VS RUIDO (regla de oro): priorizá lo NUEVO o lo que CAMBIÓ. Si una situación es vieja y sin novedad (ej. un cliente que lleva 15+ días sin responder y ya fue reportado), NO la repitas salvo que haya novedad o que te pregunten por ella directamente. Cada línea de tu respuesta tiene que ganarse su lugar.
- Para CUALQUIER pieza de contenido (guion, carrusel, historias, ideas, análisis): PRIMERO usar_skill con la skill y la marca correspondiente. Nunca escribas contenido sin cargar el estilo.
- Si te piden algo pesado (transcribir/descargar un perfil entero, análisis masivo): encargar_trabajo.
- Si un dato no está en tus tools, decilo con precisión (qué ventana/fuente sí tenés) — no inventes números ni clientes.
- Formato: markdown liviano, listas cortas, sin tablas enormes.

Config del negocio (data/negocio.json):
${JSON.stringify(negocio)}

Skills disponibles:
${JSON.stringify(skills)}`;

  return [
    {
      type: "text",
      text: estable,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `Ahora: ${new Date().toLocaleString("es-PR", { timeZone: "America/Puerto_Rico" })} (America/Puerto_Rico).`,
    },
  ];
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_SESION)?.value;
  if (!(await sesionValida(cookie))) {
    return Response.json({ error: "no-autorizado" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "jarvis-desactivado" }, { status: 503 });
  }
  if (!rateLimitOk(cookie ?? "local")) {
    return Response.json({ error: "rate-limit" }, { status: 429 });
  }

  const body = (await req.json()) as {
    mensajes?: { role: "user" | "assistant"; content: string }[];
  };
  const historial = (body.mensajes ?? [])
    .filter((m) => m.content?.trim())
    .slice(-MAX_MENSAJES);
  if (historial.length === 0 || historial.at(-1)?.role !== "user") {
    return Response.json({ error: "mensaje-vacio" }, { status: 400 });
  }

  const client = new Anthropic();
  const system = await armarSystem();
  const mensajes: Anthropic.MessageParam[] = historial.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emitir = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for (let i = 0; i < MAX_ITERACIONES; i++) {
          const s = client.messages.stream({
            model: MODEL,
            max_tokens: 4096,
            thinking: { type: "disabled" },
            output_config: { effort: "medium" },
            system,
            tools: TOOLS,
            messages: mensajes,
          });

          for await (const event of s) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              emitir({ tipo: "texto", delta: event.delta.text });
            }
            if (
              event.type === "content_block_start" &&
              event.content_block.type === "tool_use"
            ) {
              emitir({ tipo: "tool", nombre: event.content_block.name });
            }
          }

          const final = await s.finalMessage();
          if (final.stop_reason !== "tool_use") {
            emitir({ tipo: "fin", usage: final.usage });
            break;
          }

          mensajes.push({ role: "assistant", content: final.content });
          const resultados: Anthropic.ToolResultBlockParam[] = [];
          for (const bloque of final.content) {
            if (bloque.type === "tool_use") {
              const contenido = await ejecutarTool(
                bloque.name,
                bloque.input as Record<string, unknown>,
              );
              // Tools que disparan una acción en el HUD (ej. poner un video en pantalla).
              try {
                const parsed = JSON.parse(contenido) as { _accion?: string };
                if (parsed && parsed._accion) {
                  emitir({ tipo: "accion", ...(parsed as object) });
                }
              } catch {
                /* no era JSON de acción */
              }
              resultados.push({
                type: "tool_result",
                tool_use_id: bloque.id,
                content: contenido,
              });
            }
          }
          mensajes.push({ role: "user", content: resultados });
        }
      } catch (e) {
        emitir({
          tipo: "error",
          mensaje: e instanceof Error ? e.message : "error desconocido",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
