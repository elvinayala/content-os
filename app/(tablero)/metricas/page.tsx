import { PageHeader } from "@/components/page-header";
import { MetricasMarca, type MarcaIG } from "@/components/sections/metricas-marca";
import { Badge } from "@/components/ui/badge";
import { leerInsightsIGMarca } from "@/lib/ops";
import type { UnidadNegocio } from "@/lib/types";

export const metadata = { title: "Métricas · Instagram por marca" };
// Los snapshots de IG los escribe el scraper de Apify (/sync-metricas) — leer fresco.
export const dynamic = "force-dynamic";

const MARCAS: { unidad: UnidadNegocio; nombre: string }[] = [
  { unidad: "ai-borinquen", nombre: "AI Borinquen" },
  { unidad: "level-up", nombre: "Level Up Media" },
  { unidad: "shadow-operator", nombre: "Shadow Operator" },
];

export default async function MetricasPage() {
  const marcas: MarcaIG[] = await Promise.all(
    MARCAS.map(async (m) => ({
      unidad: m.unidad,
      nombre: m.nombre,
      insights: await leerInsightsIGMarca(m.unidad),
    })),
  );
  const conectadas = marcas.filter((m) => m.insights).length;

  return (
    <>
      <PageHeader
        titulo="Métricas de Instagram"
        descripcion="Seguidores, vistas y engagement reales por marca — desde Instagram vía Apify."
      >
        <Badge variant="outline" className="label-mono">
          {conectadas}/{marcas.length} conectadas
        </Badge>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6">
        <MetricasMarca marcas={marcas} />
      </main>
    </>
  );
}
