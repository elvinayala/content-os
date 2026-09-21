import { redirect } from "next/navigation";

import { PulseSidebar } from "@/components/pulse/pulse-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usuarioActual } from "@/lib/pulse/auth";
import { listarBoards } from "@/lib/pulse/repo";

export const dynamic = "force-dynamic";

export default async function PulseAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/pulse/login");
  const boards = await listarBoards(usuario);
  return (
    <SidebarProvider>
      <PulseSidebar boards={boards} usuario={usuario} />
      <SidebarInset className="min-w-0 bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}
