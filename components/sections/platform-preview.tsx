import { Bookmark, Heart, MessageCircle, Music2, Send } from "lucide-react";

import type { Plataforma } from "@/lib/types";
import { plataformaMeta } from "@/lib/plataforma";
import { cn } from "@/lib/utils";

interface Props {
  plataforma: Plataforma;
  etiqueta: string; // nombre visible (ej. "YT Shorts")
  handle: string;
  gancho: string;
  descripcion: string;
}

// Mockup de cómo se ve la publicación en cada plataforma (formato reel vertical).
export function PlatformPreview({
  plataforma,
  etiqueta,
  handle,
  gancho,
  descripcion,
}: Props) {
  const meta = plataformaMeta[plataforma];

  return (
    <div className="w-44 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
      {/* Chrome superior: plataforma + handle */}
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <span
          className={cn(
            "rounded border px-1 text-[10px] font-semibold",
            meta.clase,
          )}
        >
          {meta.abrev}
        </span>
        <span className="truncate text-xs font-medium">{etiqueta}</span>
      </div>

      {/* Media vertical 9:16 con el gancho como texto en pantalla */}
      <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/30 via-card to-secondary">
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <p className="text-center text-sm font-extrabold leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            {gancho || "Tu gancho acá"}
          </p>
        </div>
        {/* Acciones laterales tipo reel */}
        <div className="absolute bottom-2 right-1.5 flex flex-col items-center gap-2 text-white/90">
          <Heart className="size-4" />
          <MessageCircle className="size-4" />
          {plataforma === "TikTok" ? (
            <Music2 className="size-4" />
          ) : (
            <Bookmark className="size-4" />
          )}
          <Send className="size-4" />
        </div>
        {/* Handle abajo a la izquierda */}
        <div className="absolute bottom-2 left-2 text-xs font-semibold text-white drop-shadow">
          {handle}
        </div>
      </div>

      {/* Caption (descripción generada) */}
      <div className="px-2.5 py-2">
        <p className="line-clamp-4 text-[11px] leading-snug text-muted-foreground whitespace-pre-line">
          {descripcion || "La descripción se genera sola con el gancho, el ángulo y el CTA."}
        </p>
      </div>
    </div>
  );
}
