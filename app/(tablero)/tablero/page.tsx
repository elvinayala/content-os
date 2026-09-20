import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { navItems } from "@/lib/nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resumen } from "@/lib/mock/metricas";
import { fmtCompacto, fmtDelta, fmtPorcentaje } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <>
      <PageHeader
        titulo="Tablero de contenido"
        descripcion="Tu negocio de creador, en un solo tablero."
      />
      <main className="flex-1 space-y-8 p-4 sm:p-6">
        {/* Resumen rápido de métricas */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Esta semana
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {resumen.map((m) => (
              <Card key={m.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{m.label}</CardDescription>
                  <CardTitle className="text-2xl">
                    {m.formato === "porcentaje"
                      ? fmtPorcentaje(m.valor)
                      : fmtCompacto(m.valor)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      m.deltaPct >= 0 ? "text-primary" : "text-destructive",
                    )}
                  >
                    {fmtDelta(m.deltaPct)} vs. semana pasada
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Acceso a las 6 secciones */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Secciones
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <item.icon className="size-5" />
                    </div>
                    <CardTitle className="text-base">{item.titulo}</CardTitle>
                    <CardDescription>{item.descripcion}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
