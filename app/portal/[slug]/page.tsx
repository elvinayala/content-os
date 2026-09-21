import { notFound } from "next/navigation";

import { PortalAutoFlow } from "@/components/borinquen/portal/portal-autoflow";
import { calcularMetricas, leerPortalPorSlug, listarLeads, listarLlamadas, listarSolicitudes } from "@/lib/portal/repo";

export const dynamic = "force-dynamic";

export default async function PortalClientePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const portal = await leerPortalPorSlug(slug);
  if (!portal || !portal.activo) notFound();
  const [leads, llamadas, solicitudes, metricas] = await Promise.all([
    listarLeads(portal.id, { incluirEjemplos: portal.modo === "demo" }),
    listarLlamadas(portal.id),
    listarSolicitudes(portal.id),
    calcularMetricas(portal.id),
  ]);
  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <PortalAutoFlow
        portal={portal}
        leads={leads}
        llamadas={llamadas}
        solicitudes={solicitudes}
        metricas={metricas}
        modo="cliente"
        urlPublica={null}
        vozReal={Boolean(portal.agentIdVoz && process.env.RETELL_API_KEY)}
      />
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Hecho por <b>AI Borinquen</b> · AutoFlow · WhatsApp +1 (939) 304-0491
      </p>
    </main>
  );
}
