import { cn } from "@/lib/utils";

// Isotipo de Pulse: cuadrado con degradado terracota profundo, brillo superior y una
// onda de pulso con trazo fino y punto luminoso al final. Solo SVG (sin assets).
export function PulseLogo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={cn("shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id="pl-fondo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e07a4a" />
          <stop offset="0.55" stopColor="#c8562d" />
          <stop offset="1" stopColor="#8f3a1e" />
        </linearGradient>
        <linearGradient id="pl-brillo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="pl-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id="pl-sombra" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#pl-fondo)" />
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#pl-brillo)" />
      <rect x="2.5" y="2.5" width="59" height="59" rx="15.5" fill="none" stroke="#fff" strokeOpacity="0.18" />
      {/* línea base tenue */}
      <path d="M12 34 H52" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" />
      {/* onda del pulso */}
      <path
        d="M12 34 H22 L26.5 24 L32 44 L37.5 20 L42 34 H52"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#pl-sombra)"
      />
      {/* punto luminoso */}
      <circle cx="52" cy="34" r="7" fill="url(#pl-halo)" />
      <circle cx="52" cy="34" r="2.6" fill="#fff" />
    </svg>
  );
}

// Logo + wordmark, para la sidebar y el login.
export function PulseMarca({ subtitulo, size = 36, className }: { subtitulo?: string; size?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <PulseLogo size={size} className="drop-shadow-[0_6px_14px_rgba(200,86,45,0.35)]" />
      <div className="flex flex-col leading-none">
        <span className="text-[17px] font-semibold tracking-[-0.02em]">Pulse</span>
        {subtitulo ? <span className="mt-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">{subtitulo}</span> : null}
      </div>
    </div>
  );
}
