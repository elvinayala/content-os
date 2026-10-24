import type { Metadata } from "next";

import { ENTIDAD } from "@/lib/legal/versiones";

export const metadata: Metadata = {
  title: { default: `Documentos legales · ${ENTIDAD}`, template: `%s · ${ENTIDAD}` },
  description: "Términos, privacidad, reembolsos, cookies y accesibilidad de las plataformas de EA Market LLC (Level Up Media y AI Borinquen).",
};

// Páginas legales públicas en todos los dominios (proxy.ts → esRutaLegal). Lectura cómoda: columna angosta.
export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">{children}</main>
      <footer className="mx-auto w-full max-w-2xl border-t border-border px-5 py-8 text-xs leading-relaxed text-muted-foreground">
        {ENTIDAD} · Puerto Rico. Level Up Media y AI Borinquen son marcas de {ENTIDAD}.
      </footer>
    </div>
  );
}
