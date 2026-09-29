// ¿Qué le falta a la ficha de un empleado? (28/sep, Elvin: "todo el mundo debe tener todos los datos llenos, incluyendo
// fotos"). Puro (tests en tests/ficha-completa.test.mjs): lo usan el aviso de Hoy, la lista de Personas y el mensaje a RR.HH.

export interface FichaParaRevisar {
  fotoPath: string | null;
  telefono: string | null;
  ciudad: string | null;
  pais: string | null;
  documentoNumero: string | null;
  contactoEmergencia: string | null;
}

export function faltantesFicha(f: FichaParaRevisar | null, docs: { identificacion: number; contrato: number }): string[] {
  if (!f) return ["ficha"];
  const vacio = (v: string | null) => !v || !v.trim();
  const falta: string[] = [];
  if (vacio(f.fotoPath)) falta.push("foto");
  if (vacio(f.telefono)) falta.push("teléfono");
  if (vacio(f.ciudad) || vacio(f.pais)) falta.push("ciudad y país");
  if (vacio(f.documentoNumero)) falta.push("número de documento");
  if (vacio(f.contactoEmergencia)) falta.push("contacto de emergencia");
  if (!docs.identificacion) falta.push("foto de tu identificación");
  if (!docs.contrato) falta.push("contrato firmado");
  return falta;
}

/** "foto, teléfono y contrato firmado" */
export function listaHumana(xs: string[]): string {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}
