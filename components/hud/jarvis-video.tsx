"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface VideoAccion {
  id: string;
  titulo: string;
  embed: string;
}

// Escucha el evento "jarvis-accion" (cuando Jarvis usa reproducir_video) y pone el
// video en la pantalla del HUD como overlay. Se cierra con la X o con Escape.
export function JarvisVideo() {
  const [video, setVideo] = useState<VideoAccion | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const det = (e as CustomEvent<{ accion?: string; video?: VideoAccion }>)
        .detail;
      if (det?.accion === "video" && det.video?.embed) setVideo(det.video);
    };
    window.addEventListener("jarvis-accion", handler);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setVideo(null);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("jarvis-accion", handler);
      window.removeEventListener("keydown", esc);
    };
  }, []);

  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={() => setVideo(null)}
    >
      <div
        className="glow relative w-full max-w-4xl overflow-hidden rounded-xl border border-primary/40 bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="label-mono truncate text-primary">▶ {video.titulo}</span>
          <button
            onClick={() => setVideo(null)}
            className="text-muted-foreground hover:text-foreground"
            title="Cerrar (Esc)"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="aspect-video w-full">
          <iframe
            key={video.id}
            src={video.embed}
            title={video.titulo}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
