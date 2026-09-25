// "Preguntarle al CRM": la parte pura (sin DB ni IA) para poder testearla.
// Los tableros se aplanan a filas con el texto legible de cada columna y el agente
// consulta con condiciones simples sobre esos títulos de columna.

export type ValorPlano = string | number | null;

export interface FilaPlana {
  id: string;
  nombre: string;
  tablero: string; // slug
  tableroNombre: string;
  grupo: string;
  campos: Record<string, ValorPlano>; // título de columna → valor legible
}

export type Operador = "es" | "no_es" | "contiene" | "no_contiene" | "vacio" | "no_vacio" | "mayor" | "menor" | "entre";

export interface Condicion {
  columna: string;
  op: Operador;
  valor?: string | number;
  valor2?: string | number;
}

export interface Consulta {
  tableros?: string[]; // slugs o nombres
  grupos?: string[]; // títulos (parcial)
  excluir_grupos?: string[];
  condiciones?: Condicion[];
  texto?: string; // búsqueda libre en nombre + todos los campos
  contar_por?: string; // columna (o "grupo"/"tablero") para devolver conteos
  mostrar?: string[]; // columnas extra a devolver por fila
  limite?: number;
}

export interface ResultadoConsulta {
  total: number;
  conteo?: Record<string, number>;
  items: { id: string; nombre: string; tablero: string; grupo: string; campos: Record<string, ValorPlano> }[];
  avisos: string[];
}

export const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const vacio = (v: ValorPlano | undefined) => v === null || v === undefined || v === "";

function campo(f: FilaPlana, columna: string): ValorPlano | undefined {
  const n = norm(columna);
  if (n === "nombre" || n === "cliente") return f.nombre;
  if (n === "grupo") return f.grupo;
  if (n === "tablero") return f.tableroNombre;
  for (const [k, v] of Object.entries(f.campos)) if (norm(k) === n) return v;
  return undefined;
}

// Número o fecha ISO comparable; null si no se puede comparar.
function comparable(v: ValorPlano | string | number | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return Date.parse(s.slice(0, 10) + "T00:00:00Z");
  const n = Number(s.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function cumple(f: FilaPlana, c: Condicion): boolean {
  const v = campo(f, c.columna);
  const texto = norm(v);
  const buscado = norm(c.valor);
  switch (c.op) {
    case "vacio":
      return vacio(v);
    case "no_vacio":
      return !vacio(v);
    case "es":
      // Multi-valor ("Ana, Luis"): basta con que una parte coincida.
      return texto === buscado || texto.split(/\s*,\s*/).includes(buscado);
    case "no_es":
      return !(texto === buscado || texto.split(/\s*,\s*/).includes(buscado));
    case "contiene":
      return !!buscado && texto.includes(buscado);
    case "no_contiene":
      return !buscado || !texto.includes(buscado);
    case "mayor":
    case "menor":
    case "entre": {
      const a = comparable(v);
      const b = comparable(c.valor);
      if (a === null || b === null) return false;
      if (c.op === "mayor") return a > b;
      if (c.op === "menor") return a < b;
      const b2 = comparable(c.valor2);
      return b2 !== null && a >= Math.min(b, b2) && a <= Math.max(b, b2);
    }
  }
}

const coincideLista = (valor: string, lista?: string[]) => !lista?.length || lista.some((x) => norm(valor).includes(norm(x)));

export function consultar(filas: FilaPlana[], q: Consulta): ResultadoConsulta {
  const avisos: string[] = [];
  const columnasConocidas = new Set(filas.flatMap((f) => Object.keys(f.campos).map(norm)).concat(["nombre", "cliente", "grupo", "tablero"]));
  for (const c of q.condiciones ?? []) {
    if (!columnasConocidas.has(norm(c.columna))) avisos.push(`No existe la columna "${c.columna}".`);
  }
  const res = filas.filter(
    (f) =>
      (!q.tableros?.length || q.tableros.some((t) => norm(t) === norm(f.tablero) || norm(f.tableroNombre).includes(norm(t)))) &&
      coincideLista(f.grupo, q.grupos) &&
      !(q.excluir_grupos?.length && q.excluir_grupos.some((x) => norm(f.grupo).includes(norm(x)))) &&
      (q.condiciones ?? []).every((c) => cumple(f, c)) &&
      (!q.texto || [f.nombre, ...Object.values(f.campos)].some((v) => norm(v).includes(norm(q.texto)))),
  );
  let conteo: Record<string, number> | undefined;
  if (q.contar_por) {
    conteo = {};
    for (const f of res) {
      const v = campo(f, q.contar_por);
      const partes = vacio(v) ? ["(vacío)"] : String(v).split(/\s*,\s*/);
      for (const p of partes) conteo[p] = (conteo[p] ?? 0) + 1;
    }
  }
  const mostrar = [...new Set([...(q.condiciones ?? []).map((c) => c.columna), ...(q.mostrar ?? []), ...(q.contar_por ? [q.contar_por] : [])])].filter(
    (c) => !["nombre", "cliente", "grupo", "tablero"].includes(norm(c)),
  );
  const limite = Math.max(1, Math.min(q.limite ?? 40, 100));
  return {
    total: res.length,
    conteo,
    avisos,
    items: res.slice(0, limite).map((f) => ({
      id: f.id,
      nombre: f.nombre,
      tablero: f.tableroNombre,
      grupo: f.grupo,
      campos: Object.fromEntries(
        mostrar.map((c) => {
          const v = campo(f, c) ?? null;
          return [c, typeof v === "string" && v.length > 300 ? v.slice(0, 300) + "…" : v];
        }),
      ),
    })),
  };
}
