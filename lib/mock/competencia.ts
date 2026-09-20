import type { CuentaCompetencia, ReelCompetencia } from "@/lib/types";

// MOCK — Rastreador de Competencia.
// Para producción: scraping de los domingos a la mañana de las 8 cuentas seguidas
// (ej. Apify) + transcripción del audio. Ver CLAUDE.md → "Conectar datos reales".

// Fecha de la última actualización (corre los domingos a la mañana).
export const actualizadoEl = "2026-06-14";

// Ranking de cuentas seguidas por su mejor reel de la semana.
export const cuentas: CuentaCompetencia[] = [
  { id: "a1", creador: "@growthlab", iniciales: "GL", seguidores: 214_000, topVistas: 1_800_000 },
  { id: "a2", creador: "@creatorx", iniciales: "CX", seguidores: 98_000, topVistas: 920_000 },
  { id: "a3", creador: "@datayango", iniciales: "DY", seguidores: 156_000, topVistas: 640_000 },
  { id: "a4", creador: "@marcaviva", iniciales: "MV", seguidores: 72_000, topVistas: 512_000 },
  { id: "a5", creador: "@brandirlab", iniciales: "BL", seguidores: 45_000, topVistas: 388_000 },
];

export const reelsCompetencia: ReelCompetencia[] = [
  {
    id: "r1",
    creador: "@growthlab",
    seguidores: 214_000,
    iniciales: "GL",
    gancho: "Esta regla de los 100 cambió cómo creo contenido.",
    textoPantalla: "REGLA DE LOS 100 ✍️",
    plataforma: "Instagram",
    vistas: 1_800_000,
    engagementPct: 8.9,
    publicadoEl: "2026-06-13",
    url: "https://instagram.com/reel/ejemplo1",
  },
  {
    id: "r2",
    creador: "@creatorx",
    seguidores: 98_000,
    iniciales: "CX",
    gancho: "Nadie te dijo esto sobre el algoritmo.",
    textoPantalla: "EL SECRETO DEL ALGORITMO",
    plataforma: "TikTok",
    vistas: 920_000,
    engagementPct: 11.2,
    publicadoEl: "2026-06-14",
    url: "https://tiktok.com/@creatorx/video/ejemplo2",
  },
  {
    id: "r3",
    creador: "@datayango",
    seguidores: 156_000,
    iniciales: "DY",
    gancho: "El stack de IA que uso todos los días.",
    textoPantalla: "MI STACK DE IA 🤖",
    plataforma: "YouTube",
    vistas: 640_000,
    engagementPct: 9.8,
    publicadoEl: "2026-06-11",
    url: "https://youtube.com/shorts/ejemplo3",
  },
  {
    id: "r4",
    creador: "@marcaviva",
    seguidores: 72_000,
    iniciales: "MV",
    gancho: "Cómo edité este reel en 7 minutos.",
    textoPantalla: "EDICIÓN EN 7 MIN ⏱️",
    plataforma: "Instagram",
    vistas: 512_000,
    engagementPct: 6.4,
    publicadoEl: "2026-06-12",
    url: "https://instagram.com/reel/ejemplo4",
  },
  {
    id: "r5",
    creador: "@brandirlab",
    seguidores: 45_000,
    iniciales: "BL",
    gancho: "Dejá de hacer esto en tus carruseles.",
    textoPantalla: "ERROR DE CARRUSEL ❌",
    plataforma: "LinkedIn",
    vistas: 388_000,
    engagementPct: 5.3,
    publicadoEl: "2026-06-10",
    url: "https://linkedin.com/posts/ejemplo5",
  },
];
