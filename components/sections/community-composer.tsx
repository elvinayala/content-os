"use client";

import { useState } from "react";
import { Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import type { Plataforma } from "@/lib/types";
import {
  etiquetaPlataforma,
  generarDescripcion,
  plataformas,
} from "@/lib/mock/community";
import { PlatformBadge } from "@/components/platform-badge";
import { PlatformPreview } from "@/components/sections/platform-preview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function CommunityComposer() {
  const [gancho, setGancho] = useState("");
  const [angulo, setAngulo] = useState("");
  const [cta, setCta] = useState("");
  const [activas, setActivas] = useState<Record<Plataforma, boolean>>({
    Instagram: true,
    TikTok: true,
    YouTube: true,
    X: false,
    LinkedIn: false,
  });
  const [descripciones, setDescripciones] = useState<
    Partial<Record<Plataforma, string>>
  >({});

  const seleccionadas = plataformas.filter((p) => activas[p]);

  function toggle(p: Plataforma) {
    setActivas((prev) => ({ ...prev, [p]: !prev[p] }));
  }

  function etiqueta(p: Plataforma) {
    return etiquetaPlataforma[p] ?? p;
  }

  function generar() {
    if (seleccionadas.length === 0) {
      toast.error("Activá al menos una plataforma");
      return;
    }
    const partes = { gancho, angulo, cta };
    const next: Partial<Record<Plataforma, string>> = {};
    for (const p of seleccionadas) next[p] = generarDescripcion(partes, p);
    setDescripciones(next);
    toast.success(`Descripción generada para ${seleccionadas.length} plataforma(s)`);
  }

  function publicar() {
    if (seleccionadas.length === 0) {
      toast.error("Activá al menos una plataforma");
      return;
    }
    // Demo: la publicación real se delega al Zernio MCP. Ver CLAUDE.md.
    toast.success(
      `Enviado a Zernio MCP para publicar en ${seleccionadas
        .map(etiqueta)
        .join(", ")} (demo)`,
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Nueva publicación</CardTitle>
            <CardDescription>
              Un clic y se sube a las plataformas que elijas. La descripción se
              escribe sola.
            </CardDescription>
          </div>
          <Button onClick={publicar} className="shrink-0">
            <Upload />
            PUBLICAR
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Plataformas con punto de estado */}
        <div className="flex flex-wrap gap-2">
          {plataformas.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                activas[p]
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/40",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  activas[p] ? "bg-emerald-400" : "bg-muted-foreground/40",
                )}
              />
              {etiqueta(p)}
            </button>
          ))}
        </div>

        {/* Gancho + ángulo + CTA → descripción automática */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="gancho">Gancho</Label>
            <Input
              id="gancho"
              placeholder="Los primeros 3 seg"
              value={gancho}
              onChange={(e) => setGancho(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="angulo">Ángulo</Label>
            <Input
              id="angulo"
              placeholder="Qué lo hace único"
              value={angulo}
              onChange={(e) => setAngulo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cta">Llamado a la acción</Label>
            <Input
              id="cta"
              placeholder="Guardá / Seguime…"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
            />
          </div>
        </div>

        <Button variant="outline" onClick={generar}>
          <Sparkles />
          Generar descripción
        </Button>

        {/* Vista previa: cómo se ve la publicación en cada plataforma */}
        {seleccionadas.length > 0 && (
          <div className="space-y-2">
            <Label>Vista previa por plataforma</Label>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {seleccionadas.map((p) => (
                <PlatformPreview
                  key={p}
                  plataforma={p}
                  etiqueta={etiqueta(p)}
                  handle="@tenfoldmarc"
                  gancho={gancho}
                  descripcion={
                    descripciones[p] ??
                    generarDescripcion({ gancho, angulo, cta }, p)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {Object.keys(descripciones).length > 0 && (
          <div className="space-y-3">
            <Label>Descripciones por plataforma</Label>
            {seleccionadas.map((p) => (
              <div key={p} className="space-y-1.5">
                <PlatformBadge plataforma={p} />
                <Textarea
                  rows={3}
                  value={descripciones[p] ?? ""}
                  onChange={(e) =>
                    setDescripciones((prev) => ({ ...prev, [p]: e.target.value }))
                  }
                  className="font-mono text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
