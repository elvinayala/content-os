// Refiere y gana (Elvin, 30/sep): el cliente refiere un negocio desde la app y ve cómo va. Puro; tests en
// tests/clientes-app.test.mjs.

export interface ReferidoNuevo {
  negocio: string;
  contacto: string;
  telefono: string;
  nota: string;
}

/** Valida y limpia lo que escribe el cliente. Devuelve el error a mostrar o el referido listo. */
export function validarReferido(p: Partial<Record<keyof ReferidoNuevo, unknown>>): { error: string } | { ok: ReferidoNuevo } {
  const t = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");
  const negocio = t(p.negocio, 80);
  const contacto = t(p.contacto, 80);
  const telefono = t(p.telefono, 30).replace(/[^\d+]/g, "");
  const nota = t(p.nota, 300);
  if (negocio.length < 2) return { error: "Escribe el nombre del negocio." };
  if (contacto.length < 2) return { error: "Escribe el nombre de la persona." };
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 15) return { error: "Escribe un teléfono válido (con código de área)." };
  return { ok: { negocio, contacto, telefono, nota } };
}

/** Cómo va cada referido, en palabras del cliente (de lo que pasa en Leads). */
export function estadoReferido(estado: string): { texto: string; tono: "proceso" | "ganado" | "cerrado" } {
  if (estado === "ganado") return { texto: "¡Ya es cliente! 🎉", tono: "ganado" };
  if (estado === "perdido") return { texto: "Esta vez no se dio", tono: "cerrado" };
  return { texto: "En conversación", tono: "proceso" };
}

export const TOPE_REFERIDOS_DIA = 5;
