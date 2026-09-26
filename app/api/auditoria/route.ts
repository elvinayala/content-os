import { after, NextResponse, type NextRequest } from "next/server";

import { upsertContacto } from "@/lib/activecampaign";
import { leadQuiz } from "@/lib/leads/cables";

// after() corre hasta maxDuration: AC es lento (tags + lista ≈ 10-40 s).
export const maxDuration = 60;

// Endpoint público que reciben los quiz funnels de ClickFunnels
// (demos/auditorias/*): crea/actualiza el lead en Pipedrive.
//
//   POST { marca: "level-up" | "ai-borinquen", evento: "lead" | "resultado",
//          datos: {...respuestas}, resultado?: {...}, tracking?: {...}, dealId?: number }
//
//  - evento "lead"      → al capturar nombre/email/WhatsApp/negocio (antes de la
//                          1.ª pregunta): persona + organización + deal en el stage
//                          de NEW LEAD + nota "empezó el diagnóstico". Devuelve dealId.
//  - evento "resultado" → al terminar: nota con el diagnóstico completo (números,
//                          cuello/oportunidad, score y respuestas) en el mismo deal.
//
// Tokens: PIPEDRIVE_LEVELUP_TOKEN / PIPEDRIVE_AIB_TOKEN (ya en Vercel). Stage destino
// configurable con PIPEDRIVE_LEVELUP_STAGE_DIAGNOSTICO / PIPEDRIVE_AIB_STAGE_DIAGNOSTICO.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Marca = "level-up" | "ai-borinquen" | "shadow-operator" | "1000x";

const CUENTAS: Record<
  Marca,
  { token?: string; stage: number; titulo: string; etiqueta: string }
> = {
  "level-up": {
    token: process.env.PIPEDRIVE_LEVELUP_TOKEN,
    // Pipeline 12 "LUM DIAGNÓSTICO DE CRECIMIENTO" → stage 122 "NEW LEAD / DIAGNÓSTICO"
    stage: Number(process.env.PIPEDRIVE_LEVELUP_STAGE_DIAGNOSTICO ?? 122),
    titulo: "Diagnóstico de Crecimiento",
    etiqueta: "Diagnóstico LU",
  },
  "ai-borinquen": {
    token: process.env.PIPEDRIVE_AIB_TOKEN,
    // Pipeline 3 "DIAGNÓSTICO DE AUTOMATIZACIÓN" → stage 33 "NEW LEAD / DIAGNÓSTICO"
    stage: Number(process.env.PIPEDRIVE_AIB_STAGE_DIAGNOSTICO ?? 33),
    titulo: "Diagnóstico de Automatización con IA",
    etiqueta: "Diagnóstico AIB",
  },
  "shadow-operator": {
    // Marca personal de Elvin → vive en el Pipedrive de Level Up.
    // Pipeline 14 "SHADOW · AUDITORÍA NEGOCIO DIGITAL" → stage 136 "NEW LEAD / AUDITORÍA"
    token: process.env.PIPEDRIVE_LEVELUP_TOKEN,
    stage: Number(process.env.PIPEDRIVE_SHADOW_STAGE_AUDITORIA ?? 136),
    titulo: "Auditoría de Negocio Digital",
    etiqueta: "Auditoría Shadow",
  },
  "1000x": {
    // Richy & Elvin Trading LLC → Pipedrive propio (token + stage por env; sin token = 503 y el
    // quiz sigue andando, solo no escribe en el CRM).
    token: process.env.PIPEDRIVE_1000X_TOKEN,
    stage: Number(process.env.PIPEDRIVE_1000X_STAGE_DIAGNOSTICO ?? 0),
    titulo: "Diagnóstico de Trader",
    etiqueta: "Diagnóstico 1000X",
  },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS });
}

// --- Pipedrive helpers -------------------------------------------------------

async function pd<T = unknown>(
  token: string,
  method: "GET" | "POST" | "PUT",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(
    `https://api.pipedrive.com/v1/${path}${sep}api_token=${token}`,
    {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    },
  );
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string;
  };
  if (!res.ok || data.success === false) {
    throw new Error(`Pipedrive ${method} ${path.split("?")[0]}: ${data.error ?? res.status}`);
  }
  return data.data as T;
}

async function buscarPersona(token: string, email: string): Promise<number | null> {
  const r = await pd<{ items?: { item: { id: number } }[] }>(
    token,
    "GET",
    `persons/search?term=${encodeURIComponent(email)}&fields=email&exact_match=true&limit=1`,
  );
  return r?.items?.[0]?.item?.id ?? null;
}

async function buscarOrg(token: string, nombre: string): Promise<number | null> {
  const r = await pd<{ items?: { item: { id: number } }[] }>(
    token,
    "GET",
    `organizations/search?term=${encodeURIComponent(nombre)}&exact_match=true&limit=1`,
  );
  return r?.items?.[0]?.item?.id ?? null;
}

async function buscarDealAbierto(
  token: string,
  personId: number,
  titulo: string,
): Promise<number | null> {
  const r = await pd<{ id: number; title: string; status: string }[]>(
    token,
    "GET",
    `persons/${personId}/deals?status=open&limit=50`,
  );
  return (r ?? []).find((d) => d.title.startsWith(titulo))?.id ?? null;
}

// --- Formato de notas --------------------------------------------------------

const esc = (s: unknown) =>
  String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
const usd = (n: unknown) => `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
const pct = (x: unknown) => `${Math.round((Number(x) || 0) * 100)}%`;

const LU_OPC: Record<string, Record<string, string>> = {
  tipo: { salud: "Clínica / salud", estetica: "Estética / medspa", profesional: "Servicios profesionales", hogar: "Servicios al hogar", local: "Restaurante / retail", ecommerce: "Ecommerce", otro: "Otro" },
  fuente: { referidos: "Referidos", organico: "Redes orgánicas", ads: "Anuncios pagos", seo: "Google / SEO", mixto: "Mezcla", nada: "Sin fuente estable" },
  capacidad: { mucha: "Mucha", algo: "Algo", limite: "Al límite" },
  cuello: { leads: "No llegan suficientes leads", calidad: "Leads que no califican", conversion: "No convierte", seguimiento: "No hace seguimiento", inconsistente: "Marketing inconsistente", otro: "Otro" },
};
const SO_OPC: Record<string, Record<string, string>> = {
  etapa: { "0": "No vende aún", "500": "< $1K/mes", "2000": "$1K-3K/mes", "6000": "$3K-10K/mes", "15000": "> $10K/mes" },
  tipo: { servicio: "Servicio / agencia", coaching: "Coaching / consultoría", curso: "Curso / producto digital", comunidad: "Comunidad / membresía", fisico: "Producto físico", nose: "No lo sabe" },
  nicho: { claro: "Nicho claro (dolor + dinero)", amplio: "Público amplio", cambio: "Cambia de nicho seguido", nodef: "Sin definir" },
  tiempo: { "1": "< 3 meses", "6": "3-12 meses", "24": "1-3 años", "48": "> 3 años" },
  fuente: { organico: "Contenido orgánico", ads: "Anuncios", referidos: "Referidos", dm: "Prospección directa", ninguna: "No le llegan" },
  conversaciones: { "0": "0", "3": "1-5", "10": "5-15", "27": "15-40", "60": "40+" },
  cierres: { "0": "0", "1.5": "1-2", "4": "3-5", "8": "6-10", "14": "10+" },
  seguimiento: { si: "Sí, automático", medio: "A medias", no: "No" },
  cta: { si: "Con estructura y CTA", aveces: "A veces", sincta: "Sin CTA", nopublico: "Casi no publica" },
  cuello: { oferta: "Oferta", nicho: "Nicho", contenido: "Contenido", estrategia: "Estrategia / cierre", tiempo: "Tiempo / sistema", otro: "Otro" },
  fund: { nicho: "Nicho", oferta: "Oferta", contenido: "Contenido", estrategia: "Estrategia" },
};
const X_OPC: Record<string, Record<string, string>> = {
  experiencia: { "0": "Nunca en real", "3": "< 6 meses", "12": "6 meses - 2 años", "36": "> 2 años" },
  mercado: { futuros: "Futuros", forex: "Forex", cripto: "Cripto", acciones: "Acciones / opciones", nose: "No lo sabe" },
  capital: { "250": "< $500", "1250": "$500-2K", "6000": "$2K-10K", "20000": "> $10K", fondeo: "Cuenta de fondeo" },
  estrategia: { probada: "Reglas escritas y probadas", reglas: "Reglas sin probar", intuicion: "Intuición / señales", ninguna: "Sin estrategia" },
  entradas: { confirmacion: "Espera confirmación", persigo: "Persigue el movimiento", depende: "Depende del día" },
  horario: { fijo: "Horario fijo", cuando: "Cuando puede", sin: "Sin planificar (celular)" },
  riesgo: { "1": "≤ 1%", "2": "1-3%", "5": "> 3%", nolo: "No lo calcula" },
  rr: { "2": "1:2 o mejor", "1": "~1:1", corto: "Corta ganancias / deja correr pérdidas", nomido: "No la mide" },
  resultado: { consistente: "Rentable consistente", devuelvo: "Gana y devuelve", pierdo: "Perdiendo", noreal: "Sin resultados en real" },
  journal: { si: "Sí, semanal", aveces: "A veces", no: "No" },
  pantalla: { "1": "< 1 h/día", "2": "1-3 h/día", "4": "> 3 h/día" },
  cuello: { psicologia: "Emociones / psicología", estrategia: "Sin estrategia clara", riesgo: "Gestión de riesgo", tiempo: "Tiempo", info: "Información contradictoria", otro: "Otro" },
  pilar: { estructura: "Estructura", ejecucion: "Ejecución", riesgo: "Riesgo", sistema: "Sistema" },
};
const AB_OPC: Record<string, Record<string, string>> = {
  tipo: { salud: "Clínica / salud", estetica: "Estética / medspa", profesional: "Servicios profesionales", hogar: "Servicios al hogar", agencia: "Agencia / B2B", local: "Restaurante / retail", otro: "Otro" },
  canal: { whatsapp: "WhatsApp", llamadas: "Llamadas", dm: "Instagram / Facebook DMs", web: "Formulario web / email", varios: "Varios canales", presencial: "Presencial" },
  respuesta: { min: "Minutos", hora: "< 1 hora", dia: "Mismo día", dias: "1-2 días", nunca: "A veces no responde" },
  seguimiento: { yo: "El dueño", empleado: "Un empleado", varios: "Varios sin proceso", crm: "CRM con automatizaciones", nadie: "Nadie consistente" },
  proceso: { respuesta: "Responder leads al instante", seguimiento: "Seguimiento automático", agenda: "Calificar y agendar", llamadas: "Atender llamadas", admin: "Tareas administrativas", otro: "Otro" },
};
const et = (m: Record<string, Record<string, string>>, k: string, v: unknown) =>
  m[k]?.[String(v)] ?? String(v ?? "");

function notaLead(marca: Marca, d: Record<string, unknown>, tracking: Record<string, unknown>) {
  const c = CUENTAS[marca];
  const utm = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid"]
    .filter((k) => tracking[k])
    .map((k) => `${k}=${esc(tracking[k])}`)
    .join(" · ");
  return (
    `<b>${c.titulo}</b> — empezó el diagnóstico (todavía no lo terminó).<br>` +
    `Nombre: ${esc(d.nombre)} · ${marca === "shadow-operator" || marca === "1000x" ? "Instagram" : "Negocio"}: ${esc(d.negocio)} · WhatsApp: ${esc(d.telefonoCompleto ?? d.telefono)} · Email: ${esc(d.email)}` +
    (utm ? `<br>Origen: ${utm}` : "") +
    (tracking.landing_url ? `<br>URL: ${esc(tracking.landing_url)}` : "")
  );
}

function notaResultado(
  marca: Marca,
  d: Record<string, unknown>,
  r: Record<string, unknown>,
  nombrePrincipal: string,
) {
  if (marca === "level-up") {
    return (
      `<b>Diagnóstico de Crecimiento — resultado</b><br>` +
      `<b>Cuello de botella:</b> ${esc(nombrePrincipal)}${r.secundario ? ` (+ ${esc(et(LU_OPC, "cuello", r.secundario))})` : ""}<br>` +
      `<b>Capacidad de escala:</b> ${esc(r.score)}/100<br>` +
      `<b>Brecha:</b> ${usd(r.brecha)}/mes · <b>Clientes que faltan:</b> ${esc(r.clientesExtra)}/mes · <b>Conversión:</b> ${pct(r.conv)} · <b>Leads necesarios:</b> ${esc(r.leadsNecesarios)}/mes<br><br>` +
      `<b>Respuestas</b><br>` +
      `Tipo: ${esc(et(LU_OPC, "tipo", d.tipo))} · Ticket: ${usd(d.ticket)} · Factura: ${usd(r.fact)}/mes (rango)<br>` +
      `Fuente: ${esc(et(LU_OPC, "fuente", d.fuente))} · Inversión mkt: ${usd(d.inversion)}/mes · Leads: ~${esc(d.leads)}/mes · Cierres: ~${esc(d.clientes)}/mes<br>` +
      `Meta: ${usd(r.meta)}/mes${r.pidioMeta ? "" : " (estimada)"} · Capacidad: ${esc(et(LU_OPC, "capacidad", d.capacidad) || "n/a")}<br>` +
      `Cuello declarado: ${esc(et(LU_OPC, "cuello", d.cuello))}${d.frustracion ? ` — "${esc(d.frustracion)}"` : ""}`
    );
  }
  if (marca === "shadow-operator") {
    const F = (r.F ?? {}) as Record<string, unknown>;
    return (
      `<b>Auditoría de Negocio Digital — resultado</b><br>` +
      `<b>Fundamento flojo:</b> ${esc(nombrePrincipal)}${r.secundario ? ` (+ ${esc(et(SO_OPC, "fund", r.secundario))})` : ""}<br>` +
      `<b>Fundamentos:</b> ${esc(r.score)}/100 · Nicho ${esc(F.nicho)} · Oferta ${esc(F.oferta)} · Contenido ${esc(F.contenido)} · Estrategia ${esc(F.estrategia)}<br>` +
      `<b>Matemática de $10K:</b> ticket ${usd(r.ticket)}${r.ticketEstimado ? " (estimado)" : ""} · ${esc(r.clientesMeta)} clientes · ${esc(r.convMeta)} conversaciones/mes · le faltan ${esc(r.convFaltan)} · cierre ${pct(r.tasa)}${r.tasaEstimada ? " (estimado)" : ""} · brecha ${usd(r.brecha)}/mes<br><br>` +
      `<b>Respuestas</b><br>` +
      `Etapa: ${esc(et(SO_OPC, "etapa", d.etapa))} · Vende: ${esc(et(SO_OPC, "tipo", d.tipo))} · Ticket: ${usd(d.ticket)}<br>` +
      `Nicho: ${esc(et(SO_OPC, "nicho", d.nicho))} · Ingredientes de la oferta: ${esc(d.ingredientes)}/4 · Tiempo intentando: ${esc(et(SO_OPC, "tiempo", d.tiempo))}<br>` +
      `Fuente: ${esc(et(SO_OPC, "fuente", d.fuente))} · Conversaciones: ${esc(et(SO_OPC, "conversaciones", d.conversaciones))}/mes · Cierres: ${esc(et(SO_OPC, "cierres", d.cierres))}/mes<br>` +
      `Seguimiento: ${d.seguimiento ? esc(et(SO_OPC, "seguimiento", d.seguimiento)) : "n/a"} · Contenido: ${d.cta ? esc(et(SO_OPC, "cta", d.cta)) : "n/a"}<br>` +
      `Lo que dice que le frena: ${esc(et(SO_OPC, "cuello", d.cuello))}${d.frustracion ? ` — "${esc(d.frustracion)}"` : ""}`
    );
  }
  if (marca === "1000x") {
    const F = (r.F ?? {}) as Record<string, unknown>;
    return (
      `<b>Diagnóstico de Trader — resultado</b><br>` +
      `<b>Perfil:</b> ${esc(r.perfil)} · <b>Pilar flojo:</b> ${esc(nombrePrincipal)}${r.secundario ? ` (+ ${esc(et(X_OPC, "pilar", r.secundario))})` : ""}<br>` +
      `<b>Disciplina:</b> ${esc(r.score)}/100 · Estructura ${esc(F.estructura)} · Ejecución ${esc(F.ejecucion)} · Riesgo ${esc(F.riesgo)} · Sistema ${esc(F.sistema)}<br>` +
      `<b>Matemática:</b> capital ${r.fondeo ? "fondeo" : usd(r.capital)} · riesgo ${pct(r.riesgoPct)}${r.riesgoEstimado ? " (estimado)" : ""} = ${usd(r.riesgoUSD)}/trade · mala semana ${usd(r.malaSemana)} · 10 stops seguidos −${pct(r.racha)}<br><br>` +
      `<b>Respuestas</b><br>` +
      `Experiencia: ${esc(et(X_OPC, "experiencia", d.experiencia))} · Mercado: ${esc(et(X_OPC, "mercado", d.mercado))} · Capital: ${esc(et(X_OPC, "capital", d.capital))}<br>` +
      `Estrategia: ${esc(et(X_OPC, "estrategia", d.estrategia))} · Entradas: ${esc(et(X_OPC, "entradas", d.entradas))} · Horario: ${esc(et(X_OPC, "horario", d.horario))}<br>` +
      `Riesgo: ${esc(et(X_OPC, "riesgo", d.riesgo))} · R:B: ${esc(et(X_OPC, "rr", d.rr))} · Últimos 3 meses: ${esc(et(X_OPC, "resultado", d.resultado))}<br>` +
      `Journal: ${d.journal ? esc(et(X_OPC, "journal", d.journal)) : "n/a"} · Pantalla: ${d.pantalla ? esc(et(X_OPC, "pantalla", d.pantalla)) : "n/a"}<br>` +
      `Lo que dice que le frena: ${esc(et(X_OPC, "cuello", d.cuello))}${d.frustracion ? ` — "${esc(d.frustracion)}"` : ""}`
    );
  }
  return (
    `<b>Diagnóstico de Automatización con IA — resultado</b><br>` +
    `<b>Principal oportunidad:</b> ${esc(nombrePrincipal)}${r.secundario ? ` (+ ${esc(et(AB_OPC, "proceso", r.secundario))})` : ""}<br>` +
    `<b>Nivel de automatización:</b> ${esc(r.nivel)}/100<br>` +
    `<b>Oportunidades perdidas:</b> ${esc(r.perdidas)}/mes · <b>Ingresos en riesgo:</b> ${usd(r.ingresoRiesgo)}/mes · <b>Horas recuperables:</b> ${esc(r.horasMes)}/mes · <b>Procesos automatizables:</b> ${esc(Array.isArray(r.procesos) ? r.procesos.length : 0)}<br><br>` +
    `<b>Respuestas</b><br>` +
    `Tipo: ${esc(et(AB_OPC, "tipo", d.tipo))} · Equipo: ~${esc(d.equipo)} personas · Factura: ${usd(r.fact)}/mes (rango)<br>` +
    `Canal: ${esc(et(AB_OPC, "canal", d.canal))} · Responde: ${esc(et(AB_OPC, "respuesta", d.respuesta))} · Leads: ~${esc(d.leads)}/mes · Seguimiento: ${esc(et(AB_OPC, "seguimiento", d.seguimiento))}<br>` +
    `Horas repetitivas/semana: ${esc(d.horas || "n/a")} · Llamadas sin contestar: ${d.llamadas ? pct(d.llamadas) : "n/a"}<br>` +
    `Quiere automatizar: ${esc(et(AB_OPC, "proceso", d.proceso))}${d.frustracion ? ` — "${esc(d.frustracion)}"` : ""}`
  );
}

// --- Handler -----------------------------------------------------------------

const emailOk = (v: unknown) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "json-invalido" }, 400);
  }
  const marca = body.marca as Marca;
  const evento = body.evento as string;
  const datos = (body.datos ?? {}) as Record<string, unknown>;
  const tracking = (body.tracking ?? {}) as Record<string, unknown>;
  const cuenta = CUENTAS[marca];
  if (!cuenta) return json({ error: "marca-invalida" }, 400);
  if (evento !== "lead" && evento !== "resultado") return json({ error: "evento-invalido" }, 400);
  if (!emailOk(datos.email) || !String(datos.nombre ?? "").trim()) {
    return json({ error: "lead-incompleto" }, 400);
  }
  if (!cuenta.token) return json({ error: "sin-token-pipedrive" }, 503);
  const token = cuenta.token;

  const nombre = String(datos.nombre).trim().slice(0, 120);
  const email = String(datos.email).trim().toLowerCase();
  const telefono = String(datos.telefonoCompleto ?? datos.telefono ?? "").trim().slice(0, 40);
  const negocio = String(datos.negocio ?? "").trim().slice(0, 120);
  const titulo = `${cuenta.titulo} — ${negocio || nombre}`;

  try {
    // Persona (buscar por email; si no, crear)
    let personId = await buscarPersona(token, email);
    let orgId: number | null = null;
    if (negocio) {
      orgId = await buscarOrg(token, negocio);
      if (!orgId) orgId = (await pd<{ id: number }>(token, "POST", "organizations", { name: negocio })).id;
    }
    if (!personId) {
      personId = (
        await pd<{ id: number }>(token, "POST", "persons", {
          name: nombre,
          email: [{ value: email, primary: true, label: "work" }],
          phone: telefono ? [{ value: telefono, primary: true, label: "mobile" }] : [],
          ...(orgId ? { org_id: orgId } : {}),
        })
      ).id;
    }

    // Deal (reusar si viene dealId o ya hay uno abierto del diagnóstico)
    // dealId del navegador: verificar que exista y siga abierto (puede haberse borrado)
    let dealId: number | null = null;
    if (Number(body.dealId)) {
      try {
        const d = await pd<{ id: number; status: string }>(token, "GET", `deals/${Number(body.dealId)}`);
        if (d && d.status === "open") dealId = d.id;
      } catch { dealId = null; }
    }
    if (!dealId) dealId = await buscarDealAbierto(token, personId, cuenta.titulo);
    let creado = false;
    if (!dealId) {
      dealId = (
        await pd<{ id: number }>(token, "POST", "deals", {
          title: titulo,
          person_id: personId,
          ...(orgId ? { org_id: orgId } : {}),
          stage_id: cuenta.stage,
        })
      ).id;
      creado = true;
    }

    // Nota
    // ActiveCampaign: la base del ecosistema. Entra con tags de marca, origen y resultado.
    // No-op sin ACTIVECAMPAIGN_*; nunca rompe el flujo del quiz.
    // Shadow y 1000X solo entran a AC si tienen lista propia configurada.
    const acConLista = { "shadow-operator": process.env.AC_LISTA_SO, "1000x": process.env.AC_LISTA_1000X } as Record<string, string | undefined>;
    if (!(marca in acConLista) || acConLista[marca]) {
      const tagsAC = [`origen:quiz`, `quiz:${evento}`];
      if (evento === "resultado" && body.resultado && typeof body.resultado === "object") {
        const r = body.resultado as { principal?: string; score?: number };
        if (r.principal) tagsAC.push(`quiz-principal:${String(r.principal).slice(0, 40)}`);
      }
      if (marca === "level-up" && tracking.avatar) tagsAC.push(`avatar:${String(tracking.avatar).slice(0, 20)}`);
      after(() => upsertContacto({ email, nombre, telefono, marca, tags: tagsAC }).then((r) => { if (!r.ok) console.error("[AC] upsert falló", r.error); }));
    }

    // Leads (Pulse): el quiz de Level Up también entra al CRM nuevo, en paralelo con Pipedrive.
    if (marca === "level-up") {
      const r = body.resultado && typeof body.resultado === "object" ? (body.resultado as { principal?: string }).principal : null;
      after(() => leadQuiz({ evento, nombre, email, telefono, negocio, resultado: r ?? null, avatar: tracking.avatar ? String(tracking.avatar) : null, utm: tracking.utm_source ? String(tracking.utm_source) : null }));
    }

    const contenido =
      evento === "lead"
        ? notaLead(marca, { ...datos, telefonoCompleto: telefono }, tracking)
        : notaResultado(
            marca,
            datos,
            (body.resultado ?? {}) as Record<string, unknown>,
            String(body.cuelloNombre ?? body.principalNombre ?? ""),
          );
    await pd(token, "POST", "notes", { content: contenido, deal_id: dealId, person_id: personId, pinned_to_deal_flag: evento === "resultado" ? 1 : 0 });

    return json({ ok: true, dealId, personId, creado });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auditoria] pipedrive:", msg.replace(/api_token=[^&\s]+/g, "api_token=***"));
    return json({ error: "pipedrive", detalle: msg.slice(0, 200) }, 502);
  }
}
