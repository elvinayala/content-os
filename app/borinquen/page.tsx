import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  MessageSquare,
  Plus,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";

import { leerAgentesVoz } from "@/lib/voz/store";
import { leerAsistentesChat } from "@/lib/chat/store";
import type { EstadoAgenteVoz } from "@/lib/types";
import { BoriChat } from "@/components/borinquen/bori-chat";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Inicio · AI Borinquen" };
export const dynamic = "force-dynamic";

const ESTADO: Record<EstadoAgenteVoz, string> = {
  activo: "var(--status-working)",
  pausado: "var(--status-idle)",
  borrador: "var(--muted-foreground)",
};

const PASOS = [
  { icon: Wand2, titulo: "Elegí el tipo", desc: "Voz o chat, según cómo te escriben tus clientes." },
  { icon: UploadCloud, titulo: "Entrenalo", desc: "Dale la info del negocio y pegá conversaciones reales." },
  { icon: Sparkles, titulo: "Publicá", desc: "Sale a atender 24/7 con tu tono y tus respuestas." },
];

export default async function InicioPage() {
  const [voz, chat] = await Promise.all([
    leerAgentesVoz(),
    leerAsistentesChat(),
  ]);

  const agentes = [
    ...voz.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      tipo: "voz" as const,
      estado: a.estado,
      cliente: a.cliente,
      href: `/borinquen/voz/${a.id}`,
      stat: `${a.metricas?.llamadas ?? 0} llamadas`,
    })),
    ...chat.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      tipo: "chat" as const,
      estado: a.estado,
      cliente: a.cliente,
      href: `/borinquen/chat/${a.id}`,
      stat: `${a.metricas?.chats ?? 0} chats`,
    })),
  ].sort((a, b) => (a.estado === "activo" ? -1 : 1) - (b.estado === "activo" ? -1 : 1));

  const activos = agentes.filter((a) => a.estado === "activo").length;
  const conversaciones =
    voz.reduce((s, a) => s + (a.metricas?.llamadas ?? 0), 0) +
    chat.reduce((s, a) => s + (a.metricas?.chats ?? 0), 0);
  const leads = chat.reduce((s, a) => s + (a.metricas?.leads ?? 0), 0);

  return (
    <>
      <PageHeader titulo="Inicio">
        <Badge variant="outline" className="label-mono">
          Datos demo
        </Badge>
        <Button size="sm" asChild>
          <Link href="/borinquen/crear">
            <Plus className="size-4" /> Crear agente
          </Link>
        </Button>
      </PageHeader>

      <main className="flex-1 p-4 sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8">
            {/* Hero */}
            <div>
              <p className="label-mono text-primary">AI Borinquen</p>
              <h1 className="mt-1 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Creá tu agente de IA en minutos
              </h1>
              <p className="mt-2 max-w-lg text-muted-foreground">
                Elegí voz o chat, dale la info de tu negocio y sale a atender a
                tus clientes con tu tono — sin bajar la calidad.
              </p>
            </div>

            {/* Dos caminos: Voz / Chat */}
            <div className="grid gap-4 sm:grid-cols-2">
              <CrearCard
                href="/borinquen/crear?tipo=voz"
                icon={<AudioLines className="size-6" />}
                titulo="Agente de Voz"
                desc="Atiende llamadas 24/7. Preset probado de baja latencia en español PR."
              />
              <CrearCard
                href="/borinquen/crear?tipo=chat"
                icon={<MessageSquare className="size-6" />}
                titulo="Asistente de Chat"
                desc="Responde WhatsApp, Instagram y web con las respuestas de tu negocio."
              />
            </div>

            {/* Cómo funciona */}
            <div>
              <h2 className="label-mono mb-3 text-muted-foreground">
                Cómo funciona
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {PASOS.map((p, i) => (
                  <Card key={p.titulo} className="bg-gradient-to-b from-card to-background/40">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-primary">
                        <p.icon className="size-4" />
                        <span className="label-mono">Paso {i + 1}</span>
                      </div>
                      <p className="mt-2 font-medium">{p.titulo}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {p.desc}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Stats compactos */}
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Agentes activos" valor={String(activos)} />
              <Stat label="Conversaciones" valor={conversaciones.toLocaleString("es-PR")} />
              <Stat label="Leads capturados" valor={String(leads)} />
            </div>

            {/* Tus agentes */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="label-mono text-muted-foreground">Tus agentes</h2>
                <span className="label-mono text-muted-foreground">
                  {agentes.length} en total
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {agentes.slice(0, 6).map((a) => (
                  <Link key={a.id} href={a.href} className="block">
                    <Card className="h-full bg-gradient-to-b from-card to-background/40 transition-colors hover:border-primary/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
                            {a.tipo === "voz" ? (
                              <AudioLines className="size-4" />
                            ) : (
                              <MessageSquare className="size-4" />
                            )}
                          </div>
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: ESTADO[a.estado] }}
                          />
                        </div>
                        <p className="mt-2 truncate text-sm font-medium">
                          {a.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.cliente ?? "AI Borinquen"} · {a.stat}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Rail: Bori copiloto */}
          <BoriChat />
        </div>
      </main>
    </>
  );
}

function CrearCard({
  href,
  icon,
  titulo,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  titulo: string;
  desc: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="glow h-full border-primary/25 bg-gradient-to-b from-card to-background/40 transition-colors hover:border-primary/60">
        <CardContent className="p-5">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
            {icon}
          </div>
          <h3 className="mt-3 text-lg font-semibold">{titulo}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
            Crear <ArrowRight className="size-3.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function Stat({ label, valor }: { label: string; valor: string }) {
  return (
    <Card className="bg-gradient-to-b from-card to-background/40">
      <CardContent className="p-4">
        <p className="label-mono text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl font-semibold">{valor}</p>
      </CardContent>
    </Card>
  );
}
