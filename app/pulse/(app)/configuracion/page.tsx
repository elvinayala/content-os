import { redirect } from "next/navigation";

import { UsuariosAdmin } from "@/components/pulse/usuarios-admin";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usuarioActual } from "@/lib/pulse/auth";
import { listarUsuarios } from "@/lib/pulse/repo";
import { NOMBRE_APP } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";
export const metadata = { title: `Configuración · ${NOMBRE_APP}` };

export default async function ConfiguracionPage() {
  const u = await usuarioActual();
  if (!u || u.rol !== "admin") redirect("/pulse");
  const usuarios = await listarUsuarios();
  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold">Usuarios y configuración</h1>
      </header>
      <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
        <UsuariosAdmin usuarios={usuarios} yo={u} />
      </main>
    </>
  );
}
