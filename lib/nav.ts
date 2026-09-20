import {
  LayoutDashboard,
  Bookmark,
  BarChart3,
  Crown,
  Home,
  Radar,
  Megaphone,
  CalendarDays,
  Sparkles,
  Users,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  titulo: string;
  href: string;
  icon: LucideIcon;
  descripcion: string;
}

// Las 6 secciones del tablero (en orden del prompt PASO 01).
export const navItems: NavItem[] = [
  {
    titulo: "CEO Command Center",
    href: "/ceo",
    icon: Crown,
    descripcion:
      "Todo tu ecosistema en una pantalla: agencias, agentes, leads y contenido.",
  },
  {
    titulo: "Inicio del tablero",
    href: "/tablero",
    icon: Home,
    descripcion: "Resumen del tablero de contenido y accesos a sus secciones.",
  },
  {
    titulo: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    descripcion:
      "Ventas y métricas (CAC/LTV/Churn) de tus agencias, desde Google Sheets.",
  },
  {
    titulo: "Equipo",
    href: "/equipo",
    icon: Users,
    descripcion: "Tus 5 agentes en cadena: de la data a la publicación.",
  },
  {
    titulo: "Baúl de Ganchos",
    href: "/ganchos",
    icon: Bookmark,
    descripcion: "Cada gancho guardado, transcripto y convertido en plantilla.",
  },
  {
    titulo: "Métricas",
    href: "/metricas",
    icon: BarChart3,
    descripcion: "Vistas, guardados, seguidores y los bombazos de la semana.",
  },
  {
    titulo: "Rastreador de Competencia",
    href: "/competencia",
    icon: Radar,
    descripcion: "Los reels que más rompen de los creadores que seguís.",
  },
  {
    titulo: "Community Manager",
    href: "/community",
    icon: Megaphone,
    descripcion: "Publicá en varias plataformas y generá descripciones.",
  },
  {
    titulo: "Calendario de Contenido",
    href: "/calendario",
    icon: CalendarDays,
    descripcion: "Se llena solo desde /guion, con ganchos y ángulos.",
  },
  {
    titulo: "Tendencias",
    href: "/tendencias",
    icon: Sparkles,
    descripcion: "Lo nuevo de IA de 12 fuentes, filtrado para contenido.",
  },
  {
    titulo: "Mi negocio",
    href: "/configuracion",
    icon: Settings2,
    descripcion: "Tu data, cuentas y las reglas que usa el equipo.",
  },
];
