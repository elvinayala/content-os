import {
  AudioLines,
  Bot,
  Globe,
  Home,
  MessageSquare,
  Plug,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

// Navegación del portal de agentes de AI Borinquen. Única fuente de verdad de
// la sidebar. El producto gira sobre CREAR agentes (voz o chat) y entrenarlos.
export interface BorinquenNavItem {
  titulo: string;
  href: string;
  icon: LucideIcon;
  descripcion: string;
}

export const borinquenNav: BorinquenNavItem[] = [
  {
    titulo: "Inicio",
    href: "/borinquen",
    icon: Home,
    descripcion: "Creá tu agente y mirá los que ya trabajan.",
  },
  {
    titulo: "Agentes de Voz",
    href: "/borinquen/voz",
    icon: AudioLines,
    descripcion: "Agentes que atienden llamadas, con el preset de baja latencia.",
  },
  {
    titulo: "Asistentes de Chat",
    href: "/borinquen/chat",
    icon: MessageSquare,
    descripcion: "Agentes que responden WhatsApp, Instagram y web.",
  },
  {
    titulo: "CRM",
    href: "/borinquen/crm",
    icon: Users,
    descripcion: "Tus leads por etapa — lo que capturan los agentes.",
  },
  {
    titulo: "AutoFlow",
    href: "/borinquen/autoflow",
    icon: Workflow,
    descripcion: "Las instancias DFY de cada cliente: chat + voz + CRM.",
  },
  {
    titulo: "Portales",
    href: "/borinquen/portales",
    icon: Globe,
    descripcion: "El portal de cada prospecto o cliente: agentes, llamadas, CRM y solicitudes.",
  },
  {
    titulo: "Asistente Personal",
    href: "/borinquen/asistente",
    icon: Bot,
    descripcion: "Tu asistente por Telegram/WhatsApp que ejecuta acciones.",
  },
  {
    titulo: "Conexiones",
    href: "/borinquen/configuracion",
    icon: Plug,
    descripcion: "Proveedores de voz, números y API keys.",
  },
];
