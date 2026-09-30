// Los números del Inicio de Pulse y la lista detrás de cada uno. El número ES el largo de su lista,
// así lo que se ve al abrir la tarjeta siempre cuadra con lo que dice.

export type VistaInicio = "activos" | "onboarding" | "nuevos" | "cartera";

export const VISTAS: { id: VistaInicio; titulo: string; nota: string }[] = [
  { id: "activos", titulo: "Clientes activos", nota: "Trabajando con nosotros" },
  { id: "onboarding", titulo: "En onboarding", nota: "Onboarding y estrategia" },
  { id: "nuevos", titulo: "Nuevos este mes", nota: "Fichas creadas en el mes" },
  { id: "cartera", titulo: "En cartera", nota: "Sin contar las bajas" },
];

export type FichaInicio = {
  id: string;
  nombre: string;
  empresa: string | null;
  boardSlug: string;
  marca: string;
  grupo: string;
  creadoEl: string;
};

const ACTIVO = /cliente activo|inner circle|accelerator|marketing|recurrente/i;
const ONBOARDING = /onboarding|an[aá]lisis/i;
const BAJA = /offboard|baja|inactiv/i;

export function esVistaInicio(v: unknown): v is VistaInicio {
  return VISTAS.some((x) => x.id === v);
}

/** Primer instante del mes en curso, en hora de Puerto Rico (UTC-4, sin horario de verano). */
export function inicioMesPR(ahora = new Date()): string {
  return `${ahora.toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" }).slice(0, 7)}-01T00:00:00-04:00`;
}

export function enVista(vista: VistaInicio, f: Pick<FichaInicio, "grupo" | "creadoEl">, inicioMes: string): boolean {
  if (/offboard/i.test(f.grupo)) return false;
  if (vista === "activos") return ACTIVO.test(f.grupo);
  if (vista === "onboarding") return ONBOARDING.test(f.grupo);
  if (vista === "nuevos") return new Date(f.creadoEl).getTime() >= new Date(inicioMes).getTime();
  return !BAJA.test(f.grupo);
}

/** Reparte las fichas en las 4 listas, cada una de la más reciente a la más vieja. */
export function listasInicio(fichas: FichaInicio[], inicioMes: string): Record<VistaInicio, FichaInicio[]> {
  const orden = [...fichas].sort((a, b) => b.creadoEl.localeCompare(a.creadoEl));
  const r = {} as Record<VistaInicio, FichaInicio[]>;
  for (const { id } of VISTAS) r[id] = orden.filter((f) => enVista(id, f, inicioMes));
  return r;
}

export function marcaDeTablero(slug: string): string {
  return slug === "ai-borinquen" ? "AI Borinquen" : "Level Up";
}
