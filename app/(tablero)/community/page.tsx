import { PageHeader } from "@/components/page-header";
import { CommunityComposer } from "@/components/sections/community-composer";
import { PlatformBadge } from "@/components/platform-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { publicaciones } from "@/lib/mock/community";
import { fmtFecha } from "@/lib/format";

export const metadata = { title: "Community Manager · @tenfoldmarc" };

const estadoVariant = {
  borrador: "secondary",
  programado: "default",
  publicado: "outline",
} as const;

export default function CommunityPage() {
  return (
    <>
      <PageHeader
        titulo="Community Manager"
        descripcion="Publicá en varias plataformas con un clic y con descripciones que se escriben solas."
      />
      <main className="flex-1 p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <CommunityComposer />
          </div>

          {/* Cola de publicaciones */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Cola de publicaciones
            </h2>
            {publicaciones.map((pub) => (
              <Card key={pub.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{pub.titulo}</CardTitle>
                    <Badge variant={estadoVariant[pub.estado]}>
                      {pub.estado}
                    </Badge>
                  </div>
                  <CardDescription>{fmtFecha(pub.fecha)}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {pub.plataformas
                    .filter((p) => p.activa)
                    .map((p) => (
                      <PlatformBadge key={p.plataforma} plataforma={p.plataforma} />
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
