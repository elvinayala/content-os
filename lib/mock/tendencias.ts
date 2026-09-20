import type { Tendencia } from "@/lib/types";

// MOCK — Tendencias.
// Para producción: revisar las 12 fuentes 1 vez por día + un filtro con IA que
// etiquete cada novedad como potencial/explicativo/ignorar y arme el resumen de
// Slack a las 7 AM. Ver CLAUDE.md → "Conectar datos reales".

// Las 12 fuentes que se revisan por día.
export const fuentes: string[] = [
  "Blog de Anthropic",
  "Blog de OpenAI",
  "Google DeepMind",
  "Hugging Face",
  "Listas de X · IA",
  "Listas de X · Creators",
  "The Rundown AI",
  "Ben's Bites",
  "TLDR AI",
  "MIT Tech Review",
  "Product Hunt",
  "Nicho · Creator economy",
];

export const tendencias: Tendencia[] = [
  {
    id: "t1",
    titulo: "Nuevo modelo de video text-to-video con clips de 60s",
    fuente: "Blog de OpenAI",
    resumen:
      "Un nuevo modelo genera clips coherentes de hasta 60 segundos con control de cámara.",
    etiqueta: "potencial",
    angulosContenido: [
      "Reel: 'probé esto por 7 días'",
      "Carrusel: 3 usos para creadores",
    ],
    fecha: "2026-06-16",
    url: "https://example.com/t1",
  },
  {
    id: "t2",
    titulo: "Anthropic publica guía de agentes para creadores",
    fuente: "Blog de Anthropic",
    resumen:
      "Una guía práctica para automatizar tareas de contenido con agentes de IA.",
    etiqueta: "potencial",
    angulosContenido: ["Tutorial: mi flujo con agentes", "Reel: 'esto lo hace solo'"],
    fecha: "2026-06-16",
    url: "https://example.com/t2",
  },
  {
    id: "t3",
    titulo: "Hilo viral: el formato de hook que rinde 23% más",
    fuente: "Listas de X · Creators",
    resumen:
      "Un hilo con análisis de 1M de reels muestra que los hooks con cifras retienen mejor.",
    etiqueta: "potencial",
    angulosContenido: ["Reel-data: 'el dato que cambia tus hooks'"],
    fecha: "2026-06-15",
    url: "https://example.com/t3",
  },
  {
    id: "t4",
    titulo: "Plataforma lanza monetización por guardados",
    fuente: "Nicho · Creator economy",
    resumen:
      "Una plataforma empieza a pagar a creadores en función de los guardados, no solo vistas.",
    etiqueta: "potencial",
    angulosContenido: ["Reacción/opinión", "Qué significa para tu estrategia"],
    fecha: "2026-06-15",
    url: "https://example.com/t4",
  },
  {
    id: "t5",
    titulo: "Edición por voz llega a las apps de social",
    fuente: "The Rundown AI",
    resumen:
      "Editar reels dictando cambios por voz ya está en beta para algunas cuentas.",
    etiqueta: "potencial",
    angulosContenido: ["Demo en vivo", "Antes/después de mi workflow"],
    fecha: "2026-06-14",
    url: "https://example.com/t5",
  },
  {
    id: "t6",
    titulo: "Cómo funciona por dentro un modelo de difusión",
    fuente: "Hugging Face",
    resumen:
      "Explicación técnica de difusión; útil para entender, no tanto para un reel.",
    etiqueta: "explicativo",
    angulosContenido: ["Nota larga / newsletter"],
    fecha: "2026-06-14",
    url: "https://example.com/t6",
  },
  {
    id: "t7",
    titulo: "Resumen semanal de papers de investigación",
    fuente: "TLDR AI",
    resumen: "Selección de research reciente, mayormente académico.",
    etiqueta: "explicativo",
    angulosContenido: ["Referencia para profundizar"],
    fecha: "2026-06-13",
    url: "https://example.com/t7",
  },
  {
    id: "t8",
    titulo: "Cambio menor en los términos de una API",
    fuente: "Product Hunt",
    resumen: "Ajuste de pricing sin impacto directo para creadores de contenido.",
    etiqueta: "ignorar",
    angulosContenido: [],
    fecha: "2026-06-13",
    url: "https://example.com/t8",
  },
];
