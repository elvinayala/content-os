import { Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// A dónde cae quien entra a /portal/<slug> sin el link con token (o con la cookie vencida).
export default async function PortalAccesoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const wa = `https://wa.me/19393040491?text=${encodeURIComponent(`Hola, necesito el enlace de mi portal AutoFlow (${slug})`)}`;
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md items-center p-6">
      <Card className="w-full bg-gradient-to-b from-card to-background/40">
        <CardContent className="space-y-4 p-6 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Lock className="size-5" />
          </div>
          <h1 className="text-xl font-semibold">Este portal es privado</h1>
          <p className="text-sm text-muted-foreground">
            Entra con el enlace que te mandó tu asesor de AI Borinquen por WhatsApp. Si lo perdiste, pídelo otra vez y te llega
            en un minuto.
          </p>
          <a
            href={wa}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Pedir mi enlace por WhatsApp
          </a>
        </CardContent>
      </Card>
    </main>
  );
}
