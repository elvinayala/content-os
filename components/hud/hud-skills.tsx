"use client";

import {
  BookOpenText,
  Clapperboard,
  GalleryHorizontalEnd,
  Lightbulb,
  MessageSquareText,
  Mic,
  Radar,
} from "lucide-react";

import type { SkillJarvis } from "@/lib/jarvis/skills";
import { cn } from "@/lib/utils";

// Panel derecho: los "empleados". Click → precarga el prompt en el chat.
const ICONOS: Record<string, typeof Lightbulb> = {
  "guionar-reel": Clapperboard,
  "armar-carrusel": GalleryHorizontalEnd,
  "redactar-historias": MessageSquareText,
  "analizar-competidor": Radar,
  "ideas-ganadoras": Lightbulb,
  "transcribir-perfil": Mic,
};

const PROMPTS: Record<string, string> = {
  "guionar-reel": "Escribime un guion de reel para ",
  "armar-carrusel": "Armame un carrusel para ",
  "redactar-historias": "Redactame las historias de hoy para ",
  "analizar-competidor": "Analizá el perfil @",
  "ideas-ganadoras": "Dame una tanda de 10 ideas para ",
  "transcribir-perfil": "Transcribí el perfil entero de @",
};

export function HudSkills({
  skills,
  encargosPendientes,
}: {
  skills: Omit<SkillJarvis, "cuerpo">[];
  encargosPendientes: number;
}) {
  const precargar = (nombre: string) => {
    window.dispatchEvent(
      new CustomEvent("jarvis-prompt", {
        detail: PROMPTS[nombre] ?? `Usá la skill ${nombre} para `,
      }),
    );
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h2 className="label-mono mb-2 text-muted-foreground">Skills</h2>
        <div className="space-y-1.5">
          {skills.map((s) => {
            const Icon = ICONOS[s.nombre] ?? BookOpenText;
            return (
              <button
                key={s.nombre}
                onClick={() => precargar(s.nombre)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-md border border-border bg-card/60 px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-card",
                )}
                title={s.descripcion}
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-medium">
                    {s.nombre.replace(/-/g, " ")}
                  </span>
                  <span className="label-mono text-muted-foreground">
                    {s.ejecucion === "worker" ? "worker · pesada" : "live"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card/60 px-3 py-2">
        <div className="label-mono text-muted-foreground">Cola del worker</div>
        <div className="mt-0.5 font-mono text-lg font-semibold">
          {encargosPendientes}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            pendiente{encargosPendientes === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
