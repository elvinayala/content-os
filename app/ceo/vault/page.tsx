import Link from "next/link";
import { Lightbulb, Network, ShieldQuestion, Sparkles, Target } from "lucide-react";

import { listarNotas } from "@/lib/vault";
import {
  entidadesMasConectadas,
  leerSintesis,
  type TipoSintesis,
} from "@/lib/memoria";
import { fmtFecha } from "@/lib/format";
import { vault } from "@/lib/mock/ceo";
import { PageHeader } from "@/components/page-header";
import { VaultGrid } from "@/components/ceo/vault-grid";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Knowledge Vault · CEO Command Center" };
// El vault crece con /sync-vault y los encargos — leer fresco.
export const dynamic = "force-dynamic";

const CARPETAS: { key: string; label: string }[] = [
  { key: "mentorias", label: "Baúl de mentorías" },
  { key: "estilo", label: "Estilo de marca" },
  { key: "reuniones", label: "Reuniones" },
  { key: "slack", label: "Slack" },
  { key: "ideas", label: "Ideas" },
  { key: "decisiones", label: "Decisiones" },
];

const SINTESIS_ICONO: Record<TipoSintesis, typeof Target> = {
  "angulos-ganadores": Target,
  "objeciones-reales": ShieldQuestion,
  "ideas-de-data": Lightbulb,
  "decisiones-negocio": Sparkles,
};

export default async function VaultPage() {
  const [notas, sintesis, entidades] = await Promise.all([
    listarNotas(),
    leerSintesis(),
    entidadesMasConectadas(18),
  ]);

  return (
    <>
      <PageHeader
        titulo="Knowledge Vault"
        descripcion="La memoria compuesta del sistema: cada reunión, llamada y chat conectados — destilados en ángulos, objeciones e ideas con data."
      >
        <Badge variant="outline" className="label-mono">
          {notas.length} notas
        </Badge>
      </PageHeader>

      <main className="flex-1 space-y-8 p-4 sm:p-6">
        {/* Memoria compuesta: síntesis destilada + entidades más conectadas */}
        <section className="space-y-4">
          <h2 className="label-mono flex items-center gap-2 text-primary">
            <Network className="size-4" /> Memoria compuesta
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {sintesis.map((s) => {
              const Icon = SINTESIS_ICONO[s.tipo];
              return (
                <Link key={s.tipo} href={`/ceo/vault/estilo/${s.tipo}`}>
                  <Card
                    className={
                      "h-full bg-gradient-to-b from-card to-background/60 transition-colors hover:border-primary/40" +
                      (s.cuerpo ? "" : " opacity-60")
                    }
                  >
                    <CardHeader className="pb-1">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Icon className="size-4 text-primary" />
                        {s.titulo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">{s.que}</p>
                      <span className="label-mono mt-2 block text-muted-foreground">
                        {s.cuerpo
                          ? s.fecha
                            ? `destilado · ${fmtFecha(s.fecha)}`
                            : "destilado"
                          : "pendiente de destilar"}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {entidades.length > 0 ? (
            <div>
              <h3 className="label-mono mb-2 text-muted-foreground">
                Entidades más conectadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {entidades.map((e) => (
                  <Link
                    key={e.nombre}
                    href={`/ceo/memoria/${encodeURIComponent(e.nombre)}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {e.nombre}
                    <span className="label-mono text-muted-foreground">
                      {e.menciones}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* Notas reales del vault/ */}
        <section className="space-y-6">
          {CARPETAS.map(({ key, label }) => {
            const deCarpeta = notas.filter((n) => n.carpeta === key);
            if (deCarpeta.length === 0) return null;
            return (
              <div key={key}>
                <h2 className="label-mono mb-3 text-muted-foreground">
                  {label} · {deCarpeta.length}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {deCarpeta.map((n) => (
                    <Link key={n.slug} href={`/ceo/vault/${n.slug}`}>
                      <Card className="h-full bg-gradient-to-b from-card to-background/60 transition-colors hover:border-primary/40">
                        <CardHeader className="pb-1">
                          <CardTitle className="text-sm leading-snug">
                            {n.titulo}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {n.fecha ? (
                              <span className="label-mono text-muted-foreground">
                                {fmtFecha(n.fecha)}
                              </span>
                            ) : null}
                            {n.tags.slice(0, 3).map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="text-xs"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          {notas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              El vault está vacío — corré{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                /sync-vault
              </code>{" "}
              para traer tus reuniones y el día de Slack.
            </p>
          ) : null}
        </section>

        {/* Biblioteca mock (PASO 01) hasta migrarla a notas */}
        <section>
          <h2 className="label-mono mb-3 text-muted-foreground">
            Biblioteca (seed)
          </h2>
          <VaultGrid items={vault} />
        </section>
      </main>
    </>
  );
}
