import { MessageSquareText } from "lucide-react";

import { PedirChat } from "@/components/pedir-chat";

export const metadata = { title: "Pedir contenido · Equipo" };
export const dynamic = "force-dynamic";

// Portal del equipo de contenido: Valentina, Juan Diego y creadores le hablan a
// Sofi para pedir contenido. Acceso scopeado (CONTENIDO_PORTAL_PASSWORD).
export default function PedirPage() {
  return (
    <div className="ceo flex h-svh w-full flex-col bg-background text-foreground">
      <header className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <MessageSquareText className="size-4" />
        </div>
        <div className="leading-tight">
          <h1 className="font-semibold">Equipo de contenido · Sofi</h1>
          <p className="label-mono text-muted-foreground">
            Head de Contenido · dirige el Estudio UGC — pedí y Sofi lo produce con el equipo
          </p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-4">
        <PedirChat />
      </main>
    </div>
  );
}
