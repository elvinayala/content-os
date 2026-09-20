import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { marked } from "marked";

import { fmtFechaLarga } from "@/lib/format";
import { leerNota, listarNotas, resolverWikilinks } from "@/lib/vault";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NotaVaultPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugStr = slug.map(decodeURIComponent).join("/");
  const [nota, todas] = await Promise.all([leerNota(slugStr), listarNotas()]);
  if (!nota) notFound();

  const html = await marked.parse(
    resolverWikilinks(
      nota.cuerpo,
      todas.map((n) => n.slug),
    ),
  );

  return (
    <>
      <PageHeader titulo={nota.titulo} descripcion={`vault/${nota.slug}.md`}>
        {nota.fuente ? (
          <Badge variant="outline" className="label-mono">
            {nota.fuente}
          </Badge>
        ) : null}
      </PageHeader>

      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <Link
          href="/ceo/vault"
          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Volver al vault
        </Link>

        <Card className="max-w-3xl bg-gradient-to-b from-card to-background/60">
          <CardContent className="p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {nota.fecha ? (
                <span className="label-mono text-muted-foreground">
                  {fmtFechaLarga(nota.fecha)}
                </span>
              ) : null}
              {nota.unidad ? (
                <Badge variant="outline" className="label-mono">
                  {nota.unidad}
                </Badge>
              ) : null}
              {nota.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
            <article
              className="prose prose-invert prose-sm max-w-none prose-headings:tracking-tight prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
