import { redirect } from "next/navigation";

import { ContratosAib } from "@/components/aib-contratos/panel";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { textoCostos } from "@/lib/aib-contratos/documento";
import { enlaceContrato } from "@/lib/aib-contratos/firmar";
import { listarContratos, puedeContratosAib } from "@/lib/aib-contratos/repo";
import { usuarioActual } from "@/lib/pulse/auth";
import { NOMBRE_APP } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";
export const metadata = { title: `Contratos AI Borinquen · ${NOMBRE_APP}` };

export default async function ContratosAibPage() {
  const u = await usuarioActual();
  if (!u || !(await puedeContratosAib(u))) redirect("/pulse");
  const lista = await listarContratos();
  return (
    <div className="fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium">Contratos · AI Borinquen</span>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <ContratosAib
          contratos={lista.map((c) => ({
            id: c.id,
            codigo: c.codigo,
            estado: c.estado,
            abierto: !!c.abierto,
            nombre: c.firmado?.datos.nombre ?? c.oferta.cliente.nombre,
            negocio: c.firmado?.datos.negocio || c.oferta.cliente.negocio,
            telefono: c.oferta.cliente.telefono,
            servicio: c.oferta.servicio,
            costos: textoCostos(c.oferta.costos),
            emitidoPor: c.emitido.por,
            emitidoEn: c.emitido.en,
            firmadoEn: c.firmado?.en ?? null,
            link: enlaceContrato(c),
            pdf: c.estado === "firmado" ? `/api/contrato/${c.token}/pdf` : null,
          }))}
        />
      </main>
    </div>
  );
}
