// Papelera universal: reglas puras (tests en tests/pulse-papelera.test.mjs). La base copia cada fila
// borrada en pulse_papelera (trigger de la migración 0029); aquí se agrupa en lotes, se ordena para
// restaurar (padres antes que hijos) y se describe en español.

export const DIAS_PAPELERA = 90;
export const MINUTOS_DESHACER = 15; // quien borró puede deshacer lo suyo en este rato

export interface FilaPapelera {
  id: number;
  tabla: string;
  fila: Record<string, unknown>;
  borradoAt: string; // ISO; todo lo de una transacción comparte este valor = un lote
  borradoPor: string | null;
  restauradoAt: string | null;
}

export interface Lote {
  clave: string; // = borradoAt
  borradoAt: string;
  borradoPor: string | null;
  total: number;
  porTabla: { tabla: string; nombre: string; n: number }[];
  principal: string; // qué se borró, en palabras ("3 fichas de clientes")
  ejemplos: string[];
  restaurado: boolean;
}

// Padres primero: al restaurar, un hijo necesita que su padre ya exista (las FK). Lo que no está en
// la lista va al final; igual se reintenta en varias vueltas.
export const ORDEN_TABLAS = [
  "pulse_users",
  "pulse_boards",
  "pulse_board_members",
  "pulse_columns",
  "pulse_groups",
  "pulse_items",
  "pulse_files",
  "pulse_activity",
  "leads_embudos",
  "leads_etapas",
  "leads_tratos",
  "leads_actividades",
  "leads_historial",
  "form_formularios",
  "form_respuestas",
  "desempeno_perfiles",
  "desempeno_fichas",
  "desempeno_archivos",
];

const NOMBRES: Record<string, [string, string]> = {
  pulse_items: ["ficha", "fichas"],
  pulse_boards: ["tablero", "tableros"],
  pulse_columns: ["columna", "columnas"],
  pulse_groups: ["grupo", "grupos"],
  pulse_files: ["archivo", "archivos"],
  pulse_activity: ["comentario o cambio", "comentarios y cambios"],
  pulse_reglas: ["automatización", "automatizaciones"],
  pulse_vistas: ["vista guardada", "vistas guardadas"],
  pulse_users: ["usuario", "usuarios"],
  leads_tratos: ["lead", "leads"],
  leads_actividades: ["actividad de lead", "actividades de leads"],
  leads_historial: ["nota o mensaje de lead", "notas y mensajes de leads"],
  leads_etapas: ["etapa de embudo", "etapas de embudo"],
  leads_embudos: ["embudo", "embudos"],
  form_respuestas: ["respuesta de formulario", "respuestas de formularios"],
  form_formularios: ["formulario", "formularios"],
  desempeno_archivos: ["documento de empleado", "documentos de empleados"],
  desempeno_ausencias: ["ausencia", "ausencias"],
  desempeno_ajustes: ["ajuste de nómina", "ajustes de nómina"],
  desempeno_noticias: ["noticia", "noticias"],
  desempeno_empresa: ["sección de Empresa", "secciones de Empresa"],
  desempeno_bienestar_posts: ["publicación de Bienestar", "publicaciones de Bienestar"],
  desempeno_bienestar_comentarios: ["comentario de Bienestar", "comentarios de Bienestar"],
  desempeno_ponches: ["ponche", "ponches"],
};

export function nombreTabla(tabla: string, n = 2): string {
  const par = NOMBRES[tabla];
  if (par) return n === 1 ? par[0] : par[1];
  return tabla.replace(/^(pulse|leads|form|desempeno|autoflow|max|aib)_/, "").replace(/_/g, " ");
}

export function ordenRestaurar(tabla: string): number {
  const i = ORDEN_TABLAS.indexOf(tabla);
  return i === -1 ? ORDEN_TABLAS.length : i;
}

// Lo que identifica una fila para una persona: su nombre, título o correo.
export function resumenFila(fila: Record<string, unknown>): string {
  for (const k of ["name", "nombre", "titulo", "title", "email", "texto"]) {
    const v = fila[k];
    if (typeof v === "string" && v.trim()) return v.trim().length > 60 ? v.trim().slice(0, 58) + "…" : v.trim();
  }
  return String(fila.id ?? "—");
}

export function agruparLotes(filas: FilaPapelera[]): Lote[] {
  const mapa = new Map<string, FilaPapelera[]>();
  for (const f of filas) {
    const k = f.borradoAt;
    const arr = mapa.get(k);
    if (arr) arr.push(f);
    else mapa.set(k, [f]);
  }
  const lotes: Lote[] = [];
  for (const [clave, fs] of mapa) {
    const cuenta = new Map<string, number>();
    for (const f of fs) cuenta.set(f.tabla, (cuenta.get(f.tabla) ?? 0) + 1);
    const porTabla = [...cuenta].map(([tabla, n]) => ({ tabla, nombre: nombreTabla(tabla, n), n })).sort((a, b) => ordenRestaurar(a.tabla) - ordenRestaurar(b.tabla) || b.n - a.n);
    const top = porTabla[0];
    lotes.push({
      clave,
      borradoAt: clave,
      borradoPor: fs.find((f) => f.borradoPor)?.borradoPor ?? null,
      total: fs.length,
      porTabla,
      principal: `${top.n} ${top.nombre}`,
      ejemplos: fs.filter((f) => f.tabla === top.tabla).slice(0, 3).map((f) => resumenFila(f.fila)),
      restaurado: fs.every((f) => f.restauradoAt),
    });
  }
  return lotes.sort((a, b) => b.borradoAt.localeCompare(a.borradoAt));
}

// Quién puede restaurar un lote: admin siempre; el que lo borró, dentro de MINUTOS_DESHACER.
export function puedeRestaurar(p: { rol: string; userId: string; lote: Pick<Lote, "borradoPor" | "borradoAt">; ahora?: Date }): boolean {
  if (p.rol === "admin") return true;
  if (!p.lote.borradoPor || p.lote.borradoPor !== p.userId) return false;
  const edad = (p.ahora ?? new Date()).getTime() - new Date(p.lote.borradoAt).getTime();
  return edad >= 0 && edad <= MINUTOS_DESHACER * 60_000;
}

// Rutas de Storage que el lote se llevó (fichas de Pulse y documentos de Ritmo) para traerlas de vuelta.
export function archivosDelLote(filas: Pick<FilaPapelera, "tabla" | "fila">[]): string[] {
  return filas
    .filter((f) => f.tabla === "pulse_files" || f.tabla === "desempeno_archivos")
    .map((f) => f.fila.storage_path)
    .filter((p): p is string => typeof p === "string" && p.length > 0);
}

// Nombre de tabla seguro para SQL (viene del trigger, pero igual se valida).
export const tablaValida = (t: string) => /^[a-z][a-z0-9_]{0,62}$/.test(t);

// Ruta en la papelera de Storage: papelera/<día>/<ruta original>.
export const rutaPapelera = (path: string, dia: string) => `papelera/${dia}/${path}`;
