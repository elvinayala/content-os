import { redirect } from "next/navigation";

import { ListaFormularios } from "@/components/formularios/lista";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { listarFormularios } from "@/lib/formularios/repo";
import { linkPublico, puedeFormularios } from "@/lib/formularios/reglas";
import { usuarioActual } from "@/lib/pulse/auth";
import { NOMBRE_APP } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";
export const metadata = { title: `Formularios · ${NOMBRE_APP}` };

export default async function FormulariosPage() {
  const u = await usuarioActual();
  if (!u || !puedeFormularios(u, process.env.FORMULARIOS_ACCESO || undefined)) redirect("/pulse");
  const forms = await listarFormularios();
  return (
    <div className="fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium">Formularios</span>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <ListaFormularios
          formularios={forms.map((f) => ({
            id: f.id,
            titulo: f.titulo,
            slug: f.slug,
            marca: f.marca,
            activo: f.activo,
            accion: f.accion,
            preguntas: f.config.preguntas.length,
            total: f.total,
            ultima: f.ultima?.toISOString() ?? null,
            link: linkPublico(f),
          }))}
        />
      </main>
    </div>
  );
}
