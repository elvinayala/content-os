"use client";

import { BarChart3, FolderOpen, Home, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// Arriba: logo + negocio. Abajo (teléfono): las 4 pestañas. En la computadora van arriba.
const TABS = [
  { href: "/cliente", nombre: "Inicio", icono: Home },
  { href: "/cliente/resultados", nombre: "Resultados", icono: BarChart3 },
  { href: "/cliente/archivos", nombre: "Archivos", icono: FolderOpen },
  { href: "/cliente/cuenta", nombre: "Mi cuenta", icono: UserRound },
];

export function NavCliente({ negocio }: { negocio: string }) {
  const path = usePathname();
  const activo = (href: string) => (href === "/cliente" ? path === "/cliente" : path.startsWith(href));
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href="/cliente" className="flex items-center gap-2">
            <Image src="/marcas/level-up-icon-dark.png" alt="Level Up Media" width={30} height={26} priority />
            <span className="lu-titulo text-[15px] font-semibold">Level Up</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className={cn("rounded-full px-3.5 py-1.5 text-sm transition", activo(t.href) ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                {t.nombre}
              </Link>
            ))}
          </nav>
          <span className="ml-auto max-w-44 truncate text-sm text-muted-foreground">{negocio}</span>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-md">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={cn("flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition", activo(t.href) ? "text-primary" : "text-muted-foreground")}>
              <t.icono className="size-5" />
              {t.nombre}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
