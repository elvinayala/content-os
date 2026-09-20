import "server-only";

// Resumen de negocio de Bori (heybori.ai) para el Command Center.
// Bori es un proyecto aparte (Express en Railway) con su propia base de datos;
// expone /api/metricas-negocio en SOLO LECTURA con un token dedicado
// (BORI_METRICS_TOKEN) que no permite escribir nada.
// Sin token → conectado:false y la tarjeta muestra el estado, no explota.

const BASE = (process.env.BORI_URL || "https://www.heybori.ai").replace(/\/$/, "");
const TOKEN = process.env.BORI_METRICS_TOKEN || "";

export interface VentaBori {
  id: string | number;
  userId: string | null;
  email: string | null;
  eventType: "nueva_suscripcion" | "renovacion" | "paquete_creditos" | "cancelacion" | string;
  plan: string | null;
  amountUsd: number;
  createdAt: number;
}

export interface ResumenPeriodo {
  ingreso: number;
  nuevas: number;
  renovaciones: number;
  cancelaciones: number;
  paquetes: number;
  total: number;
}

export interface NegocioBori {
  conectado: boolean;
  hoy: ResumenPeriodo & { registros: number; actividad: { kind: string | null; count: number }[] };
  semana: ResumenPeriodo;
  mes: ResumenPeriodo;
  mrr: { mrr: number; porPlan: Record<string, number> };
  embudo: {
    total: number;
    gratis: number;
    cortesia: number;
    pagando: number;
    morosos: number;
    cancelados: number;
    conversion: number;
  };
  porDia: (ResumenPeriodo & { fecha: string; altas: number })[];
  ultimasVentas: VentaBori[];
  totalUsuarios: number;
  error?: string;
}

const VACIO: ResumenPeriodo = {
  ingreso: 0,
  nuevas: 0,
  renovaciones: 0,
  cancelaciones: 0,
  paquetes: 0,
  total: 0,
};

function sinDatos(error?: string): NegocioBori {
  return {
    conectado: false,
    hoy: { ...VACIO, registros: 0, actividad: [] },
    semana: { ...VACIO },
    mes: { ...VACIO },
    mrr: { mrr: 0, porPlan: {} },
    embudo: { total: 0, gratis: 0, cortesia: 0, pagando: 0, morosos: 0, cancelados: 0, conversion: 0 },
    porDia: [],
    ultimasVentas: [],
    totalUsuarios: 0,
    error,
  };
}

export async function leerNegocioBori(): Promise<NegocioBori> {
  if (!TOKEN) return sinDatos("Falta BORI_METRICS_TOKEN en .env.local");
  try {
    // Bori corre en Railway y viene tardando ~6.6s (está en crash-loop), así que
    // era EL cuello de botella del Command Center: con no-store cada request
    // pagaba esa espera. Ahora se cachea 3 min (son métricas de negocio, no
    // hace falta al segundo) y el timeout es corto para que un Bori caído
    // degrade la tarjeta en vez de arrastrar la página entera.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch(`${BASE}/api/metricas-negocio`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      next: { revalidate: 180 },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return sinDatos(`Bori respondió ${r.status}`);
    const j = (await r.json()) as Omit<NegocioBori, "conectado">;
    return { ...j, conectado: true };
  } catch (e) {
    return sinDatos(e instanceof Error ? e.message : "no se pudo leer Bori");
  }
}
