import "server-only";

import { leads as mockLeads } from "@/lib/mock/ceo";
import type {
  EtapaLead,
  LeadPipeline,
  OnboardingNuevo,
  ResultadoPipeline,
  UnidadOps,
} from "@/lib/types";

// Pipedrive en vivo: lee deals de las 2 cuentas (Level Up + AI Borinquen) con
// los tokens de .env.local. Sin tokens → cae al mock. Nunca tira: si una cuenta
// falla, devuelve las demás + el error (con el api_token sanitizado).

interface CuentaPD {
  unidad: UnidadOps;
  domain?: string;
  token?: string;
}

function cuentas(): CuentaPD[] {
  return [
    {
      unidad: "level-up",
      domain: process.env.PIPEDRIVE_LEVELUP_DOMAIN,
      token: process.env.PIPEDRIVE_LEVELUP_TOKEN,
    },
    {
      unidad: "ai-borinquen",
      domain: process.env.PIPEDRIVE_AIB_DOMAIN,
      token: process.env.PIPEDRIVE_AIB_TOKEN,
    },
  ];
}

function sanitizar(msg: string): string {
  return msg.replace(/api_token=[^&\s]+/g, "api_token=***");
}

interface PdDeal {
  id: number;
  title?: string;
  value?: number;
  status?: "open" | "won" | "lost";
  add_time?: string;
  update_time?: string;
  won_time?: string;
  stage_id?: number;
  person_id?: { name?: string } | null;
  org_id?: { name?: string } | null;
  owner_id?: { name?: string } | null;
  person_name?: string;
  org_name?: string;
  owner_name?: string;
  next_activity_subject?: string;
  origin?: string;
  channel?: string;
}

function etapaDe(
  deal: PdDeal,
  stageNombre: string | undefined,
): EtapaLead {
  const key = (stageNombre ?? "").toLowerCase();
  // Clientes activos / cerrados (ganados) — el lifecycle real vive en el stage.
  if (
    deal.status === "won" ||
    /onboarding|setup|cliente activo|recurrente|closed|already purchased|purchase|recopilaci|sesi[oó]n estr|seguimiento|reporte/.test(
      key,
    )
  )
    return "cerrado";
  // Perdidos / no califica.
  if (
    deal.status === "lost" ||
    /no califica|don'?t qualif|not qualif|inactivo|error/.test(key)
  )
    return "perdido";
  // Lead nuevo.
  if (/new lead|nuevo|lead in|entrant/.test(key)) return "nuevo";
  // Cita agendada / sesión / propuesta.
  if (/appointment|cita|propuesta|proposal|cotiz|estrat[eé]g/.test(key))
    return "propuesta";
  if (/calific|qualif/.test(key)) return "calificado";
  // En seguimiento (llamadas, follow-up, remarketing).
  if (/called|llamad|follow|remarket|reasignar|grupo|x[1-6]$/.test(key))
    return "contactado";
  return "contactado";
}

async function fetchCuenta(
  c: CuentaPD,
): Promise<{ leads: LeadPipeline[]; onboardings: OnboardingNuevo[] }> {
  // El token identifica la compañía → api.pipedrive.com funciona sin el dominio.
  const base = c.domain
    ? `https://${c.domain}.pipedrive.com/api/v1`
    : "https://api.pipedrive.com/v1";
  const auth = `api_token=${c.token}`;

  // stages → nombres
  const stagesRes = await fetch(`${base}/stages?${auth}`, {
    next: { revalidate: 300 }, // los stages casi no cambian
    signal: AbortSignal.timeout(5000), // nunca colgar el dashboard
  });
  const stagesJson = (await stagesRes.json()) as {
    data?: { id: number; name: string }[];
  };
  const stageNombre = new Map<number, string>(
    (stagesJson.data ?? []).map((s) => [s.id, s.name]),
  );

  // deals — traemos los más recientes primero y paginamos hasta cubrir ~60 días
  // (para que los contadores por día sean exactos aunque haya mucho volumen).
  const limiteDias = Date.now() - 60 * 86_400_000;
  const deals: PdDeal[] = [];
  for (let start = 0, pagina = 0; pagina < 6; pagina++, start += 500) {
    const res = await fetch(
      `${base}/deals?status=all_not_deleted&limit=500&start=${start}&sort=add_time%20DESC&${auth}`,
      { next: { revalidate: 30 }, signal: AbortSignal.timeout(5000) }, // leads nuevos casi en tiempo real
    );
    const json = (await res.json()) as {
      data?: PdDeal[];
      additional_data?: { pagination?: { more_items_in_collection?: boolean } };
    };
    const lote = json.data ?? [];
    deals.push(...lote);
    const masViejo = lote.at(-1)?.add_time;
    const seguir =
      json.additional_data?.pagination?.more_items_in_collection &&
      (!masViejo || new Date(masViejo).getTime() > limiteDias);
    if (!seguir || lote.length === 0) break;
  }

  const treintaDias = Date.now() - 30 * 86_400_000;
  const leads: LeadPipeline[] = [];
  const onboardings: OnboardingNuevo[] = [];

  for (const d of deals) {
    const cerradoViejo =
      (d.status === "won" || d.status === "lost") &&
      d.won_time &&
      new Date(d.won_time).getTime() < treintaDias;
    if (cerradoViejo) continue; // won/lost > 30d no inflan el board

    const nombre =
      d.person_id?.name ?? d.person_name ?? d.title ?? "Sin nombre";
    const negocio = d.org_id?.name ?? d.org_name ?? undefined;
    const dueno = d.owner_id?.name ?? d.owner_name ?? undefined;

    leads.push({
      id: `pd-${c.unidad}-${d.id}`,
      nombre,
      negocio,
      unidad: c.unidad,
      etapa: etapaDe(d, stageNombre.get(d.stage_id ?? -1)),
      valorMensual: Math.round(d.value ?? 0),
      origen: d.origin ?? d.channel ?? "Pipedrive",
      ultimoContacto: (d.update_time ?? d.add_time ?? "").slice(0, 10),
      creadoEl: (d.add_time ?? "").slice(0, 10),
      ganadoEl: d.won_time ? d.won_time.slice(0, 10) : undefined,
      dueno,
      nota: d.next_activity_subject,
    });

    // onboarding = deal ganado en los últimos 30 días
    if (d.status === "won" && d.won_time) {
      onboardings.push({
        id: `onb-${c.unidad}-${d.id}`,
        cliente: nombre,
        negocio,
        unidad: c.unidad,
        valorMensual: Math.round(d.value ?? 0),
        dueno,
        acuerdo: d.title,
        resumen: d.next_activity_subject,
        ganadoEl: d.won_time.slice(0, 10),
      });
    }
  }
  return { leads, onboardings };
}

export async function leerPipeline(): Promise<ResultadoPipeline> {
  const configuradas = cuentas().filter((c) => c.token);
  if (configuradas.length === 0) {
    return {
      leads: mockLeads,
      fuente: "mock",
      unidadesLive: [],
      errores: [],
      onboardings: [],
    };
  }

  const resultados = await Promise.allSettled(
    configuradas.map((c) => fetchCuenta(c)),
  );

  const leads: LeadPipeline[] = [];
  const onboardings: OnboardingNuevo[] = [];
  const errores: string[] = [];
  const unidadesLive: UnidadOps[] = [];

  resultados.forEach((r, i) => {
    const unidad = configuradas[i].unidad;
    if (r.status === "fulfilled") {
      leads.push(...r.value.leads);
      onboardings.push(...r.value.onboardings);
      unidadesLive.push(unidad);
    } else {
      errores.push(
        `${unidad}: ${sanitizar(String(r.reason?.message ?? r.reason))}`,
      );
    }
  });

  // Si TODO falló, no dejamos la pantalla vacía → mock.
  if (leads.length === 0 && errores.length > 0) {
    return {
      leads: mockLeads,
      fuente: "mock",
      unidadesLive,
      errores,
      onboardings: [],
    };
  }

  onboardings.sort((a, b) => b.ganadoEl.localeCompare(a.ganadoEl));
  return { leads, fuente: "pipedrive", unidadesLive, errores, onboardings };
}
