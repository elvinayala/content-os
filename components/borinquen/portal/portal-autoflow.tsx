import { AudioLines, MessageSquare, Phone } from "lucide-react";

import { Dato } from "@/components/borinquen/dato";
import { TranscriptoCard } from "@/components/borinquen/transcripto-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeadCliente, LlamadaPortal, MetricasPortal, PortalAutoFlow as Portal, SolicitudCambio } from "@/lib/portal/types";

import { BotonActualizarLlamadas, CopiarLink } from "./controles";
import { CrmKanban } from "./crm-kanban";
import { ProbarVoz } from "./probar-voz";
import { Solicitudes } from "./solicitudes";

// El Portal AutoFlow: lo que el closer abre en la llamada y el prospecto/cliente toca después.
// Mismo componente en /portal/<slug> (modo cliente, sin sidebar) y /borinquen/portales/<slug>
// (modo closer, con sidebar y controles). Regla: ningún número inventado — si no hay dato, "—".
export function PortalAutoFlow({
  portal,
  leads,
  llamadas,
  solicitudes,
  metricas,
  modo,
  urlPublica,
  vozReal,
}: {
  portal: Portal;
  leads: LeadCliente[];
  llamadas: LlamadaPortal[];
  solicitudes: SolicitudCambio[];
  metricas: MetricasPortal;
  modo: "cliente" | "closer";
  urlPublica: string | null;
  vozReal: boolean;
}) {
  const demo = portal.modo === "demo";
  const abiertas = solicitudes.filter((s) => s.estado !== "lista").length;
  const ms = (v: number | null) => (v == null ? "—" : v < 1000 ? `${v} ms` : `${(v / 1000).toFixed(1)} s`);

  return (
    <div className="space-y-6">
      {/* Cabecera del negocio */}
      <div className="overflow-hidden rounded-2xl border border-border/60">
        <div className="h-1.5 w-full" style={{ background: portal.color }} />
        <div className="flex flex-wrap items-start justify-between gap-3 bg-card/60 p-5">
          <div>
            <p className="label-mono text-muted-foreground">Portal AutoFlow · AI Borinquen</p>
            <h2 className="mt-1 text-2xl font-semibold leading-tight">{portal.negocio}</h2>
            <p className="text-sm text-muted-foreground">
              {portal.contacto ? `${portal.contacto} · ` : ""}
              {portal.asistente} atiende tu chat{vozReal ? " y tu teléfono" : ""}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={"label-mono " + (demo ? "" : "text-[var(--status-working)]")}>
              {demo ? "Demo · datos de ejemplo" : "Producción"}
            </Badge>
            {modo === "closer" && urlPublica ? <CopiarLink url={urlPublica} /> : null}
          </div>
        </div>
      </div>

      <Tabs defaultValue="agentes">
        <TabsList className="flex-wrap">
          <TabsTrigger value="agentes">Tus agentes</TabsTrigger>
          <TabsTrigger value="llamadas">Llamadas{llamadas.length ? ` (${llamadas.length})` : ""}</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="solicitudes">Solicitudes{abiertas ? ` (${abiertas})` : ""}</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
        </TabsList>

        {/* Tus agentes */}
        <TabsContent value="agentes" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-gradient-to-b from-card to-background/40">
              <CardContent className="space-y-3 p-5">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="size-2 rounded-full bg-[var(--status-working)]" />
                  <MessageSquare className="size-4 text-primary" /> {portal.asistente} · chat
                </h3>
                <p className="text-sm text-muted-foreground">
                  Responde WhatsApp, Instagram y web de {portal.negocio} las 24 horas: orienta, toma nombre y teléfono, y agenda. Si el
                  cliente pide una persona, te avisa.
                </p>
                {portal.urls.chat ? (
                  <Button asChild>
                    <a href={portal.urls.chat} target="_blank" rel="noreferrer">
                      Escríbele como cliente
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">El chat de prueba todavía no está publicado.</p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-b from-card to-background/40">
              <CardContent className="space-y-3 p-5">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className={"size-2 rounded-full " + (vozReal ? "bg-[var(--status-working)]" : "bg-muted-foreground/40")} />
                  <AudioLines className="size-4 text-primary" /> {portal.asistente} · voz
                </h3>
                <p className="text-sm text-muted-foreground">
                  Contesta el teléfono cuando nadie puede, con voz natural en español de Puerto Rico e inglés. Toma los datos y agenda.
                </p>
                {vozReal && portal.agentIdVoz ? (
                  <ProbarVoz slug={portal.slug} agentId={portal.agentIdVoz} asistente={portal.asistente} />
                ) : portal.urls.voz ? (
                  <Button asChild variant="outline">
                    <a href={portal.urls.voz} target="_blank" rel="noreferrer">
                      Hablar con {portal.asistente}
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">La voz de prueba todavía no está publicada.</p>
                )}
              </CardContent>
            </Card>
          </div>
          {portal.urls.propuesta || portal.urls.landing || portal.urls.deck ? (
            <div className="flex flex-wrap gap-2 text-sm">
              {portal.urls.propuesta ? (
                <Button asChild variant="ghost" size="sm">
                  <a href={portal.urls.propuesta} target="_blank" rel="noreferrer">
                    Ver tu propuesta →
                  </a>
                </Button>
              ) : null}
              {portal.urls.landing ? (
                <Button asChild variant="ghost" size="sm">
                  <a href={portal.urls.landing} target="_blank" rel="noreferrer">
                    Ver tu landing →
                  </a>
                </Button>
              ) : null}
              {portal.urls.deck ? (
                <Button asChild variant="ghost" size="sm">
                  <a href={portal.urls.deck} target="_blank" rel="noreferrer">
                    Descargar la presentación →
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </TabsContent>

        {/* Llamadas */}
        <TabsContent value="llamadas" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Cada llamada de prueba que hagas queda aquí con su transcripción y grabación. Son reales, no de ejemplo.
            </p>
            <BotonActualizarLlamadas slug={portal.slug} />
          </div>
          {llamadas.length === 0 ? (
            <Card className="bg-gradient-to-b from-card to-background/40">
              <CardContent className="flex items-start gap-3 p-6 text-sm text-muted-foreground">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  Todavía no hay llamadas. Ve a <b>Tus agentes</b>, llama a {portal.asistente}, y en uno o dos minutos ves aquí lo que
                  dijeron los dos.
                </span>
              </CardContent>
            </Card>
          ) : (
            llamadas.map((l) => (
              <TranscriptoCard
                key={l.id}
                t={{
                  id: l.id,
                  fecha: l.inicio ?? l.creadoEl,
                  duracionSeg: l.duracionSeg,
                  turnos: l.turnos,
                  resultado: l.resultado,
                  resumen: l.resumen,
                  grabacionUrl: l.grabacionUrl,
                  estado: l.estado,
                  sentimiento: l.sentimiento,
                }}
              />
            ))
          )}
        </TabsContent>

        {/* CRM del cliente */}
        <TabsContent value="crm" className="mt-4">
          <CrmKanban slug={portal.slug} leads={leads} mostrarEjemplos={demo} />
        </TabsContent>

        {/* Solicitudes */}
        <TabsContent value="solicitudes" className="mt-4">
          <Solicitudes slug={portal.slug} asistente={portal.asistente} solicitudes={solicitudes} modo={modo} />
        </TabsContent>

        {/* Métricas */}
        <TabsContent value="metricas" className="mt-4 space-y-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Dato label="Llamadas atendidas" valor={metricas.llamadasAtendidas == null ? "—" : String(metricas.llamadasAtendidas)} />
            <Dato label="Mensajes de chat" valor={metricas.mensajesChat == null ? "—" : String(metricas.mensajesChat)} />
            <Dato label="Leads capturados" valor={metricas.leadsCapturados == null ? "—" : String(metricas.leadsCapturados)} />
            <Dato label="Respuesta de voz (p50)" valor={ms(metricas.tiempoRespuestaMs)} capitalizar={false} />
          </div>
          <p className="text-xs text-muted-foreground">
            Cuenta solo lo real: tus llamadas y chats de prueba{demo ? ", no los datos de ejemplo" : ""}. Cuando el sistema esté
            instalado en {portal.negocio}, aquí ves el mes completo.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
