import { redirect } from "next/navigation";

import { BuscadorGlobal } from "@/components/pulse/buscador-global";
import { PulseSidebar } from "@/components/pulse/pulse-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { puedeFormularios } from "@/lib/formularios/reglas";
import { marcasConAcceso } from "@/lib/leads/repo";
import { esSoloRitmo, segundoPasoPendiente, tipoAcceso, usuarioActual } from "@/lib/pulse/auth";
import { listarBoards } from "@/lib/pulse/repo";
import { puedeGestionarUsuarios } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";

export default async function PulseAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/pulse/login");
  // Empleado de operaciones que solo usa Ritmo: Pulse (clientes, Leads, Tesorería) no es para él.
  if (usuario.rol === "miembro" && (await esSoloRitmo(usuario.id))) redirect("/ritmo");
  // Segundo candado (28/sep): todo el que ve tableros confirma con el código de su app.
  if (await segundoPasoPendiente(usuario)) redirect("/pulse/verificar");
  const soloLeads = (await tipoAcceso(usuario.id, usuario.rol)) === "solo_leads";
  const [boards, marcasLeads] = await Promise.all([listarBoards(usuario), marcasConAcceso(usuario)]);
  return (
    <SidebarProvider>
      <PulseSidebar boards={boards} usuario={usuario} soloLeads={soloLeads} tieneLeads={marcasLeads.length > 0} tieneFormularios={puedeFormularios(usuario, process.env.FORMULARIOS_ACCESO || undefined)} />
      <SidebarInset className="min-w-0 bg-background">{children}</SidebarInset>
      <BuscadorGlobal boards={boards.map((b) => ({ slug: b.slug, nombre: b.nombre, color: b.color }))} puedeConfigurar={puedeGestionarUsuarios(usuario.rol)} />
    </SidebarProvider>
  );
}
