import { useId } from "react";

import { cn } from "@/lib/utils";

// Marca de Ritmo: un pulso dentro de un anillo; el trazo va del verde (pulso) al coral (calor).
export function RitmoLogo({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <defs>
        <linearGradient id={id} x1="4" y1="16" x2="28" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--neon, #5cf09a)" />
          <stop offset="1" stopColor="var(--coral, #f59e7a)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14.5" stroke={`url(#${id})`} strokeOpacity="0.4" />
      <path d="M5 17h5l2.5-6 4 11 3-8 1.5 3H27" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
