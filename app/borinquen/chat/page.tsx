import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";

import { leerAsistentesChat } from "@/lib/chat/store";
import type { EstadoAgenteVoz } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Asistentes de Chat · AI Borinquen" };
export const dynamic = "force-dynamic";

const ESTADO: Record<EstadoAgenteVoz, { dot: string; label: string }> = {
  activo: { dot: "var(--status-working)", label: "Activo" },
  pausado: { dot: "var(--status-idle)", label: "Pausado" },
  borrador: { dot: "var(--muted-foreground)", label: "Borrador" },
};

export default async function ChatPage() {
  const asistentes = await leerAsistentesChat();

  return (
    <>
      <PageHeader
        titulo="Asistentes de Chat"
        descripcion="Agentes que responden WhatsApp, Instagram y web — entrenados con tu negocio."
      >
        <Button size="sm" asChild>
          <Link href="/borinquen/crear?tipo=chat">
            <Plus className="size-4" /> Crear asistente
          </Link>
        </Button>
      </PageHeader>

      <main className="flex-1 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {asistentes.map((a) => {
            const est = ESTADO[a.estado];
            return (
              <Link key={a.id} href={`/borinquen/chat/${a.id}`} className="block">
                <Card className="h-full bg-gradient-to-b from-card to-background/40 transition-colors hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
                        <MessageSquare className="size-5" />
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
                      {a.cliente ?? "AI Borinquen"} · {a.canales.join(", ")}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {a.proposito}
                    </p>
                    <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-3 text-xs">
                      <span className="font-mono">
                        {a.metricas?.chats ?? 0}{" "}
                        <span className="text-muted-foreground">chats</span>
                      </span>
                      <span className="font-mono">
                        {a.metricas?.resueltosPct != null
                          ? `${a.metricas.resueltosPct}%`
                          : "—"}{" "}
                        <span className="text-muted-foreground">resueltos</span>
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
