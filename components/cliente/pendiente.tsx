"use client";

import { useLinkStatus } from "next/link";

// Va DENTRO de un <Link>: mientras esa navegación carga, el texto pulsa (sin mover el layout).
// Lo usa el selector de periodo de Resultados, que se queda en la misma ruta y no muestra loading.tsx.
export function TextoPendiente({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span className={pending ? "animate-pulse" : undefined} aria-busy={pending || undefined}>
      {children}
    </span>
  );
}
