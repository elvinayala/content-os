/**
 * Las herramientas del agente: definición (para Claude) + ejecución (código nuestro).
 * Todas devuelven JSON serializable; si una integración no está configurada, devuelven
 * `simulado: true` y el agente sigue funcionando.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { almacen, type Contacto, type Trabajo, type Candidato } from "./almacen.js";
import { menu, territorios } from "./prompt.js";
import { ventanasLibres, crearEvento, borrarEvento, plomeroDeTerritorio, cotizadorDeTerritorio, ventanasVisitaLibres, crearVisitaCotizador } from "./integraciones/calendario.js";
import fs from "node:fs";
import path from "node:path";
import { RAIZ, type Proyecto, type Contratista } from "./almacen.js";
import { crearLinkPago } from "./integraciones/cobros.js";
import { upsertContacto, crearOportunidad, agregarNota, huecosLibres, guardarCita, citasCalendario } from "./integraciones/crm.js";
import { dmSlack } from "./integraciones/slack.js";
import { mensajeCita, aceptaHora, esPrioridad, horaPrioritariaValida, chocaEntrevista, separarHuecos, unirOcupadas, MIN_ENTREVISTA } from "./reclutamiento.js";
/** Entrevistas ya agendadas (futuras), menos la del contacto que se está atendiendo. */
const entrevistasOcupadas = (contactoId?: string) => almacen.candidatos().filter((x) => x.estado === "entrevista" && x.entrevista && x.contactoId !== contactoId && new Date(x.entrevista).getTime() > Date.now() - MIN_ENTREVISTA * 60_000).map((x) => x.entrevista as string);
/** Las del agente + las reales del calendario de GHL (lo que se agenda o mueve a mano). Si GHL falla, quedan las del agente. */
const ocupadasConGhl = async (contactoId: string, ghlContactId: string | undefined, desde: Date, hasta: Date) => unirOcupadas(entrevistasOcupadas(contactoId), await citasCalendario(config.ghl.calEntrevista, new Date(desde.getTime() - MIN_ENTREVISTA * 60_000), new Date(hasta.getTime() + MIN_ENTREVISTA * 60_000)), ghlContactId);
import { avisarCoordinador } from "./canales/whatsapp.js";
import { programarLlamadaHumana } from "./llamar-cliente.js";

/** Quién puede hacer plomería en PR (Ley 59-2022): licencia de oficial o maestro, o certificado de aprendiz (con un maestro). */
const PUEDE_TRABAJAR = ["maestro", "oficial", "aprendiz"];
import { config } from "./config.js";
import { crearOferta } from "./despacho.js";
import { registrar as registrarEncuesta, MOTIVOS } from "./encuestas.js";

type Categoria = { id: string; nombre: string; ticket_plausible: [number, number]; tramo: string; preguntas: string[]; permisos: string; cross_sell: string[]; alias: string[] };
export const categorias: { visita_gratis: boolean; categorias: Categoria[] } = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "categorias-proyectos.json"), "utf8"));

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export const definiciones: Anthropic.Beta.BetaTool[] = [
  {
    name: "buscar_precio",
    description: "Busca en el menú de Resuelto el servicio que mejor corresponde al problema descrito y devuelve su precio fijo o rango, nivel (P/M/G) y notas. Úsala antes de dar cualquier precio.",
    input_schema: { type: "object", properties: { problema: { type: "string", description: "Descripción del problema o servicio en palabras del cliente" } }, required: ["problema"], additionalProperties: false },
  },
  {
    name: "verificar_cobertura",
    description: "Dado un municipio de Puerto Rico, dice si tenemos cobertura activa, el territorio, y el plomero asignado. Estados: activo, reclutando, pronto, sin-cobertura.",
    input_schema: { type: "object", properties: { municipio: { type: "string" } }, required: ["municipio"], additionalProperties: false },
  },
  {
    name: "consultar_disponibilidad",
    description: "Devuelve las ventanas de 2 horas libres del plomero del territorio para una fecha (YYYY-MM-DD). Pide como máximo 3 fechas distintas por turno.",
    input_schema: { type: "object", properties: { territorio_id: { type: "string" }, fecha: { type: "string", description: "YYYY-MM-DD" }, emergencia: { type: "boolean" } }, required: ["territorio_id", "fecha", "emergencia"], additionalProperties: false },
  },
  {
    name: "enlace_reserva",
    description: "Devuelve el enlace de la página de reserva de Resuelto con el servicio y el pueblo ya escogidos. El cliente escoge día y hora, deja sus datos y sube fotos del área él mismo. Úsalo cuando el cliente prefiera reservar solo o esté ocupado ('estoy en el trabajo', 'después te escribo'), o si quiere mandar fotos más cómodo.",
    input_schema: { type: "object", properties: { servicio_id: { type: "string", description: "id del menú (buscar_precio); 'diagnostico' si no está claro" }, municipio: { type: "string" } }, required: ["servicio_id", "municipio"], additionalProperties: false },
  },
  {
    name: "agendar_cita",
    description: "Crea el trabajo: evento en el calendario del plomero, oportunidad en el CRM y registro interno. Solo después de que el cliente aprobó precio y ventana y dio nombre y dirección.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string" }, telefono: { type: "string", description: "Con código de país, ej. 17875551234" }, municipio: { type: "string" }, territorio_id: { type: "string" },
        servicio_id: { type: "string", description: "id del menú devuelto por buscar_precio" }, emergencia: { type: "boolean" },
        direccion: { type: "string" }, referencia: { type: "string", description: "Punto de referencia o instrucciones de acceso; vacío si no hay" },
        inicio: { type: "string", description: "ISO 8601 con offset, ej. 2026-09-06T10:00:00-04:00" }, fin: { type: "string" },
        notas: { type: "string", description: "Resumen del problema y lo que se vio en fotos; vacío si no hay" },
      },
      required: ["nombre", "telefono", "municipio", "territorio_id", "servicio_id", "emergencia", "direccion", "referencia", "inicio", "fin", "notas"],
      additionalProperties: false,
    },
  },
  {
    name: "consultar_trabajo",
    description: "Busca los trabajos de este contacto (o por id R-0000) y devuelve estado, fecha, plomero y montos.",
    input_schema: { type: "object", properties: { trabajo_id: { type: "string", description: "id del trabajo o cadena vacía para listar los del contacto" } }, required: ["trabajo_id"], additionalProperties: false },
  },
  {
    name: "reprogramar_o_cancelar",
    description: "Mueve un trabajo a otra ventana o lo cancela.",
    input_schema: { type: "object", properties: { trabajo_id: { type: "string" }, accion: { type: "string", enum: ["reprogramar", "cancelar"] }, nuevo_inicio: { type: "string", description: "ISO; vacío si cancela" }, nuevo_fin: { type: "string" }, motivo: { type: "string" } }, required: ["trabajo_id", "accion", "nuevo_inicio", "nuevo_fin", "motivo"], additionalProperties: false },
  },
  {
    name: "crear_link_pago",
    description: "Genera el link de pago (tarjeta) e instrucciones de ATH Móvil para un trabajo. Total = mano de obra + coordinación + recargo + materiales cobrados (costo + 20%). Úsala al completar el trabajo o para el depósito del 50% en trabajos grandes.",
    input_schema: { type: "object", properties: { trabajo_id: { type: "string" }, mano_obra: { type: "number" }, materiales_costo: { type: "number", description: "Costo de materiales según recibo; 0 si no hubo" }, es_deposito_50: { type: "boolean" } }, required: ["trabajo_id", "mano_obra", "materiales_costo", "es_deposito_50"], additionalProperties: false },
  },
  {
    name: "horarios_entrevista",
    description: "Devuelve los huecos LIBRES reales del calendario de entrevistas de GHL (videollamada de hasta 1 h, lunes a viernes; ya vienen separados 1 h entre sí y de las entrevistas agendadas). Úsala antes de proponerle una hora a un plomero y propón SOLO horas de esta lista. Pasa `desde` (YYYY-MM-DD) si pidió un día en particular.",
    input_schema: { type: "object", properties: { desde: { type: "string", description: "YYYY-MM-DD; vacío = desde hoy" } }, required: [], additionalProperties: false },
  },
  {
    name: "registrar_candidato",
    description: "Registra a un plomero que quiere trabajar con Resuelto y, si ya eligió horario, agenda la entrevista por videollamada (bloquea 1 hora). Llámala en cuanto tengas lo básico, aunque todavía no haya entrevista acordada (entrevista vacío).",
    input_schema: {
      type: "object",
      properties: { nombre: { type: "string" }, whatsapp: { type: "string" }, nivel_licencia: { type: "string", enum: ["maestro", "oficial", "aprendiz", "en tramite", "no tiene"] }, numero_licencia: { type: "string", description: "vacío si no lo dio" }, municipio: { type: "string" }, experiencia: { type: "string", description: "años de experiencia como plomero, tal como lo dijo; vacío si no lo dio" }, equipo: { type: "string", description: "vehículo y herramientas que tiene" }, disponibilidad: { type: "string" }, entrevista: { type: "string", description: "ISO de la hora que el plomero ACEPTÓ en su último mensaje (un sí claro o que él mismo dijo esa hora): uno de los huecos de horarios_entrevista, o — solo si es maestro o gran candidato — la hora que él pidió (lun–sáb, 7 AM–6 PM, con -04:00). Vacío si aún no aceptó" } },
      required: ["nombre", "whatsapp", "nivel_licencia", "numero_licencia", "municipio", "experiencia", "equipo", "disponibilidad", "entrevista"],
      additionalProperties: false,
    },
  },
  {
    name: "agregar_lista_espera",
    description: "Anota a alguien de un municipio sin cobertura para avisarle cuando abramos su zona.",
    input_schema: { type: "object", properties: { municipio: { type: "string" }, nombre: { type: "string" } }, required: ["municipio", "nombre"], additionalProperties: false },
  },
  {
    name: "anotar_otro_oficio",
    description: "Anota en la LISTA DE ESPERA de Resuelto a alguien que NO es plomero pero ofrece otro oficio (electricista/perito, handyman, técnico de aire acondicionado, pintor, contratista general, jardinero…). Resuelto va a abrir más oficios y lo llamamos primero cuando abra el suyo. Llámala en cuanto tengas nombre + oficio + área; lo que falte va vacío.",
    input_schema: { type: "object", properties: {
      nombre: { type: "string" }, oficio: { type: "string", description: "el oficio tal como lo dijo, p. ej. 'perito electricista'" },
      municipio: { type: "string", description: "municipio o área donde trabaja ('toda la isla' vale)" },
      experiencia: { type: "string", description: "años de experiencia tal como lo dijo; vacío si no lo dio" },
      licencia: { type: "string", description: "licencia/colegiación del oficio si la mencionó; vacío si no" },
      telefono: { type: "string", description: "su número (10 dígitos); vacío si todavía no lo dio" },
      nota: { type: "string", description: "algo útil en una línea (dónde ha trabajado, si tiene guagua, etc.)" },
    }, required: ["nombre", "oficio", "municipio"], additionalProperties: false },
  },
  {
    name: "clasificar_contacto",
    description: "Llámala EN CUANTO sepas qué tipo de persona escribe (normalmente en el 1er o 2º mensaje): cliente de plomería, dueño con proyecto, plomero candidato o contratista candidato. Crea la tarjeta en el CRM de inmediato para que el equipo la vea aunque la persona no termine la conversación. Llámala una vez por contacto, y de nuevo si cambia el tipo o cuando te dé su teléfono (pásalo en telefono).",
    input_schema: { type: "object", properties: { tipo: { type: "string", enum: ["cliente", "cliente-proyecto", "plomero-candidato", "contratista"] }, nombre: { type: "string", description: "vacío si aún no lo dio" }, municipio: { type: "string", description: "vacío si aún no lo dio" }, resumen: { type: "string", description: "1 línea: qué quiere o qué dijo" }, telefono: { type: "string", description: "teléfono de 10 dígitos si ya lo dio (en Messenger/Instagram es la única forma de tenerlo); vacío si no" } }, required: ["tipo", "nombre", "municipio", "resumen"], additionalProperties: false },
  },
  {
    name: "guardar_nota_cliente",
    description: "Guarda un dato útil del contacto para futuras conversaciones (nombre, dirección, preferencia, detalle de la casa, aviso interno).",
    input_schema: { type: "object", properties: { nota: { type: "string" }, nombre: { type: "string", description: "vacío si no cambia" }, municipio: { type: "string" }, direccion: { type: "string" }, tipo: { type: "string", enum: ["cliente", "plomero-candidato", "cliente-proyecto", "contratista", "otro", ""] } }, required: ["nota", "nombre", "municipio", "direccion", "tipo"], additionalProperties: false },
  },
  {
    name: "escalar_a_humano",
    description: "Pasa la conversación al Coordinador de Resuelto. A partir de aquí el agente deja de responder hasta que un humano la libere.",
    input_schema: { type: "object", properties: { motivo: { type: "string", enum: ["urgencia-agua", "cliente-molesto", "reclamacion", "pide-humano", "fuera-de-menu", "no-entiendo", "legal-prensa", "otro"] }, resumen: { type: "string", description: "2-3 líneas con contexto para el humano" }, urgente: { type: "boolean" } }, required: ["motivo", "resumen", "urgente"], additionalProperties: false },
  },
  // ── División Proyectos ──
  {
    name: "precalificar_proyecto",
    description: "Registra y precalifica un PROYECTO de mejora (baños, cocinas, pisos, puertas/ventanas, remodelación, piscinas, exteriores, poda). Devuelve el rango de ticket plausible de la categoría, si hay cotizador en la zona y el siguiente paso. Resuelto NO da precio final por chat: da rango y agenda visita gratis.",
    input_schema: { type: "object", properties: {
      categoria_id: { type: "string", enum: ["poda-arboles", "banos", "cocinas", "pisos", "puertas-ventanas", "remodelacion-general", "piscinas", "exteriores", "otra"] },
      municipio: { type: "string" }, descripcion: { type: "string", description: "Qué quiere hacer, en palabras del cliente" },
      tamano: { type: "string", description: "Tamaño aproximado (pies, cantidad, áreas); vacío si no lo sabe" },
      presupuesto_cliente: { type: "string", description: "Lo que dice que tiene o espera gastar; 'no sabe' si no lo dijo" },
      plazo: { type: "string", description: "Para cuándo lo quiere; vacío si no lo dijo" },
      propiedad: { type: "string", enum: ["propia", "autorizado", "alquiler", "desconocida"] },
      fotos_recibidas: { type: "number" }, nombre: { type: "string" }, telefono: { type: "string" } },
      required: ["categoria_id", "municipio", "descripcion", "tamano", "presupuesto_cliente", "plazo", "propiedad", "fotos_recibidas", "nombre", "telefono"], additionalProperties: false },
  },
  {
    name: "ventanas_visita",
    description: "Ventanas de 2 horas libres del cotizador del territorio para la visita gratis de cotización en una fecha (YYYY-MM-DD). Mínimo 12 h de aviso.",
    input_schema: { type: "object", properties: { territorio_id: { type: "string" }, fecha: { type: "string" } }, required: ["territorio_id", "fecha"], additionalProperties: false },
  },
  {
    name: "agendar_visita_cotizacion",
    description: "Agenda la visita del cotizador a la propiedad para un proyecto ya precalificado. Crea el evento en el calendario del cotizador y la oportunidad en el CRM.",
    input_schema: { type: "object", properties: { proyecto_id: { type: "string" }, inicio: { type: "string", description: "ISO con offset" }, fin: { type: "string" }, direccion: { type: "string" }, referencia: { type: "string", description: "vacío si no hay" } }, required: ["proyecto_id", "inicio", "fin", "direccion", "referencia"], additionalProperties: false },
  },
  {
    name: "registrar_contratista",
    description: "Registra a un contratista que quiere ejecutar proyectos con Resuelto (programa Resuelto Verified). Registro DACO vigente es requisito.",
    input_schema: { type: "object", properties: {
      nombre: { type: "string" }, empresa: { type: "string", description: "vacío si trabaja a su nombre" }, whatsapp: { type: "string" },
      categorias: { type: "array", items: { type: "string" }, description: "ids de categorías que ejecuta" },
      zonas: { type: "string", description: "municipios o zonas que cubre" }, registro_daco: { type: "string", description: "número de registro DACO; vacío si no tiene" },
      seguro: { type: "string", description: "qué seguro tiene; vacío si ninguno" }, licencias: { type: "string", description: "licencias de oficio si aplica; vacío si no" },
      experiencia_anos: { type: "number" }, capacidad_mensual: { type: "string", description: "cuántos proyectos puede tomar al mes" }, portfolio: { type: "string", description: "link o descripción; vacío si no" } },
      required: ["nombre", "empresa", "whatsapp", "categorias", "zonas", "registro_daco", "seguro", "licencias", "experiencia_anos", "capacidad_mensual", "portfolio"], additionalProperties: false },
  },
  {
    name: "registrar_encuesta",
    description: "Guarda las respuestas de la encuesta post-visita (QA del cotizador + recuperación de la venta). Llámala cuando tengas las respuestas principales, aunque falten algunas.",
    input_schema: { type: "object", properties: {
      proyecto_id: { type: "string" },
      llego_a_tiempo: { type: "boolean" }, profesional: { type: "number", description: "1–5" }, explico_bien: { type: "number", description: "1–5" }, cotizacion_clara: { type: "number", description: "1–5" },
      precio_recibido: { type: "number", description: "el precio que el cliente recuerda; 0 si no lo dijo" },
      contrato: { type: "boolean", description: "¿ya contrató el proyecto (con nosotros o con otro)?" },
      motivo_no_contrato: { type: "string", enum: [...MOTIVOS, ""] },
      esta_comparando: { type: "boolean" }, interes_financiamiento: { type: "boolean" },
      fecha_deseada: { type: "string", description: "vacío si no aplica" }, problema_representante: { type: "string", description: "vacío si no hubo" }, comentario: { type: "string", description: "resumen en 1–2 líneas de lo que dijo" } },
      required: ["proyecto_id", "llego_a_tiempo", "profesional", "explico_bien", "cotizacion_clara", "precio_recibido", "contrato", "motivo_no_contrato", "esta_comparando", "interes_financiamiento", "fecha_deseada", "problema_representante", "comentario"], additionalProperties: false },
  },
];

// ─────────────────────────── ejecución ───────────────────────────

type Ctx = { contacto: Contacto; ultimoTexto?: string };

function buscarServicio(problema: string) {
  const p = norm(problema);
  const puntuar = (s: (typeof menu.servicios)[number]) => {
    let pts = 0;
    for (const a of (s as any).alias as string[] ?? []) if (p.includes(norm(a))) pts += 3 + norm(a).length / 10;
    for (const w of norm(s.nombre).split(/\s+/)) if (w.length > 3 && p.includes(w)) pts += 1;
    return pts;
  };
  const ordenados = menu.servicios.map((s) => ({ s, pts: puntuar(s) })).sort((a, b) => b.pts - a.pts);
  return ordenados[0].pts > 0 ? ordenados.slice(0, 3).filter((x) => x.pts > 0).map((x) => x.s) : [];
}

function territorioDeMunicipio(municipio: string) {
  const m = norm(municipio);
  return territorios.territorios.find((t) => t.municipios.some((x) => norm(x) === m || m.includes(norm(x))));
}

export async function ejecutar(nombre: string, input: any, ctx: Ctx): Promise<unknown> {
  switch (nombre) {
    case "buscar_precio": {
      const res = buscarServicio(input.problema);
      if (!res.length) return { encontrado: false, sugerencia: "No está en el menú. Ofrece diagnóstico ($69, se acredita) o escala si es comercial." };
      return { encontrado: true, opciones: res.map((s) => ({ id: s.id, nombre: s.nombre, nivel: s.nivel, precio: s.precio ?? null, rango: s.rango ?? null, cotizacion_en_sitio: !!s.cotizacion, nota: s.nota ?? null })), cargo_coordinacion: menu.cargo_coordinacion, recargo_emergencia: menu.recargo_emergencia, manejo_materiales_pct: menu.manejo_materiales_pct, garantia_meses: menu.garantia_meses };
    }
    case "verificar_cobertura": {
      const t = territorioDeMunicipio(input.municipio);
      if (!t) return { estado: "sin-cobertura", municipio: input.municipio, accion: "lista de espera" };
      // Cobertura REAL: hay servicio solo si hay un plomero ACTIVO en el registro para ese territorio.
      const pl = plomeroDeTerritorio(t.id);
      const estado = pl ? "activo" : t.estado === "activo" ? "reclutando" : t.estado;
      return { estado, territorio_id: t.id, territorio: t.nombre, plomero: pl ? { id: pl.id, nombre: pl.nombre } : null, accion: pl ? "agendar" : "lista de espera" };
    }
    case "enlace_reserva": {
      const q = new URLSearchParams({ s: String(input.servicio_id ?? ""), p: String(input.municipio ?? ""), o: ctx.contacto.canal });
      return { ok: true, enlace: `${config.urlPublica}/reservar?${q.toString()}`, nota: "Mándalo completo, en su propia línea. La confirmación le llega por texto cuando el plomero acepte." };
    }
    case "consultar_disponibilidad": {
      const v = await ventanasLibres(input.territorio_id, input.fecha, !!input.emergencia);
      return { fecha: input.fecha, ventanas: v, simulado: !config.tiene.calendario() };
    }
    case "agendar_cita": {
      const servicio = menu.servicios.find((s) => s.id === input.servicio_id);
      if (!servicio) return { error: "servicio_id inválido; usa buscar_precio" };
      const t = territorios.territorios.find((x) => x.id === input.territorio_id);
      if (!t) return { error: "territorio inválido" };
      if (!plomeroDeTerritorio(t.id)) return { error: "sin_plomero_activo", accion: "No agendes. Todavía no hay plomero activo en esa zona: ofrece la lista de espera (agregar_lista_espera) y di que le avisamos apenas abramos." };
      const id = almacen.nuevoIdTrabajo();
      const manoObra = servicio.precio ?? null;
      const ghlId = ctx.contacto.ghlContactId ?? (await upsertContacto({ nombre: input.nombre, telefono: input.telefono, municipio: input.municipio, tags: ["cliente", "agendado", t.id], fuente: ctx.contacto.canal }));
      let oportunidadId: string | undefined;
      if (ghlId) oportunidadId = await crearOportunidad({ contactId: ghlId, nombre: input.nombre, valor: (manoObra ?? servicio.rango?.[0] ?? 0) + menu.cargo_coordinacion, trabajoId: id });
      const trabajo: Trabajo = { id, contactoId: ctx.contacto.id, nombre: input.nombre, telefono: input.telefono, municipio: input.municipio, territorio: t.id, plomeroId: "", servicioId: servicio.id, servicio: servicio.nombre, nivel: servicio.nivel as any, manoObra, rango: servicio.rango, fee: menu.cargo_coordinacion, emergencia: !!input.emergencia, direccion: input.direccion, referencia: input.referencia || undefined, inicio: input.inicio, fin: input.fin, estado: "agendado", ghlOpportunityId: oportunidadId, fotos: [], creado: new Date().toISOString() };
      almacen.guardarTrabajo(trabajo);
      almacen.guardarContacto({ ...ctx.contacto, nombre: input.nombre, telefono: input.telefono, municipio: input.municipio, direccion: input.direccion, tipo: "cliente", ghlContactId: ghlId });
      // Despacho: la oferta sale a todos los plomeros del territorio; el primero que acepta se la lleva.
      const pagoPlomero = manoObra ? Math.round(manoObra * 0.65 * 100) / 100 : 0;
      const oferta = await crearOferta({ tipo: "trabajo", referencia: id, categoria: "plomeria", categoriaNombre: servicio.nombre, territorio: t.id, municipio: input.municipio, resumen: `${servicio.nombre}${input.emergencia ? " · EMERGENCIA" : ""}. ${input.notas || ""}`.trim(), pagoProveedor: pagoPlomero + (input.emergencia ? Math.round(menu.recargo_emergencia * 0.65 * 100) / 100 : 0), inicio: input.inicio, fin: input.fin });
      return { ok: true, trabajo_id: id, oferta_id: oferta.id, plomeros_avisados: oferta.avisados.length, crm: oportunidadId ? "creado" : "simulado", total_estimado: manoObra ? manoObra + menu.cargo_coordinacion + (input.emergencia ? menu.recargo_emergencia : 0) : null, nota_para_el_cliente: "Confirma la cita; el nombre y la foto del plomero se envían 30 minutos antes." };
    }
    case "consultar_trabajo": {
      const todos = almacen.trabajos();
      const res = input.trabajo_id ? todos.filter((t) => t.id === input.trabajo_id) : todos.filter((t) => t.contactoId === ctx.contacto.id);
      return { trabajos: res.map((t) => ({ id: t.id, servicio: t.servicio, estado: t.estado, inicio: t.inicio, fin: t.fin, plomero: t.plomeroId, mano_obra: t.manoObra, fee: t.fee, emergencia: t.emergencia, link_pago: t.linkPago ?? null })) };
    }
    case "reprogramar_o_cancelar": {
      const t = almacen.trabajos().find((x) => x.id === input.trabajo_id);
      if (!t) return { error: "no existe" };
      if (input.accion === "cancelar") {
        if (t.eventoCalendarId) await borrarEvento(t.territorio, t.eventoCalendarId);
        almacen.guardarTrabajo({ ...t, estado: "cancelado" });
        await avisarCoordinador(`❌ Cancelado ${t.id} (${t.servicio}, ${t.municipio}). Motivo: ${input.motivo}`);
        return { ok: true, estado: "cancelado" };
      }
      if (t.eventoCalendarId) await borrarEvento(t.territorio, t.eventoCalendarId);
      const nuevoEvento = await crearEvento(t.territorio, { titulo: `${t.id} · ${t.servicio} · ${t.nombre}`, descripcion: `Reprogramado. ${input.motivo}`, inicio: input.nuevo_inicio, fin: input.nuevo_fin, direccion: `${t.direccion}, ${t.municipio}, PR` });
      almacen.guardarTrabajo({ ...t, inicio: input.nuevo_inicio, fin: input.nuevo_fin, eventoCalendarId: nuevoEvento });
      await avisarCoordinador(`🔁 Reprogramado ${t.id} → ${new Date(input.nuevo_inicio).toLocaleString("es-PR", { timeZone: config.zonaHoraria })}`);
      return { ok: true, estado: "agendado", inicio: input.nuevo_inicio, fin: input.nuevo_fin };
    }
    case "crear_link_pago": {
      const t = almacen.trabajos().find((x) => x.id === input.trabajo_id);
      if (!t) return { error: "no existe" };
      const materialesCobrados = Math.round(input.materiales_costo * (1 + menu.manejo_materiales_pct / 100) * 100) / 100;
      let total = input.mano_obra + t.fee + (t.emergencia ? menu.recargo_emergencia : 0) + materialesCobrados;
      if (input.es_deposito_50) total = Math.round(total * 50) / 100;
      const link = await crearLinkPago({ trabajoId: t.id, concepto: t.servicio + (input.es_deposito_50 ? " (depósito 50%)" : ""), montoCentavos: Math.round(total * 100), telefono: t.telefono });
      almacen.guardarTrabajo({ ...t, linkPago: link.url, estado: input.es_deposito_50 ? t.estado : "completado", manoObra: input.mano_obra });
      return { total, desglose: { mano_obra: input.mano_obra, coordinacion: t.fee, emergencia: t.emergencia ? menu.recargo_emergencia : 0, materiales_costo: input.materiales_costo, materiales_cobrados: materialesCobrados }, link_tarjeta: link.url ?? null, ath_movil: link.athMovil, simulado: link.simulado };
    }
    case "horarios_entrevista": {
      const desde = input.desde && /^\d{4}-\d{2}-\d{2}$/.test(input.desde) ? new Date(`${input.desde}T00:00:00-04:00`) : new Date();
      const inicio = new Date(Math.max(desde.getTime(), Date.now()));
      const huecos = separarHuecos(await huecosLibres(config.ghl.calEntrevista, inicio, new Date(inicio.getTime() + 8 * 86_400_000)), await ocupadasConGhl(ctx.contacto.id, ctx.contacto.ghlContactId, inicio, new Date(inicio.getTime() + 8 * 86_400_000)));
      if (!huecos.length) return { ok: false, mensaje: "No pude leer el calendario ahora. Pregúntale qué días y horas le sirven, anótalo en disponibilidad y dile que el equipo lo llama para cuadrar." };
      const fmt = (iso: string) => new Date(iso).toLocaleString("es-PR", { timeZone: config.zonaHoraria, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
      return { ok: true, huecos: huecos.slice(0, 16).map((iso) => ({ iso, texto: fmt(iso) })), nota: "Propón 1 o 2 que caigan en lo que él dijo. Cuando confirme, llama registrar_candidato con entrevista = el iso exacto." };
    }
    case "registrar_candidato": {
      // Un candidato por contacto: si ya existe (el agente lo actualiza al cuadrar la entrevista o al saber más),
      // se reusa su id en vez de crear otro P-xxx (22/sep: David quedó registrado dos veces).
      const previo = almacen.candidatos().find((x) => x.contactoId === ctx.contacto.id);
      // Candado: solo se agenda si el plomero ACEPTÓ esa hora en su último mensaje (23/sep: Abilo dijo
      // "No tengo trabajo a esa hora" y se le confirmó igual). Si no, se registra lo demás y no se agenda.
      let sinAceptar: string | null = null;
      if (input.entrevista && input.entrevista !== previo?.entrevista && !aceptaHora(ctx.ultimoTexto, input.entrevista, config.zonaHoraria)) {
        sinAceptar = `No agendé: en su último mensaje ("${String(ctx.ultimoTexto ?? "").slice(0, 120)}") no aceptó esa hora. NO le confirmes nada. Si dijo que no puede o que tiene trabajo, pregúntale qué hora le sirve; si no está claro, pregúntale directo si le sirve o no.`;
        input = { ...input, entrevista: previo?.entrevista ?? "" };
      }
      // Candado legal (24/sep, Ley 59-2022 Art. 29): sin licencia de oficial/maestro ni certificado de aprendiz no se
      // puede hacer plomería, así que no hay entrevista. Se registra igual (ruta de aprendiz), pero no se agenda.
      let sinLicencia: string | null = null;
      if (input.entrevista && input.entrevista !== previo?.entrevista && !PUEDE_TRABAJAR.includes(String(input.nivel_licencia))) {
        sinLicencia = `No agendé: sin licencia de oficial o maestro ni certificado de aprendiz, por ley (Ley 59-2022) no puede hacer plomería, así que no hay entrevista. NO le confirmes nada. Explícale la ruta del certificado de aprendiz (no lleva examen: curso de plomería de 3 meses en una escuela acreditada y lo solicita a la Junta) y que nos escriba cuando lo tenga.`;
        input = { ...input, entrevista: previo?.entrevista ?? "" };
      }
      const c: Candidato = { id: previo?.id ?? "P-" + String(almacen.candidatos().length + 1).padStart(3, "0"), contactoId: ctx.contacto.id, nombre: input.nombre, whatsapp: input.whatsapp, nivelLicencia: input.nivel_licencia, numeroLicencia: input.numero_licencia || undefined, municipio: input.municipio, experiencia: input.experiencia || undefined, equipo: input.equipo, disponibilidad: input.disponibilidad, entrevista: input.entrevista || undefined, estado: input.entrevista ? "entrevista" : "nuevo", creado: previo?.creado ?? new Date().toISOString() };
      almacen.guardarCandidato(c);
      const ghlId = await upsertContacto({ nombre: c.nombre, telefono: c.whatsapp, municipio: c.municipio, tags: ["plomero-candidato", c.nivelLicencia], fuente: ctx.contacto.canal });
      almacen.guardarContacto({ ...ctx.contacto, nombre: c.nombre, telefono: c.whatsapp, municipio: c.municipio, tipo: "plomero-candidato", ghlContactId: ghlId });
      // Misma tarjeta que crea el formulario web (netlify/functions/lead.mjs): pipeline Candidatos → Aplicó.
      if (ghlId) {
        if (!ctx.contacto.ghlOpportunityId) { const op = await crearOportunidad({ contactId: ghlId, nombre: c.nombre, valor: 0, trabajoId: c.id, pipelineId: process.env.GHL_PIPELINE_CANDIDATOS_ID, stageId: process.env.GHL_STAGE_CANDIDATO_APLICO }); if (op) { ctx.contacto.ghlOpportunityId = op; almacen.guardarContacto(ctx.contacto); } }
        await agregarNota(ghlId, `Aplicó por WhatsApp (agente). Licencia: ${c.nivelLicencia}${c.numeroLicencia ? " #" + c.numeroLicencia : ""} · Municipio: ${c.municipio}${c.experiencia ? " · Experiencia: " + c.experiencia : ""} · Equipo: ${c.equipo} · Disponibilidad: ${c.disponibilidad}${c.entrevista ? " · Entrevista acordada: " + c.entrevista : ""}`);
      }
      // Entrevista acordada → cita en el calendario de GHL (asignada a la reclutadora) + DM corto por Slack.
      let cita: { ok: boolean; error?: string } | null = null;
      if (c.entrevista && ghlId && c.entrevista !== previo?.entrevista) {
        // Maestros y grandes candidatos: se les da la hora que pidan (lun–sáb 7–6) aunque no sea un hueco libre.
        const prioridad = esPrioridad(c);
        let fueraDeHorario = false;
        if (prioridad && horaPrioritariaValida(c.entrevista)) {
          const dia = new Date(c.entrevista);
          const libres = await huecosLibres(config.ghl.calEntrevista, new Date(dia.getTime() - 12 * 3600_000), new Date(dia.getTime() + 12 * 3600_000));
          fueraDeHorario = !libres.some((h) => new Date(h).getTime() === dia.getTime());
        }
        // Ni la hora de un gran candidato puede caer a menos de 1 h de otra entrevista (Yaileen dura ~1 h).
        cita = chocaEntrevista(c.entrevista, await ocupadasConGhl(ctx.contacto.id, ghlId, new Date(c.entrevista), new Date(c.entrevista))) ? { ok: false, error: "choca con otra entrevista" } : await guardarCita({ calendarId: config.ghl.calEntrevista, contactId: ghlId, inicio: c.entrevista, minutos: MIN_ENTREVISTA, titulo: `${prioridad ? "⭐ " : ""}Entrevista · ${c.nombre} (${c.nivelLicencia}${c.experiencia ? ", " + c.experiencia : ""}) · ${c.municipio}`, asignadoA: config.ghl.usuarioReclutamiento, citaId: previo?.ghlCitaId, lugar: config.zoomEntrevistas || undefined, forzar: fueraDeHorario });
        if (cita.ok) { almacen.guardarCandidato({ ...c, ghlCitaId: (cita as { id?: string }).id ?? previo?.ghlCitaId }); await dmSlack(config.slack.reclutamiento, mensajeCita(c, c.entrevista, fueraDeHorario)); }
        else { almacen.guardarCandidato({ ...c, entrevista: previo?.entrevista, estado: previo?.entrevista ? "entrevista" : "nuevo" }); }
      } else if (previo?.ghlCitaId) almacen.guardarCandidato({ ...c, ghlCitaId: previo.ghlCitaId });
      if (sinAceptar) return { ok: false, candidato_id: c.id, registrado: true, error: sinAceptar };
      if (sinLicencia) return { ok: false, candidato_id: c.id, registrado: true, error: sinLicencia };
      if (cita && !cita.ok) {
        const t = territorioDeMunicipio(c.municipio);
        return { ok: false, candidato_id: c.id, territorio: t ? `${t.id} ${t.nombre}` : "", error: "Esa hora ya no está libre en el calendario (o no es un hueco válido). NO le confirmes la cita: llama horarios_entrevista y ofrécele otra." };
      }
      await avisarCoordinador(`🔧 Candidato ${c.id}: ${c.nombre} (${c.nivelLicencia}${c.numeroLicencia ? " " + c.numeroLicencia : ""}) · ${c.municipio}${c.experiencia ? " · " + c.experiencia + " de experiencia" : ""} · ${c.equipo}${c.entrevista ? `\nEntrevista: ${new Date(c.entrevista).toLocaleString("es-PR", { timeZone: config.zonaHoraria })}` : ""}`);
      const t = territorioDeMunicipio(c.municipio);
      // Cita recién confirmada: el enlace de Zoom va en el mensaje de confirmación, tal cual.
      const zoom = cita?.ok && config.zoomEntrevistas ? { enlace_videollamada: config.zoomEntrevistas, instruccion_enlace: "Confírmale día y hora y pégale este enlace de Zoom completo, tal cual, en una línea aparte. Dile que entre ahí a esa hora." } : {};
      return { ...zoom, ok: true, candidato_id: c.id, territorio: t ? `${t.id} ${t.nombre}` : "sin territorio definido aún", nota: "Reclutamos en todo Puerto Rico: sigue con la entrevista sin importar el municipio.", apto_por_licencia: PUEDE_TRABAJAR.includes(c.nivelLicencia), ...(PUEDE_TRABAJAR.includes(c.nivelLicencia) ? {} : { nota_ley: "Sin licencia ni certificado de aprendiz: no hay entrevista. Ofrécele la ruta del certificado de aprendiz; no le prometas trabajos." }) };
    }
    case "anotar_otro_oficio": {
      // Otros oficios (26/sep, Elvin: "no le cierres la puerta al electricista: lista de espera y lo llamamos cuando abramos").
      const previo = almacen.candidatos().find((x) => x.contactoId === ctx.contacto.id);
      const tel = String(input.telefono || ctx.contacto.telefono || (ctx.contacto.canal === "whatsapp" ? ctx.contacto.identificador : "") || "").replace(/\D/g, "");
      const c: Candidato = { id: previo?.id ?? "P-" + String(almacen.candidatos().length + 1).padStart(3, "0"), contactoId: ctx.contacto.id, nombre: input.nombre, whatsapp: tel, nivelLicencia: input.licencia || "no aplica", municipio: input.municipio, experiencia: input.experiencia || undefined, oficio: input.oficio, equipo: input.nota || "", disponibilidad: "", estado: "lista-espera", creado: previo?.creado ?? new Date().toISOString() };
      almacen.guardarCandidato(c);
      const oficioTag = "oficio-" + norm(input.oficio).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const ghlId = await upsertContacto({ nombre: c.nombre, telefono: tel || undefined, municipio: c.municipio, tags: ["lista-espera-oficios", oficioTag], fuente: ctx.contacto.canal });
      almacen.guardarContacto({ ...ctx.contacto, nombre: c.nombre, telefono: tel || ctx.contacto.telefono, municipio: c.municipio, tipo: "plomero-candidato", ghlContactId: ghlId ?? ctx.contacto.ghlContactId });
      if (ghlId) await agregarNota(ghlId, `Lista de espera · ${input.oficio}${input.licencia ? " (" + input.licencia + ")" : ""} · ${c.municipio}${c.experiencia ? " · " + c.experiencia : ""}${input.nota ? " · " + input.nota : ""}. Llamar cuando Resuelto abra ese oficio.`);
      return { ok: true, candidato_id: c.id, falta_telefono: !tel, nota: tel ? "Anotado. Dile que quedó en la lista y que cuando abramos su oficio lo llamamos primero." : "Anotado sin teléfono: pídeselo una vez para poder llamarlo cuando abramos." };
    }
    case "agregar_lista_espera": {
      almacen.agregarListaEspera({ municipio: input.municipio, nombre: input.nombre, contactoId: ctx.contacto.id, creado: new Date().toISOString() });
      await upsertContacto({ nombre: input.nombre, telefono: ctx.contacto.telefono, municipio: input.municipio, tags: ["lista-espera", `espera-${norm(input.municipio).replace(/\s+/g, "-")}`], fuente: ctx.contacto.canal });
      return { ok: true };
    }
    case "clasificar_contacto": {
      const c = ctx.contacto;
      const telNuevo = String(input.telefono ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
      const primerTelefono = telNuevo.length === 10 && !c.telefono;
      if (telNuevo.length === 10) c.telefono = telNuevo;
      if (input.nombre) c.nombre = input.nombre;
      if (input.municipio) c.municipio = input.municipio;
      c.tipo = input.tipo;
      const tagTipo = input.tipo === "cliente" ? "cliente" : input.tipo === "cliente-proyecto" ? "cliente-proyecto" : input.tipo === "plomero-candidato" ? "plomero-candidato" : "contratista-candidato";
      // En Messenger/Instagram el identificador es un id de Meta, no un teléfono: no se manda como teléfono a GHL.
      const telGhl = c.telefono ?? (c.canal === "whatsapp" ? c.identificador : undefined);
      const ghlId = c.ghlContactId ?? (telGhl ? await upsertContacto({ nombre: c.nombre, telefono: telGhl, municipio: c.municipio, tags: [tagTipo], fuente: c.canal }) : undefined);
      if (ghlId && !c.ghlContactId) c.ghlContactId = ghlId;
      else if (ghlId) await upsertContacto({ nombre: c.nombre, telefono: telGhl, municipio: c.municipio, tags: [tagTipo], fuente: c.canal });
      // Tarjeta en el pipeline que corresponda, una sola vez.
      if (ghlId && !c.ghlOpportunityId) {
        const etiqueta = c.nombre || (c.telefono ?? c.identificador);
        const pipe = input.tipo === "plomero-candidato" ? { pipelineId: process.env.GHL_PIPELINE_CANDIDATOS_ID, stageId: process.env.GHL_STAGE_CANDIDATO_APLICO }
          : input.tipo === "contratista" ? { pipelineId: process.env.GHL_PIPELINE_CONTRATISTAS_ID, stageId: process.env.GHL_STAGE_CONTRATISTA_APLICO }
          : input.tipo === "cliente-proyecto" ? { pipelineId: process.env.GHL_PIPELINE_PROYECTOS_ID, stageId: process.env.GHL_STAGE_VISITA_AGENDADA }
          : { pipelineId: config.ghl.pipelineId, stageId: process.env.GHL_STAGE_NUEVO };
        const op = await crearOportunidad({ contactId: ghlId, nombre: etiqueta, valor: 0, trabajoId: "WA", ...pipe });
        if (op) c.ghlOpportunityId = op;
        await agregarNota(ghlId, `Escribió por ${c.canal}. ${input.resumen}`);
      }
      almacen.guardarContacto(c);
      // Cliente que dejó su teléfono: si no agenda en 20 min, una persona lo llama y cierra a mano (Elvin, 25/sep).
      if (primerTelefono && (input.tipo === "cliente" || input.tipo === "cliente-proyecto")) {
        if (c.ghlContactId) await agregarNota(c.ghlContactId, `📞 Dio su teléfono (${c.telefono}) por ${c.canal}. Si no agenda, llamarlo para cerrar. ${input.resumen}`);
        programarLlamadaHumana(c.id, input.resumen);
      }
      return { ok: true, en_crm: !!ghlId, tarjeta: !!c.ghlOpportunityId, ...(primerTelefono ? { telefono_guardado: true } : {}) };
    }
    case "guardar_nota_cliente": {
      const c = { ...ctx.contacto };
      if (input.nombre) c.nombre = input.nombre;
      if (input.municipio) c.municipio = input.municipio;
      if (input.direccion) c.direccion = input.direccion;
      if (input.tipo) c.tipo = input.tipo;
      c.notas = [...c.notas, `${new Date().toISOString().slice(0, 10)}: ${input.nota}`].slice(-20);
      almacen.guardarContacto(c);
      Object.assign(ctx.contacto, c);
      if (c.ghlContactId) await agregarNota(c.ghlContactId, input.nota);
      return { ok: true };
    }
    case "escalar_a_humano": {
      const humanoDesde = new Date().toISOString();
      almacen.guardarContacto({ ...ctx.contacto, humano: true, humanoDesde });
      Object.assign(ctx.contacto, { humano: true, humanoDesde });
      await avisarCoordinador(`${input.urgente ? "🚨 URGENTE" : "🙋 Escalado"} · ${input.motivo}\nContacto: ${ctx.contacto.nombre ?? ""} ${ctx.contacto.telefono ?? ctx.contacto.identificador} (${ctx.contacto.canal})\n${input.resumen}\n\nPara devolver al agente: ${config.urlPublica}/admin/liberar/${encodeURIComponent(ctx.contacto.id)}?t=${config.adminToken}`);
      return { ok: true, mensaje_para_cliente: "Dile que en unos minutos le escribe alguien del equipo. No sigas cotizando." };
    }
    case "precalificar_proyecto": {
      const cat = categorias.categorias.find((c) => c.id === input.categoria_id);
      const t = territorioDeMunicipio(input.municipio);
      const cot = t ? cotizadorDeTerritorio(t.id) : undefined;
      let estado: Proyecto["estado"] = "precalificado"; let motivo: string | undefined;
      if (!cat) { estado = "descartado"; motivo = "categoria_no_incluida"; }
      else if (input.propiedad === "alquiler") { estado = "descartado"; motivo = "no_es_propietario"; }
      const presupuestoNum = Number(String(input.presupuesto_cliente).replace(/[^0-9.]/g, "")) || null;
      const presupuestoBajo = !!(cat && presupuestoNum && presupuestoNum < cat.ticket_plausible[0] / 2);
      const id = almacen.nuevoIdProyecto();
      const ghlId = ctx.contacto.ghlContactId ?? (await upsertContacto({ nombre: input.nombre, telefono: input.telefono, municipio: input.municipio, tags: ["proyecto", input.categoria_id, estado], fuente: ctx.contacto.canal }));
      const proyecto: Proyecto = { id, contactoId: ctx.contacto.id, categoriaId: input.categoria_id, nombre: input.nombre, telefono: input.telefono, municipio: input.municipio, territorio: t?.id, descripcion: input.descripcion, tamano: input.tamano || undefined, presupuestoCliente: input.presupuesto_cliente || undefined, plazo: input.plazo || undefined, propiedad: input.propiedad, fotos: Number(input.fotos_recibidas) || 0, estado, motivoDescarte: motivo, ghlContactId: ghlId, fuente: ctx.contacto.canal, creado: new Date().toISOString() };
      almacen.guardarProyecto(proyecto);
      almacen.guardarContacto({ ...ctx.contacto, nombre: input.nombre, telefono: input.telefono, municipio: input.municipio, tipo: "cliente-proyecto", ghlContactId: ghlId });
      if (estado === "precalificado") await avisarCoordinador(`🏗️ Proyecto ${id} · ${cat?.nombre}\n${input.nombre} · ${input.telefono} · ${input.municipio}${t ? ` (${t.id})` : " (sin territorio)"}\n${input.descripcion.slice(0, 200)}${presupuestoBajo ? "\n⚠️ presupuesto declarado bajo" : ""}`);
      return { proyecto_id: id, estado, motivo: motivo ?? null, categoria: cat?.nombre ?? null, ticket_plausible: cat?.ticket_plausible ?? null, permisos: cat?.permisos ?? null, preguntas_utiles: cat?.preguntas ?? [], presupuesto_bajo: presupuestoBajo, territorio_id: t?.id ?? null, hay_cotizador: !!cot && cot.estado !== "por-contratar", cotizador_estado: cot?.estado ?? "sin-cotizador", siguiente_paso: estado !== "precalificado" ? "explicar con honestidad y cerrar" : cot ? (cot.estado === "por-contratar" ? "lista de espera: aún no hay cotizador en la zona; anotar y avisar" : "ofrecer 2 ventanas con ventanas_visita y agendar") : "agregar_lista_espera" };
    }
    case "ventanas_visita": {
      const v = await ventanasVisitaLibres(input.territorio_id, input.fecha);
      return { fecha: input.fecha, ventanas: v, simulado: !config.tiene.calendario(), visita_gratis: categorias.visita_gratis };
    }
    case "agendar_visita_cotizacion": {
      const p = almacen.proyectos().find((x) => x.id === input.proyecto_id);
      if (!p) return { error: "proyecto no existe" };
      if (!p.territorio) return { error: "proyecto sin territorio; usa agregar_lista_espera" };
      const cat = categorias.categorias.find((c) => c.id === p.categoriaId);
      const res = await crearVisitaCotizador(p.territorio, { titulo: `${p.id} · Cotización ${cat?.nombre ?? p.categoriaId} · ${p.nombre}`, descripcion: `Tel: ${p.telefono}\n${p.descripcion}\nTamaño: ${p.tamano ?? "-"} · Presupuesto: ${p.presupuestoCliente ?? "-"} · Plazo: ${p.plazo ?? "-"}\nFotos: ${p.fotos}\nReferencia: ${input.referencia}`, inicio: input.inicio, fin: input.fin, direccion: `${input.direccion}, ${p.municipio}, PR` });
      if (!res) return { error: "sin cotizador en el territorio" };
      let oportunidadId: string | undefined;
      if (p.ghlContactId) oportunidadId = await crearOportunidad({ contactId: p.ghlContactId, nombre: p.nombre, valor: cat ? Math.round((cat.ticket_plausible[0] + cat.ticket_plausible[1]) / 2) : 0, trabajoId: p.id, pipelineId: process.env.GHL_PIPELINE_PROYECTOS_ID, stageId: process.env.GHL_STAGE_VISITA_AGENDADA });
      almacen.guardarProyecto({ ...p, estado: "visita-agendada", cotizadorId: res.cotizadorId, visita: { inicio: input.inicio, fin: input.fin, cotizadorId: res.cotizadorId, eventoCalendarId: res.eventoId }, ghlOpportunityId: oportunidadId });
      almacen.guardarContacto({ ...ctx.contacto, direccion: input.direccion });
      await avisarCoordinador(`📐 Visita agendada ${p.id} · ${cat?.nombre}\n${p.nombre} · ${p.telefono}\n${new Date(input.inicio).toLocaleString("es-PR", { timeZone: config.zonaHoraria })}\n${input.direccion}, ${p.municipio}\nCotizador: ${res.cotizadorId}`);
      return { ok: true, proyecto_id: p.id, cotizador: res.cotizadorId, calendario: res.eventoId ? "creado" : "simulado", crm: oportunidadId ? "creado" : "simulado" };
    }
    case "registrar_contratista": {
      const c: Contratista = { id: almacen.nuevoIdContratista(), contactoId: ctx.contacto.id, nombre: input.nombre, empresa: input.empresa || undefined, whatsapp: input.whatsapp, categorias: input.categorias ?? [], zonas: String(input.zonas).split(/[,;]/).map((z: string) => z.trim()).filter(Boolean), registroDaco: input.registro_daco || undefined, seguro: input.seguro || undefined, licencias: input.licencias || undefined, experienciaAnos: Number(input.experiencia_anos) || undefined, capacidadMensual: input.capacidad_mensual || undefined, portfolio: input.portfolio || undefined, estado: "nuevo", proyectos: 0, creado: new Date().toISOString() };
      almacen.guardarContratista(c);
      const ghlId = await upsertContacto({ nombre: c.nombre, telefono: c.whatsapp, tags: ["contratista-candidato", ...c.categorias], fuente: ctx.contacto.canal });
      almacen.guardarContacto({ ...ctx.contacto, nombre: c.nombre, telefono: c.whatsapp, tipo: "contratista", ghlContactId: ghlId });
      if (ghlId) {
        if (!ctx.contacto.ghlOpportunityId) { const op = await crearOportunidad({ contactId: ghlId, nombre: c.nombre, valor: 0, trabajoId: c.id, pipelineId: process.env.GHL_PIPELINE_CONTRATISTAS_ID, stageId: process.env.GHL_STAGE_CONTRATISTA_APLICO }); if (op) { ctx.contacto.ghlOpportunityId = op; almacen.guardarContacto(ctx.contacto); } }
        await agregarNota(ghlId, `Aplicó por WhatsApp (agente). ${c.empresa ? "Empresa: " + c.empresa + " · " : ""}Categorías: ${c.categorias.join(", ")} · Zonas: ${c.zonas.join(", ")} · DACO: ${c.registroDaco ?? "NO"} · Seguro: ${c.seguro ?? "no indica"} · Exp: ${c.experienciaAnos ?? "?"} años`);
      }
      await avisarCoordinador(`🧱 Contratista ${c.id}: ${c.nombre}${c.empresa ? ` (${c.empresa})` : ""}\nCategorías: ${c.categorias.join(", ")} · Zonas: ${c.zonas.join(", ")}\nDACO: ${c.registroDaco ?? "NO"} · Seguro: ${c.seguro ?? "no indica"} · Exp: ${c.experienciaAnos ?? "?"} años · Capacidad: ${c.capacidadMensual ?? "?"}`);
      return { ok: true, contratista_id: c.id, apto_documental: !!c.registroDaco, faltantes: [!c.registroDaco ? "registro DACO (requisito)" : null, !c.seguro ? "seguro de responsabilidad" : null, !c.portfolio ? "portfolio o fotos de trabajos" : null].filter(Boolean), siguiente_paso: c.registroDaco ? "verificación documental y entrevista (hasta 1 h); ofrecer 2 horarios" : "explicar que el registro DACO es requisito y cómo obtenerlo (daco.pr.gov, ~$205 + fianza); anotar para cuando lo tenga" };
    }
    case "registrar_encuesta": {
      const r = await registrarEncuesta(input.proyecto_id, { llegoATiempo: input.llego_a_tiempo, profesional: input.profesional, explicoBien: input.explico_bien, cotizacionClara: input.cotizacion_clara, precioRecibido: input.precio_recibido || undefined, contrato: input.contrato, motivoNoContrato: input.motivo_no_contrato || undefined, estaComparando: input.esta_comparando, interesFinanciamiento: input.interes_financiamiento, fechaDeseada: input.fecha_deseada || undefined, problemaRepresentante: input.problema_representante || undefined, comentario: input.comentario || undefined });
      return { ...r, siguiente_paso: r.senalRecovery ? "Agradece y dile que alguien del equipo lo llama mañana para ver cómo ayudarlo (sin prometer descuentos)." : r.alertaRepresentante ? "Agradece, pide disculpas por la experiencia y di que lo revisamos hoy." : "Agradece y cierra." };
    }
    default:
      return { error: `herramienta desconocida: ${nombre}` };
  }
}
