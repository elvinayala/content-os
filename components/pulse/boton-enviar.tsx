"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

// Botón de envío para <form action={…}>: mientras la acción corre, spinner pequeño + deshabilitado + "Guardando…"
// (o el texto que le pases en `pendiente`). Tiene que ir DENTRO del <form>.
export function BotonEnviar({ children, pendiente = "Guardando…", className }: { children: React.ReactNode; pendiente?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> {pendiente}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
