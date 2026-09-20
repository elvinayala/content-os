import {
  BarChart3,
  ClipboardList,
  Lightbulb,
  PenLine,
  Send,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface Agente {
  id: string;
  nombre: string;
  rol: string;
  icon: LucideIcon;
  responsabilidades: string[];
  consume: string; // qué recibe (input del pipeline)
  entrega: string; // qué produce (output del pipeline)
  href: string; // sección del tablero donde opera
  seccion: string; // nombre de la sección
}

// Sofi coordina a todo el equipo (está por encima del pipeline).
export const head = {
  id: "sofi",
  nombre: "Sofi",
  rol: "Head de Contenido",
  icon: ClipboardList,
  responsabilidades: [
    "Dirige el Estudio UGC: los traffickers le piden videos de anuncio por Slack",
    "Hace el intake de cada brief — no se produce nada sin brief completo",
    "Ningún pedido queda sin respuesta: da ETA y persigue briefs incompletos",
    "Persigue entregas y firma cada video que sale del estudio",
    "Maneja el pipeline de contenido semanal",
    "Junta todos los reportes en un solo informe",
  ],
} satisfies {
  id: string;
  nombre: string;
  rol: string;
  icon: LucideIcon;
  responsabilidades: string[];
};

// El equipo de contenido como pipeline: Mateo → Santi → Cami → Lauti → Facu.
export const equipo: Agente[] = [
  {
    id: "mateo",
    nombre: "Mateo",
    rol: "Analista de Datos",
    icon: BarChart3,
    responsabilidades: [
      "Saca métricas diarias de todas las plataformas",
      "Detecta qué hooks están funcionando ahora",
      "Sigue el contenido top de tu competencia",
      "Marca qué posts matar y cuáles repetir",
    ],
    consume: "Tus cuentas + competidores",
    entrega: "Informe semanal de performance",
    href: "/metricas",
    seccion: "Métricas + Competencia",
  },
  {
    id: "santi",
    nombre: "Santi",
    rol: "Estratega de Contenido",
    icon: Target,
    responsabilidades: [
      "Lee el informe de Mateo cada semana",
      "Define el mix semanal (X reels, Y carruseles, Z YouTube)",
      "Elige los CTA / recursos que más convierten",
      "Arma la estrategia semanal",
    ],
    consume: "Informe de Mateo",
    entrega: "Estrategia + mix de la semana",
    href: "/configuracion",
    seccion: "Reglas del equipo",
  },
  {
    id: "cami",
    nombre: "Cami",
    rol: "Ideadora",
    icon: Lightbulb,
    responsabilidades: [
      "Toma las directivas de Santi",
      "Tira 30+ ideas de los ángulos ganadores",
      "Crea tendencias según los ángulos de contenido",
      "Define las mejores 7 ideas ganadoras por semana",
    ],
    consume: "Estrategia de Santi",
    entrega: "7 ideas ganadoras",
    href: "/tendencias",
    seccion: "Tendencias",
  },
  {
    id: "lauti",
    nombre: "Lauti",
    rol: "Guionista",
    icon: PenLine,
    responsabilidades: [
      "Agarra las 7 mejores ideas de Cami",
      "Escribe los guiones completos",
      "Usa formatos de hooks ya probados (Baúl de Ganchos)",
      "Pasa los guiones listos para grabar (/guion)",
    ],
    consume: "7 ideas de Cami",
    entrega: "Guiones → Calendario",
    href: "/ganchos",
    seccion: "Baúl de Ganchos + /guion",
  },
  {
    id: "facu",
    nombre: "Facu",
    rol: "Encargado de Publicación",
    icon: Send,
    responsabilidades: [
      "Programa el contenido que aprobaste",
      "Lo agenda en todas las redes",
      "Chequea que los posts salgan al aire",
      "Audita los embudos de DM cada semana",
    ],
    consume: "Guiones de Lauti",
    entrega: "Publicaciones en todas las redes",
    href: "/community",
    seccion: "Community Manager + Calendario",
  },
];
