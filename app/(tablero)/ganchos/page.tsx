import { PageHeader } from "@/components/page-header";
import { GanchosExplorer } from "@/components/sections/ganchos-explorer";
import { Badge } from "@/components/ui/badge";
import { leerGanchos } from "@/lib/ganchos";

export const metadata = { title: "Baúl de Ganchos · @tenfoldmarc" };
// El worker (transcribir-perfil) agrega ganchos a data/ganchos.json.
export const dynamic = "force-dynamic";

export default async function GanchosPage() {
  const ganchos = await leerGanchos();
  const nichos = [...new Set(ganchos.map((g) => g.nicho))].sort();
  const tiposGancho = [...new Set(ganchos.map((g) => g.tipo))].sort();

  return (
    <>
      <PageHeader
        titulo="Baúl de Ganchos"
        descripcion="Cada gancho que guardás, transcripto y convertido en plantilla lista para reusar."
      >
        <Badge variant="outline">{ganchos.length} ganchos</Badge>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6">
        <GanchosExplorer ganchos={ganchos} nichos={nichos} tipos={tiposGancho} />
      </main>
    </>
  );
}
