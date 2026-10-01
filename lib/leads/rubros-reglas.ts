// Rubro del negocio del lead (Aure, 1/oct): etiquetas de una lista común a Level Up y AI Borinquen. Se guarda en
// leads_tratos.datos.nicho (el mismo campo que ya llenaba Claude). La dirección puede crear las que falten.

export const RUBROS_SEMILLA = [
  "Estética",
  "Construcción",
  "Solar",
  "Handyman",
  "Abogados",
  "Doctores",
  "Seguros",
  "Vendedores / Tiendas",
  "Dealer de autos",
  "Educación (escuelas o cursos)",
  "Real estate",
  "Auto partes",
  "Otro",
] as const;

export const SIN_RUBRO = "__sin";

// Cómo lo suele decir Claude o la gente → etiqueta de la semilla (llaves ya en claveRubro).
const SINONIMOS: Record<string, string> = {
  "bienes raices": "Real estate",
  "belleza": "Estética",
  "salon de belleza": "Estética",
  "spa": "Estética",
  "salud": "Doctores",
  "medico": "Doctores",
  "medicos": "Doctores",
  "abogado": "Abogados",
  "legal": "Abogados",
  "seguro": "Seguros",
  "energia solar": "Solar",
  "placas solares": "Solar",
  "autos": "Dealer de autos",
  "concesionario": "Dealer de autos",
  "piezas de autos": "Auto partes",
  "tienda": "Vendedores / Tiendas",
  "ventas": "Vendedores / Tiendas",
  "escuela": "Educación (escuelas o cursos)",
  "cursos": "Educación (escuelas o cursos)",
  "remodelacion": "Construcción",
  "reparaciones": "Handyman",
};

/** "  real   estate " → "real estate"; máx. 40 caracteres. */
export function normalizarRubro(v: unknown): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
}

/** Llave para comparar sin mayúsculas, acentos ni signos: "Dealer de Autos" = "dealer de autos". */
export function claveRubro(v: unknown): string {
  return normalizarRubro(v)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Semilla + las creadas, sin repetir (gana la primera forma escrita) y con "Otro" siempre al final. */
export function unirCatalogo(creados: readonly string[]): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const r of [...RUBROS_SEMILLA.filter((x) => x !== "Otro"), ...creados]) {
    const n = normalizarRubro(r);
    const k = claveRubro(n);
    if (!k || k === "otro" || vistos.has(k)) continue;
    vistos.add(k);
    out.push(n);
  }
  out.push("Otro");
  return out;
}

/** Lo que devuelve Claude ("Bienes raíces", "real estate", "Belleza"…) → la etiqueta del catálogo o "Otro". null si no dijo nada. */
export function rubroDeCatalogo(texto: unknown, catalogo: readonly string[]): string | null {
  const k = claveRubro(texto);
  if (!k) return null;
  const buscar = (llave: string) => catalogo.find((c) => claveRubro(c) === llave);
  const exacto = buscar(k) ?? (SINONIMOS[k] ? buscar(claveRubro(SINONIMOS[k])) : undefined);
  if (exacto) return exacto;
  // "Educación" calza con "Educación (escuelas o cursos)"; "Tiendas" con "Vendedores / Tiendas".
  const palabras = k.split(" ").filter((w) => w.length > 3);
  const parcial = catalogo.find((c) => {
    const kc = claveRubro(c);
    return kc !== "otro" && palabras.some((w) => kc.split(" ").includes(w));
  });
  return parcial ?? "Otro";
}

/** Error para crear una etiqueta nueva, o null si se puede. */
export function errorRubroNuevo(nombre: unknown, catalogo: readonly string[]): string | null {
  const n = normalizarRubro(nombre);
  if (n.length < 2) return "Escribe el nombre de la etiqueta.";
  if (catalogo.some((c) => claveRubro(c) === claveRubro(n))) return "Esa etiqueta ya existe.";
  return null;
}
