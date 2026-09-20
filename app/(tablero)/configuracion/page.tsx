import { PageHeader } from "@/components/page-header";
import { ConfiguracionForm } from "@/components/sections/configuracion-form";
import { leerNegocio } from "@/lib/negocio";

export const metadata = { title: "Mi negocio · @tenfoldmarc" };
export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const negocio = await leerNegocio();

  return (
    <>
      <PageHeader
        titulo="Mi negocio"
        descripcion="Tu data, tus cuentas y las reglas que usa el equipo de agentes."
      />
      <main className="flex-1 p-4 sm:p-6">
        <ConfiguracionForm negocio={negocio} />
      </main>
    </>
  );
}
