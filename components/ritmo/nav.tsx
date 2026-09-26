"use client";

import { Briefcase, IdCard, Inbox, LogOut, Settings2, ShieldCheck, Timer, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { salirDeRitmoAction } from "@/app/ritmo/actions";
import { cn } from "@/lib/utils";

import { RitmoLogo } from "./logo";
import { RelojPR } from "./reloj";

// Arriba: marca + pestañas (escritorio). Abajo: barra de pestañas fija (teléfono).
export function NavRitmo({ nombre, equipo, ajustes, miFicha, pendientes, vacantesNuevas = 0 }: { nombre: string; equipo: boolean; ajustes: boolean; miFicha: string | null; pendientes: number; vacantesNuevas?: number }) {
  const path = usePathname();
  const tabs = [
    { href: "/ritmo", nombre: "Hoy", icono: Timer, activo: path === "/ritmo" },
    ...(equipo ? [{ href: "/ritmo/equipo", nombre: "Equipo", icono: Users, activo: path.startsWith("/ritmo/equipo") }] : []),
    ...(equipo ? [{ href: "/ritmo/personas", nombre: "Personas", icono: UsersRound, activo: path.startsWith("/ritmo/personas") }] : []),
    ...(!equipo && miFicha ? [{ href: `/ritmo/personas/${miFicha}`, nombre: "Mi ficha", icono: IdCard, activo: path.startsWith("/ritmo/personas") }] : []),
    { href: "/ritmo/solicitudes", nombre: "Solicitudes", icono: Inbox, activo: path.startsWith("/ritmo/solicitudes"), badge: pendientes },
    // Vacantes internas y referidos. En el teléfono de la maestra no cabe (5 pestañas): queda en escritorio.
    { href: "/ritmo/carreras", nombre: "Carreras", icono: Briefcase, activo: path.startsWith("/ritmo/carreras"), nuevo: vacantesNuevas > 0, soloEscritorio: equipo },
    ...(ajustes ? [{ href: "/ritmo/ajustes", nombre: "Ajustes", icono: Settings2, activo: path.startsWith("/ritmo/ajustes") }] : []),
    // En el teléfono la maestra ya tiene 5 pestañas: el canal ético queda en Solicitudes.
    { href: "/ritmo/etica", nombre: "Ético", icono: ShieldCheck, activo: path.startsWith("/ritmo/etica"), soloEscritorio: equipo },
  ] as { href: string; nombre: string; icono: typeof Timer; activo: boolean; badge?: number; nuevo?: boolean; soloEscritorio?: boolean }[];
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/60 backdrop-blur-xl backdrop-saturate-150" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link href="/ritmo" className="flex items-center gap-2">
            <RitmoLogo size={26} />
            <span className="text-[15px] font-semibold tracking-tight">Ritmo</span>
          </Link>
          {tabs.length > 1 ? (
            <nav className="ml-6 hidden items-center gap-1 md:flex">
              {tabs.map((t) => (
                <Link key={t.href} href={t.href} className={cn("relative rounded-full px-3.5 py-1.5 text-sm transition", t.activo ? "tab-activa bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}>
                  {t.nombre}
                  {t.badge ? <span className="ml-1.5 rounded-full bg-[color:var(--coral)] px-1.5 text-[10px] font-semibold text-background">{t.badge}</span> : null}
                  {t.nuevo && !t.activo ? <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--neon)]" title="Vacante nueva" /> : null}
                </Link>
              ))}
            </nav>
          ) : null}
          <span className="ml-auto" />
          <RelojPR />
          <span className="hidden truncate text-sm text-muted-foreground sm:block">{nombre}</span>
          <form action={salirDeRitmoAction}>
            <button type="submit" title="Cerrar sesión" className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
        <span className="linea-luz" aria-hidden />
      </header>
      {tabs.length > 1 ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur-xl md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <span className="linea-luz" style={{ top: -1, bottom: "auto" }} aria-hidden />
          <div className="mx-auto flex max-w-md">
            {tabs.filter((t) => !t.soloEscritorio).map((t) => (
              <Link key={t.href} href={t.href} className={cn("relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition", t.activo ? "text-primary [&_svg]:drop-shadow-[0_0_6px_var(--neon)]" : "text-muted-foreground")}>
                {t.badge ? <span className="absolute top-1.5 left-1/2 ml-2 rounded-full bg-[color:var(--coral)] px-1.5 text-[10px] font-semibold text-background">{t.badge}</span> : null}
                {t.nuevo && !t.activo ? <span className="absolute top-2 left-1/2 ml-2.5 size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--neon)]" /> : null}
                <t.icono className="size-5" />
                {t.nombre}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </>
  );
}
