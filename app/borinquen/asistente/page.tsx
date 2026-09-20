import { Bot, MessageCircle, Send, TriangleAlert } from "lucide-react";

import { leerAsistentes } from "@/lib/asistente";
import type { EstadoAsistente } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Asistente · Bori" };
export const dynamic = "force-dynamic";

const ESTADO: Record<EstadoAsistente, { dot: string; label: string }> = {
  activo: { dot: "var(--status-working)", label: "Activo" },
  pausado: { dot: "var(--status-idle)", label: "Pausado" },
  borrador: { dot: "var(--muted-foreground)", label: "Borrador" },
};

export default async function AsistentePage() {
  const asistentes = await leerAsistentes();
  const telegramListo = !!process.env.TELEGRAM_BOT_TOKEN;

  return (
    <>
      <PageHeader
        titulo="Asistente personal"
        descripcion="El agente que controlás por Telegram/WhatsApp — ejecuta acciones."
      >
        <Badge
          variant="outline"
          className="label-mono"
        >
          {telegramListo ? "Telegram conectado" : "Telegram sin token"}
        </Badge>
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Asistentes configurados */}
        <div className="grid gap-4 lg:grid-cols-2">
          {asistentes.map((a) => {
            const est = ESTADO[a.estado];
            return (
              <Card
                key={a.id}
                className="bg-gradient-to-b from-card to-background/40"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
                        <Bot className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{a.cliente}</h3>
                        <p className="label-mono text-muted-foreground">
                          <Send className="mr-1 inline size-3" />
                          {a.canal}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="label-mono">
                      <span
                        className="mr-1 size-1.5 rounded-full"
                        style={{ backgroundColor: est.dot }}
                      />
                      {est.label}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {a.promptSistema}
                  </p>
                  <div className="mt-3">
                    <p className="label-mono mb-1.5 text-muted-foreground">
                      Acciones habilitadas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {a.tools.map((t) => (
                        <Badge key={t} variant="outline" className="font-mono text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cómo se conecta */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-gradient-to-b from-card to-background/40">
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 font-semibold">
                <Send className="size-4 text-primary" /> Telegram (recomendado)
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Gratis, sin aprobación, permite asistentes abiertos. Se crea el
                bot con @BotFather, se pone el token en{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  TELEGRAM_BOT_TOKEN
                </code>{" "}
                y el asistente reusa el tool-loop de Bori para ejecutar acciones.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[color-mix(in_oklch,var(--status-waiting)_30%,transparent)] bg-gradient-to-b from-card to-background/40">
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 font-semibold">
                <MessageCircle className="size-4" /> WhatsApp (add-on)
              </h3>
              <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--status-waiting)]" />
                Desde ene-2026 Meta no permite asistentes de IA de propósito
                general por la API oficial (sí casos estructurados tipo AutoFlow).
                La vía no-oficial responde solo a mensajes entrantes y tiene
                riesgo de baneo — se ofrece con disclaimer.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
