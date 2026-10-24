import { after, NextResponse, type NextRequest } from "next/server";

import { upsertContacto } from "@/lib/activecampaign";
import { leadQuiz, leadQuiz1000x } from "@/lib/leads/cables";

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

type Marca = "level-up" | "ai-borinquen" | "shadow-operator" | "1000x" | "elvin-escalar";

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
    // Richy & Elvin Trading LLC. Desde el 24/oct/2026 NO usa Pipedrive: el lead entra a Leads (Pulse), marca
    // 1000x, aislada de Level Up y AIB (ver el bloque "1000X" del handler). Aquí solo quedan título y etiqueta.
    token: undefined,
    stage: 0,
    titulo: "Diagnóstico de Trader",
    etiqueta: "Diagnóstico 1000X",
  },
  "elvin-escalar": {
    // Marca personal de Elvin (elvinayala.com/escalar) → Pipedrive de Level Up.
    // Pipeline 16 "ELVIN · ESCALAR $10-20K" → stage 154 "NEW LEAD / AUDITORÍA"
    token: process.env.PIPEDRIVE_LEVELUP_TOKEN,
    stage: Number(process.env.PIPEDRIVE_ELVIN_STAGE_ESCALAR ?? 154),
    titulo: "Escala tu negocio digital",
    etiqueta: "Auditoría Elvin",
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
// 1000X v2 (24/oct/2026, embudo de Elvin: diagnóstico → resultado → aplicación + llamada → Done With You $3,500).
const X_OPC: Record<string, Record<string, string>> = {
  experiencia: { "0": "Nunca / solo demo", "3": "< 6 meses", "12": "6 meses - 2 años", "36": "> 2 años" },
  fondeo: { no: "No, quiere empezar", fallo: "Lo intentó y no pasó", perdio: "Pasó y perdió la cuenta", activa: "Tiene cuenta fondeada activa" },
  cuello: { estrategia: "Sin estrategia clara", emociones: "Emociones / disciplina", reglas: "Reglas del fondeo (drawdown, límite diario)", riesgo: "Gestión de riesgo", tiempo: "Falta de tiempo", info: "Información contradictoria" },
  estrategia: { probada: "Reglas escritas y probadas", reglas: "Reglas sin probar", intuicion: "Intuición / señales", ninguna: "Sin estrategia" },
  ejecucion: { plan: "Sigue su plan", temprano: "Entra antes de la confirmación", venganza: "Sobreopera / se venga tras perder", cierra: "Corta ganancias / deja correr pérdidas", noopera: "Todavía no opera" },
  riesgo: { "1": "≤ 1%", "2": "1-3%", "5": "> 3%", nolo: "No lo calcula" },
  bots: { usa: "Usa bots o alertas", probo: "Probó y no le funcionó", interesa: "No, pero le interesa", no: "No le interesa" },
  objetivo: { pasar: "Pasar su primera evaluación", retiros: "Mantener la cuenta y lograr los primeros retiros", escalar: "Escalar a más cuentas", base: "Aprender con una base sólida" },
  acompanamiento: { si: "Sí, quiere acompañamiento", talvez: "Tal vez", no: "No, prefiere por su cuenta" },
  area: { estructura: "Estrategia", ejecucion: "Ejecución", riesgo: "Gestión de riesgo", sistema: "Automatización e IA" },
  disponibilidad: { "3": "< 3 h/semana", "5": "3-5 h/semana", "10": "5-10 h/semana", "11": "> 10 h/semana" },
  inversion: { si: "Puede invertir $3,500", opciones: "Quiere conversar opciones de pago", no: "Ahora no puede invertir" },
  horario: { manana: "Mañana", tarde: "Tarde", noche: "Noche" },
};
const EE_OPC: Record<string, Record<string, string>> = {
  tipo: { coach: "Coaching / consultoría", creador: "Creador de contenido", curso: "Curso / producto digital", comunidad: "Comunidad / membresía", servicio: "Agencia / servicio digital" },
  facturacion: { "500": "< $1K/mes", "2000": "$1K-3K/mes", "4000": "$3K-5K/mes", "7500": "$5K-10K/mes", "15000": "$10K-20K/mes", "25000": "> $20K/mes" },
  audiencia: { "500": "< 2.5K", "5000": "2.5K-10K", "25000": "10K-50K", "100000": "> 50K" },
  nicho: { claro: "Nicho claro (dolor + dinero)", amplio: "Público amplio", cambio: "Cambia de enfoque seguido" },
  fuente: { organico: "Contenido orgánico", ads: "Anuncios", referidos: "Referidos", dm: "Prospección directa", ninguna: "Casi no le llegan" },
  conversaciones: { "0": "0", "3": "1-5", "10": "5-15", "27": "15-40", "60": "40+" },
  cierres: { "0": "0", "1.5": "1-2", "4": "3-5", "8": "6-10", "14": "10+" },
  quien: { yo: "Él/ella mismo", setter: "Con setter", closer: "Closer", nadie: "Aún no hace llamadas" },
  seguimiento: { si: "Sí, automático", medio: "A medias", no: "No" },
  equipo: { solo: "Solo", free: "1-2 freelancers", pequeno: "Equipo pequeño", completo: "Equipo completo" },
  cuello: { oferta: "Oferta", contenido: "Contenido", cierre: "Cierre", sistema: "Sistema / delegar", techo: "Estancado", otro: "Otro" },
  palanca: { oferta: "Oferta", contenido: "Audiencia y contenido", cierre: "Cierre de ventas", sistema: "Sistema y equipo" },
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
    `Nombre: ${esc(d.nombre)} · ${marca === "shadow-operator" || marca === "1000x" || marca === "elvin-escalar" ? "Instagram" : "Negocio"}: ${esc(d.negocio)} · WhatsApp: ${esc(d.telefonoCompleto ?? d.telefono)} · Email: ${esc(d.email)}` +
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
  if (marca === "elvin-escalar") {
    const F = (r.F ?? {}) as Record<string, unknown>;
    return (
      `<b>Escala tu negocio digital — resultado</b><br>` +
      `<b>Palanca floja:</b> ${esc(nombrePrincipal)}${r.secundario ? ` (+ ${esc(et(EE_OPC, "palanca", r.secundario))})` : ""}<br>` +
      `<b>Palancas:</b> ${esc(r.score)}/100 · Oferta ${esc(F.oferta)} · Contenido ${esc(F.contenido)} · Cierre ${esc(F.cierre)} · Sistema ${esc(F.sistema)}<br>` +
      `<b>Matemática de la meta:</b> meta ${usd(r.meta)}/mes · ticket ${usd(r.ticket)}${r.ticketEstimado ? " (estimado)" : ""} · ${esc(r.clientesMeta)} clientes · ${esc(r.convMeta)} conversaciones/mes · le faltan ${esc(r.convFaltan)} · cierre ${pct(r.tasa)}${r.tasaEstimada ? " (estimado)" : ""} · brecha ${usd(r.brecha)}/mes<br><br>` +
      `<b>Respuestas</b><br>` +
      `Negocio: ${esc(et(EE_OPC, "tipo", d.tipo))} · Factura: ${esc(et(EE_OPC, "facturacion", d.facturacion))} · Ticket: ${usd(d.ticket)} · Audiencia: ${esc(et(EE_OPC, "audiencia", d.audiencia))}<br>` +
      `Nicho: ${esc(et(EE_OPC, "nicho", d.nicho))} · Ingredientes de la oferta: ${esc(d.ingredientes)}/4<br>` +
      `Fuente: ${esc(et(EE_OPC, "fuente", d.fuente))} · Conversaciones: ${esc(et(EE_OPC, "conversaciones", d.conversaciones))}/mes · Cierres: ${esc(et(EE_OPC, "cierres", d.cierres))}/mes · Llamadas: ${esc(et(EE_OPC, "quien", d.quien))}<br>` +
      `Seguimiento: ${d.seguimiento ? esc(et(EE_OPC, "seguimiento", d.seguimiento)) : "n/a"} · Equipo: ${d.equipo ? esc(et(EE_OPC, "equipo", d.equipo)) : "n/a"}<br>` +
      `Lo que dice que le frena: ${esc(et(EE_OPC, "cuello", d.cuello))}${d.frustracion ? ` — "${esc(d.frustracion)}"` : ""}`
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
      `<b>Diagnóstico 1000X — resultado</b><br>` +
      `<b>Área a mejorar:</b> ${esc(nombrePrincipal)}${r.secundario ? ` (+ ${esc(et(X_OPC, "area", r.secundario))})` : ""} · <b>Preparación:</b> ${esc(r.score)}/100<br>` +
      `Estrategia ${esc(F.estructura)} · Ejecución ${esc(F.ejecucion)} · Riesgo ${esc(F.riesgo)} · Automatización ${esc(F.sistema)}<br><br>` +
      `<b>Para el closer</b><br>` +
      `Experiencia: ${esc(et(X_OPC, "experiencia", d.experiencia))} · Fondeo: ${esc(et(X_OPC, "fondeo", d.fondeo))}<br>` +
      `Mayor dificultad: ${esc(et(X_OPC, "cuello", d.cuello))} · Objetivo 90 días: ${esc(et(X_OPC, "objetivo", d.objetivo))}<br>` +
      `Bots / IA: ${esc(et(X_OPC, "bots", d.bots))} · Acompañamiento: ${esc(et(X_OPC, "acompanamiento", d.acompanamiento))}<br>` +
      `Estrategia: ${esc(et(X_OPC, "estrategia", d.estrategia))} · Al operar: ${esc(et(X_OPC, "ejecucion", d.ejecucion))} · Riesgo: ${esc(et(X_OPC, "riesgo", d.riesgo))}`
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

/** Las notas de Pipedrive vienen en HTML mínimo (<b>, <br>, entidades de esc()); el historial de Leads es texto plano. */
const aTexto = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

// Texto exacto de la casilla del quiz de 1000X (demos/auditorias/1000x/index.html, label.optin): queda guardado
// con cada lead como prueba de qué aceptó, porque la casilla es propia del quiz y no la del registro legal común.
const CASILLA_1000X = "Acepto recibir mi diagnóstico y que el equipo de 1000X me escriba por WhatsApp o DM. Entiendo que esto es educación, no asesoría financiera.";

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
  // "aplicacion" (pedir la llamada después del resultado) solo existe en el embudo de 1000X.
  if (evento !== "lead" && evento !== "resultado" && !(evento === "aplicacion" && marca === "1000x")) return json({ error: "evento-invalido" }, 400);
  if (!emailOk(datos.email) || String(datos.email).length > 254 || !String(datos.nombre ?? "").trim()) {
    return json({ error: "lead-incompleto" }, 400);
  }

  const nombre = String(datos.nombre).trim().slice(0, 120);
  const email = String(datos.email).trim().toLowerCase();
  const telefono = String(datos.telefonoCompleto ?? datos.telefono ?? "").trim().slice(0, 40);
  const negocio = String(datos.negocio ?? "").trim().slice(0, 120);

  // 1000X: sin Pipedrive ni ActiveCampaign (no hay registro de consentimiento de marketing todavía). El lead va
  // directo a Leads (Pulse), marca 1000x. Si falla, 502: es la única copia del dato.
  if (marca === "1000x") {
    // Endpoint público (CORS *): todo lo que viene del navegador se acota antes de guardarse.
    const r = body.resultado && typeof body.resultado === "object" ? (body.resultado as Record<string, unknown>) : {};
    const txt = (v: unknown, n = 60) => (v == null ? null : String(v).slice(0, n));
    const num = (v: unknown) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : null);
    const instagram = negocio.replace(/^@+/, "");
    const principal = String(body.principalNombre ?? body.cuelloNombre ?? "").slice(0, 60);
    const ap = body.aplicacion && typeof body.aplicacion === "object" ? (body.aplicacion as Record<string, unknown>) : {};
    const aplicacion = {
      disponibilidad: txt(ap.disponibilidad, 10),
      inversion: txt(ap.inversion, 20),
      horario: txt(ap.horario, 20),
      expectativas: txt(ap.expectativas, 600),
      enviadaEn: new Date().toISOString(),
    };
    const extra =
      evento === "resultado"
        ? {
            resultadoQuiz: `${principal} · ${num(r.score) ?? "?"}/100`.slice(0, 160),
            quiz1000x: {
              area: txt(r.principal), secundaria: txt(r.secundario), score: num(r.score),
              experiencia: txt(datos.experiencia, 10), fondeo: txt(datos.fondeo, 20), dificultad: txt(datos.cuello, 20),
              objetivo: txt(datos.objetivo, 20), bots: txt(datos.bots, 20), acompanamiento: txt(datos.acompanamiento, 20),
            },
          }
        : evento === "aplicacion"
        ? { aplicacion }
        : {
            consentimiento: {
              texto: CASILLA_1000X,
              aceptadoEn: new Date().toISOString(),
              ip: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
              navegador: (req.headers.get("user-agent") ?? "").slice(0, 200) || null,
              pagina: tracking.landing_url ? String(tracking.landing_url).slice(0, 300) : null,
            },
          };
    try {
      const lead = await leadQuiz1000x({
        nombre,
        email,
        telefono,
        instagram,
        utm: tracking.utm_source ? String(tracking.utm_source).slice(0, 80) : null,
        nota: aTexto(
          evento === "lead"
            ? notaLead(marca, { ...datos, telefonoCompleto: telefono }, tracking)
            : evento === "aplicacion"
            ? `<b>Diagnóstico 1000X — PIDIÓ LLAMADA</b><br>` +
              `Inversión: ${esc(et(X_OPC, "inversion", aplicacion.inversion))} · Disponibilidad: ${esc(et(X_OPC, "disponibilidad", aplicacion.disponibilidad))} · Mejor horario: ${esc(et(X_OPC, "horario", aplicacion.horario))}<br>` +
              (aplicacion.expectativas ? `Qué espera: "${esc(aplicacion.expectativas)}"<br>` : "") +
              `Área a mejorar: ${esc(principal)} · Dificultad: ${esc(et(X_OPC, "cuello", datos.cuello))} · Objetivo 90 días: ${esc(et(X_OPC, "objetivo", datos.objetivo))}`
            : notaResultado(marca, datos, r, principal),
        ).slice(0, 4000),
        datos: extra,
      });
      return json({ ok: true, leadId: lead.id, creado: lead.nuevo });
    } catch (e) {
      console.error("[auditoria] leads 1000x:", e instanceof Error ? e.message : e);
      return json({ error: "leads" }, 502);
    }
  }

  if (!cuenta.token) return json({ error: "sin-token-pipedrive" }, 503);
  const token = cuenta.token;
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
    // Shadow y Elvin solo entran a AC si tienen lista propia configurada (1000X no pasa por aquí: ver arriba).
    const acConLista = { "shadow-operator": process.env.AC_LISTA_SO, "elvin-escalar": process.env.AC_LISTA_ELVIN } as Record<string, string | undefined>;
    if (!(marca in acConLista) || acConLista[marca]) {
      const tagsAC = [`origen:quiz`, `quiz:${evento}`];
      if (evento === "resultado" && body.resultado && typeof body.resultado === "object") {
        const r = body.resultado as { principal?: string; score?: number };
        if (r.principal) tagsAC.push(`quiz-principal:${String(r.principal).slice(0, 40)}`);
      }
      if (marca === "level-up" && tracking.avatar) tagsAC.push(`avatar:${String(tracking.avatar).slice(0, 20)}`);
      after(() => upsertContacto({ email, nombre, telefono, marca, tags: tagsAC }).then((r) => { if (!r.ok) console.error("[AC] upsert falló", r.error); }));
    }

    // Leads (Pulse): los quiz de Level Up y de AI Borinquen también entran al CRM nuevo, en paralelo con Pipedrive.
    if (marca === "level-up" || marca === "ai-borinquen") {
      const r = body.resultado && typeof body.resultado === "object" ? (body.resultado as { principal?: string }).principal : null;
      after(() => leadQuiz({ marca: marca === "ai-borinquen" ? "ai_borinquen" : "level_up", evento, nombre, email, telefono, negocio, resultado: r ?? null, avatar: tracking.avatar ? String(tracking.avatar) : null, utm: tracking.utm_source ? String(tracking.utm_source) : null }));
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
