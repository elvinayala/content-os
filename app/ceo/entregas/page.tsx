import { CheckCircle2, Clock } from "lucide-react";

import { leerEntregas, leerPlanProduccion } from "@/lib/entregas";
import { leerPedidos } from "@/lib/pedidos";
import type { TipoEntrega, UnidadNegocio } from "@/lib/types";
import { UNIDADES } from "@/lib/ceo";
import { EntregasInbox } from "@/components/ceo/entregas-inbox";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fmtFecha } from "@/lib/format";

export const metadata = { title: "Entregas · CEO Command Center" };
// La escribe /fabrica-contenido (semanal) — leer fresco.
export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<TipoEntrega, string> = {
  idea: "ideas",
  gancho: "ganchos",
  guion: "guiones",
  carrusel: "carruseles",
  historia: "historias",
  anuncio: "anuncios",
  arte: "artes",
  email: "emails",
};

export default async function EntregasPage() {
  const [{ entregas }, plan, pedidosSnap] = await Promise.all([
    leerEntregas(),
    leerPlanProduccion(),
    leerPedidos(),
  ]);
  const nuevas = entregas.filter((e) => e.estado === "nuevo").length;
  const pedidos = pedidosSnap.pedidos;
  const enCola = pedidos.filter((p) => p.estado === "en-cola").length;

  // Progreso del mes por marca vs. la cuota.
  const mesActual = new Date().toISOString().slice(0, 7);
  const marcas = Object.keys(plan) as UnidadNegocio[];

  return (
    <>
      <PageHeader
        titulo="Entregas del equipo"
        descripcion="Lo que los agentes te dejan para revisar: ideas, ganchos, guiones y carruseles por marca."
      >
        {nuevas > 0 ? (
          <Badge className="label-mono">{nuevas} nuevas</Badge>
        ) : null}
        <Badge variant="outline" className="label-mono">
          {entregas.length} total
        </Badge>
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Progreso del mes vs. cuota */}
        {marcas.length > 0 ? (
          <section className="grid gap-4 lg:grid-cols-3">
            {marcas.map((m) => {
              const cuota = plan[m] ?? {};
              const delMes = entregas.filter(
                (e) => e.marca === m && e.creadoEl.startsWith(mesActual),
              );
              return (
                <Card
                  key={m}
                  className="bg-gradient-to-b from-card to-background/60"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {UNIDADES[m].nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(Object.keys(cuota) as TipoEntrega[]).map((t) => {
                      const hechas = delMes.filter((e) => e.tipo === t).length;
                      const meta = cuota[t] ?? 0;
                      const pct = meta ? Math.min(100, (hechas / meta) * 100) : 0;
                      return (
                        <div key={t}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {TIPO_LABEL[t]}
                            </span>
                            <span className="font-mono tabular-nums">
                              {hechas}/{meta}
                            </span>
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
                  </CardContent>
                </Card>
              );
            })}
          </section>
        ) : null}

        {/* Mis pedidos: lo que Elvin pidió con el botón "Pedir contenido" y su estatus */}
        {pedidos.length > 0 ? (
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                Mis pedidos
                {enCola > 0 ? (
                  <Badge className="label-mono">{enCola} en cola</Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {pedidos.slice(0, 8).map((p) => (
                <div key={p.ts} className="flex items-start gap-2.5">
                  {p.estado === "listo" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--status-working)]" />
                  ) : (
                    <Clock className="mt-0.5 size-4 shrink-0 text-[var(--status-waiting)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{p.texto}</p>
                    <p className="label-mono mt-0.5 text-muted-foreground">
                      {p.estado === "listo"
                        ? (p.resultado ?? "✓ listo — en la bandeja")
                        : "en cola — el equipo lo produce en la próxima corrida (~30 min)"}
                      {" · "}
                      {fmtFecha(p.fecha)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <EntregasInbox entregas={entregas} />
      </main>
    </>
  );
}
