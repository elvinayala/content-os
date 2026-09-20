import Link from "next/link";
import { AudioLines, Gauge, Plus, Sparkles, Zap } from "lucide-react";

import { leerAgentesVoz } from "@/lib/voz/store";
import { estadoProveedores } from "@/lib/voz";
import { VOZ_PRESET_DEFAULT, totalPresupuestoMs } from "@/lib/voz/preset";
import type { EstadoAgenteVoz } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Agentes de Voz · Bori" };
export const dynamic = "force-dynamic";

const ESTADO_STYLE: Record<EstadoAgenteVoz, { dot: string; label: string }> = {
  activo: { dot: "var(--status-working)", label: "Activo" },
  pausado: { dot: "var(--status-idle)", label: "Pausado" },
  borrador: { dot: "var(--muted-foreground)", label: "Borrador" },
};

export default async function VoiceStudioPage() {
  const [agentes, proveedores] = await Promise.all([
    leerAgentesVoz(),
    Promise.resolve(estadoProveedores()),
  ]);
  const retell = proveedores.find((p) => p.proveedor === "retell");

  return (
    <>
      <PageHeader
        titulo="Voice Studio"
        descripcion="Creá y afiná agentes de voz con el preset de baja latencia."
      >
        <Button size="sm" asChild>
          <Link href="/borinquen/crear?tipo=voz">
            <Plus className="size-4" /> Crear agente
          </Link>
        </Button>
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Preset por defecto — el "muy probado" */}
        <Card className="glow bg-gradient-to-b from-card to-background/40">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">
                Preset por defecto — baja latencia, español PR
              </h2>
              <Badge variant="outline" className="label-mono ml-auto">
                <Gauge className="mr-1 size-3" />
                Objetivo &lt; {(VOZ_PRESET_DEFAULT.objetivoLatenciaMs / 1000).toFixed(1)}s
              </Badge>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <PresetItem label="STT" valor={`${VOZ_PRESET_DEFAULT.sttProveedor} ${VOZ_PRESET_DEFAULT.sttModelo}`} />
              <PresetItem label="LLM" valor="Claude Haiku → Sonnet" />
              <PresetItem label="TTS" valor={`${VOZ_PRESET_DEFAULT.ttsProveedor} flash`} />
              <PresetItem label="Turnos" valor="Semántico + barge-in" />
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="size-3.5 text-primary" />
              Generación preventiva ON · presupuesto ~{totalPresupuestoMs()}ms voz-a-voz ·{" "}
              {retell?.disponible
                ? "Retell conectado."
                : "Modo local (poné RETELL_API_KEY para crearlos en Retell)."}
            </p>
          </CardContent>
        </Card>

        {/* Lista de agentes */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agentes.map((a) => {
            const est = ESTADO_STYLE[a.estado];
            return (
              <Link key={a.id} href={`/borinquen/voz/${a.id}`} className="block">
                <Card className="h-full bg-gradient-to-b from-card to-background/40 transition-colors hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
                        <AudioLines className="size-5" />
                      </div>
                      <Badge variant="outline" className="label-mono">
                        <span
                          className="mr-1 size-1.5 rounded-full"
                          style={{ backgroundColor: est.dot }}
                        />
                        {est.label}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-semibold leading-tight">{a.nombre}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.cliente ?? "AI Borinquen"} · {a.proveedor}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {a.proposito}
                    </p>
                    <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-3 text-xs">
                      <span className="font-mono">
                        {a.metricas?.llamadas ?? 0}{" "}
                        <span className="text-muted-foreground">llamadas</span>
                      </span>
                      <span className="font-mono">
                        {a.metricas?.latenciaP50Ms
                          ? `${(a.metricas.latenciaP50Ms / 1000).toFixed(2)}s`
                          : "—"}{" "}
                        <span className="text-muted-foreground">p50</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}

function PresetItem({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <p className="label-mono text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{valor}</p>
    </div>
  );
}
