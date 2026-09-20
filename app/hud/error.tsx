"use client";

import { RotateCw } from "lucide-react";

// Red de seguridad del HUD.
export default function HudError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <h2 className="text-lg font-semibold">El HUD se trabó un momento</h2>
        <p className="text-sm text-muted-foreground">
          Recargá — no se perdió nada. Jarvis y tus datos siguen intactos.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          <RotateCw className="size-4" /> Reintentar
        </button>
      </div>
    </div>
  );
}
