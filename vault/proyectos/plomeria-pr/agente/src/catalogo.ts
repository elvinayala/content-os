/**
 * Catálogo único de lo que Resuelto vende (27/sep/2026, Elvin: "que el agente venda handyman y electricidad"):
 * plomería (data/menu.json) + los oficios nuevos (data/menus-oficios.json, precios aprobados por Elvin).
 * Cada servicio lleva su `categoria`: la oferta sale solo a los técnicos de esa categoría y territorio, y solo se vende
 * donde hay un técnico ACTIVO de esa categoría (activoDe en proveedores.ts). Aire acondicionado está en el catálogo
 * pero en pausa (27/sep): sin técnicos, el agente lo manda a lista de espera.
 */
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "./almacen.js";

export type Categoria = "plomeria" | "aire" | "handyman" | "electricidad";
export const NOMBRE_CATEGORIA: Record<Categoria, string> = { plomeria: "Plomería", aire: "Aire acondicionado", handyman: "Handyman", electricidad: "Electricidad" };
/** Cómo se le dice al técnico de cada categoría (en mensajes al cliente y al equipo). */
export const TECNICO_DE: Record<Categoria, string> = { plomeria: "plomero licenciado", aire: "técnico de aire licenciado", handyman: "handyman registrado en DACO", electricidad: "perito electricista licenciado" };

export interface ServicioCat { id: string; nombre: string; nivel: "P" | "M" | "G"; precio?: number; rango?: [number, number]; cotizacion?: boolean; nota?: string; alias: string[]; categoria: Categoria; garantia_dias?: number; garantia_nota?: string }

// Cómo lo pide la gente (sin acentos, en minúscula: la búsqueda normaliza). Ojo con choques con plomería:
// "llave" es de agua (plomería); la de la puerta es "cerradura"/"llavín".
const ALIAS: Record<string, string[]> = {
  "aire-diagnostico": ["aire no enfria", "no enfria", "aire acondicionado", "el aire", "split", "consola", "hace ruido el aire", "a/c"],
  "aire-mantenimiento": ["mantenimiento del aire", "mantenimiento de aire", "limpieza del aire", "limpiar el aire", "limpiar split", "limpieza de split", "lavar el aire", "mantenimiento del split"],
  "aire-mantenimiento-adicional": ["otro split", "dos splits", "varios aires", "dos aires", "tres aires"],
  "aire-drenaje": ["aire gotea", "gotea el split", "drenaje del aire", "split gotea"],
  "aire-instalacion-12": ["instalar aire", "instalar split", "instalacion de aire", "instalar un aire", "mini split", "12000", "12,000"],
  "aire-instalacion-24": ["18000", "24000", "18,000", "24,000"],
  "aire-desinstalar": ["desinstalar", "quitar el aire", "mudar el aire"],
  "aire-fuga": ["gas del aire", "recarga", "fuga de gas", "freon"],
  "hm-tv": ["tv", "television", "televisor", "montar tv", "colgar tv", "guindar tv", "montar la tele"],
  "hm-mueble": ["armar", "ensamblar", "mueble", "gavetero", "mesa de noche", "silla"],
  "hm-mueble-grande": ["cama", "closet", "escritorio", "ropero", "armario"],
  "hm-colgar": ["cuadro", "espejo", "repisa", "colgar", "guindar"],
  "hm-cortinas": ["cortina", "blinds", "persiana"],
  "hm-cerradura": ["cerradura", "manija", "llavin", "perilla", "cerrojo"],
  "hm-puerta": ["puerta roza", "puerta no cierra", "ajustar puerta", "puerta pega", "arreglar puerta"],
  "hm-drywall": ["hueco en la pared", "drywall", "pared rota", "parchar", "hoyo en la pared"],
  "hm-silicon": ["silicon", "sellar la banera", "sellar ducha", "sellador", "sellar"],
  "hm-hora": ["handyman", "varios arreglos", "arreglitos", "por hora", "chiripas"],
  "el-diagnostico": ["breaker", "se dispara", "no hay luz", "corto circuito", "electricidad", "electricista", "perito", "se va la luz"],
  "el-receptaculo": ["receptaculo", "enchufe", "interruptor", "switch", "toma corriente", "tomacorriente"],
  "el-gfci": ["gfci"],
  "el-lampara": ["lampara", "luminaria", "luz del techo", "plafon"],
  "el-abanico": ["abanico", "ventilador de techo"],
  "el-receptaculo-nuevo": ["receptaculo nuevo", "enchufe nuevo", "toma nueva", "poner un enchufe"],
  "el-220": ["220", "secadora", "linea de 220", "conectar calentador electrico"],
  "el-generador": ["generador", "planta electrica", "transfer switch", "bateria", "placas solares", "inversor"],
};

const nivelDe = (p?: number): "P" | "M" | "G" => (p == null ? "M" : p < 200 ? "P" : p < 500 ? "M" : "G");
const MENU = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "menu.json"), "utf8"));
const OFI = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "menus-oficios.json"), "utf8")).oficios as Record<string, { servicios: any[] }>;

export const CATALOGO: ServicioCat[] = [
  ...MENU.servicios.map((s: any) => ({ ...s, alias: s.alias ?? [], categoria: "plomeria" as Categoria })),
  ...Object.entries(OFI).flatMap(([cat, o]) => o.servicios.map((s) => ({ ...s, nivel: nivelDe(s.precio ?? s.rango?.[0]), alias: ALIAS[s.id] ?? [], categoria: cat as Categoria }))),
];
export const servicioPorId = (id: string) => CATALOGO.find((s) => s.id === id);
export const esCategoria = (c: unknown): c is Categoria => typeof c === "string" && c in NOMBRE_CATEGORIA;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
/** Los 3 servicios que mejor corresponden a lo que dijo el cliente, de cualquier oficio. Pura (tests). */
export function buscar(problema: string, catalogo: ServicioCat[] = CATALOGO): ServicioCat[] {
  const p = norm(problema);
  const puntos = (s: ServicioCat) => {
    let pts = 0;
    for (const a of s.alias) if (p.includes(norm(a))) pts += 3 + norm(a).length / 10;
    for (const w of norm(s.nombre).split(/\s+/)) if (w.length > 3 && p.includes(w)) pts += 1;
    return pts;
  };
  return catalogo.map((s) => ({ s, pts: puntos(s) })).filter((x) => x.pts > 0).sort((a, b) => b.pts - a.pts).slice(0, 3).map((x) => x.s);
}

/** Garantía de mano de obra de un servicio (30/sep, Elvin: destapes 30 días; lo demás, los meses del menú). Pura. */
export function garantiaDe(servicioId: string | undefined, mesesGeneral = MENU.garantia_meses as number): { dias: number | null; meses: number | null; texto: string; nota: string | null } {
  const s = servicioId ? servicioPorId(servicioId) : undefined;
  if (s?.garantia_dias) return { dias: s.garantia_dias, meses: null, texto: `${s.garantia_dias} días`, nota: s.garantia_nota ?? null };
  return { dias: null, meses: mesesGeneral, texto: `${mesesGeneral} meses`, nota: null };
}
