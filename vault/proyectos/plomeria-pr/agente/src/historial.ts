/**
 * Historial PERMANENTE por contacto (append-only, un .jsonl por contacto en el volumen).
 * La conversación que usa el agente se recorta a 40 turnos; esto no se recorta nunca: es lo que el gerente de
 * proyectos lee en el portal meses después (garantías, reclamos, "qué le dijimos").
 */
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "./almacen.js";

const DIR = path.join(RAIZ, "data", "estado", "historial");
fs.mkdirSync(DIR, { recursive: true });
export type Autor = "cliente" | "resuelto" | "humano" | "plomero" | "sistema" | "staff";
export interface Evento { fecha: string; autor: Autor; texto: string; ref?: string }
const archivo = (contactoId: string) => path.join(DIR, contactoId.replace(/[^a-zA-Z0-9_.:-]/g, "_").replace(/:/g, "__") + ".jsonl");

export function archivar(contactoId: string, autor: Autor, texto: string, ref?: string) {
  if (!contactoId || !texto?.trim()) return;
  const e: Evento = { fecha: new Date().toISOString(), autor, texto: texto.trim().slice(0, 4000), ...(ref ? { ref } : {}) };
  try { fs.appendFileSync(archivo(contactoId), JSON.stringify(e) + "\n"); } catch (err) { console.error("historial", err); }
}
export function leerHistorial(contactoId: string, limite = 300): Evento[] {
  try { return fs.readFileSync(archivo(contactoId), "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as Evento).slice(-limite); } catch { return []; }
}
