import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PanelPortal } from "@/components/borinquen/portal/closer-controles";
import { PortalAutoFlow } from "@/components/borinquen/portal/portal-autoflow";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { urlPortal } from "@/lib/portal/acceso";
import { calcularMetricas, leerPortalPorSlug, listarLeads, listarLlamadas, listarSolicitudes } from "@/lib/portal/repo";

export const dynamic = "force-dynamic";

// El mismo portal que ve el cliente, con los controles del closer arriba.
export default async function PortalCloserPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const portal = await leerPortalPorSlug(slug);
  if (!portal) notFound();
  const [leads, llamadas, solicitudes, metricas, url] = await Promise.all([
    listarLeads(portal.id, { incluirEjemplos: true }),
    listarLlamadas(portal.id),
    listarSolicitudes(portal.id),
    calcularMetricas(portal.id),
    urlPortal(portal.slug),
  ]);
  return (
    <>
      <PageHeader titulo={portal.negocio} descripcion="Lo que el prospecto ve en su portal. Ábrelo en la llamada y que él lo toque.">
        <Badge variant="outline" className="label-mono">
          {portal.slug}
        </Badge>
      </PageHeader>
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <Link href="/borinquen/portales" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Portales
        </Link>
        <PanelPortal portal={portal} />
        <PortalAutoFlow
          portal={portal}
          leads={leads}
          llamadas={llamadas}
          solicitudes={solicitudes}
          metricas={metricas}
          modo="closer"
          urlPublica={url}
          vozReal={Boolean(portal.agentIdVoz && process.env.RETELL_API_KEY)}
        />
      </main>
    </>
  );
}
