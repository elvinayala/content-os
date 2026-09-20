// Frescura de un snapshot — función PURA (sin fs), usable en cliente y servidor.
// "fresco" (< umbral), "stale" (>= umbral), "mock" (sin snapshot).

export interface Frescura {
  estado: "fresco" | "stale" | "mock";
  horas: number | null;
}

export function frescura(
  actualizadoEl: string | null | undefined,
  umbralHoras = 26,
): Frescura {
  if (!actualizadoEl) return { estado: "mock", horas: null };
  const ms = Date.now() - new Date(actualizadoEl).getTime();
  const horas = Math.max(0, Math.round(ms / 3_600_000));
  return { estado: horas >= umbralHoras ? "stale" : "fresco", horas };
}
