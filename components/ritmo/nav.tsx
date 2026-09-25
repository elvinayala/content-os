"use client";

import { IdCard, LogOut, Settings2, ShieldCheck, Timer, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { salirDeRitmoAction } from "@/app/ritmo/actions";
import { cn } from "@/lib/utils";

import { RitmoLogo } from "./logo";

// Arriba: marca + pestañas (escritorio). Abajo: barra de pestañas fija (teléfono).
export function NavRitmo({ nombre, equipo, ajustes, miFicha }: { nombre: string; equipo: boolean; ajustes: boolean; miFicha: string | null }) {
  const path = usePathname();
  const tabs = [
    { href: "/ritmo", nombre: "Hoy", icono: Timer, activo: path === "/ritmo" },
    ...(equipo ? [{ href: "/ritmo/equipo", nombre: "Equipo", icono: Users, activo: path.startsWith("/ritmo/equipo") }] : []),
    ...(equipo ? [{ href: "/ritmo/personas", nombre: "Personas", icono: UsersRound, activo: path.startsWith("/ritmo/personas") }] : []),
    ...(!equipo && miFicha ? [{ href: `/ritmo/personas/${miFicha}`, nombre: "Mi ficha", icono: IdCard, activo: path.startsWith("/ritmo/personas") }] : []),
    ...(ajustes ? [{ href: "/ritmo/ajustes", nombre: "Ajustes", icono: Settings2, activo: path.startsWith("/ritmo/ajustes") }] : []),
    { href: "/ritmo/etica", nombre: "Ético", icono: ShieldCheck, activo: path.startsWith("/ritmo/etica") },
  ];
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
                <Link key={t.href} href={t.href} className={cn("rounded-full px-3.5 py-1.5 text-sm transition", t.activo ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground")}>
                  {t.nombre}
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
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className={cn("flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition", t.activo ? "text-primary" : "text-muted-foreground")}>
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
