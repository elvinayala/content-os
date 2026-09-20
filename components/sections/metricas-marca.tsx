"use client";

import { useState } from "react";
import { ExternalLink, Flame, Heart, Lock, MessageCircle } from "lucide-react";

import { fmtCompacto } from "@/lib/format";
import { frescura, type Frescura } from "@/lib/frescura";
import type { InsightsIG, PostIG } from "@/lib/types";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MarcaIG {
  unidad: string;
  nombre: string;
  insights: InsightsIG | null;
}

function mediana(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const TIPO_LABEL: Record<PostIG["tipo"], string> = {
  reel: "Reel",
  carrusel: "Carrusel",
  imagen: "Imagen",
};

export function MetricasMarca({ marcas }: { marcas: MarcaIG[] }) {
  const [activa, setActiva] = useState(marcas[0]?.unidad ?? "");
  const marca = marcas.find((m) => m.unidad === activa) ?? marcas[0];
  const ig = marca?.insights ?? null;

  // Métricas derivadas de los posts reales.
  const reels = (ig?.posts ?? []).filter((p) => p.tipo === "reel" && p.vistas);
  const vistasReels = reels.map((p) => p.vistas ?? 0);
  const medVistas = mediana(vistasReels);
  const vistasTotales = vistasReels.reduce((a, b) => a + b, 0);
  const engagementTotal = (ig?.posts ?? []).reduce(
    (a, p) => a + p.likes + p.comentarios,
    0,
  );
  const engagementProm = ig?.posts.length
    ? Math.round(engagementTotal / ig.posts.length)
    : 0;

  const topPosts = [...(ig?.posts ?? [])]
    .sort((a, b) => (b.vistas ?? b.likes) - (a.vistas ?? a.likes))
    .slice(0, 6);

  const f: Frescura = frescura(ig?.actualizadoEl);

  return (
    <div className="space-y-6">
      {/* Selector de marca */}
      <div className="flex flex-wrap gap-2">
        {marcas.map((m) => (
          <button
            key={m.unidad}
            onClick={() => setActiva(m.unidad)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              m.unidad === activa
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {m.nombre}
          </button>
        ))}
      </div>

      {!ig ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Sin datos de Instagram todavía para {marca?.nombre}. Corré el
            scraper (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              /sync-metricas
            </code>
            ) para llenar esta vista.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Encabezado de la cuenta */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground">
              @{ig.handle}
            </span>
            <FreshnessBadge frescura={f} fuente="Instagram" />
          </div>

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Seguidores" valor={fmtCompacto(ig.seguidores ?? 0)} />
            <StatCard
              label="Vistas (reels recientes)"
              valor={fmtCompacto(vistasTotales)}
            />
            <StatCard
              label="Engagement prom./post"
              valor={fmtCompacto(engagementProm)}
            />
            <StatCard
              label="Guardados · DMs"
              valor="Meta"
              locked
              nota="requiere conexión Meta"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top posts / bombazos */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top posts</CardTitle>
                <CardDescription>
                  Ordenados por vistas · &quot;bombazo&quot; = 2× la mediana de
                  reels ({fmtCompacto(medVistas)} vistas)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin posts recientes scrapeados.
                  </p>
                ) : (
                  topPosts.map((p, i) => {
                    const esBombazo =
                      !!p.vistas && medVistas > 0 && p.vistas >= medVistas * 2;
                    return (
                      <div
                        key={p.url}
                        className="flex items-start gap-3 rounded-lg border border-border p-3"
                      >
                        <span className="text-sm font-semibold tabular-nums text-primary">
                          #{i + 1}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm leading-snug">
                              {p.caption || "(sin caption)"}
                            </p>
                            {esBombazo ? (
                              <Badge className="shrink-0 gap-1">
                                <Flame className="size-3" />
                                Bombazo
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <Badge variant="outline">{TIPO_LABEL[p.tipo]}</Badge>
                            {p.vistas != null ? (
                              <span className="tabular-nums">
                                {fmtCompacto(p.vistas)} vistas
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Heart className="size-3" /> {fmtCompacto(p.likes)}
                            </span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <MessageCircle className="size-3" />{" "}
                              {fmtCompacto(p.comentarios)}
                            </span>
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 text-primary hover:underline"
                            >
                              ver <ExternalLink className="size-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Hallazgos IA */}
            <Card>
              <CardHeader>
                <CardTitle>Qué rinde</CardTitle>
                <CardDescription>Lectura del contenido reciente</CardDescription>
              </CardHeader>
              <CardContent>
                {ig.hallazgos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin conclusiones todavía.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {ig.hallazgos.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  valor,
  locked,
  nota,
}: {
  label: string;
  valor: string;
  locked?: boolean;
  nota?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn(
            "text-2xl",
            locked && "flex items-center gap-1.5 text-muted-foreground",
          )}
        >
          {locked ? <Lock className="size-4" /> : null}
          {valor}
        </CardTitle>
      </CardHeader>
      {nota ? (
        <CardContent>
          <span className="text-xs text-muted-foreground">{nota}</span>
        </CardContent>
      ) : null}
    </Card>
  );
}
