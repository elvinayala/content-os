// Reglas de Carreras (puras, sin DB; tests en tests/carreras.test.mjs).
// Vacantes internas: el equipo aplica para subir o cambiar de puesto, o refiere a alguien.
// Bono por referido: SOLO si la persona referida se contrata Y completa el onboarding.

export const BONO_REFERIDO = 100; // US$, por defecto (cada vacante puede tener el suyo)

export const MODALIDADES = [
  { id: "remoto", nombre: "Remoto" },
  { id: "hibrido", nombre: "Híbrido" },
  { id: "presencial", nombre: "Presencial" },
] as const;

export const ESTADOS_VACANTE = [
  { id: "abierta", nombre: "Abierta" },
  { id: "pausada", nombre: "Pausada" },
  { id: "cerrada", nombre: "Cerrada" },
] as const;

export type EstadoPostulacion = "recibida" | "en_proceso" | "entrevista" | "contratado" | "onboarding_completo" | "descartada" | "retirada";

// El camino que ve la persona, en orden. "descartada" y "retirada" cierran el caso fuera del camino.
export const ETAPAS: { id: EstadoPostulacion; nombre: string; soloReferido?: boolean }[] = [
  { id: "recibida", nombre: "Recibida" },
  { id: "en_proceso", nombre: "En revisión" },
  { id: "entrevista", nombre: "Entrevista" },
  { id: "contratado", nombre: "Seleccionado" },
  { id: "onboarding_completo", nombre: "Onboarding completo", soloReferido: true },
];
export const CIERRES: { id: EstadoPostulacion; nombre: string }[] = [
  { id: "descartada", nombre: "No seleccionado" },
  { id: "retirada", nombre: "Retirada" },
];

export const nombreEstado = (e: string) => [...ETAPAS, ...CIERRES].find((x) => x.id === e)?.nombre ?? e;
export const etapasDe = (tipo: string) => ETAPAS.filter((e) => tipo === "referido" || !e.soloReferido);
export const esEstadoValido = (tipo: string, e: string) => etapasDe(tipo).some((x) => x.id === e) || CIERRES.some((x) => x.id === e);
export const abierta = (estado: string) => !["contratado", "onboarding_completo", "descartada", "retirada"].includes(estado);

/** El bono se paga una sola vez: referido, onboarding completo y todavía sin ajuste de nómina. */
export const correspondeBono = (p: { tipo: string; estado: string; bonoAjusteId: string | null }) =>
  p.tipo === "referido" && p.estado === "onboarding_completo" && !p.bonoAjusteId;

/** Solo quien aplicó o refirió puede retirar, y solo mientras no haya pasado de "recibida". */
export const puedeRetirar = (p: { userId: string; estado: string }, actorId: string) => p.userId === actorId && p.estado === "recibida";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const limpio = (s: string | null | undefined, max: number) => (s ?? "").trim().slice(0, max);

export type DatosReferido = { nombre: string; email: string; telefono: string; relacion: string; motivo: string; enlace: string };

/** Valida un referido. Devuelve el texto de error o null. */
export function errorReferido(r: DatosReferido, quienRefiere: { email: string }, yaReferidos: { email: string | null }[]): string | null {
  const nombre = limpio(r.nombre, 120);
  const email = limpio(r.email, 200).toLowerCase();
  const tel = limpio(r.telefono, 40).replace(/[^\d+]/g, "");
  if (nombre.length < 3) return "Escribe el nombre completo de la persona";
  if (!email && tel.length < 7) return "Pon el correo o el teléfono de la persona";
  if (email && !EMAIL.test(email)) return "El correo no se ve bien";
  if (email && email === quienRefiere.email.trim().toLowerCase()) return "No te puedes referir a ti mismo; usa “Aplicar”";
  if (email && yaReferidos.some((y) => (y.email ?? "").toLowerCase() === email)) return "Esa persona ya fue referida para esta vacante";
  if (limpio(r.motivo, 2000).length < 10) return "Cuéntanos en una o dos líneas por qué la recomiendas";
  if (r.enlace && !/^https?:\/\//i.test(r.enlace.trim())) return "El enlace debe empezar con https://";
  return null;
}

/** Valida una aplicación interna. */
export function errorAplicacion(a: { motivo: string; enlace: string }, yaAplico: boolean): string | null {
  if (yaAplico) return "Ya aplicaste a esta vacante";
  if (limpio(a.motivo, 2000).length < 10) return "Cuéntanos en una o dos líneas por qué te interesa";
  if (a.enlace && !/^https?:\/\//i.test(a.enlace.trim())) return "El enlace debe empezar con https://";
  return null;
}

/** Una vacante es "nueva" durante 7 días (punto en el menú). */
export const esNueva = (createdAt: Date | string, ahora = Date.now()) => ahora - new Date(createdAt).getTime() < 7 * 86_400_000;
