"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Clock, Send } from "lucide-react";
import { toast } from "sonner";

import type { EtiquetaTendencia, Tendencia } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fmtFecha } from "@/lib/format";
import { cn } from "@/lib/utils";

const etiquetaMeta: Record<
  EtiquetaTendencia,
  { label: string; clase: string }
> = {
  potencial: {
    label: "Potencial de gancho",
    clase: "border-primary/40 bg-primary/10 text-primary",
  },
  explicativo: {
    label: "Explicativo",
    clase: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  ignorar: {
    label: "Ignorar",
    clase: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  },
};

type Filtro = "todas" | EtiquetaTendencia;

const filtros: { key: Filtro; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "potencial", label: "Potencial de gancho" },
  { key: "explicativo", label: "Explicativo" },
  { key: "ignorar", label: "Ignorar" },
];

function EtiquetaBadge({ etiqueta }: { etiqueta: EtiquetaTendencia }) {
  const meta = etiquetaMeta[etiqueta];
  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-xs font-medium",
        meta.clase,
      )}
    >
      {meta.label}
    </span>
  );
}

export function TendenciasFeed({ tendencias }: { tendencias: Tendencia[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todas");

  // Las 5 con más potencial, de lo más nuevo a lo más viejo.
  const top5 = useMemo(
    () =>
      tendencias
        .filter((t) => t.etiqueta === "potencial")
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .slice(0, 5),
    [tendencias],
  );

  const visibles = useMemo(() => {
    const base =
      filtro === "todas"
        ? tendencias
        : tendencias.filter((t) => t.etiqueta === filtro);
    return [...base].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [tendencias, filtro]);

  function enviarSlack() {
    // Demo: el envío real va por el Slack MCP, programado a las 7 AM. Ver CLAUDE.md.
    toast.success("Resumen enviado a Slack (demo) · se programa diario a las 7 AM");
  }

  return (
    <div className="space-y-8">
      {/* Resumen diario para Slack */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Resumen del día</CardTitle>
              <CardDescription>
                Las 5 con más potencial, listas para tu bandeja.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <Clock className="size-3.5" />
                Slack · 7 AM
              </Badge>
              <Button size="sm" onClick={enviarSlack}>
                <Send />
                Enviar ahora
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {top5.map((t, i) => (
              <li key={t.id} className="flex items-start gap-3 text-sm">
                <span className="font-semibold text-primary tabular-nums">
                  {i + 1}.
                </span>
                <div className="flex-1">
                  <span className="font-medium">{t.titulo}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t.fuente} · {fmtFecha(t.fecha)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Feed completo con filtro por etiqueta */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Etiqueta:</span>
          {filtros.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filtro === f.key ? "default" : "outline"}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {visibles.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-normal">
                    {t.fuente}
                  </Badge>
                  <EtiquetaBadge etiqueta={t.etiqueta} />
                </div>
                <CardTitle className="text-base leading-snug">
                  {t.titulo}
                </CardTitle>
                <CardDescription>{t.resumen}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                {t.angulosContenido.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Ángulos para contenido
                    </span>
                    <ul className="mt-1 space-y-1">
                      {t.angulosContenido.map((a) => (
                        <li
                          key={a}
                          className="flex items-start gap-1.5 text-sm leading-snug"
                        >
                          <span className="mt-1 size-1 shrink-0 rounded-full bg-primary" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    {fmtFecha(t.fecha)}
                  </span>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Ver fuente
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
