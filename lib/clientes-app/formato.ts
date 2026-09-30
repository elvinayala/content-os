// Formato de fechas para la app de clientes (hora de Puerto Rico, español de PR).
export const fechaLarga = (f: string | null) => (f ? new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" }) : null);
export const fechaCorta = (f: string | null) => (f ? new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { day: "numeric", month: "short", year: "numeric" }) : null);
export const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
export const iniciales = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
