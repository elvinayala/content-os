import { Badge } from "@/components/ui/badge";
import type { Plataforma } from "@/lib/types";
import { cn } from "@/lib/utils";

const estilos: Record<Plataforma, string> = {
  Instagram: "border-pink-500/30 bg-pink-500/10 text-pink-300",
  TikTok: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  YouTube: "border-red-500/30 bg-red-500/10 text-red-300",
  X: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
  LinkedIn: "border-blue-500/30 bg-blue-500/10 text-blue-300",
};

export function PlatformBadge({ plataforma }: { plataforma: Plataforma }) {
  return (
    <Badge variant="outline" className={cn("font-medium", estilos[plataforma])}>
      {plataforma}
    </Badge>
  );
}
