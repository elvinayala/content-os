import { redirect } from "next/navigation";

import { NavRitmo } from "@/components/ritmo/nav";
import { usuarioActual } from "@/lib/pulse/auth";
import { puedeGestionarUsuarios } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";

export default async function RitmoAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const u = await usuarioActual();
  if (!u) redirect("/ritmo/entrar");
  // Vista maestra (Equipo + Ajustes): solo Elvin, Carilin y Aure (admin/editoras).
  const maestro = puedeGestionarUsuarios(u.rol);
  return (
    <>
      <NavRitmo nombre={u.nombre} equipo={maestro} ajustes={maestro} />
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-32 sm:px-6 md:pb-16">{children}</main>
    </>
  );
}
