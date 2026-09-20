import type { Metadata } from "next";

import { BorinquenSidebar } from "@/components/borinquen/borinquen-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Bori · AI Borinquen",
  description:
    "La plataforma de agentes de AI Borinquen: voz, CRM, AutoFlow y asistente.",
};

// La clase .borinquen scopea el tema verde esmeralda a esta sección
// (app/globals.css); el resto del sitio conserva su tema.
export default function BorinquenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="borinquen w-full bg-background text-foreground">
      <SidebarProvider>
        <BorinquenSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
}
