import { PageHeader } from "@/components/page-header";
import { ReferentesAnalisis } from "@/components/sections/referentes-analisis";
import { FreshnessBadge } from "@/components/ceo/freshness-badge";
import { leerCompetencia } from "@/lib/competencia";
import { frescura } from "@/lib/frescura";

export const metadata = { title: "Rastreador de Competencia · referentes" };
// Los datos los escribe /sync-competencia (Apify) — leer fresco.
export const dynamic = "force-dynamic";

export default async function CompetenciaPage() {
  const data = await leerCompetencia();
  const f = frescura(
    data.fuente === "mock" ? null : `${data.actualizadoEl}`,
    24 * 8, // umbral 8 días (corre semanal)
  );

  return (
    <>
      <PageHeader
        titulo="Rastreador de Referentes"
        descripcion="Análisis de tus referentes de marketing, IA y contenido — últimos 60 días desde Instagram. Tocá un referente para ver sus reels, ángulos y formatos."
      >
        <FreshnessBadge frescura={f} fuente="Instagram" />
      </PageHeader>
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          {data.cuentas.length} referentes · ordenados por vistas promedio (60 días)
        </h2>
        <ReferentesAnalisis cuentas={data.cuentas} reels={data.reels} />
      </main>
    </>
  );
}
