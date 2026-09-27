// Recordatorio de SOPs (27/sep/2026, Elvin: "persigue a Carilin y a Aure todos los días hasta el
// viernes; si te dicen que ya lo están haciendo, solo pregunta estatus"). Parte pura: arma el
// mensaje del día. Sin DB ni Slack (tests en tests/pulse-sop.test.mjs).

export interface SopPersona {
  nombre: string; // "Carilin"
  total: number;
  publicados: number;
  enRevision: number;
  faltan: string[]; // departamentos sin SOP publicado
  links: string[];
}

export type ModoSop = "primero" | "insistir" | "estatus" | "ultimo" | "listo";

const FECHA_LIMITE = "el viernes 2 de octubre";

export function modoDelDia(p: { yaSeLeEscribio: boolean; respondio: boolean; esUltimoDia: boolean; todoPublicado: boolean }): ModoSop {
  if (p.todoPublicado) return "listo";
  if (p.esUltimoDia) return "ultimo";
  if (!p.yaSeLeEscribio) return "primero";
  return p.respondio ? "estatus" : "insistir";
}

const lista = (xs: string[]) => (xs.length <= 4 ? xs.join(", ") : `${xs.slice(0, 4).join(", ")} y ${xs.length - 4} más`);

export function mensajeSop(p: SopPersona, modo: ModoSop): string | null {
  const conteo = `Van *${p.publicados} de ${p.total}* publicados${p.enRevision ? ` (${p.enRevision} en revisión)` : ""}.`;
  const links = p.links.join("\n");
  switch (p.total ? modo : "listo") {
    case "listo":
      return null;
    case "primero":
      return [
        `Hola ${p.nombre} 👋 De parte de Elvin, la prioridad de esta semana: *los SOP de cada departamento en Pulse antes de ${FECHA_LIMITE}*.`,
        "1. Reúnete con cada departamento y revisen su SOP (si no lo tienen, se hace de nuevo).",
        "2. Pongan la fecha de revisión.",
        "3. Súbelo a Pulse (pestaña SOPs) y márcalo *Publicado*.",
        `Te tocan: ${lista(p.faltan)}. ${conteo}`,
        links,
        "— Pulse",
      ].join("\n");
    case "insistir":
      return `Hola ${p.nombre}, recordatorio de los SOP: ${conteo} Faltan: ${lista(p.faltan)}. La fecha es ${FECHA_LIMITE}. ¿Me confirmas que ya estás en eso?\n${links}\n— Pulse`;
    case "estatus":
      return `${p.nombre}, ¿cómo van los SOP? ${conteo} Faltan: ${lista(p.faltan)}.\n${links}\n— Pulse`;
    case "ultimo":
      return `${p.nombre}, hoy es el último día para los SOP. ${conteo} Faltan: ${lista(p.faltan)}. Cuando cada uno esté revisado y subido, márcalo *Publicado*.\n${links}\n— Pulse`;
  }
}
