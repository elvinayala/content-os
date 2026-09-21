// Tipos de Pulse (el CRM que reemplaza a Monday). Compartidos entre server y client.
// El modelo es genérico tipo Monday: tableros → columnas (tipo + settings) → grupos →
// items con `values` = { [columnId]: ValorCelda }.

export const NOMBRE_APP = "Pulse";
export const SUBTITULO_APP = "Level Up Media";

export type TipoColumna =
  | "text"
  | "long_text"
  | "number"
  | "status"
  | "dropdown"
  | "date"
  | "people"
  | "checkbox"
  | "link"
  | "email"
  | "phone"
  | "file"
  | "relation";

export const TIPOS_COLUMNA: { tipo: TipoColumna; nombre: string; descripcion: string }[] = [
  { tipo: "text", nombre: "Texto", descripcion: "Una línea de texto" },
  { tipo: "long_text", nombre: "Texto largo", descripcion: "Notas, comentarios, historial" },
  { tipo: "number", nombre: "Número", descripcion: "Montos, cantidades" },
  { tipo: "status", nombre: "Estado", descripcion: "Una etiqueta de color" },
  { tipo: "dropdown", nombre: "Lista", descripcion: "Varias etiquetas" },
  { tipo: "date", nombre: "Fecha", descripcion: "Un día" },
  { tipo: "people", nombre: "Personas", descripcion: "Responsables del equipo" },
  { tipo: "checkbox", nombre: "Casilla", descripcion: "Sí / no" },
  { tipo: "link", nombre: "Enlace", descripcion: "URL con texto" },
  { tipo: "email", nombre: "E-mail", descripcion: "Correo electrónico" },
  { tipo: "phone", nombre: "Teléfono", descripcion: "Número de teléfono" },
  { tipo: "file", nombre: "Archivo", descripcion: "PDFs, imágenes" },
  { tipo: "relation", nombre: "Relación", descripcion: "Elementos de otro tablero" },
];

// Los 20 colores de Monday (mismo var_name) para que la migración mapee directo.
export type ColorPulse =
  | "green"
  | "bright_green"
  | "yellow"
  | "orange"
  | "dark_orange"
  | "red"
  | "dark_red"
  | "pink"
  | "purple"
  | "dark_purple"
  | "indigo"
  | "blue"
  | "bright_blue"
  | "dark_blue"
  | "aqua"
  | "teal"
  | "river"
  | "brown"
  | "grey"
  | "dark_grey";

export interface EtiquetaStatus {
  id: string;
  label: string;
  color: ColorPulse;
  esDone?: boolean;
}

export interface SettingsColumna {
  labels?: EtiquetaStatus[]; // status, dropdown
  formato?: "moneda" | "entero" | "decimal"; // number
  boardId?: string; // relation → tablero destino
  multiple?: boolean; // people, relation, dropdown
}

export type ValorLink = { url: string; text?: string };

// text/long_text/email/phone/date("YYYY-MM-DD") → string · number → number ·
// checkbox → boolean · status → id de etiqueta · dropdown/people/relation/file → string[] ·
// link → { url, text }
export type ValorCelda = string | number | boolean | string[] | ValorLink | null;

// admin: todo. editor: todo menos eliminar tableros y tocar admins (puede dar de alta gente).
// miembro: usa los tableros.
export type RolUsuario = "admin" | "editor" | "miembro";
export const NOMBRE_ROL: Record<RolUsuario, string> = { admin: "Admin", editor: "Editor", miembro: "Miembro" };
export function puedeGestionarUsuarios(rol: RolUsuario): boolean {
  return rol === "admin" || rol === "editor";
}

export interface UsuarioPulse {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
  color: ColorPulse | null;
  tieneClave: boolean;
}

export interface Board {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  color: ColorPulse | null;
  position: number;
}

export interface Columna {
  id: string;
  boardId: string;
  title: string;
  type: TipoColumna;
  settings: SettingsColumna;
  position: number;
  width: number;
}

export interface Grupo {
  id: string;
  boardId: string;
  title: string;
  color: ColorPulse;
  position: number;
  colapsadoDefault: boolean;
}

export interface Item {
  id: string;
  boardId: string;
  groupId: string;
  name: string;
  position: number;
  values: Record<string, ValorCelda>;
  updatedAt: string; // ISO
  parcial?: boolean; // true = vino sin `values` (grupo colapsado); se cargan al abrir el grupo
}

export interface ArchivoPulse {
  id: string;
  itemId: string;
  columnId: string;
  nombre: string;
  mime: string | null;
  bytes: number | null;
}

export type TipoActividad = "crear" | "valor" | "nombre" | "mover" | "eliminar" | "comentario";

export interface Actividad {
  id: string;
  itemId: string;
  columnId: string | null;
  tipo: TipoActividad;
  before: unknown;
  after: unknown;
  at: string; // ISO
  usuario: { id: string; nombre: string; color: ColorPulse | null } | null;
}

export interface BoardCompleto {
  board: Board;
  columns: Columna[];
  groups: Grupo[];
  items: Item[];
  usuarios: UsuarioPulse[];
  archivos: ArchivoPulse[];
}

export type Vista = "tabla" | "kanban" | "tarjetas";
