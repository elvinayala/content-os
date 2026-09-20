"use client";

import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Red de seguridad de la sección CEO: si CUALQUIER cosa falla al renderizar
// (un snapshot corrupto, Sheets caído que tira, etc.) mostramos esto en vez de
// una pantalla en blanco. El resto del portal sigue navegable.
export default function CeoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="glow max-w-md border-primary/30 bg-gradient-to-b from-card to-background/60">
        <CardContent className="space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold">Algo se trabó al cargar</h2>
          <p className="text-sm text-muted-foreground">
            El Command Center tuvo un problema momentáneo. No se perdió nada —
            probá recargar. Si sigue, es casi siempre un dato temporal (Google
            Sheets lento o un snapshot a medio escribir) y se arregla solo en la
            próxima corrida.
          </p>
          {error.digest ? (
            <p className="label-mono text-muted-foreground">
              ref: {error.digest}
            </p>
          ) : null}
          <div className="flex justify-center gap-2">
            <Button onClick={reset}>
              <RotateCw className="size-4" /> Reintentar
            </Button>
            <Button variant="outline" asChild>
              <a href="/ceo">Ir al inicio</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
