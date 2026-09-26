import { redirect } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { marcasConAcceso } from "@/lib/leads/repo";
import { slugDeMarca } from "@/lib/leads/reglas";
import { usuarioActual } from "@/lib/pulse/auth";

export const dynamic = "force-dynamic";

// /pulse/leads → a la primera marca a la que la persona tiene acceso (Level Up primero).
export default async function LeadsInicio() {
  const u = await usuarioActual();
  if (!u) redirect("/pulse/login");
  const marcas = await marcasConAcceso(u);
  if (marcas.length) redirect(`/pulse/leads/${slugDeMarca(marcas[0])}`);
  return (
    <div className="min-h-svh">
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium">Leads</span>
      </header>
      <main className="mx-auto max-w-md px-6 py-16 text-center text-sm text-muted-foreground">Todavía no tienes acceso a Leads. Pídeselo a un admin de Pulse.</main>
    </div>
  );
}
