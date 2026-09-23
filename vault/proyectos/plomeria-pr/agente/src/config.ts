import "dotenv/config";

function req(nombre: string, porDefecto?: string): string {
  const v = process.env[nombre] ?? porDefecto;
  if (v === undefined) throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example)`);
  return v;
}
const opt = (nombre: string, porDefecto = ""): string => process.env[nombre] ?? porDefecto;

export const config = {
  modelo: opt("MODELO", "claude-sonnet-5"),   // rápido y barato para chat; MODELO=claude-opus-5 si quieres más finura
  esfuerzo: opt("ESFUERZO", "medium") as "low" | "medium" | "high",
  port: Number(opt("PORT", "3100")),
  urlPublica: opt("URL_PUBLICA", "http://localhost:3100"),
  corsOrigenes: opt("CORS_ORIGENES", "*").split(",").map((s) => s.trim()),
  zonaHoraria: opt("ZONA_HORARIA", "America/Puerto_Rico"),

  wa: {
    /** zernio (default si hay ZERNIO_API_KEY) | meta (Cloud API directa). */
    proveedor: (opt("WA_PROVEEDOR") || (process.env.ZERNIO_API_KEY ? "zernio" : "meta")) as "zernio" | "meta",
    numeroPublico: opt("WA_NUMERO_PUBLICO"),
    token: opt("WA_TOKEN"),
    phoneNumberId: opt("WA_PHONE_NUMBER_ID"),
    verifyToken: opt("WA_VERIFY_TOKEN", "resuelto"),
    appSecret: opt("META_APP_SECRET"),
  },
  zernio: {
    apiKey: opt("ZERNIO_API_KEY"),
    accountId: opt("ZERNIO_ACCOUNT_ID"),
    webhookSecret: opt("ZERNIO_WEBHOOK_SECRET"),
    base: opt("ZERNIO_API_BASE", "https://zernio.com/api/v1"),
  },
  /** Horas que el agente calla después de que un humano contesta desde el inbox; luego retoma solo. */
  humanoHoras: Number(opt("HUMANO_HORAS", "3")),
  telegram: {
    botToken: opt("TELEGRAM_BOT_TOKEN"),
    coordinadorChatId: opt("COORDINADOR_TELEGRAM_CHAT_ID"),
  },
  meta: {
    pageToken: opt("PAGE_ACCESS_TOKEN"),
    igAccountId: opt("IG_ACCOUNT_ID"),
  },
  google: {
    serviceAccountJson: opt("GOOGLE_SERVICE_ACCOUNT_JSON"),
  },
  cobros: {
    stripeKey: opt("STRIPE_SECRET_KEY"),
    athMovil: opt("ATH_MOVIL_BUSINESS", "/ResueltoPR"),
  },
  ghl: {
    /** Calendario "Entrevista · Plomeros y contratistas (20 min)" y el usuario de GHL de la reclutadora (Yaileen). */
    calEntrevista: opt("GHL_CAL_ENTREVISTA", "CRKoqwOhXCD07QUjKWMH"),
    usuarioReclutamiento: opt("GHL_USUARIO_RECLUTAMIENTO", "h38dHpLts7bkmKkjuduq"),
    token: opt("GHL_TOKEN"),
    locationId: opt("GHL_LOCATION_ID"),
    pipelineId: opt("GHL_PIPELINE_ID"),
    stageAgendado: opt("GHL_STAGE_AGENDADO"),
  },
  slack: {
    token: opt("SLACK_BOT_TOKEN"),
    /** A quién le llegan las entrevistas y los grandes candidatos (Yaileen, U08Q51UFLSH). */
    reclutamiento: opt("SLACK_RECLUTAMIENTO_ID", "U08Q51UFLSH"),
  },
  openaiKey: opt("OPENAI_API_KEY"),
  coordinadorWhatsapp: opt("COORDINADOR_WHATSAPP"),
  /** Protege /admin/*. Los links que salen por Telegram lo llevan en ?t= */
  adminToken: opt("ADMIN_TOKEN"),

  /** true cuando la integración tiene credenciales; si no, la herramienta responde en modo simulado y lo dice. */
  tiene: {
    whatsapp: () => config.wa.proveedor === "zernio" ? !!(process.env.ZERNIO_API_KEY && process.env.ZERNIO_ACCOUNT_ID) : !!(process.env.WA_TOKEN && process.env.WA_PHONE_NUMBER_ID),
    meta: () => !!process.env.PAGE_ACCESS_TOKEN,
    calendario: () => !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    stripe: () => !!process.env.STRIPE_SECRET_KEY,
    ghl: () => !!(process.env.GHL_TOKEN && process.env.GHL_LOCATION_ID),
    whisper: () => !!process.env.OPENAI_API_KEY,
  },
};

export { req };
