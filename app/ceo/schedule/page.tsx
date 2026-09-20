import { CalendarClock, Clapperboard, ExternalLink, Flag, Video } from "lucide-react";

import { UNIDADES } from "@/lib/ceo";
import { leerCalendario } from "@/lib/calendario";
import { fmtFechaLarga, hoyISO } from "@/lib/format";
import { frescura, leerAgendaSnapshot } from "@/lib/ops";
import { agenda } from "@/lib/mock/ceo";
import type { TipoEventoAgenda, UnidadNegocio } from "@/lib/types";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Schedule · CEO Command Center" };
// Mezcla la agenda real (data/agenda.json, la escribe /brief-ceo) con los
// posts de data/calendario.json como deadlines. Sin snapshot → mock.
export const dynamic = "force-dynamic";

const TIPO_ICON: Record<TipoEventoAgenda, typeof Flag> = {
  reunion: CalendarClock,
  grabacion: Video,
  deadline: Flag,
  foco: Clapperboard,
};

interface ItemAgenda {
  id: string;
  fecha: string;
  hora: string;
  titulo: string;
  tipo: TipoEventoAgenda;
  unidad: UnidadNegocio;
  duracionMin?: number;
  esPost?: boolean;
  link?: string;
  delAgente?: boolean;
}

export default async function SchedulePage() {
  const [eventos, snapshot] = await Promise.all([
    leerCalendario(),
    leerAgendaSnapshot(),
  ]);
  const f = frescura(snapshot?.actualizadoEl);
  const agendaBase: ItemAgenda[] = snapshot
    ? snapshot.eventos.map((e) => ({
        ...e,
        delAgente: e.origen === "agente",
      }))
    : agenda;
  const hoyIso = hoyISO();

  // Los posts del calendario de contenido aparecen como deadlines de Shadow Operator.
  const posts: ItemAgenda[] = eventos
    .filter((e) => e.fecha >= hoyIso)
    .map((e) => ({
      id: `cal-${e.id}`,
      fecha: e.fecha,
      hora: e.hora,
      titulo: `Post: ${e.titulo}`,
      tipo: "deadline",
      unidad: "shadow-operator",
      esPost: true,
    }));

  const todos: ItemAgenda[] = [...agendaBase, ...posts]
    .filter((e) => e.fecha >= hoyIso)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  const porDia = new Map<string, ItemAgenda[]>();
  for (const e of todos) {
    const lista = porDia.get(e.fecha) ?? [];
    lista.push(e);
    porDia.set(e.fecha, lista);
  }

  return (
    <>
      <PageHeader
        titulo="Schedule"
        descripcion="Reuniones, grabaciones, deadlines y bloques de foco de la semana."
      >
        <FreshnessBadge frescura={f} fuente="Google Calendar" />
        <Badge variant="outline" className="label-mono">
          {todos.length} eventos
        </Badge>
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {porDia.size === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nada agendado hacia adelante.
          </p>
        ) : (
          [...porDia.entries()].map(([fecha, items]) => (
            <section key={fecha}>
              <h2 className="label-mono mb-2 text-muted-foreground">
                {fecha === hoyIso ? "Hoy · " : ""}
                {fmtFechaLarga(fecha)}
              </h2>
              <Card className="bg-gradient-to-b from-card to-background/60">
                <CardContent className="divide-y divide-border p-0">
                  {items.map((e) => {
                    const Icon = TIPO_ICON[e.tipo];
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <span className="label-mono w-12 shrink-0 text-primary">
                          {e.hora}
                        </span>
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {e.titulo}
                          {e.delAgente ? (
                            <Badge className="label-mono ml-2">CEO-AGENT</Badge>
                          ) : null}
                        </span>
                        {e.link ? (
                          <a
                            href={e.link}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-primary hover:opacity-80"
                            title="Abrir en Google Calendar"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        ) : null}
                        {e.duracionMin ? (
                          <span className="label-mono shrink-0 text-muted-foreground">
                            {e.duracionMin} min
                          </span>
                        ) : null}
                        <Badge variant="outline" className="label-mono shrink-0">
                          {UNIDADES[e.unidad].abrev}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          ))
        )}
      </main>
    </>
  );
}
