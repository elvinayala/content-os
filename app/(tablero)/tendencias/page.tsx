import { PageHeader } from "@/components/page-header";
import { CompetenciaReels } from "@/components/sections/competencia-reels";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { leerTendenciasIA } from "@/lib/tendencias-ia";
import { frescura } from "@/lib/frescura";
import { fmtCompacto } from "@/lib/format";

export const metadata = { title: "Tendencias de IA · último momento" };
// Feed real desde las cuentas de noticias de IA (/sync-tendencias, Apify).
export const dynamic = "force-dynamic";

export default async function TendenciasPage() {
  const data = await leerTendenciasIA();
  const cuentas = [...(data?.cuentas ?? [])].sort(
    (a, b) => b.seguidores - a.seguidores,
  );
  // "Último momento": ordenado por fecha desc.
  const posts = [...(data?.reels ?? [])].sort((a, b) =>
    b.publicadoEl.localeCompare(a.publicadoEl),
  );
  const f = frescura(data?.actualizadoEl ?? null, 24 * 2);

  return (
    <>
      <PageHeader
        titulo="Tendencias de IA"
        descripcion="Último momento de IA, Claude y marketing — de las cuentas de noticias top."
      >
        <FreshnessBadge frescura={f} fuente="Instagram" />
      </PageHeader>
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {!data ? (
          <Card className="p-6 text-sm text-muted-foreground">
            Sin snapshot todavía. Corré{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              /sync-tendencias
            </code>{" "}
            para traer lo último de las cuentas de IA.
          </Card>
        ) : (
          <>
            {/* Cuentas monitoreadas */}
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                {cuentas.length} cuentas de IA monitoreadas
              </h2>
              <Card className="divide-y divide-border p-0">
                {cuentas.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-4 p-3 sm:px-4"
                  >
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                        {c.iniciales}
                      </AvatarFallback>
                    </Avatar>
                    <p className="flex-1 font-medium">{c.creador}</p>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {fmtCompacto(c.seguidores)} seguidores
                    </span>
                  </div>
                ))}
              </Card>
            </section>

            {/* Feed: último momento */}
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Último momento · lo más reciente que publicaron
              </h2>
              <CompetenciaReels reels={posts} />
            </section>
          </>
        )}
      </main>
    </>
  );
}
