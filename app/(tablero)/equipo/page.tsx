import Link from "next/link";
import { ArrowRight, ChevronRight, Clock, Settings2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { equipo, head } from "@/lib/equipo";
import { leerNegocio } from "@/lib/negocio";
import { leerCalendario } from "@/lib/calendario";
import { leerCompetencia } from "@/lib/competencia";
import { leerFuentes } from "@/lib/fuentes";
import { leerInsightsIGMarca } from "@/lib/ops";
import { leerTendenciasIA } from "@/lib/tendencias-ia";
import { publicaciones } from "@/lib/mock/community";
import { type EventoCalendario, type UnidadNegocio } from "@/lib/types";
import { fmtCompacto } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Equipo · lo que produce el equipo" };
export const dynamic = "force-dynamic";

const estadoLabel: Record<EventoCalendario["estado"], string> = {
  idea: "en idea",
  guion: "en guion",
  grabar: "a grabar",
  editar: "a editar",
  listo: "listas",
};

const MARCAS_IG: UnidadNegocio[] = [
  "ai-borinquen",
  "level-up",
  "shadow-operator",
];

function medianaVistas(vistas: number[]): number {
  if (vistas.length === 0) return 0;
  const s = [...vistas].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export default async function EquipoPage() {
  const [negocio, eventos, fuentes, competencia, tendencias, ...igs] =
    await Promise.all([
      leerNegocio(),
      leerCalendario(),
      leerFuentes(),
      leerCompetencia(),
      leerTendenciasIA(),
      ...MARCAS_IG.map((m) => leerInsightsIGMarca(m)),
    ]);

  const configurado = negocio.marca.nicho.trim().length > 0;

  // ── Informe consolidado de Sofi, con DATOS REALES de cada agente ──
  // Mateo (Métricas + Competencia)
  let igViewsTotal = 0;
  let bombazosReales = 0;
  for (const ig of igs) {
    if (!ig) continue;
    const reelViews = ig.posts
      .filter((p) => p.tipo === "reel" && p.vistas)
      .map((p) => p.vistas ?? 0);
    igViewsTotal += reelViews.reduce((a, b) => a + b, 0);
    const med = medianaVistas(reelViews);
    if (med > 0) bombazosReales += reelViews.filter((v) => v >= med * 2).length;
  }
  const igsConectadas = igs.filter(Boolean).length;
  const referentes = competencia.cuentas.length;

  // Cami (Tendencias de IA) — señales frescas de las cuentas de noticias
  const senalesIA = tendencias?.reels.length ?? 0;
  const cuentasIA = tendencias?.cuentas.length ?? 0;

  // Lauti / Facu (Calendario + Community)
  const enCola = publicaciones.filter((p) => p.estado !== "publicado").length;
  const listas = eventos.filter((e) => e.estado === "listo").length;

  const informe: { label: string; valor: string; de: string; href: string }[] =
    [
      {
        label: "IG Views (reels)",
        valor: fmtCompacto(igViewsTotal),
        de: "Mateo",
        href: "/metricas",
      },
      {
        label: "Bombazos propios",
        valor: String(bombazosReales),
        de: "Mateo",
        href: "/metricas",
      },
      {
        label: "Señales de IA",
        valor: String(senalesIA),
        de: "Cami",
        href: "/tendencias",
      },
      {
        label: "Guiones en calendario",
        valor: String(eventos.length),
        de: "Lauti",
        href: "/calendario",
      },
      {
        label: "En cola de publicación",
        valor: String(enCola),
        de: "Facu",
        href: "/community",
      },
    ];

  const pendientes = (["guion", "grabar", "editar", "idea"] as const)
    .map((estado) => ({
      estado,
      n: eventos.filter((e) => e.estado === estado).length,
    }))
    .filter((p) => p.n > 0);

  return (
    <>
      <PageHeader
        titulo="Tu equipo de contenido"
        descripcion="Sofi coordina 5 agentes en cadena — cada número lleva a lo que ese agente produjo."
      >
        <Button asChild size="sm" variant="outline">
          <Link href="/configuracion">
            <Settings2 />
            Mi negocio
          </Link>
        </Button>
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Sofi · Head de Contenido — command center */}
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <head.icon className="size-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{head.nombre}</CardTitle>
                  <Badge>{head.rol}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Junta lo que produce cada agente en un solo informe.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informe consolidado — clickeable a la sección de cada agente */}
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Informe consolidado · datos reales
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {informe.map((m) => (
                  <Link
                    key={m.label}
                    href={m.href}
                    className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50"
                  >
                    <p className="text-xl font-semibold tabular-nums">
                      {m.valor}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-primary/80">
                      {m.de} →
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* A tiempo / pendientes */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm">
              <Clock className="size-4 text-primary" />
              <span className="font-medium">
                {listas}/{eventos.length} listas a tiempo
              </span>
              {pendientes.length > 0 ? (
                <span className="text-muted-foreground">· persigue:</span>
              ) : (
                <span className="text-muted-foreground">· todo al día 🎉</span>
              )}
              {pendientes.map((p) => (
                <Badge key={p.estado} variant="outline">
                  {p.n} {estadoLabel[p.estado]}
                </Badge>
              ))}
              <Button asChild size="sm" variant="ghost" className="ml-auto">
                <Link href="/calendario">
                  Ver calendario
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tira del pipeline que coordina Sofi */}
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            El equipo que coordina
          </h2>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
            {equipo.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2">
                <Link
                  href={a.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-sm hover:bg-primary/20"
                >
                  <a.icon className="size-3.5 text-primary" />
                  <span className="font-medium">{a.nombre}</span>
                </Link>
                {i < equipo.length - 1 && (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resumen de lo que el equipo tiene conectado (real) */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {configurado ? (
                  <>
                    Operando para{" "}
                    <span className="text-primary">{negocio.marca.handle}</span>
                    {negocio.marca.nicho ? ` · ${negocio.marca.nicho}` : ""}
                  </>
                ) : (
                  "Todavía no configuraste tu negocio"
                )}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">
                  {igsConectadas} cuentas IG con datos
                </Badge>
                <Badge variant="outline">{referentes} referentes rastreados</Badge>
                <Badge variant="outline">{cuentasIA} fuentes de IA</Badge>
                <Badge variant="outline">
                  mix {negocio.reglas.mixSemanal.reels}/
                  {negocio.reglas.mixSemanal.carruseles}/
                  {negocio.reglas.mixSemanal.youtube}
                </Badge>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href="/configuracion">
                {configurado ? "Editar" : "Configurar"}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Agentes en cadena */}
        <div className="space-y-4">
          {equipo.map((a, i) => (
            <Card key={a.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <a.icon className="size-5" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {i + 1}/5
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{a.nombre}</CardTitle>
                      <Badge variant="secondary">{a.rol}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Opera en: {a.seccion}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={a.href}>
                      Abrir
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {a.responsabilidades.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-sm leading-snug"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
                  <span className="text-muted-foreground">Recibe</span>
                  <Badge variant="outline">{a.consume}</Badge>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Entrega</span>
                  <Badge variant="outline" className="text-primary">
                    {a.entrega}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
