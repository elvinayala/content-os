import type { TipoAgente } from "@/lib/types";
import { CrearAgenteWizard } from "@/components/borinquen/crear-agente-wizard";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Crear agente · AI Borinquen" };

export default async function CrearPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const tipoInicial: TipoAgente | undefined =
    tipo === "voz" || tipo === "chat" ? tipo : undefined;

  return (
    <>
      <PageHeader
        titulo="Crear agente"
        descripcion="Elegí voz o chat, entrenalo con la info de tu negocio y sale a trabajar."
      />
      <main className="flex-1 p-4 sm:p-6">
        <CrearAgenteWizard tipoInicial={tipoInicial} />
      </main>
    </>
  );
}
