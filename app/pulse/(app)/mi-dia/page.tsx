import { MiDia } from "@/components/pulse/mi-dia";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usuarioActual } from "@/lib/pulse/auth";
import { pendientesDe } from "@/lib/pulse/mi-dia-datos";
import { boardsVisibles, listarUsuarios } from "@/lib/pulse/repo";
import { NOMBRE_APP } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";
export const metadata = { title: `Mi día · ${NOMBRE_APP}` };

export default async function MiDiaPage() {
  const u = await usuarioActual();
  if (!u) return null;
  const [visibles, usuarios] = await Promise.all([boardsVisibles(u), listarUsuarios()]);
  const { pendientes, hoy } = await pendientesDe([...visibles]);
  return (
    <div className="fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium">Mi día</span>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <MiDia pendientes={pendientes} hoy={hoy} yo={u} usuarios={usuarios} />
      </main>
    </div>
  );
}
