// En qué va el cliente (puro; tests en tests/clientes-app.test.mjs). Sale del grupo del tablero LEVEL UP MEDIA y de
// la columna Progreso: ONBOARDING & SETUP → ANÁLISIS Y ESTRATEGIA → CLIENTE ACTIVO / ACCELERATOR / INNER CIRCLE.

export type Etapa = "onboarding" | "configuracion" | "estrategia" | "campanas" | "baja";

export const PASOS: { id: Exclude<Etapa, "baja">; nombre: string; corto: string; detalle: string }[] = [
  { id: "onboarding", nombre: "Onboarding", corto: "Onboarding", detalle: "Conocemos tu negocio y recibimos tu información." },
  { id: "configuracion", nombre: "Configuración", corto: "Cuentas", detalle: "Dejamos listas tu cuenta publicitaria y tus activos." },
  { id: "estrategia", nombre: "Estrategia", corto: "Estrategia", detalle: "Tu estratega arma el plan y los creativos de tus anuncios." },
  { id: "campanas", nombre: "Campañas activas", corto: "Campañas", detalle: "Tus anuncios están corriendo y los optimizamos cada semana." },
];

const norm = (s: string | null | undefined) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function etapaDe(grupo: string | null | undefined, progreso?: string | null): Etapa {
  const g = norm(grupo);
  const p = norm(progreso);
  if (g.includes("offboard") || p.includes("decidio no continuar")) return "baja";
  if (g.includes("cliente activo") || g.includes("accelerator") || g.includes("inner circle")) return "campanas";
  if (g.includes("estrategia")) return "estrategia";
  if (p.includes("set up listo")) return "estrategia";
  if (p.includes("onboarding completado") || p.includes("configurar cuenta")) return "configuracion";
  return "onboarding";
}

/** Índice del paso actual (0-3) para la barra de progreso; -1 si está de baja. */
export const pasoActual = (e: Etapa) => PASOS.findIndex((p) => p.id === e);
