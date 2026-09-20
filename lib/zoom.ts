import "server-only";

import type { SnapshotLlamadas } from "@/lib/types";

// Zoom Intelligence en vivo: la API del portal Level Up expone las llamadas de
// setters/closers ya analizadas (score, objeciones, alertas). Login con
// email/clave de .env.local → Bearer. Sin credenciales → conectado=false y la
// UI cae al mock. Nunca tira: si la API falla, devuelve el error.

export interface AlertaZoom {
  severity: "high" | "medium" | "low" | string;
  message: string;
  hostName?: string;
  agency?: string;
}

export interface ZoomIntel {
  actualizadoEl: string;
  conectado: boolean;
  // Métricas de HOY (tiempo real, cacheadas ~60s) — demos de closers del día, etc.
  hoy: {
    setterCalls: number;
    closerCalls: number;
    adminCalls: number;
    analizadas: number;
    pendientes: number;
    oportunidadesCalientes: number;
    conversaciones: number;
  };
  // Métricas de los últimos 7 días (acumulado).
  metrics: {
    setterCalls: number;
    closerCalls: number;
    adminCalls: number;
    analizadas: number;
    pendientes: number;
    oportunidadesCalientes: number;
    alertasAdmin: number;
  };
  objecionesTop: { texto: string; veces: number }[];
  alertas: AlertaZoom[];
  // Compat con el resto del ecosistema (agentes, widgets viejos).
  llamadas: SnapshotLlamadas;
  error?: string;
}

interface ZoomMeeting {
  role?: string;
  agency?: string;
  agencyLabel?: string;
  hostName?: string;
  analysis?: { objections?: string[] } | null;
}

// Cache de token en memoria del módulo (evita re-login en cada request).
let tokenCache: { token: string; exp: number } | null = null;

function creds() {
  return {
    base: process.env.ZOOM_INTEL_BASE,
    email: process.env.ZOOM_INTEL_EMAIL,
    password: process.env.ZOOM_INTEL_PASSWORD,
  };
}

async function login(base: string, email: string, password: string): Promise<string> {
  // Token válido en cache (~50 min) → reusar.
  const ahora = Date.now();
  if (tokenCache && tokenCache.exp > ahora) return tokenCache.token;

  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`login ${res.status}`);
  const j = (await res.json()) as {
    token?: string;
    access_token?: string;
    data?: { token?: string };
  };
  const token = j.token ?? j.access_token ?? j.data?.token;
  if (!token) throw new Error("login sin token");
  tokenCache = { token, exp: ahora + 50 * 60_000 };
  return token;
}

function vacio(actualizadoEl: string, error?: string): ZoomIntel {
  return {
    actualizadoEl,
    conectado: false,
    hoy: {
      setterCalls: 0,
      closerCalls: 0,
      adminCalls: 0,
      analizadas: 0,
      pendientes: 0,
      oportunidadesCalientes: 0,
      conversaciones: 0,
    },
    metrics: {
      setterCalls: 0,
      closerCalls: 0,
      adminCalls: 0,
      analizadas: 0,
      pendientes: 0,
      oportunidadesCalientes: 0,
      alertasAdmin: 0,
    },
    objecionesTop: [],
    alertas: [],
    llamadas: {
      actualizadoEl,
      fuente: "Zoom Intelligence",
      kpis: {
        llamadasSetters: null,
        demosClosers: null,
        revenueDetectado: null,
        tasaCierre: null,
      },
      objecionesTop: [],
    },
    error,
  };
}

// El summary de 7d pesa ~2.8MB, así que el data cache de Next lo RECHAZA
// (tope 2MB) y cada request lo volvía a bajar y a parsear. Como el resultado
// ya procesado es un objeto chico, lo guardamos en memoria del lambda: dentro
// del TTL no se toca la red. Complementa el cache de `tokenCache`.
let intelCache: { key: string; data: ZoomIntel; exp: number } | null = null;
const INTEL_TTL_MS = 120_000; // 2 min

export async function leerZoomIntel(range = "7d"): Promise<ZoomIntel> {
  const { base, email, password } = creds();
  const ahora = new Date().toISOString();
  if (!base || !email || !password) return vacio(ahora);

  if (intelCache && intelCache.key === range && intelCache.exp > Date.now()) {
    return intelCache.data;
  }

  try {
    const token = await login(base, email, password);
    const auth = { Authorization: `Bearer ${token}` };

    // Timeouts de 5s (antes 8s): el Command Center entero se renderiza en
    // paralelo, así que un upstream lento no puede comerse todo el presupuesto
    // de la función. Si Zoom no contesta a tiempo, la tarjeta cae a "vacío".
    const [sumRes, hoyRes, alertRes] = await Promise.all([
      // Ventana de 7 días (acumulado). no-store a propósito: son ~2.8MB y el
      // data cache los rechaza igual — intentar guardarlos solo gastaba tiempo.
      fetch(`${base}/zoom-intelligence/summary?agency=all&range=${range}`, {
        headers: auth,
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }),
      // HOY (tiempo real) — cachea solo 60s para reflejar demos apenas entran.
      fetch(`${base}/zoom-intelligence/summary?agency=all&range=today`, {
        headers: auth,
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${base}/zoom-intelligence/alerts?agency=all&range=${range}`, {
        headers: auth,
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    const sum = (await sumRes.json()) as {
      generatedAt?: string;
      metrics?: Record<string, number>;
      meetings?: ZoomMeeting[];
    };
    const hoyJson = (await hoyRes.json().catch(() => ({}))) as {
      metrics?: Record<string, number>;
    };
    const alertJson = (await alertRes.json().catch(() => ({}))) as {
      alerts?: {
        severity?: string;
        message?: string;
        delivered?: boolean;
        meeting?: { hostName?: string; agency?: string };
      }[];
    };

    const m = sum.metrics ?? {};
    const meetings = sum.meetings ?? [];

    // Top objeciones agregadas de los análisis de las llamadas.
    const conteo = new Map<string, number>();
    for (const mt of meetings) {
      for (const o of mt.analysis?.objections ?? []) {
        const k = o.trim();
        if (k) conteo.set(k, (conteo.get(k) ?? 0) + 1);
      }
    }
    const objecionesTop = [...conteo.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([texto, veces]) => ({ texto, veces }));

    const alertas: AlertaZoom[] = (alertJson.alerts ?? [])
      .filter((a) => a.delivered !== true)
      .slice(0, 8)
      .map((a) => ({
        severity: a.severity ?? "low",
        message: a.message ?? "",
        hostName: a.meeting?.hostName,
        agency: a.meeting?.agency,
      }));

    const h = hoyJson.metrics ?? {};

    const resultado: ZoomIntel = {
      actualizadoEl: sum.generatedAt ?? ahora,
      conectado: true,
      hoy: {
        setterCalls: h.setterCalls ?? 0,
        closerCalls: h.closerCalls ?? 0,
        adminCalls: h.adminCalls ?? 0,
        analizadas: h.analyzed ?? 0,
        pendientes: h.pendingTranscripts ?? 0,
        oportunidadesCalientes: h.hotOpportunities ?? 0,
        conversaciones: h.conversationsToday ?? 0,
      },
      metrics: {
        setterCalls: m.setterCalls ?? 0,
        closerCalls: m.closerCalls ?? 0,
        adminCalls: m.adminCalls ?? 0,
        analizadas: m.analyzed ?? 0,
        pendientes: m.pendingTranscripts ?? 0,
        oportunidadesCalientes: m.hotOpportunities ?? 0,
        alertasAdmin: m.administrativeAlerts ?? 0,
      },
      objecionesTop,
      alertas,
      llamadas: {
        actualizadoEl: sum.generatedAt ?? ahora,
        fuente: "Zoom Intelligence",
        kpis: {
          llamadasSetters: m.setterCalls ?? null,
          demosClosers: m.closerCalls ?? null,
          revenueDetectado: null,
          tasaCierre: null,
        },
        objecionesTop: objecionesTop.map((o) => o.texto),
      },
    };

    intelCache = { key: range, data: resultado, exp: Date.now() + INTEL_TTL_MS };
    return resultado;
  } catch (e) {
    // Si Zoom falla pero tenemos algo reciente en memoria, servimos eso antes
    // que una tarjeta vacía (aunque esté un poco viejo).
    if (intelCache && intelCache.key === range) return intelCache.data;
    return vacio(ahora, e instanceof Error ? e.message : String(e));
  }
}
