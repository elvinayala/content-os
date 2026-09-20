import type { MetricaResumen, PuntoSemana, Bombazo } from "@/lib/types";

// MOCK — Métricas.
// Para producción: Instagram Graph API (insights de cuenta y media).
// Ver CLAUDE.md → "Conectar datos reales".

export const resumen: MetricaResumen[] = [
  {
    key: "vistas",
    label: "IG Views",
    valor: 287_400,
    deltaPct: 18.4,
    formato: "numero",
    series: {
      "7": [38, 41, 36, 52, 61, 58, 64],
      "30": [30, 34, 32, 40, 38, 45, 50, 47, 55, 62],
      "90": [20, 24, 22, 28, 33, 31, 40, 44, 52, 61, 58, 70],
    },
  },
  {
    key: "guardados",
    label: "Guardados",
    valor: 9_800,
    deltaPct: 9.1,
    formato: "numero",
    series: {
      "7": [11, 13, 12, 15, 18, 16, 20],
      "30": [9, 10, 12, 11, 14, 13, 16, 18, 19, 21],
      "90": [6, 7, 9, 8, 11, 13, 12, 15, 17, 19, 22, 24],
    },
  },
  {
    key: "seguidores",
    label: "Seguidores",
    valor: 1_200,
    deltaPct: 6.2,
    formato: "numero",
    prefijo: "+",
    series: {
      "7": [120, 140, 110, 160, 150, 180, 190],
      "30": [90, 110, 100, 130, 120, 150, 160, 155, 170, 190],
      "90": [60, 80, 75, 100, 120, 110, 140, 150, 165, 175, 185, 200],
    },
  },
  {
    key: "dms",
    label: "DMs",
    valor: 1_204,
    deltaPct: -3.4,
    formato: "numero",
    series: {
      "7": [180, 170, 160, 175, 150, 165, 158],
      "30": [200, 190, 185, 180, 175, 170, 168, 160, 158, 155],
      "90": [140, 160, 155, 170, 180, 175, 190, 185, 195, 188, 182, 178],
    },
  },
];

export const semana: PuntoSemana[] = [
  { dia: "Lun", vistas: 52_000, guardados: 1_420, seguidores: 380 },
  { dia: "Mar", vistas: 61_500, guardados: 1_680, seguidores: 410 },
  { dia: "Mié", vistas: 48_900, guardados: 1_290, seguidores: 350 },
  { dia: "Jue", vistas: 73_200, guardados: 2_140, seguidores: 520 },
  { dia: "Vie", vistas: 95_800, guardados: 2_980, seguidores: 690 },
  { dia: "Sáb", vistas: 88_100, guardados: 2_010, seguidores: 470 },
  { dia: "Dom", vistas: 62_800, guardados: 1_420, seguidores: 390 },
];

// Top 5 ordenados por vistas. Un reel es "bombazo" si duplica la mediana de 30d
// (MEDIANA_30D en lib/types.ts) — se calcula en la página.
export const bombazos: Bombazo[] = [
  {
    id: "b1",
    titulo: "El error de $10.000 que casi nadie ve venir",
    plataforma: "Instagram",
    vistas: 142_000,
    guardados: 4_820,
    razon: "Gancho de pérdida personal + cifra concreta en los primeros 2 seg.",
  },
  {
    id: "b2",
    titulo: "Probé esta IA por 30 días",
    plataforma: "TikTok",
    vistas: 98_400,
    guardados: 3_110,
    razon: "Formato experimento con resultado sorpresa; retención alta hasta el final.",
  },
  {
    id: "b3",
    titulo: "Hacé esto los primeros 3 segundos",
    plataforma: "Instagram",
    vistas: 76_900,
    guardados: 2_640,
    razon: "Promesa accionable + demo en vivo; mucho guardado para 'verlo después'.",
  },
  {
    id: "b4",
    titulo: "3 cosas que dejaría de hacer si empezara hoy",
    plataforma: "YouTube",
    vistas: 54_200,
    guardados: 1_980,
    razon: "Lista corta con consejo contraintuitivo; buen tiempo de visualización.",
  },
  {
    id: "b5",
    titulo: "La regla de los 100",
    plataforma: "Instagram",
    vistas: 41_300,
    guardados: 1_510,
    razon: "Framework con nombre memorable; se comparte como 'tip rápido'.",
  },
];
