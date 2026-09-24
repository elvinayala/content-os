/**
 * Biblioteca de creativos ya producidos (viven públicos en resueltopr.com). Nina los reutiliza y los combina
 * con piezas que ella misma genera (render.ts). Los reels SOLO salen de aquí: no se generan videos en el servidor.
 */
import type { Pilar, Formato } from "./identidad.js";

export interface Creativo {
  id: string;
  formato: Formato;
  pilar: Pilar;
  /** URLs públicas (1 para post/reel, 2–10 para carrusel). */
  urls: string[];
  /** De qué habla, para que el caption lo acompañe. */
  tema: string;
  /** Público al que le habla. */
  para: "clientes" | "plomeros" | "contratistas" | "todos";
}

const BASE = "https://resueltopr.com";
const u = (p: string) => BASE + p;

export const BIBLIOTECA: Creativo[] = [
  // Feed de lanzamiento
  { id: "f01", formato: "post", pilar: "mentalidad", urls: [u("/feed/f01-hola.png")], tema: "Hola, somos Resuelto: plomería con precio fijo en PR", para: "todos" },
  { id: "f02", formato: "post", pilar: "producto", urls: [u("/feed/f02-garantia.png")], tema: "Garantía de 12 meses por escrito", para: "clientes" },
  { id: "f03", formato: "carrusel", pilar: "solucion", urls: [1, 2, 3, 4, 5].map((n) => u(`/feed/f03-como-${n}.png`)), tema: "Cómo funciona Resuelto en 4 pasos: escribes, precio, agendamos, va un licenciado", para: "clientes" },
  // Clientes
  { id: "c1", formato: "post", pilar: "producto", urls: [u("/flyers/c1-menu-precios.png")], tema: "Menú de precios: destape desde $149, precio antes de ir", para: "clientes" },
  { id: "c2", formato: "post", pilar: "mentalidad", urls: [u("/flyers/c2-promesa.png")], tema: "La promesa: precio antes de ir, ventana de 2 h, garantía", para: "clientes" },
  { id: "c3", formato: "post", pilar: "producto", urls: [u("/flyers/c3-destape.png")], tema: "Destape de fregadero/ducha a precio fijo", para: "clientes" },
  { id: "c4", formato: "post", pilar: "solucion", urls: [u("/flyers/c4-cisterna.png")], tema: "Cisterna: revisión y mantenimiento", para: "clientes" },
  { id: "c8", formato: "post", pilar: "problema", urls: [u("/flyers/c8-el-problema.png")], tema: "El problema: el plomero que no llega y el precio que cambia", para: "clientes" },
  { id: "c9", formato: "post", pilar: "producto", urls: [u("/flyers/c9-sin-sorpresas.png")], tema: "Sin sorpresas en la factura", para: "clientes" },
  { id: "c10", formato: "post", pilar: "problema", urls: [u("/flyers/c10-calentador.png")], tema: "Calentador dañado: el clásico del sábado en la noche", para: "clientes" },
  { id: "c11", formato: "post", pilar: "problema", urls: [u("/flyers/c11-factura-agua.png")], tema: "La fuga que se ve en la factura de la AAA", para: "clientes" },
  { id: "c12", formato: "post", pilar: "producto", urls: [u("/flyers/c12-b2b.png")], tema: "Condominios y Airbnb: plomería con cuenta y factura", para: "clientes" },
  { id: "c13", formato: "post", pilar: "solucion", urls: [u("/flyers/c13-arreglalo-tu.png")], tema: "Arréglalo tú: cuándo sí y cuándo llamar", para: "clientes" },
  { id: "c14", formato: "post", pilar: "solucion", urls: [u("/flyers/c14-que-cisterna.png")], tema: "Guía: qué cisterna te conviene", para: "clientes" },
  // Plomeros (reclutamiento) — en TODO Puerto Rico
  // p01 y p02 fuera (23/sep/2026): cifras de pago a plomeros = señal de estafa para Meta. No volver a usarlos.
  // { id: "p01", formato: "post", pilar: "producto", urls: [u("/flyers/01-cuanto-ganas.png")], tema: "Plomeros: esto es lo que darías con nosotros ($1,950/semana)", para: "plomeros" },
  // { id: "p02", formato: "post", pilar: "producto", urls: [u("/flyers/02-el-trato.png")], tema: "El trato: 65% de la mano de obra, pago los viernes, $0 publicidad", para: "plomeros" },
  { id: "p03", formato: "post", pilar: "producto", urls: [u("/flyers/03-buscamos-10.png")], tema: "Buscamos plomeros licenciados en toda la isla", para: "plomeros" },
  // Contratistas
  { id: "k1", formato: "post", pilar: "producto", urls: [u("/flyers/k1-vendemos-el-proyecto.png")], tema: "Contratistas: nosotros vendemos el proyecto, tú lo ejecutas", para: "contratistas" },
  { id: "k3", formato: "post", pilar: "mentalidad", urls: [u("/flyers/k3-verified.png")], tema: "Resuelto Verified: contratistas con DACO y garantía", para: "contratistas" },
  // Reels
  { id: "r-plomeros", formato: "reel", pilar: "producto", urls: [u("/videos/resuelto-plomeros-15s-audio.mp4")], tema: "Tú haces la plomería, nosotros hacemos el resto (plomeros)", para: "plomeros" },
  { id: "r-clientes", formato: "reel", pilar: "producto", urls: [u("/videos/resuelto-clientes-15s.mp4")], tema: "Precio antes de ir: así funciona Resuelto (clientes)", para: "clientes" },
  { id: "r-contratistas", formato: "reel", pilar: "producto", urls: [u("/videos/resuelto-contratistas-15s.mp4")], tema: "Contratistas: proyectos vendidos, tú ejecutas", para: "contratistas" },
];
