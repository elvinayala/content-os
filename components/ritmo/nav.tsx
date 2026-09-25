"use client";

import { IdCard, Inbox, LogOut, Settings2, ShieldCheck, Timer, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { salirDeRitmoAction } from "@/app/ritmo/actions";
import { cn } from "@/lib/utils";

import { RitmoLogo } from "./logo";

// Arriba: marca + pestañas (escritorio). Abajo: barra de pestañas fija (teléfono).
export function NavRitmo({ nombre, equipo, ajustes, miFicha, pendientes }: { nombre: string; equipo: boolean; ajustes: boolean; miFicha: string | null; pendientes: number }) {
  const path = usePathname();
  const tabs = [
    { href: "/ritmo", nombre: "Hoy", icono: Timer, activo: path === "/ritmo" },
    ...(equipo ? [{ href: "/ritmo/equipo", nombre: "Equipo", icono: Users, activo: path.startsWith("/ritmo/equipo") }] : []),
    ...(equipo ? [{ href: "/ritmo/personas", nombre: "Personas", icono: UsersRound, activo: path.startsWith("/ritmo/personas") }] : []),
    ...(!equipo && miFicha ? [{ href: `/ritmo/personas/${miFicha}`, nombre: "Mi ficha", icono: IdCard, activo: path.startsWith("/ritmo/personas") }] : []),
    { href: "/ritmo/solicitudes", nombre: "Solicitudes", icono: Inbox, activo: path.startsWith("/ritmo/solicitudes"), badge: pendientes },
    ...(ajustes ? [{ href: "/ritmo/ajustes", nombre: "Ajustes", icono: Settings2, activo: path.startsWith("/ritmo/ajustes") }] : []),
    // En el teléfono la maestra ya tiene 5 pestañas: el canal ético queda en Solicitudes.
    { href: "/ritmo/etica", nombre: "Ético", icono: ShieldCheck, activo: path.startsWith("/ritmo/etica"), soloEscritorio: equipo },
  ] as { href: string; nombre: string; icono: typeof Timer; activo: boolean; badge?: number; soloEscritorio?: boolean }[];
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link href="/ritmo" className="flex items-center gap-2">
            <RitmoLogo size={26} />
            <span className="text-[15px] font-semibold tracking-tight">Ritmo</span>
          </Link>
          {tabs.length > 1 ? (
            <nav className="ml-6 hidden items-center gap-1 md:flex">
              {tabs.map((t) => (
                <Link key={t.href} href={t.href} className={cn("relative rounded-full px-3.5 py-1.5 text-sm transition", t.activo ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground")}>
                  {t.nombre}
                  {t.badge ? <span className="ml-1.5 rounded-full bg-[color:var(--coral)] px-1.5 text-[10px] font-semibold text-background">{t.badge}</span> : null}
                </Link>
              ))}
            </nav>
          ) : null}
          <span className="ml-auto hidden truncate text-sm text-muted-foreground sm:block">{nombre}</span>
          <form action={salirDeRitmoAction} className="ml-auto sm:ml-0">
            <button type="submit" title="Cerrar sesión" className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>
      {tabs.length > 1 ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur-xl md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="mx-auto flex max-w-md">
            {tabs.filter((t) => !t.soloEscritorio).map((t) => (
              <Link key={t.href} href={t.href} className={cn("relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition", t.activo ? "text-primary" : "text-muted-foreground")}>
                {t.badge ? <span className="absolute top-1.5 left-1/2 ml-2 rounded-full bg-[color:var(--coral)] px-1.5 text-[10px] font-semibold text-background">{t.badge}</span> : null}
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
