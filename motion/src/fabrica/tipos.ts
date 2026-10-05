// Guion de un anuncio de la fábrica = marca + formato + escenas. Las escenas son datos: la
// fábrica (escenas.tsx) sabe dibujar cada tipo en vertical (9:16) u horizontal (16:9).
// Texto con *asteriscos* = palabra resaltada con el color de la marca.
import type { MarcaId } from "./temas";
import type { TemaCliente } from "./cliente";

export type Formato = "9:16" | "16:9" | "1:1";

/** Un paso de la escena "navegar". Coordenadas en fracción de la captura (0-1). */
export type PasoNav = { imagen: string; dur: number; cursor?: { x: number; y: number } | null; clic?: boolean; zoom?: { x: number; y: number; w: number; h: number } | null };

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
  | { tipo: "pantalla"; titulo: string; sub?: string; imagen: string; dispositivo: "laptop" | "telefono"; puntos?: string[];
      /** Zona a la que acerca la cámara, en fracción de la captura (0-1). */
      foco?: { x: number; y: number; w: number; h: number } }
  /** Recorrido "navegando" la app en una laptop: cada paso es una captura REAL; el cursor va al botón, hace clic y la
   *  cámara se acerca a `zoom`. La suma de `pasos[].dur` es la duración de la escena (usar `navegar()` en anuncios.ts). */
  | { tipo: "navegar"; titulo: string; sub?: string; puntos?: string[]; pasos: PasoNav[] }
  | { tipo: "grafico"; titulo: string; sub?: string; par: string; modo: "autopilot" | "radar"; puntos?: string[] }
  | { tipo: "terminal"; titulo?: string; ventana: string; lineas: { t: string; tipo?: "ok" | "alerta" | "dim" | "info" }[] }
  /** Foto REAL de la persona/negocio (con su OK) con Ken Burns + titular y puntos al lado (16:9) o debajo (9:16). */
  | { tipo: "retrato"; foto: string; titulo: string; etiqueta?: string; puntos?: string[]; lado?: "izq" | "der"; enfoque?: string }
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
  /** Pista distinta a la de la marca (p. ej. una más larga para videos de 60 s). */
  musica?: string;
  /** Dirección de arte (estilos.tsx): neon · editorial · impacto · minimal · pop · tecno · "auto". Sin él = neon. */
  estilo?: import("./estilos").EstiloId | "auto";
  /** Marca de un CLIENTE (logo, colores, fuente) armada desde JSON: si viene, manda sobre `marca`. */
  cliente?: TemaCliente;
  /** Barrido en TODOS los cortes (con el estilo por defecto los impares son solo un destello, que entre dos pantallas
   *  deja un cuadro vacío y la laptop "salta"). Para recorridos/tutoriales con muchas pantallas seguidas. */
  barridoSiempre?: boolean;
};
