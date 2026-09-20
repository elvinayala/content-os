import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { marked } from "marked";

import { leerEntidad } from "@/lib/memoria";
import { listarNotas, resolverWikilinks } from "@/lib/vault";
import { fmtFecha } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// Vista de una ENTIDAD de la memoria compuesta: su nota acumulada (si existe) +
// TODO lo que la menciona en reuniones, llamadas y chats, con fecha y fuente.
export default async function EntidadPage({
  params,
}: {
  params: Promise<{ entidad: string }>;
}) {
  const { entidad } = await params;
  const nombre = decodeURIComponent(entidad);
  const [vista, todas] = await Promise.all([leerEntidad(nombre), listarNotas()]);

  const resumenHtml = vista.notaPropia
    ? await marked.parse(
        resolverWikilinks(
          vista.notaPropia.cuerpo,
          todas.map((n) => n.slug),
        ),
      )
    : null;

  return (
    <>
      <PageHeader
        titulo={vista.nombre}
        descripcion={`Memoria compuesta · ${vista.menciones.length} menciones en el vault`}
      >
        <Badge variant="outline" className="label-mono">
          entidad
        </Badge>
      </PageHeader>

      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <Link
          href="/ceo/vault"
          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Volver al vault
        </Link>

        {/* Resumen acumulado (nota propia de la entidad, si existe) */}
        {resumenHtml ? (
          <Card className="max-w-3xl bg-gradient-to-b from-card to-background/60">
            <CardContent className="p-6">
              <article
                className="prose prose-invert prose-sm max-w-none prose-headings:tracking-tight prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: resumenHtml }}
              />
            </CardContent>
          </Card>
        ) : (
          <p className="max-w-3xl text-sm text-muted-foreground">
            Todavía no hay una nota propia de <strong>{vista.nombre}</strong> (se crea
            con <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">/sync-memoria</code>).
            Abajo, todo lo que el sistema ya recuerda sobre esta entidad.
          </p>
        )}

        {/* Todo lo que la menciona */}
        <div className="max-w-3xl space-y-2">
          <h2 className="label-mono text-muted-foreground">
            Menciones ({vista.menciones.length})
          </h2>
          {vista.menciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin menciones todavía.</p>
          ) : (
            vista.menciones.slice(0, 40).map((m) => (
              <Link key={m.slug} href={`/ceo/vault/${m.slug}`}>
                <Card className="bg-gradient-to-b from-card to-background/60 transition-colors hover:border-primary/40">
                  <CardContent className="p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{m.titulo}</span>
                      {m.fecha ? (
                        <span className="label-mono text-muted-foreground">
                          {fmtFecha(m.fecha)}
                        </span>
                      ) : null}
                      {m.fuente ? (
                        <Badge variant="secondary" className="text-xs">
                          {m.fuente}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">…{m.snippet}…</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </>
  );
}
