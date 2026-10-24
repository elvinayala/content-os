"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { aceptarLegalClienteAction } from "@/app/cliente/actions";
import { Button } from "@/components/ui/button";
import { LEGAL } from "@/lib/legal/versiones";

// Primera vez en la app (o versión nueva de los documentos): dos casillas separadas, sin marcar, con su enlace al lado.
// El texto visible es el mismo de CASILLAS.terminosApp / CASILLAS.privacidadApp (lib/legal/versiones.ts).
export function AceptarLegalCliente({ negocio }: { negocio: string }) {
  const router = useRouter();
  const [terminos, setTerminos] = useState(false);
  const [privacidad, setPrivacidad] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  const seguir = () =>
    empezar(async () => {
      setError(null);
      const r = await aceptarLegalClienteAction({ terminos, privacidad });
      if (!r.ok) return setError(r.error);
      router.refresh();
    });

  const casilla = "flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 text-left text-sm leading-relaxed transition-colors hover:border-primary/50";
  const enlace = "font-medium text-primary underline underline-offset-4 hover:opacity-80";

  return (
    <main className="entra-suave mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-5 px-6" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <Image src="/marcas/level-up-icon-dark.png" alt="Level Up Media" width={56} height={48} />
      <div className="flex flex-col gap-1.5">
        <h1 className="lu-titulo text-2xl font-semibold">Tu app de Level Up, {negocio}</h1>
        <p className="text-sm text-muted-foreground">Antes de entrar, lee y acepta cómo funciona la app y cómo cuidamos tus datos.</p>
      </div>
      <label className={casilla}>
        <input type="checkbox" checked={terminos} onChange={(e) => setTerminos(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
        <span>
          Acepto los{" "}
          <a href={LEGAL.terminos.ruta} target="_blank" rel="noopener" className={enlace}>
            Términos y condiciones
          </a>
          .
        </span>
      </label>
      <label className={casilla}>
        <input type="checkbox" checked={privacidad} onChange={(e) => setPrivacidad(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
        <span>
          Acepto la{" "}
          <a href={LEGAL.privacidad.ruta} target="_blank" rel="noopener" className={enlace}>
            Política de privacidad
          </a>
          .
        </span>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button onClick={seguir} disabled={!terminos || !privacidad || pendiente} className="h-12 rounded-full text-base font-semibold">
        {pendiente ? <Loader2 className="animate-spin" /> : null} {pendiente ? "Guardando…" : "Entrar a mi app"}
      </Button>
    </main>
  );
}
