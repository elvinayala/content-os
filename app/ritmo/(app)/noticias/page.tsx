import Link from "next/link";

import { Noticia, NuevaNoticia } from "@/components/ritmo/noticias";
import { listarNoticias, personasParaLogro } from "@/lib/desempeno/noticias";
import { CATEGORIAS_NOTICIA } from "@/lib/desempeno/noticias-tipos";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Noticias" };

// Lo nuevo de la empresa: logros del equipo, noticias, comunicados y causas benéficas. Breve a propósito.
export default async function NoticiasPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return null;
  const { c } = await searchParams;
  const [todas, personas] = await Promise.all([listarNoticias(100), u.maestro ? personasParaLogro() : Promise.resolve([])]);
  const lista = c ? todas.filter((n) => n.categoria === c) : todas;
  const chip = (activo: boolean) => cn("rounded-full px-3 py-1.5 transition", activo ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ceja">Lo nuevo</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Noticias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Logros del equipo, noticias, comunicados y causas que apoyamos.</p>
        </div>
        {u.maestro ? <NuevaNoticia personas={personas} /> : null}
      </div>

      <div className="flex w-fit flex-wrap gap-1 rounded-full border border-border bg-card/60 p-1 text-xs">
        <Link href="/ritmo/noticias" className={chip(!c)}>Todas</Link>
        {CATEGORIAS_NOTICIA.map((k) => (
          <Link key={k.id} href={`/ritmo/noticias?c=${k.id}`} className={chip(c === k.id)}>
            {k.emoji} {k.nombre}
          </Link>
        ))}
      </div>

      {lista.length ? (
        <div className="panel divide-y divide-border/60 overflow-hidden">
          {lista.map((n) => (
            <Noticia key={n.id} n={{ ...n, createdAt: n.createdAt.toISOString() }} maestro={u.maestro} />
          ))}
        </div>
      ) : (
        <div className="panel p-10 text-center text-sm text-muted-foreground">
          {u.maestro ? "Todavía no hay publicaciones. Usa “Publicar” para compartir la primera." : "Todavía no hay publicaciones. Aquí vas a ver lo nuevo de la empresa."}
        </div>
      )}
    </div>
  );
}
