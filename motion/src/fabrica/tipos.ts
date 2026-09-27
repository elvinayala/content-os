// Guion de un anuncio de la fábrica = marca + formato + escenas. Las escenas son datos: la
// fábrica (escenas.tsx) sabe dibujar cada tipo en vertical (9:16) u horizontal (16:9).
// Texto con *asteriscos* = palabra resaltada con el color de la marca.
import type { MarcaId } from "./temas";

export type Formato = "9:16" | "16:9";

export type Escena = { dur: number } & (
  | { tipo: "gancho"; lineas: string[]; sub?: string; alarma?: boolean; etiqueta?: string; logo?: boolean }
  | { tipo: "numero"; etiqueta: string; desde: number; hasta: number; prefijo?: string; sufijo?: string; antes?: string; quien?: string; nota?: string }
  | { tipo: "notificaciones"; lineas: string[]; hora: string; items: { titulo: string; detalle: string; hora: string; icono?: "llamada" | "mensaje"; color?: string }[] }
  | { tipo: "comparativa"; titulo: string; filas: { nombre: string; precio: string; barra: number; tuyo?: boolean; detalle?: string }[]; nota?: string }
  | { tipo: "pasos"; titulo: string; pasos: string[] }
  | { tipo: "chat"; titulo: string; nombre: string; burbujas: { de: "cliente" | "agente"; texto: string; en: number }[]; hora?: string }
  | { tipo: "llamada"; titulo: string; quien: string; etiqueta: string }
  | { tipo: "flyers"; titulo: string; prompt: string; piezas: { titulo: string; sub: string }[] }
  | { tipo: "aprobacion"; titulo: string; campana: string; detalle: string; presupuesto: string }
  | { tipo: "embudo"; titulo: string; etapas: string[]; fuga: string }
  | { tipo: "casos"; titulo: string; casos: { nombre: string; desde: number; hasta: number }[]; nota?: string }
  | { tipo: "roles"; titulo: string; roles: string[]; sub?: string }
  | { tipo: "cita"; texto: string; autor: string; rol: string }
  | { tipo: "rompecabezas"; antes: string; despues: string; piezas: string[] }
  | { tipo: "dato"; grande: string; texto: string; fuente?: string }
  | { tipo: "semanas"; titulo: string; semanas: number }
  | { tipo: "lista"; titulo: string; items: { texto: string; monto?: string }[]; modo: "tachar" | "marcar" | "sumar"; total?: { etiqueta: string; prefijo?: string; hasta: number; sufijo?: string } }
  | { tipo: "voz"; orden: string; respuesta: string; evento?: { titulo: string; cuando: string } }
  | { tipo: "agenda"; pregunta: string; dia: string; items: { hora: string; texto: string }[] }
  | { tipo: "cierre"; cta: string; sub?: string; url?: string; nota?: string }
);

export type Anuncio = {
  id: string; // también el nombre del archivo
  marca: MarcaId;
  formato: Formato;
  titulo: string; // para la bandeja
  angulo: string;
  escenas: Escena[];
  /** Tomas de video (B-roll cinematográfico, p. ej. de Higgsfield) detrás del texto, en frames globales. */
  tomas?: { archivo: string; desde: number; dur: number; velo?: number }[];
};
