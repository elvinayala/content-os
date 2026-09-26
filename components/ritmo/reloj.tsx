"use client";

import { useEffect, useState } from "react";

// Hora de Puerto Rico en vivo (la misma que usa el ponche), con un punto que late: "sistema en línea".
export function RelojPR() {
  const [ahora, setAhora] = useState<Date | null>(null);
  useEffect(() => {
    setAhora(new Date());
    const t = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hora = ahora ? ahora.toLocaleTimeString("es-PR", { timeZone: "America/Puerto_Rico", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "--:--:--";
  return (
    <span className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/40 px-2.5 py-1 font-mono text-[11px] tracking-wider text-muted-foreground tabular-nums lg:inline-flex" title="Hora de Puerto Rico">
      <span className="relative flex size-1.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
        <span className="relative size-1.5 rounded-full bg-primary" />
      </span>
      PR {hora}
    </span>
  );
}
