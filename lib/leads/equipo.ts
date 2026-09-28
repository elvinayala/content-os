// Leads → Equipo (28/sep, Elvin: "explícale a Nahuel cómo da acceso al equipo de ventas"). Quién maneja el acceso a
// Leads de una marca y a quién se le puede dar. Puro (tests en tests/leads-equipo.test.mjs).

export type Alcance = "todos" | "mios";

/** Elvin; las editoras en las marcas que ven; y el director de ventas de esa marca (Nahuel en Level Up). */
export function manejaEquipoLeads(u: { rol: string }, perfil: { puesto: string; empresa: string; tambienEn?: string | null } | null, marca: string, veLaMarca: boolean): boolean {
  if (u.rol === "admin") return true;
  if (u.rol === "editor") return veLaMarca;
  return !!perfil && perfil.puesto === "director_ventas" && (perfil.empresa === marca || perfil.tambienEn === marca);
}

/** Por qué no se le puede dar acceso a alguien (null = sí se puede). */
export function errorDarAcceso(p: { yoId: string; objetivo: { id: string; rol: string; activo: boolean; soloRitmo: boolean; bloqueado: boolean; sistema: boolean } | null; alcance: string }): string | null {
  const o = p.objetivo;
  if (!o || !o.activo || o.sistema) return "Esa persona no tiene cuenta activa en Pulse";
  if (o.bloqueado) return "Esta persona no puede tener acceso (decisión de Elvin)";
  if (o.rol === "admin") return "Elvin ya ve todo";
  if (!["todos", "mios"].includes(p.alcance)) return "Escoge si ve todos los leads o solo los suyos";
  if (o.soloRitmo) return "Esta persona solo entra a Ritmo. Pídele a Carilin o Aure que en Ritmo → Ajustes le marquen «También puede entrar a Pulse» y vuelve a darle acceso";
  return null;
}

export const ALCANCES: { id: Alcance; nombre: string; ayuda: string }[] = [
  { id: "todos", nombre: "Todos los leads", ayuda: "Ve y trabaja todos los leads de la marca (closers, setters, chatters)" },
  { id: "mios", nombre: "Solo sus leads", ayuda: "Ve solo los leads donde es el dueño" },
];
