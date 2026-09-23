import { redirect } from "next/navigation";

import { EventosSeguridad } from "@/components/pulse/eventos-seguridad";
import { TablaPermisos } from "@/components/pulse/tabla-permisos";
import { UsuariosAdmin } from "@/components/pulse/usuarios-admin";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usuarioActual } from "@/lib/pulse/auth";
import { listarUsuarios } from "@/lib/pulse/repo";
import { leerEventos } from "@/lib/pulse/seguridad";
import { NOMBRE_APP, puedeGestionarUsuarios } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";
export const metadata = { title: `Configuración · ${NOMBRE_APP}` };

export default async function ConfiguracionPage() {
  const u = await usuarioActual();
  if (!u || !puedeGestionarUsuarios(u.rol)) redirect("/pulse");
  const [usuarios, eventos] = await Promise.all([listarUsuarios(), u.rol === "admin" ? leerEventos(60) : Promise.resolve([])]);
  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold">Usuarios y configuración</h1>
      </header>
      <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
        <UsuariosAdmin usuarios={usuarios} yo={u} />
        <TablaPermisos />
        {u.rol === "admin" ? <EventosSeguridad eventos={eventos} /> : null}
      </main>
    </>
  );
}
