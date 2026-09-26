import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormularioPublico } from "@/components/formularios/formulario-publico";
import { formularioPorSlug } from "@/lib/formularios/repo";
import { temaDe } from "@/lib/formularios/reglas";
import { usuarioActual } from "@/lib/pulse/auth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await formularioPorSlug((await params).slug);
  if (!f) return { title: "Formulario" };
  const descripcion = f.config.bienvenida.texto?.slice(0, 160) ?? f.titulo;
  return { title: f.titulo, description: descripcion, robots: { index: false, follow: false }, openGraph: { title: f.titulo, description: descripcion, type: "website" } };
}

// Formulario público propio (/f/<slug>), el reemplazo de Typeform. `?vista=previa` = vista previa
// del editor (no guarda); `?origen=` o `?utm_source=` quedan en la respuesta.
export default async function FormularioPagina({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const f = await formularioPorSlug(slug);
  if (!f || f.archivado) notFound();
  const previa = sp.vista === "previa" && !!(await usuarioActual());
  const tema = temaDe(f.apariencia);
  if (!f.activo && !previa) {
    return (
      <main className="formulario lu-fondo flex min-h-svh items-center justify-center px-6 text-center" data-oscuro={tema.oscuro} style={{ "--f-fondo": tema.fondo, "--f-texto": tema.texto, "--f-sutil": tema.sutil, "--f-acento": tema.acento } as React.CSSProperties}>
        <div className="flex max-w-md flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {tema.logo ? <img src={tema.logo} alt="" className="h-14 w-auto" /> : null}
          <h1 className="font-[family-name:var(--font-sora)] text-3xl font-bold">Este formulario está cerrado</h1>
          <p className="f-sutil">Ya no está recibiendo respuestas. Si crees que es un error, escríbele a quien te mandó el link.</p>
        </div>
      </main>
    );
  }
  const origen = [sp.utm_source, sp.origen].find((x) => typeof x === "string") as string | undefined;
  return <FormularioPublico slug={f.slug} config={f.config} tema={tema} previa={previa} origen={origen} />;
}
