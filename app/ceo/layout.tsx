import type { Metadata } from "next";

import { estadoRealAgentes } from "@/lib/agentes-estado";
import type { EstadoAgente } from "@/lib/types";
import { CeoSidebar } from "@/components/ceo/ceo-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "CEO Command Center",
  description:
    "Todo el ecosistema en una pantalla: agencias, agentes, leads y contenido.",
};

// La clase .ceo scopea el tema navy/neón a esta sección (app/globals.css);
// el resto del tablero conserva el terracota.
export default async function CeoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Estado real de cada agente (según fuentes conectadas) → dots de la sidebar.
  const real = await estadoRealAgentes();
  const estados: Record<string, EstadoAgente> = Object.fromEntries(
    Object.entries(real).map(([id, r]) => [id, r.estado]),
  );

  return (
    <div className="ceo w-full bg-background text-foreground">
      <SidebarProvider>
        <CeoSidebar estados={estados} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
}
