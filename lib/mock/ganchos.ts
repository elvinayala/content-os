import type { Gancho } from "@/lib/types";

// MOCK — Baúl de Ganchos.
// Para producción: reemplazá por tu store (DB) y un paso de transcripción + IA
// que convierta el gancho en plantilla. Ver CLAUDE.md → "Conectar datos reales".
export const ganchos: Gancho[] = [
  {
    id: "g1",
    titulo: "El error de $10.000 que casi nadie ve venir",
    fuente: "@tenfoldmarc",
    guardadoEl: "2026-06-10",
    nicho: "Finanzas",
    tipo: "Pérdida / error",
    vistas: 1_240_000,
    tags: ["dinero", "storytelling", "alto-guardado"],
    transcripto:
      "Perdí diez mil dólares por esto y te lo cuento para que no te pase. " +
      "Todo arrancó cuando creí que ya la tenía clara...",
    plantilla:
      "Perdí [CIFRA] por [ERROR] y te lo cuento para que no te pase. " +
      "Todo arrancó cuando creí que [SUPUESTO FALSO]...",
  },
  {
    id: "g2",
    titulo: "[X] acaba de matar a [Y]",
    fuente: "@creatorx",
    guardadoEl: "2026-06-12",
    nicho: "IA / Tecnología",
    tipo: "Noticia / shock",
    vistas: 2_100_000,
    tags: ["noticia", "curiosidad", "polémico"],
    transcripto:
      "Esta IA acaba de matar a una industria entera y casi nadie se dio cuenta.",
    plantilla: "[X] acaba de matar a [Y]",
  },
  {
    id: "g3",
    titulo: "Dejá de hacer [X]",
    fuente: "@growthlab",
    guardadoEl: "2026-06-13",
    nicho: "Marketing",
    tipo: "Negación / consejo",
    vistas: 880_000,
    tags: ["consejo", "directo"],
    transcripto:
      "Dejá de hacer esto en tus reels si querés que el algoritmo te empuje.",
    plantilla: "Dejá de hacer [X]",
  },
  {
    id: "g4",
    titulo: "[NÚMERO] cosas que ojalá hubiera sabido",
    fuente: "@tenfoldmarc",
    guardadoEl: "2026-06-14",
    nicho: "Crecimiento personal",
    tipo: "Lista",
    vistas: 540_000,
    tags: ["lista", "personal", "consejo"],
    transcripto:
      "5 cosas que ojalá hubiera sabido antes de empezar mi cuenta de cero.",
    plantilla: "[NÚMERO] cosas que ojalá hubiera sabido [ANTES DE X]",
  },
  {
    id: "g5",
    titulo: "Probé [HERRAMIENTA] por 30 días",
    fuente: "@datayango",
    guardadoEl: "2026-06-14",
    nicho: "IA / Tecnología",
    tipo: "Experimento / review",
    vistas: 760_000,
    tags: ["review", "IA", "experimento"],
    transcripto:
      "Probé esta IA por 30 días para crear contenido y los números me sorprendieron.",
    plantilla:
      "Probé [HERRAMIENTA] por [PERÍODO] para [OBJETIVO] y [RESULTADO INESPERADO].",
  },
  {
    id: "g6",
    titulo: "Nadie te dijo esto sobre [TEMA]",
    fuente: "@marcaviva",
    guardadoEl: "2026-06-15",
    nicho: "Marketing",
    tipo: "Contraste / secreto",
    vistas: 980_000,
    tags: ["educativo", "curiosidad"],
    transcripto:
      "Nadie te dijo esto sobre el algoritmo de Instagram, y por eso seguís estancado.",
    plantilla:
      "Nadie te dijo esto sobre [TEMA], y por eso seguís [DOLOR DE LA AUDIENCIA].",
  },
];

// Para los filtros (derivados de los datos).
export const nichos = [...new Set(ganchos.map((g) => g.nicho))].sort();
export const tiposGancho = [...new Set(ganchos.map((g) => g.tipo))].sort();
