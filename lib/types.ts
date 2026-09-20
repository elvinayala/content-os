// Tipos centralizados del tablero de contenido.
// Cada sección consume estos tipos desde lib/mock/*. Reemplazá los mocks por
// llamadas reales a API manteniendo estas firmas y el resto de la UI sigue andando.

export type Plataforma =
  | "Instagram"
  | "TikTok"
  | "YouTube"
  | "X"
  | "LinkedIn";

// 1. Baúl de Ganchos
export interface Gancho {
  id: string;
  titulo: string;
  fuente: string; // quién lo hizo primero (@handle / cuenta)
  guardadoEl: string; // ISO date
  nicho: string; // para filtrar por nicho
  tipo: string; // tipo de gancho (ej. "negación", "lista", "contraste")
  vistas: number; // vistas del contenido original
  tags: string[];
  transcripto: string; // texto literal del gancho
  plantilla: string; // versión reutilizable con [placeholders]
}

// 2. Métricas
export type RangoDias = "7" | "30" | "90";

export interface MetricaResumen {
  key: string;
  label: string; // etiqueta corta (ej. "IG VIEWS")
  valor: number;
  deltaPct: number; // variación vs. período anterior
  formato: "numero" | "porcentaje";
  prefijo?: string; // ej. "+" para seguidores
  // serie del minigráfico (sparkline) por rango de días
  series: Record<RangoDias, number[]>;
}

export interface PuntoSemana {
  dia: string; // "Lun", "Mar", ...
  vistas: number;
  guardados: number;
  seguidores: number;
}

export interface Bombazo {
  id: string;
  titulo: string;
  plataforma: Plataforma;
  vistas: number;
  guardados: number;
  // por qué explotó (una línea)
  razon: string;
}

// Mediana de vistas de los últimos 30 días. Un reel es "bombazo" si la duplica.
export const MEDIANA_30D = 48_000;

// 3. Rastreador de Competencia
// Cuenta seguida (para el ranking de la parte de arriba).
export interface CuentaCompetencia {
  id: string;
  creador: string; // @handle
  iniciales: string; // para el avatar
  seguidores: number;
  topVistas: number; // vistas del mejor reel del período
  // Análisis del referente (ventana 60 días) — opcionales para no romper data vieja.
  nombre?: string; // fullName
  reelsAnalizados?: number; // cuántos reels en 60d
  vistasPromedio?: number; // promedio de vistas en 60d
  engagementProm?: number; // engagement promedio %
  postsPorSemana?: number; // cadencia
  mejorFormato?: string; // el formato que más le rinde
  mejorAngulo?: string; // el ángulo que más le rinde
  queAprender?: string; // 1 frase: qué copiarle
}

export interface ReelCompetencia {
  id: string;
  creador: string; // @handle
  seguidores: number;
  iniciales: string;
  gancho: string; // gancho transcripto del audio / 1ra línea del caption
  textoPantalla: string; // texto en pantalla del reel
  plataforma: Plataforma;
  vistas: number;
  engagementPct: number;
  publicadoEl: string; // ISO date
  url: string;
  // Enriquecido (opcional) — lo clasifica /sync-competencia.
  angulo?: string; // problema / solución / autoridad / contraste / storytime / lista…
  formato?: string; // talking head / B-roll / tutorial / carrusel-reel / voz en off…
  likes?: number;
  comentarios?: number;
}

// Snapshot del rastreador de competencia (data/competencia.json, lo escribe
// /sync-competencia con Apify). Sin snapshot → mock.
export interface CompetenciaSnapshot {
  actualizadoEl: string;
  fuente: "apify" | "mock";
  cuentas: CuentaCompetencia[];
  reels: ReelCompetencia[];
}

// 4. Community Manager
export interface BorradorPlataforma {
  plataforma: Plataforma;
  descripcion: string;
  activa: boolean;
}

export interface PublicacionMulti {
  id: string;
  titulo: string;
  estado: "borrador" | "programado" | "publicado";
  fecha: string; // ISO date
  plataformas: BorradorPlataforma[];
}

// 5. Calendario de Contenido
export interface EventoCalendario {
  id: string;
  fecha: string; // ISO date (YYYY-MM-DD)
  hora: string; // "HH:MM"
  titulo: string;
  gancho: string;
  angulo: string;
  descripcion: string; // guion/descripción completa (panel lateral)
  plataforma: Plataforma;
  estado: "idea" | "guion" | "grabar" | "editar" | "listo";
  origen: "manual" | "guion" | "estudio"; // "guion" => /guion · "estudio" => calendario del Estudio (Sofi)
  // Campos del Estudio (plan de guerra Q4 2026). Opcionales para no romper las
  // entradas viejas. `cara` = quién graba; `keyword` = palabra del CTA.
  marca?: "level-up" | "ai-borinquen" | "shadow-operator" | "bori";
  pilar?: "problema" | "solucion" | "producto" | "mentalidad";
  cara?: string;
  formato?: string;
  keyword?: string;
  semana?: string; // "S1".."S4" del mes
}

// 6. Tendencias
// Etiqueta automática de cada novedad según su utilidad para contenido.
export type EtiquetaTendencia = "potencial" | "explicativo" | "ignorar";

export interface Tendencia {
  id: string;
  titulo: string;
  fuente: string; // una de las 12 fuentes
  resumen: string;
  etiqueta: EtiquetaTendencia;
  angulosContenido: string[]; // ideas de cómo convertirlo en contenido
  fecha: string; // ISO date
  url: string;
}

// Configuración del negocio (capa de personalización).
// Lo edita la página /configuracion y lo usan los agentes del Equipo.
export interface CuentaConectada {
  plataforma: Plataforma;
  handle: string;
  conectada: boolean; // OAuth real lo enciende el usuario
}

export interface MixSemanal {
  reels: number;
  carruseles: number;
  youtube: number;
}

export interface ReglasAgentes {
  mixSemanal: MixSemanal; // estrategia de Santi
  horariosPublicacion: string[]; // horarios de Facu ("HH:MM")
  umbralBombazo: number; // múltiplo de la mediana (Mateo)
  resumenSlackHora: string; // hora del resumen (Cami/Tendencias)
  ideasPorSemana: number; // ideas ganadoras (Cami)
}

export interface Negocio {
  marca: {
    handle: string;
    nombre: string;
    nicho: string;
    tono: string;
    audiencia: string;
    oferta: string;
    cta: string;
  };
  cuentas: CuentaConectada[];
  competidores: string[]; // hasta 8 @handles (Mateo)
  fuentes: string[]; // 12 fuentes (Cami/Tendencias)
  reglas: ReglasAgentes;
}

// Dashboard de agencias (Level Up Media + AI Borinquen) desde Google Sheets.
// Locale del libro de ventas: define cómo se parsea el dinero.
//  - "US": $1,000.00 (coma miles, punto decimal)  → Level Up Media
//  - "EU": $1.000,00 (punto miles, coma decimal)   → AI Borinquen
export type LocaleNumero = "US" | "EU";

export interface RefHoja {
  sheetId: string;
  gid: string;
}

export interface Agencia {
  id: string; // slug ("level-up", "ai-borinquen")
  nombre: string;
  activa: boolean; // se prende cuando la agencia tiene su data lista
  locale: LocaleNumero; // formato de números de su hoja de ventas
  // Columnas usadas para KPIs (varían de nombre entre hojas).
  columnas: {
    cliente: string; // "Nombre del Cliente"
    neto: string; // "Valor Neto de la venta"
    transaccion: string; // "Tipo de Transacción"
  };
  ventas: RefHoja; // libro de ventas (obligatorio)
  metricas?: RefHoja & {
    // pestañas dentro del libro de métricas de la tesorera (opcional)
    gidCac?: string;
    gidLtv?: string;
    gidChurn?: string;
  };
}

// Fila cruda de una hoja de ventas (columnas dinámicas).
export type VentaRow = Record<string, string>;

// Métricas de negocio que calcula la tesorera (una por período, por agencia).
// Viven en data/metricas.json; se actualizan el 1 de cada mes.
export interface MetricasNegocio {
  periodo: string; // "Junio 2026"
  fuente: string; // "Tesorería (xlsx)"
  cac: number | null;
  cacDetalle: {
    costoTotal: number;
    clientesNuevos: number;
    ads: number;
    comisiones: number;
    herramientas: number;
    pagoRealizado: number;
  };
  churn: number | null; // % (23/20 = 115)
  churnDetalle: { clientesInicio: number; clientesSeFueron: number };
  ltvPromedio: number | null;
  ltvTotal: number | null;
  ltvPorCliente: LtvCliente[];
}

export interface LtvCliente {
  cliente: string;
  negocio?: string;
  total: number; // valor de vida acumulado
}

// Las 3 métricas que calcula la tesorera + derivados de las ventas.
export interface MetricasAgencia {
  fuente: "hoja" | "fallback"; // de dónde salieron (hoja publicada o snapshot)
  cac: number | null; // Costo de Adquisición de Clientes
  ltvPromedio: number | null; // LTV promedio
  churn: number | null; // Tasa de cancelación (%)
  clientesNuevos: number | null;
  costoTotalAdquisicion: number | null;
  ltvPorCliente: LtvCliente[]; // tabla LTV por cliente (derivada de ventas)
}

// KPIs de cabecera calculados desde el libro de ventas.
export interface KpisVentas {
  totalFacturado: number; // suma de valor neto
  cantidadVentas: number;
  clientesUnicos: number;
  ticketPromedio: number;
}

// Todo lo que la página del dashboard necesita por agencia.
export interface DashboardAgencia {
  agencia: Agencia;
  headers: string[];
  filas: VentaRow[];
  kpis: KpisVentas;
  metricas: MetricasAgencia;
  negocio: MetricasNegocio | null; // CAC/LTV/Churn de la tesorera (data/metricas.json)
  error?: string; // si falló la lectura de la hoja
}

// ---- CEO Command Center (/ceo) — PASO 01: datos mock ----
// El ecosistema completo: las dos agencias + la marca personal.
export type UnidadNegocio =
  | "level-up"
  | "ai-borinquen"
  | "shadow-operator"
  | "ecosistema";

export type EstadoAgente = "working" | "waiting" | "idle";
export type CapaAgente = "command" | "specialist";

// Contadores del chip de la card (ROUTES / READS / ...).
export interface StatAgente {
  label: string;
  valor: number;
}

// Agente del organigrama ejecutivo. El icon (LucideIcon) vive en lib/ceo.ts
// para no acoplar este archivo a lucide.
export interface AgenteEjecutivo {
  id: string;
  nombre: string; // "CEO", "Researcher", "CMO"...
  rol: string; // "Orchestrator", "Intel Gatherer"...
  subtitulo: string; // chip mono uppercase: "COMMAND LAYER"
  descripcion: string;
  capa: CapaAgente;
  estado: EstadoAgente;
  tareaActual?: string; // qué hace ahora (working) o qué espera (waiting)
  modelo: string; // chip MODEL
  unidad: UnidadNegocio;
  stats: StatAgente[];
  vinculos: { href: string; label: string }[]; // secciones donde opera
  supervisaA?: string[]; // ids de lib/equipo.ts (el CMO supervisa a Sofi y su squad)
}

export type PrioridadTarea = "alta" | "media" | "baja";
export type EstadoTarea = "pendiente" | "en-curso" | "bloqueada" | "hecha";

export interface TareaEcosistema {
  id: string;
  titulo: string;
  detalle?: string;
  unidad: UnidadNegocio;
  agenteId: string; // dueño (id de AgenteEjecutivo) — para el roster
  responsable?: string; // persona real con quien quedó / que debe hacerlo
  conQuien?: string; // con quién lo habló Elvin (si aplica)
  origen?: string; // "Daily", "Reunión: X", "Slack", "Orquestador"
  prioridad: PrioridadTarea;
  estado: EstadoTarea;
  vence?: string; // ISO date
  requiereCEO: boolean; // necesita decisión de Elvin → sube al Command Center
  // Rol de Elvin en esta tarea (según organigrama): la ejecuta él, la decide, o
  // solo debe enterarse (la hace el equipo). Default "hacer" si no se especifica.
  paraCeo?: "hacer" | "decidir" | "saber";
}

export interface TareasSnapshot {
  actualizadoEl: string;
  tareas: TareaEcosistema[];
}

export type EtapaLead =
  | "nuevo"
  | "contactado"
  | "calificado"
  | "propuesta"
  | "cerrado"
  | "perdido";

export interface LeadPipeline {
  id: string;
  nombre: string;
  negocio?: string;
  unidad: UnidadNegocio;
  etapa: EtapaLead;
  valorMensual: number; // retainer estimado USD
  origen: string; // "Meta Ads", "Referido", "IG DM"...
  ultimoContacto: string; // ISO date
  nota?: string;
  creadoEl?: string; // cuándo entró el lead (add_time) — para contadores por día
  ganadoEl?: string; // cuándo se cerró (won_time) — para onboardings
  dueno?: string; // owner del deal (Jessica, Ana...)
}

// Onboarding nuevo (deal ganado) — para la notificación del Command Center.
export interface OnboardingNuevo {
  id: string;
  cliente: string;
  negocio?: string;
  unidad: UnidadNegocio;
  valorMensual: number;
  dueno?: string; // quién lo cerró / hace el onboarding (Jessica, Ana)
  objetivo?: string; // meta del cliente (si está en Pipedrive)
  acuerdo?: string; // qué incluye / términos
  resumen?: string; // resumen del negocio
  ganadoEl: string; // ISO date
}

// Snapshot de onboardings (lo escribe /brief-ceo desde #office-3-onboarding).
export interface OnboardingsSnapshot {
  actualizadoEl: string;
  onboardings: OnboardingNuevo[];
}

// Todo lo que devuelve el pipeline en vivo (Pipedrive) o el mock.
export interface ResultadoPipeline {
  leads: LeadPipeline[];
  fuente: "pipedrive" | "mock";
  unidadesLive: UnidadOps[]; // qué unidades vinieron de la API
  errores: string[];
  onboardings: OnboardingNuevo[]; // deals ganados recientemente
}

export type TipoEventoAgenda = "reunion" | "grabacion" | "deadline" | "foco";

export interface EventoAgenda {
  id: string;
  fecha: string; // ISO date
  hora: string; // "HH:MM"
  titulo: string;
  tipo: TipoEventoAgenda;
  unidad: UnidadNegocio;
  duracionMin?: number;
}

export type TipoKnowledge = "sop" | "playbook" | "prompt" | "doc" | "grabacion";

export interface ItemKnowledge {
  id: string;
  titulo: string;
  tipo: TipoKnowledge;
  unidad: UnidadNegocio;
  resumen: string;
  actualizado: string; // ISO date
  tags: string[];
}

export type NivelAtencion = "urgente" | "hoy" | "semana";

// Informe consolidado del CEO/Orquestador (análogo al informe de Sofi,
// pero de TODO el ecosistema).
export interface DebriefCEO {
  fecha: string; // ISO date
  titular: string; // una frase: estado general
  // El brief evolucionó de {texto} a {titulo, detalle}; la UI acepta ambas
  // formas (ver normalizarAtencion) — sin eso los ítems salían en blanco.
  atencion: {
    texto?: string;
    titulo?: string;
    detalle?: string;
    nivel: NivelAtencion;
    href?: string;
  }[];
  // Qué cerraron los agentes. El brief evolucionó de texto plano a objeto con
  // cliente/estratega/dato; la UI acepta ambas formas (ver normalizarLogro).
  logros: (string | { cliente?: string; estratega?: string; dato?: string })[];
}

// ---- PASO 02: snapshots de operaciones reales ----
// Los escribe la tarea programada /brief-ceo (Slack + Calendar + IA) en
// data/*.json; el dashboard los lee con lib/ops.ts. Si un snapshot no
// existe, la UI cae al mock de lib/mock/ceo.ts.

export type SeveridadOps = "alta" | "media";
export type UnidadOps = Extract<UnidadNegocio, "level-up" | "ai-borinquen">;

// Win de cliente detectado en Slack (ej. #clientes-wins).
export interface WinCliente {
  id: string; // "win-<ts slack>"
  cliente: string;
  estratega?: string;
  resumen: string; // qué se logró, en una frase con el dato duro
  canal: string; // "#clientes-wins"
  canalId: string;
  permalink?: string; // link directo al mensaje
  ts: string; // ISO datetime del mensaje original
}

// Situación crítica (cliente molesto / en riesgo) detectada en Slack.
export interface SituacionCritica {
  id: string;
  cliente: string;
  estratega?: string;
  resumen: string;
  severidad: SeveridadOps; // alta = riesgo de churn/escalada; media = fricción
  accionSugerida?: string; // qué recomienda el agente que haga el CEO
  canal: string;
  canalId: string;
  permalink?: string;
  ts: string;
}

// Snapshot de operaciones por unidad (data/ops-levelup.json, data/ops-borinquen.json).
export interface OpsUnidad {
  unidad: UnidadOps;
  actualizadoEl: string; // ISO datetime de la corrida
  ventanaHoras: number; // ventana de críticos/notas analizada
  ventanaWinsDias?: number; // los wins se acumulan con ventana más amplia (7 días)
  wins: WinCliente[];
  criticos: SituacionCritica[];
  notas?: string[]; // señales que no son win ni crítico pero valen
}

// Evento real de Google Calendar (data/agenda.json).
export interface EventoAgendaExt extends EventoAgenda {
  origen: "gcal" | "agente"; // "agente" = creado por la tarea con [CEO-AGENT]
  gcalId?: string; // para dedupe
  link?: string; // htmlLink del evento
}

export interface SnapshotAgenda {
  actualizadoEl: string;
  timezone: string; // "America/Puerto_Rico"
  ventanaDias: number;
  eventos: EventoAgendaExt[];
  // audit trail de lo que el agente agregó al Calendar
  creadosPorAgente: {
    titulo: string;
    fecha: string;
    motivo: string;
    gcalId?: string;
  }[];
}

// Insights de IG de Shadow Operator (data/ig-shadow.json).
export interface PostIG {
  id: string;
  url: string;
  tipo: "reel" | "carrusel" | "imagen";
  caption: string; // recortado
  publicadoEl: string; // ISO date
  vistas: number | null;
  likes: number;
  comentarios: number;
}

export interface InsightsIG {
  handle: string;
  actualizadoEl: string;
  fuente: "apify" | "graph-api";
  seguidores: number | null;
  totalPosts?: number; // total de publicaciones de la cuenta
  posts: PostIG[]; // últimos posts scrapeados
  hallazgos: string[]; // conclusiones IA: qué formato/ángulo rinde
}

// Debrief consolidado real (data/debrief.json). Su ausencia = usar mock.
export interface SnapshotDebrief {
  actualizadoEl: string; // ISO datetime
  fuente: "agente";
  debrief: DebriefCEO;
}

// Portales privados (campos tentativos hasta tener los accesos — F5).
// levelUp/aiBorinquen/total = CASH COLLECTED del mes (dinero que entró).
export interface MesVentasEA {
  mes: string;
  levelUp: number | null;
  aiBorinquen: number | null;
  total: number;
  valorNeto?: number | null; // valor de contratos firmados (secundario)
  adSpend?: number | null; // gasto en anuncios del mes
  roas?: number | null; // cash collected / gasto en anuncios
}

export interface YtdVentasEA {
  anio: number;
  levelUp: number; // cash collected acumulado del año
  aiBorinquen: number;
  total: number;
  valorNeto: number;
}

export interface SnapshotVentasEA {
  actualizadoEl: string;
  fuente: string; // "EA Market (Google Sheets)"
  meses: MesVentasEA[]; // últimos meses (cash collected)
  ytd?: YtdVentasEA; // acumulado del año en curso
  umbralRoas?: number; // ROAS mínimo saludable (default 4)
}

export interface SnapshotLlamadas {
  actualizadoEl: string;
  fuente: string; // "Zoom Intelligence"
  kpis: {
    llamadasSetters: number | null;
    demosClosers: number | null;
    revenueDetectado: number | null;
    tasaCierre: number | null; // %
  };
  objecionesTop: string[];
}

// Config de fuentes del Command Center (data/fuentes.json — sin secretos;
// los tokens van a .env.local). La usan /brief-ceo y lib/pipedrive.ts.
export interface CanalSlack {
  id: string;
  nombre: string;
}

// ---- PASO 03: encargos (trabajos pesados que ejecuta el worker local) ----
export type TipoEncargo =
  | "transcribir-perfil"
  | "ideas-ganadoras-batch"
  | "analizar-competidor";
export type EstadoEncargo = "pendiente" | "en-curso" | "hecho" | "error";

export interface Encargo {
  id: string; // "enc-<timestamp>"
  tipo: TipoEncargo;
  params: Record<string, string>; // { handle: "@x", limite: "30" }
  estado: EstadoEncargo;
  pedidoPor: "jarvis" | "manual";
  creadoEl: string;
  actualizadoEl: string;
  resultado?: { resumen: string; rutas: string[] };
  error?: string;
}

export interface ColaEncargos {
  encargos: Encargo[];
}

// ---- Entregas del equipo (la fábrica de contenido, coordinada por el CEO) ----
export type TipoEntrega =
  | "idea"
  | "gancho"
  | "guion"
  | "carrusel"
  | "historia"
  | "anuncio"
  | "email";
export type EstadoEntrega = "nuevo" | "visto" | "aprobado" | "descartado";

export interface Entrega {
  id: string;
  tipo: TipoEntrega;
  marca: UnidadNegocio;
  titulo: string; // el hook / la idea en una línea
  contenido: string; // el desarrollo completo (markdown)
  pilar?: string; // problema | solución | producto | mentalidad
  angulo?: string; // ángulo núcleo de la marca
  agente: string; // quién lo produjo (Cami, Lauti, Facu...)
  creadoEl: string; // ISO
  estado: EstadoEntrega;
  para?: string; // para qué creador/persona es (ej. "Daren", "Frankie", "Valentina")
  formato?: string; // "anuncio" | "reel" | "carrusel libreta"... (para ads/formatos)
  videoUrl?: string; // anuncios: link al video renderizado (Higgsfield)
  modelo?: string; // anuncios: modelo usado (ej. "kling-3.0", "seedance-2.0")
  promptVideo?: string; // anuncios: prompt de video usado (para iterar/re-renderizar)
  lista?: string; // emails: segmento de la lista ("clientes", "inactivos", "agendados-no-compraron", "newsletter-general")
}

export interface EntregasSnapshot {
  actualizadoEl: string;
  entregas: Entrega[];
}

// Cuota mensual de producción por marca (data/produccion.json).
export type PlanProduccion = Partial<
  Record<UnidadNegocio, Partial<Record<TipoEntrega, number>>>
>;

// ============================================================================
// AI Borinquen — Super Plataforma (admin-first)
// Voice Agent Studio, instancias AutoFlow (DFY) y asistente personal.
// El PASO 1 es la consola ADMIN (Elvin la usa acá); el portal de clientes
// (multi-tenant + Stripe) reutiliza estos tipos en una fase posterior.
// ============================================================================

export type ProveedorVoz = "retell" | "vapi";
export type EstadoAgenteVoz = "borrador" | "activo" | "pausado";

// Config NEUTRAL del agente de voz (agnóstica del proveedor). El adapter la
// traduce al payload de Retell/Vapi. El preset "muy probado" por defecto vive
// en lib/voz/preset.ts como VOZ_PRESET_DEFAULT.
export interface VozConfig {
  // STT (reconocimiento de voz)
  sttProveedor: string; // "deepgram"
  sttModelo: string; // "nova-3" | "flux"
  idioma: string; // "multi" cubre el code-switch español/inglés de PR
  interimResults: boolean; // parciales → habilita generación preventiva
  // LLM (cerebro)
  llmModelo: string; // rápido para turnos normales (Haiku)
  llmModeloEscalado: string; // más capaz solo para tools/razonamiento (Sonnet)
  temperatura: number;
  maxTokens: number;
  promptSistema: string; // 3-5 frases (prompt chico + cacheado)
  // TTS (síntesis de voz)
  ttsProveedor: string; // "elevenlabs" | "cartesia"
  ttsVozId: string; // voz LatAm/PR fijada
  ttsModelo: string; // "eleven_flash_v2_5"
  // Turn detection / VAD
  turnMode: "semantic" | "vad"; // semántico > silencio fijo
  vadMinSilencioMs: number; // 400
  endpointMinMs: number; // 400 (piso)
  endpointMaxMs: number; // 2000 (techo)
  generacionPreventiva: boolean; // dispara LLM sobre el parcial (ahorra 150-350ms)
  bargeIn: boolean; // corta el TTS al detectar voz
  fillers: string[]; // frases contextuales antes de ops lentas
  objetivoLatenciaMs: number; // objetivo voz-a-voz (< ~1000)
}

// Métricas de un agente de voz (la consistencia vive en el p95).
export interface MetricasVoz {
  llamadas: number;
  latenciaP50Ms: number | null;
  latenciaP95Ms: number | null;
  duracionPromMin: number | null;
}

export interface AgenteVoz {
  id: string;
  nombre: string;
  proveedor: ProveedorVoz;
  unidad: UnidadNegocio; // dueño (ai-borinquen por defecto)
  cliente?: string; // si es de un cliente (DFY/DWY)
  proposito: string; // "recepción", "calificar leads", "agendar citas"
  estado: EstadoAgenteVoz;
  numero?: string; // número telefónico asignado
  config: VozConfig;
  externalId?: string; // id en Retell/Vapi cuando es real
  fuente: ProveedorVoz | "mock"; // de dónde salió (o si es local/mock)
  entrenamiento?: Entrenamiento; // info del negocio + conversaciones (DWY)
  creadoEl: string; // ISO
  actualizadoEl: string; // ISO
  metricas?: MetricasVoz;
}

// Transcripción de una llamada (mock/real) — para la pestaña del detalle.
export interface TranscriptoLlamada {
  id: string;
  agenteId: string;
  fecha: string; // ISO datetime
  duracionSeg: number;
  turnos: { rol: "agente" | "cliente"; texto: string; latenciaMs?: number }[];
  resultado?: string; // "cita agendada", "lead calificado"...
}

// ---- Instancias AutoFlow (DFY) — el producto hecho-para-ti por cliente ----
export type EstadoInstancia = "onboarding" | "activo" | "pausado";
export type CanalEntrada = "whatsapp" | "instagram" | "messenger" | "web";

export interface InstanciaAutoFlow {
  id: string;
  cliente: string;
  negocio?: string;
  unidad: UnidadNegocio; // ai-borinquen
  estado: EstadoInstancia;
  canales: CanalEntrada[]; // de dónde entran los mensajes
  crm: string; // "GoHighLevel"
  numero?: string; // número del negocio (YCloud/Twilio)
  agentesVoz: string[]; // ids de AgenteVoz vinculados
  tier: string; // "$1,200" | "$3,500" | "$6,000"
  etapaPipeline: number; // 1-4 del pipeline de implementación
  pasosOnboarding: { paso: string; hecho: boolean }[];
  creadoEl: string; // ISO
  actualizadoEl: string; // ISO
}

// ---- Asistente personal (Telegram/WhatsApp) — el add-on ----
export type CanalAsistente = "telegram" | "whatsapp";
export type EstadoAsistente = "borrador" | "activo" | "pausado";

export interface AsistentePersonal {
  id: string;
  cliente: string;
  canal: CanalAsistente;
  estado: EstadoAsistente;
  tools: string[]; // acciones habilitadas: "crear_lead", "agendar"...
  promptSistema: string;
  creadoEl: string; // ISO
  actualizadoEl: string; // ISO
}

// ---- Crear + entrenar un agente (el corazón del portal DWY) ----
// El cliente elige el tipo y entrena su agente con la info del negocio +
// conversaciones recientes. Mismo entrenamiento sirve para voz y chat.
export type TipoAgente = "voz" | "chat";

export interface Entrenamiento {
  nicho: string; // rubro del negocio
  oferta: string; // qué vende / ofrece
  tono: string; // cómo habla la marca
  publico: string; // a quién atiende
  cta: string; // qué querés que logre (agendar, cotizar, vender)
  conversaciones: string; // conversaciones recientes pegadas (material real)
}

// ---- Asistente de Chat (WhatsApp/IG/web) — el otro tipo de agente ----
export type CanalChat = "whatsapp" | "instagram" | "messenger" | "web";

export interface MetricasChat {
  chats: number;
  resueltosPct: number | null;
  leads: number;
}

export interface AsistenteChat {
  id: string;
  nombre: string;
  proveedor: "borinquen"; // motor propio (tool-loop de Bori), no telefonía
  unidad: UnidadNegocio;
  cliente?: string;
  proposito: string;
  estado: EstadoAgenteVoz; // borrador | activo | pausado
  canales: CanalChat[];
  promptSistema: string; // armado desde el entrenamiento
  entrenamiento?: Entrenamiento;
  creadoEl: string; // ISO
  actualizadoEl: string; // ISO
  metricas?: MetricasChat;
}

export interface FuentesConfig {
  slack: Record<
    UnidadOps,
    {
      workspace: string;
      conectado: boolean;
      canales: {
        wins: CanalSlack | null;
        criticos: CanalSlack | null;
        csm?: CanalSlack | null; // fulfillment/customer success — prioridad alta
        onboarding?: CanalSlack | null; // Jessica/Ana suben resúmenes de clientes nuevos
        extras?: CanalSlack[]; // otros canales del barrido general
      };
    }
  >;
  calendar: {
    cuenta: string;
    calendarios: string[];
    timezone: string;
    ventanaDias: number;
    prefijoAgente: string; // "[CEO-AGENT]"
    crearEventos: boolean; // false hasta que el CEO dé el OK (F4)
  };
  instagram: Partial<
    Record<UnidadNegocio, { handle: string; metodo: "apify" | "graph-api" }>
  >;
  pipedrive: Record<
    UnidadOps,
    {
      valorEs: "mensual" | "total";
      stageMap: Record<string, EtapaLead>; // nombre de stage (lower) → etapa
    }
  >;
  portales: Record<string, { url: string; nombre: string }>;
  // Handles de IG de referentes/competencia a rastrear (/sync-competencia).
  competencia?: string[];
  // Cuentas de noticias de IA/Claude/marketing (/sync-tendencias).
  tendenciasIA?: string[];
}

// ---- Prioridades / decisiones estratégicas del CEO (PASO 04) ----
// Lo importante más allá de la salud de clientes: churn, estrategia de ventas,
// admin, finanzas, producto, equipo. Se editan en data/prioridades.json.
export type CategoriaPrioridad =
  | "churn"
  | "ventas"
  | "administrativo"
  | "finanzas"
  | "producto"
  | "equipo";

export interface Prioridad {
  id: string;
  titulo: string;
  categoria: CategoriaPrioridad;
  severidad: "alta" | "media" | "baja";
  detalle: string;
  metrica?: string; // dato duro, ej. "churn 108% este mes"
  accionSugerida?: string;
  estado: "abierta" | "en-curso" | "resuelta";
  creadoEl: string; // ISO date
}

export interface PrioridadesSnapshot {
  actualizadoEl: string;
  prioridades: Prioridad[];
}

// ---- Emails importantes (el orquestador revisa las 3 cuentas) ----
// El /brief-ceo lee Gmail vía MCP y resume lo importante en data/emails.json.
export type CategoriaEmail =
  | "venta"
  | "cliente"
  | "finanzas"
  | "urgente"
  | "operativo"
  | "personal"
  | "otro";

export interface EmailImportante {
  id: string;
  cuenta: string; // elvin@levelupmediapr.net | aiborinquen@gmail.com | info@levelupmediapr.net
  de: string; // remitente
  asunto: string;
  resumen: string; // 1 línea de por qué importa
  categoria: CategoriaEmail;
  accion?: string; // qué hacer al respecto (si aplica)
  fecha: string; // ISO datetime
  noLeido: boolean;
}

export interface EmailsSnapshot {
  actualizadoEl: string;
  cuentas: string[]; // cuentas revisadas
  resumen?: string; // titular de la bandeja del día
  emails: EmailImportante[];
}

// ---- Granola: reuniones del día → dashboard (fuente clave del CEO) ----
// El sync (/sync-granola) lee las reuniones de Granola del día y deja acá el
// resumen, las decisiones y los pendientes. Es donde queda el criterio de CEO.
export interface ReunionGranola {
  id: string;
  titulo: string;
  hora: string; // "HH:MM" local PR
  resumen: string; // qué se habló, en 1-2 líneas
}

export interface PendienteGranola {
  quien: string; // "Elvin", "Aure", "Emma", equipo...
  que: string;
  reunion?: string; // de qué reunión salió
}

export interface GranolaSnapshot {
  actualizadoEl: string;
  fecha: string; // YYYY-MM-DD (hoy)
  resumenDia: string; // titular: qué hizo hoy en una frase
  reuniones: ReunionGranola[];
  decisiones: string[]; // decisiones de CEO tomadas hoy
  pendientes: PendienteGranola[]; // action items abiertos
}

// ---- Portafolio (plan de guerra Q4 2026) ----
// Cada negocio/proyecto del holding con su capa (motor/producto/piloto/congelado),
// meta del trimestre, horas de Elvin, compuerta y trigger de reapertura.
// Lo escribe a mano el plan (data/portafolio.json); lo lee /ceo/portafolio.
export type CapaPortafolio =
  | "motor"
  | "producto"
  | "piloto"
  | "congelado"
  | "entregado";

export interface UnidadPortafolio {
  id: string;
  nombre: string;
  capa: CapaPortafolio;
  resumen: string;
  meta?: string;
  horasElvin?: string;
  jugada?: string;
  compuerta?: { fecha: string; condicion: string };
  trigger?: string;
  numeros: { label: string; valor: string; nota?: string }[];
  enlaces: { label: string; href: string }[];
}

export interface Portafolio {
  actualizadoEl: string;
  trimestre: string;
  reglas: string[];
  compuertas: { fecha: string; que: string }[];
  unidades: UnidadPortafolio[];
}
