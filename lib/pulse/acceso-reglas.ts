// Qué parte de Pulse le toca a cada cuenta (28/sep, Elvin: "proteger Pulse… nunca mezclar datos, nunca mezclar accesos";
// "el equipo de ventas con un login aparte, directo a Leads"). Puro (tests en tests/pulse-acceso.test.mjs).
//   · completo    → tableros de clientes, tesorería, SOPs… (operaciones y dirección). Lleva SEGUNDO PASO (código de app).
//   · solo_leads  → closers, setters, chatters y director de ventas: solo Leads (y Formularios si se los dieron).
//   · solo_ritmo  → empleados que solo usan Ritmo: nada de Pulse.

export type TipoAcceso = "completo" | "solo_leads" | "solo_ritmo";

export const PUESTOS_VENTAS_PULSE = ["closer", "setter", "chatter", "director_ventas"];

export function tipoAccesoPulse(rol: string, perfil: { puesto: string; soloRitmo: boolean } | null): TipoAcceso {
  if (rol === "admin" || rol === "editor") return "completo";
  if (perfil?.soloRitmo) return "solo_ritmo";
  if (perfil && PUESTOS_VENTAS_PULSE.includes(perfil.puesto)) return "solo_leads";
  return "completo";
}

/** Segundo paso para todo el que ve los tableros de Pulse. `PULSE_2FA=off` lo apaga (solo emergencias). */
export function requiereSegundoPaso(tipo: TipoAcceso, modo = "on"): boolean {
  return modo !== "off" && tipo === "completo";
}

/** Correos que pueden tener cuenta: los dominios de la empresa, o una cuenta que un admin creó a mano (correos personales). */
export const DOMINIOS_EMPRESA = ["levelupmediapr.net", "aiborinquen.co"];
export const esCorreoEmpresa = (email: string) => DOMINIOS_EMPRESA.includes(email.trim().toLowerCase().split("@")[1] ?? "");
