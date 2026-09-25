import { cn } from "@/lib/utils";

// Foto de la ficha (si hay) o iniciales con el degradado de Ritmo.
export function AvatarRitmo({ userId, nombre, foto, size = 44, className }: { userId: string; nombre: string; foto: string | null; size?: number; className?: string }) {
  const ini = nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const estilo = { width: size, height: size };
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/ritmo/foto/${userId}?v=${encodeURIComponent(foto.slice(-12))}`} alt={nombre} style={estilo} className={cn("shrink-0 rounded-full object-cover ring-1 ring-border", className)} />;
  }
  return (
    <span style={{ ...estilo, fontSize: size * 0.36 }} className={cn("flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--neon)]/25 to-[color:var(--coral)]/30 font-semibold ring-1 ring-border", className)}>
      {ini || "?"}
    </span>
  );
}
