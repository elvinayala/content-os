import { redirect } from "next/navigation";

import { BuscadorGlobal } from "@/components/pulse/buscador-global";
import { PulseSidebar } from "@/components/pulse/pulse-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { marcasConAcceso } from "@/lib/leads/repo";
import { esSoloRitmo, usuarioActual } from "@/lib/pulse/auth";
import { listarBoards } from "@/lib/pulse/repo";
import { puedeGestionarUsuarios } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";

export default async function PulseAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/pulse/login");
  // Empleado de operaciones que solo usa Ritmo: Pulse (clientes, Leads, Tesorería) no es para él.
  if (usuario.rol === "miembro" && (await esSoloRitmo(usuario.id))) redirect("/ritmo");
  const [boards, marcasLeads] = await Promise.all([listarBoards(usuario), marcasConAcceso(usuario)]);
  return (
    <SidebarProvider>
      <PulseSidebar boards={boards} usuario={usuario} tieneLeads={marcasLeads.length > 0} />
      <SidebarInset className="min-w-0 bg-background">{children}</SidebarInset>
      <BuscadorGlobal boards={boards.map((b) => ({ slug: b.slug, nombre: b.nombre, color: b.color }))} puedeConfigurar={puedeGestionarUsuarios(usuario.rol)} />
    </SidebarProvider>
  );
}
