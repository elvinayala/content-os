import Link from "next/link";
import { redirect } from "next/navigation";

import { NavRitmo } from "@/components/ritmo/nav";
import { vacantesNuevas } from "@/lib/desempeno/carreras";
import { fichaPendiente, leerFicha } from "@/lib/desempeno/fichas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { pendientesDe } from "@/lib/desempeno/solicitudes";

export const dynamic = "force-dynamic";

export default async function RitmoAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const u = await usuarioRitmo();
  if (!u) redirect("/ritmo/entrar");
  // Vista maestra (salarios, documentos, canal ético): segundo paso obligatorio.
  if (u.falta2fa) redirect("/ritmo/verificar");
  // Vista maestra (Equipo, Personas, Ajustes): Elvin, Carilin, Aure y RR.HH. (Yaileen).
  const maestro = u.maestro;
  // Todo empleado nuevo completa su ficha antes de usar Ritmo.
  const ficha = await leerFicha(u.id).catch(() => null);
  if (!maestro && fichaPendiente(ficha)) redirect("/ritmo/bienvenida");
  return (
    <>
      <NavRitmo nombre={u.nombre} equipo={maestro} ajustes={maestro} miFicha={ficha ? u.id : null} pendientes={await pendientesDe(u).catch(() => 0)} vacantesNuevas={await vacantesNuevas().catch(() => 0)} agentes={maestro && (u.rol === "admin" || u.rol === "editor")} />
      <main className="entrada mx-auto w-full max-w-5xl px-4 pt-6 pb-32 sm:px-6 md:pb-16">{children}</main>
      <footer className="estado-linea mx-auto hidden w-full max-w-5xl items-center gap-3 px-6 pb-8 md:flex">
        <span>Ritmo</span>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <span>{maestro ? "Vista maestra · verificación en dos pasos" : "Sesión protegida"}</span>
        <span>·</span>
        <span>Hora de Puerto Rico</span>
        <span>·</span>
        <Link href="/ritmo/ayuda" className="hover:text-foreground">Ayuda</Link>
      </footer>
    </>
  );
}
