import "dotenv/config";

function req(nombre: string, porDefecto?: string): string {
  const v = process.env[nombre] ?? porDefecto;
  if (v === undefined) throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example)`);
  return v;
}
const opt = (nombre: string, porDefecto = ""): string => process.env[nombre] ?? porDefecto;

export const config = {
  modelo: opt("MODELO", "claude-opus-5"),
  esfuerzo: opt("ESFUERZO", "medium") as "low" | "medium" | "high",
  port: Number(opt("PORT", "3100")),
  urlPublica: opt("URL_PUBLICA", "http://localhost:3100"),
  corsOrigenes: opt("CORS_ORIGENES", "*").split(",").map((s) => s.trim()),
  zonaHoraria: opt("ZONA_HORARIA", "America/Puerto_Rico"),

  wa: {
    token: opt("WA_TOKEN"),
    phoneNumberId: opt("WA_PHONE_NUMBER_ID"),
    verifyToken: opt("WA_VERIFY_TOKEN", "resuelto"),
    appSecret: opt("META_APP_SECRET"),
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
    token: opt("GHL_TOKEN"),
    locationId: opt("GHL_LOCATION_ID"),
    pipelineId: opt("GHL_PIPELINE_ID"),
    stageAgendado: opt("GHL_STAGE_AGENDADO"),
  },
  openaiKey: opt("OPENAI_API_KEY"),
  coordinadorWhatsapp: opt("COORDINADOR_WHATSAPP"),

  /** true cuando la integración tiene credenciales; si no, la herramienta responde en modo simulado y lo dice. */
  tiene: {
    whatsapp: () => !!(process.env.WA_TOKEN && process.env.WA_PHONE_NUMBER_ID),
    meta: () => !!process.env.PAGE_ACCESS_TOKEN,
    calendario: () => !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    stripe: () => !!process.env.STRIPE_SECRET_KEY,
    ghl: () => !!(process.env.GHL_TOKEN && process.env.GHL_LOCATION_ID),
    whisper: () => !!process.env.OPENAI_API_KEY,
  },
};

export { req };
