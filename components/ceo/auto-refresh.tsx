"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

// Refresca los Server Components (router.refresh) cada `segundos` para que los
// leads nuevos de Pipedrive aparezcan casi en tiempo real, sin recargar la
// página entera. Se pausa mientras la pestaña está en segundo plano.
export function AutoRefresh({ segundos = 30 }: { segundos?: number }) {
  const router = useRouter();
  const [ultimo, setUltimo] = useState<number>(0);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        setUltimo((n) => n + 1);
      }
    };
    const id = setInterval(tick, segundos * 1000);
    return () => clearInterval(id);
  }, [router, segundos]);

  return (
    <span
      className="label-mono inline-flex items-center gap-1 text-muted-foreground"
      title={`Actualiza cada ${segundos}s${ultimo ? ` · ${ultimo} refrescos` : ""}`}
    >
      <RefreshCw className="size-3 animate-[spin_3s_linear_infinite]" />
      auto
    </span>
  );
}
