import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { CalendarMonth } from "@/components/sections/calendar-month";
import { Badge } from "@/components/ui/badge";
import { leerCalendario } from "@/lib/calendario";

export const metadata = { title: "Calendario de Contenido · @tenfoldmarc" };
// Se lee el JSON en cada request para reflejar lo que agrega /guion.
export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const eventos = await leerCalendario();

  return (
    <>
      <PageHeader
        titulo="Calendario de Contenido"
        descripcion="Vista mensual de todo lo programado. Tocá un día para ver el guion completo."
      >
        <Badge variant="outline">{eventos.length} programadas</Badge>
      </PageHeader>
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            Corré{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
              /guion
            </code>{" "}
            en Claude Code con tu guión y las publicaciones (fecha, hora,
            plataforma y gancho) aparecen acá automáticamente.
          </p>
        </div>

        {eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay publicaciones. Usá <code>/guion</code> para empezar.
          </p>
        ) : (
          <CalendarMonth eventos={eventos} />
        )}
      </main>
    </>
  );
}
