import { redirect } from "next/navigation";

import { NavRitmo } from "@/components/ritmo/nav";
import { leerFicha } from "@/lib/desempeno/fichas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { pendientesDe } from "@/lib/desempeno/solicitudes";

export const dynamic = "force-dynamic";

export default async function RitmoAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const u = await usuarioRitmo();
  if (!u) redirect("/ritmo/entrar");
  // Vista maestra (Equipo, Personas, Ajustes): Elvin, Carilin, Aure y RR.HH. (Yaileen).
  const maestro = u.maestro;
  return (
    <>
      <NavRitmo nombre={u.nombre} equipo={maestro} ajustes={maestro} miFicha={(await leerFicha(u.id).catch(() => null)) ? u.id : null} pendientes={await pendientesDe(u).catch(() => 0)} />
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-32 sm:px-6 md:pb-16">{children}</main>
    </>
  );
}
