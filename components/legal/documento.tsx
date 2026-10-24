import Link from "next/link";
import * as React from "react";

import { ENTIDAD, LEGAL } from "@/lib/legal/versiones";
import { cn } from "@/lib/utils";

// Piezas de las páginas legales (/terminos, /privacidad, /privacidad/equipo, /reembolsos, /cookies, /accesibilidad).

export function DocumentoLegal({ titulo, version, fecha, resumen, children }: { titulo: string; version: string; fecha: string; resumen?: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{ENTIDAD}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{titulo}</h1>
        <p className="text-sm text-muted-foreground">
          Versión {version} · Vigente desde el {fecha}
        </p>
        {resumen ? <div className="mt-2 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed">{resumen}</div> : null}
      </header>
      <div className="flex flex-col gap-8">{children}</div>
    </article>
  );
}

export function Seccion({ id, titulo, children }: { id?: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{titulo}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-foreground/85 [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">{children}</div>
    </section>
  );
}

const ENLACES = [
  { href: LEGAL.terminos.ruta, texto: "Términos" },
  { href: LEGAL.privacidad.ruta, texto: "Privacidad" },
  { href: LEGAL.privacidadEquipo.ruta, texto: "Privacidad del equipo" },
  { href: LEGAL.reembolsos.ruta, texto: "Reembolsos" },
  { href: LEGAL.cookies.ruta, texto: "Cookies" },
  { href: LEGAL.accesibilidad.ruta, texto: "Accesibilidad" },
];

export function NavLegal({ actual }: { actual?: string }) {
  return (
    <nav aria-label="Documentos legales" className="flex flex-wrap gap-1.5">
      {ENLACES.map((e) => (
        <Link
          key={e.href}
          href={e.href}
          aria-current={actual === e.href ? "page" : undefined}
          className={cn(
            "rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            actual === e.href ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background" : "text-muted-foreground",
          )}
        >
          {e.texto}
        </Link>
      ))}
    </nav>
  );
}

// Enlaces legales para los pies de página y junto a los formularios de cada plataforma. `que` elige cuáles.
export function EnlacesLegales({ que = ["terminos", "privacidad"], className }: { que?: ("terminos" | "privacidad" | "privacidadEquipo" | "reembolsos" | "cookies" | "accesibilidad")[]; className?: string }) {
  const texto: Record<string, string> = {
    terminos: "Términos",
    privacidad: "Privacidad",
    privacidadEquipo: "Aviso de privacidad del equipo",
    reembolsos: "Reembolsos",
    cookies: "Cookies",
    accesibilidad: "Accesibilidad",
  };
  return (
    <nav aria-label="Documentos legales" className={cn("flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground", className)}>
      {que.map((k) => (
        <a key={k} href={LEGAL[k].ruta} target="_blank" rel="noopener" className="rounded underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {texto[k]}
        </a>
      ))}
    </nav>
  );
}
