// Lo que sale de Content OS hacia AI Core (app/api/aicore/datos): exclusiones de Elvin (13-oct).
// Red de seguridad: ningún correo ni teléfono sale de aquí, venga del campo que venga.
const CORREO = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const TELEFONO = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
export function limpiar<T>(v: T): T {
  if (typeof v === "string") return v.replace(CORREO, "[correo oculto]").replace(TELEFONO, "[teléfono oculto]") as T;
  if (Array.isArray(v)) return v.map(limpiar) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, limpiar(x)])) as T;
  return v;
}

