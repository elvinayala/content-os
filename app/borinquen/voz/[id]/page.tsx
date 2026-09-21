import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gauge, Phone } from "lucide-react";

import { leerAgenteVoz } from "@/lib/voz/store";
import { PRESUPUESTO_LATENCIA } from "@/lib/voz/preset";
import { transcriptosMock } from "@/lib/mock/borinquen";
import { listarLlamadasPorAgente } from "@/lib/portal/repo";
import { AgenteAcciones } from "@/components/borinquen/agente-acciones";
import { Dato } from "@/components/borinquen/dato";
import { TranscriptoCard, type TranscriptoVista } from "@/components/borinquen/transcripto-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

const PRESUPUESTO_LABEL: Record<string, string> = {
  endpointing: "Turn-taking",
  stt: "STT (voz→texto)",
  llmTtft: "LLM (1er token)",
  ttsTtfb: "TTS (1er byte)",
  transporte: "Transporte",
};

export default async function AgenteVozPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await leerAgenteVoz(id);
  if (!a) notFound();

  const c = a.config;
  // Llamadas reales (autoflow_llamadas, las trae el webhook de Retell) si el agente es real;
  // si no hay ninguna, el mock de siempre.
  const reales = a.externalId ? await listarLlamadasPorAgente(a.externalId).catch(() => []) : [];
  const transcriptos: TranscriptoVista[] = reales.length
    ? reales.map((l) => ({ id: l.id, fecha: l.inicio ?? l.creadoEl, duracionSeg: l.duracionSeg, turnos: l.turnos, resultado: l.resultado, resumen: l.resumen, grabacionUrl: l.grabacionUrl, estado: l.estado, sentimiento: l.sentimiento }))
    : transcriptosMock.filter((t) => t.agenteId === id).map((t) => ({ id: t.id, fecha: t.fecha, duracionSeg: t.duracionSeg, turnos: t.turnos, resultado: t.resultado }));

  return (
    <>
      <PageHeader titulo={a.nombre} descripcion={a.proposito}>
        <Badge variant="outline" className="label-mono">
          {a.proveedor}
        </Badge>
        <AgenteAcciones id={a.id} estado={a.estado} />
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <Link
          href="/borinquen/voz"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Voice Studio
        </Link>

        {/* Fila de datos rápidos */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato label="Estado" valor={a.estado} />
          <Dato
            label="Número"
            valor={a.numero ?? "sin asignar"}
            icono={<Phone className="size-3.5" />}
          />
          <Dato
            label="Latencia p50"
            valor={
              a.metricas?.latenciaP50Ms
                ? `${(a.metricas.latenciaP50Ms / 1000).toFixed(2)}s`
                : "—"
            }
          />
          <Dato label="Llamadas" valor={String(a.metricas?.llamadas ?? 0)} />
        </div>

        <Tabs defaultValue="config">
          <TabsList>
            <TabsTrigger value="config">Configuración</TabsTrigger>
            <TabsTrigger value="transcripciones">Transcripciones</TabsTrigger>
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
          </TabsList>

          {/* Configuración (el preset horneado) */}
          <TabsContent value="config" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <BloqueConfig titulo="STT — reconocimiento">
                <Fila k="Proveedor" v={`${c.sttProveedor} · ${c.sttModelo}`} />
                <Fila k="Idioma" v={c.idioma === "multi" ? "Multilingüe (code-switch PR)" : c.idioma} />
                <Fila k="Parciales" v={c.interimResults ? "Sí (generación preventiva)" : "No"} />
              </BloqueConfig>
              <BloqueConfig titulo="LLM — cerebro">
                <Fila k="Modelo" v={c.llmModelo} />
                <Fila k="Escala a" v={c.llmModeloEscalado} />
                <Fila k="Temperatura" v={String(c.temperatura)} />
                <Fila k="Max tokens" v={String(c.maxTokens)} />
              </BloqueConfig>
              <BloqueConfig titulo="TTS — síntesis">
                <Fila k="Proveedor" v={`${c.ttsProveedor} · ${c.ttsModelo}`} />
                <Fila k="Voz" v={c.ttsVozId || "por fijar (LatAm/PR)"} />
              </BloqueConfig>
              <BloqueConfig titulo="Turnos y fluidez">
                <Fila k="Detección" v={c.turnMode === "semantic" ? "Semántica + VAD" : "VAD"} />
                <Fila k="Silencio VAD" v={`${c.vadMinSilencioMs}ms`} />
                <Fila k="Endpoint" v={`${c.endpointMinMs}–${c.endpointMaxMs}ms`} />
                <Fila k="Preventiva" v={c.generacionPreventiva ? "ON" : "OFF"} />
                <Fila k="Barge-in" v={c.bargeIn ? "ON" : "OFF"} />
              </BloqueConfig>
            </div>
            <BloqueConfig titulo="Prompt del sistema">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {c.promptSistema}
              </p>
              {c.fillers.length ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Fillers: {c.fillers.map((f) => `"${f}"`).join(" · ")}
                </p>
              ) : null}
            </BloqueConfig>
          </TabsContent>

          {/* Transcripciones */}
          <TabsContent value="transcripciones" className="mt-4 space-y-4">
            {reales.length ? (
              <Badge variant="outline" className="label-mono text-[var(--status-working)]">
                Retell · {reales.length} llamadas reales
              </Badge>
            ) : null}
            {transcriptos.length === 0 ? (
              <Card className="bg-gradient-to-b from-card to-background/40">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Todavía no hay llamadas transcriptas para este agente.
                </CardContent>
              </Card>
            ) : (
              transcriptos.map((t) => <TranscriptoCard key={t.id} t={t} />)
            )}
          </TabsContent>

          {/* Métricas + presupuesto de latencia */}
          <TabsContent value="metricas" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Dato label="Llamadas" valor={String(a.metricas?.llamadas ?? 0)} />
              <Dato
                label="Latencia p50"
                valor={a.metricas?.latenciaP50Ms ? `${(a.metricas.latenciaP50Ms / 1000).toFixed(2)}s` : "—"}
              />
              <Dato
                label="Latencia p95"
                valor={a.metricas?.latenciaP95Ms ? `${(a.metricas.latenciaP95Ms / 1000).toFixed(2)}s` : "—"}
              />
            </div>
            <BloqueConfig titulo="Presupuesto de latencia (objetivo)">
              <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Gauge className="size-3.5 text-primary" />
                Voz-a-voz objetivo &lt; {(c.objetivoLatenciaMs / 1000).toFixed(1)}s. La
                consistencia vive en el p95, no en el promedio.
              </p>
              <div className="space-y-2">
                {Object.entries(PRESUPUESTO_LATENCIA).map(([k, ms]) => (
                  <div key={k}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{PRESUPUESTO_LABEL[k] ?? k}</span>
                      <span className="font-mono">{ms}ms</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(ms / c.objetivoLatenciaMs) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </BloqueConfig>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

function BloqueConfig({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-gradient-to-b from-card to-background/40">
      <CardContent className="p-5">
        <h3 className="label-mono mb-3 text-muted-foreground">{titulo}</h3>
        <div className="space-y-1.5">{children}</div>
      </CardContent>
    </Card>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
