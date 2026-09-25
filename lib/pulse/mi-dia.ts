import type { ValorCelda } from "./types";

// "Mi día": lo que le toca hoy al equipo, calculado de las fechas que ya existen en los
// tableros. Las fechas del CRM se llenan UNA vez (p. ej. el seguimiento de 10 días), así que
// solo cuenta lo que vence hoy o venció hace poco (VENTANA) y lo que alguien marcó ✓ desaparece.
// Puro y testeado (tests/pulse-mi-dia.test.mjs); lo usan la página /pulse/mi-dia y el aviso de Slack.

export type TipoPendiente = "onboarding" | "seguimiento" | "reporte" | "nuevo";

export interface Pendiente {
  tipo: TipoPendiente;
  itemId: string;
  boardSlug: string;
  boardNombre: string;
  nombre: string;
  empresa: string | null;
  fecha: string | null; // la fecha que lo dispara (YYYY-MM-DD)
  dias: number; // días de atraso (0 = hoy, negativo = mañana)
  personas: string[]; // ids asignados
}

export interface TableroMiDia {
  slug: string;
  nombre: string;
  columns: { id: string; title: string; type: string }[];
  groups: { id: string; title: string }[];
  items: { id: string; name: string; groupId: string; values: Record<string, ValorCelda>; createdAt: string; creadoPorSistema?: boolean }[];
}

export const VENTANA_DIAS = 7;
export const ONBOARDING_HORAS = 48;

export const clave = (itemId: string, tipo: TipoPendiente, fecha: string | null) => `${itemId}:${tipo}:${fecha ?? ""}`;

function diasEntre(desdeISO: string, hastaISO: string): number {
  return Math.round((Date.parse(`${hastaISO}T12:00:00Z`) - Date.parse(`${desdeISO}T12:00:00Z`)) / 86_400_000);
}

export function calcularPendientes(p: { tableros: TableroMiDia[]; hechos: Set<string>; hoy: string; ahora?: number }): Pendiente[] {
  const ahora = p.ahora ?? Date.now();
  const out: Pendiente[] = [];
  for (const t of p.tableros) {
    const col = (re: RegExp, tipo?: string) => t.columns.find((c) => re.test(c.title) && (!tipo || c.type === tipo));
    const cSeg = col(/seguimiento/i, "date");
    const cProx = col(/pr[oó]ximo reporte/i, "date");
    const cEmpresa = col(/^empresa$/i);
    const cPersonas = t.columns.find((c) => c.type === "people");
    const bajas = new Set(t.groups.filter((g) => /offboard|baja|inactiv/i.test(g.title)).map((g) => g.id));
    const onboarding = new Set(t.groups.filter((g) => /onboarding/i.test(g.title)).map((g) => g.id));
    for (const it of t.items) {
      if (bajas.has(it.groupId)) continue;
      const base = {
        itemId: it.id,
        boardSlug: t.slug,
        boardNombre: t.nombre,
        nombre: it.name,
        empresa: cEmpresa ? ((it.values[cEmpresa.id] as string) ?? null) : null,
        personas: cPersonas ? ((it.values[cPersonas.id] as string[]) ?? []) : [],
      };
      const add = (tipo: TipoPendiente, fecha: string | null, dias: number) => {
        if (!p.hechos.has(clave(it.id, tipo, fecha))) out.push({ ...base, tipo, fecha, dias });
      };
      const horas = (ahora - Date.parse(it.createdAt)) / 3_600_000;
      if (onboarding.has(it.groupId) && horas >= ONBOARDING_HORAS) add("onboarding", it.createdAt.slice(0, 10), Math.floor(horas / 24));
      if (it.creadoPorSistema && horas < 48) add("nuevo", it.createdAt.slice(0, 10), 0);
      for (const [c, tipo] of [[cSeg, "seguimiento"], [cProx, "reporte"]] as const) {
        const f = c ? (it.values[c.id] as string | null) : null;
        if (!f) continue;
        const atraso = diasEntre(f, p.hoy);
        if (atraso >= -1 && atraso <= VENTANA_DIAS) add(tipo, f, atraso);
      }
    }
  }
  const orden: TipoPendiente[] = ["nuevo", "onboarding", "seguimiento", "reporte"];
  return out.sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo) || b.dias - a.dias);
}

export function cuando(dias: number): string {
  if (dias < 0) return "mañana";
  if (dias === 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}
