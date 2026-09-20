import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";

import { AGENCIAS } from "@/lib/agencias";
import { agentesEjecutivos, orquestador, UNIDADES, unidadInfo } from "@/lib/ceo";
import { leerCalendario } from "@/lib/calendario";
import { fmtCompacto, fmtFecha, formatUSD, hoyISO } from "@/lib/format";
import { leerFuentes } from "@/lib/fuentes";
import { leerEntregas } from "@/lib/entregas";
import { armarDashboardAgencia } from "@/lib/metricas";
import {
  frescura,
  leerAgendaSnapshot,
  leerDebriefReal,
  leerInsightsIG,
  leerOps,
} from "@/lib/ops";
import { agenda, debrief as debriefMock } from "@/lib/mock/ceo";
import { Accionar } from "@/components/ceo/accionar";
import { leerTareas } from "@/lib/tareas";
import { leerPipeline } from "@/lib/pipedrive";
import { leerZoomIntel } from "@/lib/zoom";
import { leerSlackBorinquen } from "@/lib/slack-borinquen";
import { leerSlackLevelUp } from "@/lib/slack-levelup";
import { leerVentasEAlive } from "@/lib/ea-market";
import { leerNegocioBori } from "@/lib/bori";
import { leerPrioridades } from "@/lib/prioridades";
import { leerEmails } from "@/lib/emails";
import { leerGranola } from "@/lib/granola";
import { leerOnboardings } from "@/lib/onboardings";
import { resumen } from "@/lib/mock/metricas";
import type { EtapaLead, NivelAtencion } from "@/lib/types";

import { AgentStatusBadge } from "@/components/ceo/agent-status-badge";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import { OrchestratorCard } from "@/components/ceo/orchestrator-card";
import { PulseClientes } from "@/components/ceo/pulse-clientes";
import { ZoomIntelCard } from "@/components/ceo/zoom-intel-card";
import { EaMarketCard } from "@/components/ceo/ea-market-card";
import { BoriCard } from "@/components/ceo/bori-card";
import { PrioridadesPanel } from "@/components/ceo/prioridades-panel";
import { EmailsPanel } from "@/components/ceo/emails-panel";
import { GranolaPanel } from "@/components/ceo/granola-panel";
import { AutoRefresh } from "@/components/ceo/auto-refresh";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Command Center · CEO" };
// Lee Google Sheets (ventas Level Up) y data/calendario.json en cada request.
export const dynamic = "force-dynamic";
// Margen sobre el default: la página consulta ~7 servicios externos en paralelo
// (Zoom, Bori, Pipedrive, Slack, Sheets). Cada uno degrada solo si tarda, pero
// si varios van lentos a la vez no queremos que Vercel corte el render a medias
// y le muestre a Elvin el error boundary.
export const maxDuration = 30;

const NIVEL_DOT: Record<NivelAtencion, string> = {
  urgente: "var(--status-waiting)",
  hoy: "var(--neon)",
  semana: "var(--status-idle)",
};

const ETAPAS_ABIERTAS: EtapaLead[] = [
  "nuevo",
  "contactado",
  "calificado",
  "propuesta",
];

// Igual que con los logros: el brief pasó de escribir cada punto de atención
// como {texto} a {titulo, detalle}. Sin esto los ítems salen en blanco.
function normalizarAtencion(item: unknown): {
  texto: string;
  detalle?: string;
  nivel: NivelAtencion;
  href?: string;
} {
  const o = (item ?? {}) as Record<string, unknown>;
  const txt = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const nivel = txt(o.nivel);
  return {
    texto: txt(o.texto) ?? txt(o.titulo) ?? txt(o.detalle) ?? "—",
    // Si vino {titulo, detalle} mostramos ambos; si el título ya salió del
    // detalle, no lo repetimos abajo.
    detalle: txt(o.texto) ?? txt(o.titulo) ? txt(o.detalle) : undefined,
    nivel: (nivel === "urgente" || nivel === "hoy" || nivel === "semana"
      ? nivel
      : "semana") as NivelAtencion,
    href: txt(o.href),
  };
}

// Los "logros" del debrief empezaron siendo texto plano y el brief pasó a
// escribirlos como objeto {cliente, estratega, dato}. Se aceptan las dos formas:
// renderizar el objeto tal cual tumbaba TODO el Command Center.
function normalizarLogro(logro: unknown): {
  titulo: string;
  detalle?: string;
  estratega?: string;
} {
  if (typeof logro === "string") return { titulo: logro };
  if (logro && typeof logro === "object") {
    const o = logro as Record<string, unknown>;
    const txt = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    const titulo = txt(o.cliente) ?? txt(o.titulo) ?? txt(o.texto) ?? "—";
    return { titulo, detalle: txt(o.dato), estratega: txt(o.estratega) };
  }
  return { titulo: String(logro ?? "—") };
}

export default async function CommandCenterPage() {
  const levelUp = AGENCIAS.find((a) => a.id === "level-up");
  const [
    dataLevelUp,
    eventos,
    fuentes,
    opsLevelUpFile,
    opsBorinquenFile,
    debriefReal,
    agendaReal,
    igShadow,
    entregasSnap,
    tareasSnap,
    pipelineRes,
    onboardingsSnap,
    zoomIntel,
    slackBorinquen,
    ventasEAlive,
    prioridadesSnap,
    emailsSnap,
    granolaSnap,
    slackLevelUp,
    negocioBori,
  ] = await Promise.all([
    levelUp ? armarDashboardAgencia(levelUp) : Promise.resolve(null),
    leerCalendario(),
    leerFuentes(),
    leerOps("level-up"),
    leerOps("ai-borinquen"),
    leerDebriefReal(),
    leerAgendaSnapshot(),
    leerInsightsIG(),
    leerEntregas(),
    leerTareas(),
    leerPipeline(),
    leerOnboardings(),
    leerZoomIntel(),
    leerSlackBorinquen(),
    leerVentasEAlive(),
    leerPrioridades(),
    leerEmails(),
    leerGranola(),
    leerSlackLevelUp(),
    leerNegocioBori(),
  ]);
  // Level Up en vivo (Slack API con token propio) si está conectado; si no, el snapshot del brief.
  const opsLevelUp = slackLevelUp.ops ?? opsLevelUpFile;
  // Borinquen en vivo (Slack API con token propio) si está conectado; si no, el snapshot/mock.
  const opsBorinquen = slackBorinquen.ops ?? opsBorinquenFile;
  const borinquenConectado =
    slackBorinquen.conectado || fuentes.slack["ai-borinquen"].conectado;
  const tareas = tareasSnap.tareas;
  const leads = pipelineRes.leads;
  // Onboardings: Slack Level Up (#office-3-onboarding) + Slack Borinquen
  // (#office-2-onboarding, en vivo) + los ganados de Pipedrive. Dedup por cliente.
  const onboardingsBase = [
    ...onboardingsSnap.onboardings,
    ...slackBorinquen.onboardings,
  ];
  const onboardings = [
    ...onboardingsBase,
    ...pipelineRes.onboardings.filter(
      (p) => !onboardingsBase.some((o) => o.cliente === p.cliente),
    ),
  ].sort((a, b) => b.ganadoEl.localeCompare(a.ganadoEl));

  const entregasNuevas = entregasSnap.entregas.filter(
    (e) => e.estado === "nuevo",
  );

  const debrief = debriefReal?.debrief ?? debriefMock;
  const frescuraDebrief = frescura(debriefReal?.actualizadoEl);

  const hoyIso = hoyISO();
  const agendaHoy = (agendaReal?.eventos ?? agenda).filter(
    (e) => e.fecha === hoyIso,
  );
  const proximosPosts = eventos
    .filter((e) => e.fecha >= hoyIso && e.estado !== "listo")
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .slice(0, 3);
  const piezasListas = eventos.filter((e) => e.estado === "listo").length;

  // IG de Shadow: usa el snapshot de Apify si existe; si no, el mock.
  const ultimoReel = igShadow?.posts.find((p) => p.tipo === "reel");
  const igViews =
    ultimoReel?.vistas ?? resumen.find((m) => m.key === "vistas")?.valor ?? 0;
  const seguidores =
    igShadow?.seguidores ??
    resumen.find((m) => m.key === "seguidores")?.valor ??
    0;

  const tareasCEO = tareas
    .filter((t) => t.requiereCEO && t.estado !== "hecha")
    .slice(0, 5);

  const pipelineAbierto = leads.filter((l) =>
    ETAPAS_ABIERTAS.includes(l.etapa),
  );
  const valorPipeline = pipelineAbierto.reduce(
    (acc, l) => acc + l.valorMensual,
    0,
  );
  const leadsAiBorinquen = leads.filter(
    (l) => l.unidad === "ai-borinquen" && ETAPAS_ABIERTAS.includes(l.etapa),
  ).length;

  return (
    <>
      <PageHeader
        titulo="Command Center"
        descripcion="Qué necesita tu atención hoy, en una sola pantalla."
      >
        <FreshnessBadge frescura={frescuraDebrief} fuente="Brief" />
        <Badge variant="outline" className="label-mono">
          {fmtFecha(debrief.fecha)}
        </Badge>
        <AutoRefresh segundos={60} />
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {/* 1. Hero del orquestador + operator debrief */}
        <OrchestratorCard agente={orquestador}>
          <Separator />
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="label-mono mb-2 text-muted-foreground">
                Operator debrief
              </h3>
              <p className="text-sm">{debrief.titular}</p>
              <ul className="mt-3 space-y-2">
                {debrief.atencion.map((crudo, i) => {
                  const item = normalizarAtencion(crudo);
                  return (
                    <li key={`${item.texto}-${i}`} className="flex items-start gap-2.5">
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: NIVEL_DOT[item.nivel] }}
                      />
                      <span className="min-w-0 flex-1">
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="text-sm underline-offset-4 hover:text-primary hover:underline"
                          >
                            {item.texto}
                          </Link>
                        ) : (
                          <span className="text-sm">{item.texto}</span>
                        )}
                        <Accionar item={[item.texto, item.detalle].filter(Boolean).join(" — ")} />
                        {item.detalle ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {item.detalle}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h3 className="label-mono mb-2 text-muted-foreground">
                Lo que cerraron los agentes
              </h3>
              <ul className="space-y-2">
                {debrief.logros.map((logro, i) => {
                  // El brief empezó a escribir logros como objeto
                  // {cliente, estratega, dato}; antes eran texto plano.
                  // Se aceptan ambos: renderizar el objeto crudo tumbaba /ceo.
                  const l = normalizarLogro(logro);
                  return (
                    <li
                      key={`${l.titulo}-${i}`}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--status-working)]" />
                      <span>
                        {l.titulo}
                        {l.detalle ? (
                          <span className="text-muted-foreground/70"> — {l.detalle}</span>
                        ) : null}
                        {l.estratega ? (
                          <span className="label-mono ml-1.5 text-muted-foreground/60">
                            {l.estratega}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </OrchestratorCard>

        {/* Notificación: clientes nuevos que empezaron (onboardings de Pipedrive) */}
        {onboardings.length > 0 ? (
          <section>
            <h2 className="label-mono mb-3 text-[var(--status-working)]">
              🎉 Nuevos clientes esta semana
            </h2>
            <div className="space-y-2">
              {onboardings.slice(0, 5).map((o) => (
                <Card
                  key={o.id}
                  className="border-[color-mix(in_oklch,var(--status-working)_35%,transparent)] bg-gradient-to-b from-card to-background/60"
                >
                  <CardContent className="p-4">
                    <p className="text-sm">
                      <span className="font-semibold">{o.cliente}</span>
                      {o.negocio ? ` (${o.negocio})` : ""} empezó a trabajar con
                      nosotros en{" "}
                      <span className="font-medium">
                        {unidadInfo(o.unidad).nombre}
                      </span>
                      {o.dueno ? ` — onboarding con ${o.dueno}` : ""}.
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Acuerdo:{" "}
                        <span className="font-mono text-foreground">
                          {formatUSD(o.valorMensual)}
                        </span>
                        {o.acuerdo ? ` · ${o.acuerdo}` : ""}
                      </span>
                      {o.objetivo ? <span>Objetivo: {o.objetivo}</span> : null}
                      {o.resumen ? <span>· {o.resumen}</span> : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {/* 2. Unidades de negocio */}
        <section>
          <h2 className="label-mono mb-3 text-muted-foreground">
            Unidades de negocio
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Level Up Media — data real de Google Sheets */}
            <Card className="bg-gradient-to-b from-card to-background/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {UNIDADES["level-up"].nombre}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="label-mono border-[color-mix(in_oklch,var(--status-working)_40%,transparent)] text-[var(--status-working)]"
                  >
                    Live · Google Sheets
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {dataLevelUp && !dataLevelUp.error ? (
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="label-mono text-muted-foreground">
                        Cash collected {ventasEAlive?.ytd?.anio ?? 2026}
                      </dt>
                      <dd className="font-mono text-lg font-semibold">
                        {ventasEAlive?.ytd
                          ? formatUSD(ventasEAlive.ytd.levelUp)
                          : formatUSD(dataLevelUp.kpis.totalFacturado)}
                      </dd>
                    </div>
                    <div>
                      <dt className="label-mono text-muted-foreground">
                        Cash este mes
                      </dt>
                      <dd className="font-mono text-lg font-semibold">
                        {ventasEAlive?.meses?.at(-1)?.levelUp != null
                          ? formatUSD(ventasEAlive.meses.at(-1)!.levelUp!)
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="label-mono text-muted-foreground">
                        Clientes
                      </dt>
                      <dd className="font-mono text-lg font-semibold">
                        {dataLevelUp.kpis.clientesUnicos}
                      </dd>
                    </div>
                    <div>
                      <dt className="label-mono text-muted-foreground">
                        Ticket prom.
                      </dt>
                      <dd className="font-mono text-lg font-semibold">
                        {formatUSD(dataLevelUp.kpis.ticketPromedio)}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--status-waiting)]" />
                    <p>
                      No se pudo leer la hoja de ventas.{" "}
                      <Link href="/dashboard" className="text-primary">
                        Ver dashboard →
                      </Link>
                    </p>
                  </div>
                )}
                <Link
                  href="/dashboard"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                >
                  Dashboard completo <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>

            {/* AI Borinquen — standby */}
            <Card className="border-dashed bg-gradient-to-b from-card to-background/60 opacity-90">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {UNIDADES["ai-borinquen"].nombre}
                  </CardTitle>
                  <Badge variant="outline" className="label-mono">
                    <span className="mr-1 size-1.5 rounded-full bg-[var(--status-idle)]" />
                    Standby
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  La agencia está apagada en{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                    lib/agencias.ts
                  </code>
                  , pero ya está generando interés:
                </p>
                <div>
                  <div className="font-mono text-lg font-semibold">
                    {leadsAiBorinquen} leads
                  </div>
                  <p className="text-xs text-muted-foreground">
                    entrantes sin atender en el pipeline
                  </p>
                </div>
                <Link
                  href="/ceo/pipeline"
                  className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                >
                  Ver pipeline <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>

            {/* Shadow Operator — contenido */}
            <Card className="bg-gradient-to-b from-card to-background/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {UNIDADES["shadow-operator"].nombre}
                  </CardTitle>
                  <Badge variant="outline" className="label-mono">
                    Marca personal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-3 gap-3">
                  <div>
                    <dt className="label-mono text-muted-foreground">
                      IG Views
                    </dt>
                    <dd className="font-mono text-lg font-semibold">
                      {fmtCompacto(igViews)}
                    </dd>
                  </div>
                  <div>
                    <dt className="label-mono text-muted-foreground">
                      Seguidores
                    </dt>
                    <dd className="font-mono text-lg font-semibold">
                      {igShadow ? "" : "+"}
                      {fmtCompacto(seguidores)}
                    </dd>
                  </div>
                  <div>
                    <dt className="label-mono text-muted-foreground">
                      Listas
                    </dt>
                    <dd className="font-mono text-lg font-semibold">
                      {piezasListas}
                    </dd>
                  </div>
                </dl>
                <Link
                  href="/ceo/content"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                >
                  Resumen de contenido <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Mi día según Granola — la fuente que recoge el criterio del CEO */}
        <GranolaPanel snap={granolaSnap} />

        {/* Prioridades / decisiones estratégicas del CEO */}
        <PrioridadesPanel prioridades={prioridadesSnap.prioridades} />

        {/* Bandeja: lo importante de los correos (las 3 cuentas) */}
        <EmailsPanel snap={emailsSnap} />

        {/* 3. Pulso de clientes (Slack vía /brief-ceo) */}
        <PulseClientes
          unidades={[
            {
              unidad: "level-up",
              ops: opsLevelUp,
              conectado:
                slackLevelUp.conectado || fuentes.slack["level-up"].conectado,
            },
            {
              unidad: "ai-borinquen",
              ops: opsBorinquen,
              conectado: borinquenConectado,
            },
          ]}
        />

        {/* 4. Zoom Intelligence (en vivo) + portales externos */}
        <section>
          <h2 className="label-mono mb-3 text-muted-foreground">
            Llamadas y portales
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <ZoomIntelCard zoom={zoomIntel} />
            <EaMarketCard
              ventas={ventasEAlive}
              url={fuentes.portales["ea-market"]?.url ?? "#"}
            />
          </div>
        </section>

        {/* Bori — el SaaS propio: MRR, ventas del día y embudo en vivo. */}
        <section>
          <h2 className="label-mono mb-3 text-muted-foreground">Producto propio</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <BoriCard negocio={negocioBori} />
          </div>
        </section>

        {/* Entregas del equipo — lo que produjeron para revisar */}
        <Link href="/ceo/entregas" className="block">
          <Card className="glow border-primary/30 bg-gradient-to-b from-card to-background/60 transition-colors hover:border-primary/60">
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">
                  El equipo te dejó{" "}
                  <span className="text-primary">
                    {entregasNuevas.length} entregas
                  </span>{" "}
                  para revisar
                </h2>
                <p className="text-sm text-muted-foreground">
                  {entregasNuevas.length === 0
                    ? "Sin entregas nuevas — la fábrica produce cada semana."
                    : `Ideas, ganchos, guiones y carruseles listos por marca.`}
                </p>
              </div>
              <span className="label-mono inline-flex items-center gap-1 text-primary">
                Revisar entregas <ArrowRight className="size-3.5" />
              </span>
            </CardContent>
          </Card>
        </Link>

        {/* 5. Widgets */}
        <section className="grid gap-4 lg:grid-cols-2">
          {/* Agentes */}
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Agentes</CardTitle>
                <Link
                  href="/ceo/agents"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Ver red completa →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {agentesEjecutivos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <a.icon className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">{a.nombre}</span>
                      <span className="label-mono text-muted-foreground">
                        {a.subtitulo}
                      </span>
                    </div>
                    {a.tareaActual ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {a.tareaActual}
                      </p>
                    ) : null}
                  </div>
                  <AgentStatusBadge estado={a.estado} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tareas que requieren al CEO */}
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Esperan tu decisión</CardTitle>
                <Link
                  href="/ceo/tasks"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Todas las tareas →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {tareasCEO.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nada esperando tu firma. Respirá.
                </p>
              ) : (
                tareasCEO.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-md border border-border bg-background/50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{t.titulo}</p>
                      <Badge
                        variant={t.prioridad === "alta" ? "default" : "outline"}
                        className="label-mono shrink-0"
                      >
                        {t.prioridad}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {unidadInfo(t.unidad).nombre}
                      {t.vence ? ` · vence ${fmtFecha(t.vence)}` : ""}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Pipeline snapshot */}
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Lead pipeline</CardTitle>
                <Link
                  href="/ceo/pipeline"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Ver board →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono text-lg font-semibold text-foreground">
                  {formatUSD(valorPipeline)}
                </span>{" "}
                /mes en {pipelineAbierto.length} leads abiertos
              </p>
              <div className="mt-3 space-y-2">
                {ETAPAS_ABIERTAS.map((etapa) => {
                  const deEtapa = pipelineAbierto.filter(
                    (l) => l.etapa === etapa,
                  );
                  const valor = deEtapa.reduce(
                    (acc, l) => acc + l.valorMensual,
                    0,
                  );
                  const pct = valorPipeline
                    ? Math.round((valor / valorPipeline) * 100)
                    : 0;
                  return (
                    <div key={etapa}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="label-mono text-muted-foreground">
                          {etapa} · {deEtapa.length}
                        </span>
                        <span className="font-mono">{formatUSD(valor)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Hoy */}
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Hoy</CardTitle>
                <Link
                  href="/ceo/schedule"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Agenda completa →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {agendaHoy.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin eventos agendados para hoy.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {agendaHoy.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 text-sm">
                      <span className="label-mono w-12 shrink-0 text-primary">
                        {e.hora}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {e.titulo}
                      </span>
                      <span className="label-mono shrink-0 text-muted-foreground">
                        {unidadInfo(e.unidad).abrev}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {proximosPosts.length > 0 ? (
                <>
                  <Separator />
                  <div>
                    <h4 className="label-mono mb-1.5 text-muted-foreground">
                      Próximos posts
                    </h4>
                    <ul className="space-y-1.5">
                      {proximosPosts.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center gap-3 text-sm"
                        >
                          <span className="label-mono w-12 shrink-0 text-muted-foreground">
                            {fmtFecha(p.fecha)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {p.titulo}
                          </span>
                          <Badge variant="outline" className="label-mono">
                            {p.estado}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
