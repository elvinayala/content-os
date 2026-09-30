import Image from "next/image";

import { PegarLink } from "@/components/cliente/pegar-link";

export const metadata = { title: "Entrar" };

// Candado: sin link personal (o con uno viejo) no se entra. Desde la app instalada se puede pegar el link.
export default async function Acceso({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const { link } = await searchParams;
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col items-center justify-center gap-6 px-6 text-center" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <Image src="/marcas/level-up-logo-dark.png" alt="Level Up Media" width={180} height={130} priority />
      <div className="flex flex-col gap-2">
        <h1 className="lu-titulo text-2xl font-semibold">Tu cuenta con Level Up</h1>
        <p className="text-sm text-muted-foreground">
          {link === "vencido" ? "Ese link ya no sirve: tu equipo te mandó uno nuevo o lo desactivó." : "Se entra con tu link personal: te lo manda tu account manager al terminar tu onboarding."}
        </p>
      </div>
      <PegarLink />
      <p className="text-xs text-muted-foreground">¿No tienes tu link? Pídeselo a tu equipo en el canal de Slack de tu negocio.</p>
    </main>
  );
}
