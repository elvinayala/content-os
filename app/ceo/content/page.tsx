import Link from "next/link";
import { ArrowRight, Hexagon } from "lucide-react";

import { leerCalendario } from "@/lib/calendario";
import { equipo, head } from "@/lib/equipo";
import { fmtCompacto } from "@/lib/format";
import { bombazos, resumen } from "@/lib/mock/metricas";
import { tendencias } from "@/lib/mock/tendencias";
import type { EventoCalendario } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Content · CEO Command Center" };
export const dynamic = "force-dynamic";

const ESTADOS: EventoCalendario["estado"][] = [
  "idea",
  "guion",
  "grabar",
  "editar",
  "listo",
];

export default async function ContentPage() {
  const eventos = await leerCalendario();

  const porEstado = ESTADOS.map((estado) => ({
    estado,
    total: eventos.filter((e) => e.estado === estado).length,
  }));
  const igViews = resumen.find((m) => m.key === "vistas")?.valor ?? 0;
  const potenciales = tendencias.filter(
    (t) => t.etiqueta === "potencial",
  ).length;

  return (
    <>
      <PageHeader
        titulo="Content"
        descripcion="Resumen ejecutivo del sistema de contenido — el detalle vive en el tablero."
      >
        <Badge variant="outline" className="label-mono">
          Squad de {head.nombre}
        </Badge>
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Puerta de entrada al Content OS */}
        <Link href="/hud" className="block">
          <Card className="glow border-primary/30 bg-gradient-to-b from-card to-background/60 transition-colors hover:border-primary/60">
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Hexagon className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight">
                  Jarvis HUD — tu centro de comando de contenido
                </h2>
                <p className="text-sm text-muted-foreground">
                  Métricas + Jarvis + Skills + Vault detrás de una sola
                  pantalla: pedile guiones, ideas, análisis de competidores o
                  transcribir perfiles enteros.
                </p>
              </div>
              <span className="label-mono inline-flex items-center gap-1 text-primary">
                Abrir HUD <ArrowRight className="size-3.5" />
              </span>
            </CardContent>
          </Card>
        </Link>

        {/* KPIs del sistema */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardContent className="p-4">
              <div className="label-mono text-muted-foreground">
                IG Views (semana)
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {fmtCompacto(igViews)}
              </div>
              <Link
                href="/metricas"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
              >
                Métricas <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardContent className="p-4">
              <div className="label-mono text-muted-foreground">Bombazos</div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {bombazos.length}
              </div>
              <Link
                href="/metricas"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
              >
                Ver cuáles <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardContent className="p-4">
              <div className="label-mono text-muted-foreground">
                Ideas con potencial
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {potenciales}
              </div>
              <Link
                href="/tendencias"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
              >
                Tendencias <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardContent className="p-4">
              <div className="label-mono text-muted-foreground">
                Piezas en el calendario
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {eventos.length}
              </div>
              <Link
                href="/calendario"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
              >
                Calendario <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Cola de producción */}
        <section>
          <h2 className="label-mono mb-3 text-muted-foreground">
            Cola de producción
          </h2>
          <div className="grid gap-3 sm:grid-cols-5">
            {porEstado.map(({ estado, total }) => (
              <Card
                key={estado}
                className="bg-gradient-to-b from-card to-background/60"
              >
                <CardContent className="p-4 text-center">
                  <div className="font-mono text-2xl font-semibold">
                    {total}
                  </div>
                  <div className="label-mono mt-1 text-muted-foreground">
                    {estado}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* El squad */}
        <section>
          <h2 className="label-mono mb-3 text-muted-foreground">
            El squad de contenido
          </h2>
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {head.nombre} — {head.rol}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {head.responsabilidades[2]}. El pipeline completo (con el
                informe consolidado y los pendientes) vive en el tablero.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {equipo.map((m) => (
                  <Badge key={m.id} variant="secondary">
                    <m.icon className="size-3" />
                    {m.nombre} · {m.rol}
                  </Badge>
                ))}
              </div>
              <Link
                href="/tablero"
                className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
              >
                Abrir tablero de contenido <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
