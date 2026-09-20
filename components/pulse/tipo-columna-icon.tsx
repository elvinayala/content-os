import {
  AlignLeft,
  AtSign,
  Calendar,
  CheckSquare,
  ChevronDownSquare,
  CircleDot,
  Hash,
  Link2,
  Paperclip,
  Phone,
  Type,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import type { TipoColumna } from "@/lib/pulse/types";

export const ICONO_TIPO: Record<TipoColumna, LucideIcon> = {
  text: Type,
  long_text: AlignLeft,
  number: Hash,
  status: CircleDot,
  dropdown: ChevronDownSquare,
  date: Calendar,
  people: Users,
  checkbox: CheckSquare,
  link: Link2,
  email: AtSign,
  phone: Phone,
  file: Paperclip,
  relation: Workflow,
};

export function TipoColumnaIcon({ tipo, className }: { tipo: TipoColumna; className?: string }) {
  const I = ICONO_TIPO[tipo];
  return <I className={className ?? "size-3.5"} />;
}
