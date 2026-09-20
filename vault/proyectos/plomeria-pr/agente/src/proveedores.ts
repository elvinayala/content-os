/**
 * Registro unificado de proveedores: plomeros (data/proveedores.json) + contratistas
 * verificados (almacén). Es la lista a la que se le anuncian los trabajos cerrados.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { RAIZ, almacen } from "./almacen.js";

export interface Proveedor {
  id: string;
  tipo: "plomero" | "contratista";
  nombre: string;
  whatsapp: string;
  email?: string;
  categorias: string[];       // "plomeria" o ids de categorias-proyectos.json
  territorios: string[];      // ids T1..T8; los contratistas usan municipios → se mapean a territorio
  estado: "activo" | "verified" | "preferido" | "pausado";
  calendar_id?: string;
}

const cfgPath = path.join(RAIZ, "data", "proveedores.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8")) as { tiempo_para_aceptar_min: { trabajo: number; proyecto: number }; proveedores: Proveedor[] };
export const TIEMPO_ACEPTAR_MIN = cfg.tiempo_para_aceptar_min;

const territorios = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "territorios.json"), "utf8")) as { territorios: { id: string; municipios: string[] }[] };
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
export function territorioDe(municipio: string): string | undefined {
  const m = norm(municipio);
  return territorios.territorios.find((t) => t.municipios.some((x) => norm(x) === m || m.includes(norm(x))))?.id;
}

/** Todos los proveedores vigentes: los del JSON + contratistas verified/preferido del almacén. */
export function listar(): Proveedor[] {
  const contratistas: Proveedor[] = almacen.contratistas()
    .filter((c) => c.estado === "verified" || c.estado === "preferido")
    .map((c) => ({ id: c.id, tipo: "contratista", nombre: c.nombre, whatsapp: c.whatsapp, email: undefined, categorias: c.categorias, territorios: c.zonas.map(territorioDe).filter((t): t is string => !!t), estado: c.estado as "verified" | "preferido" }));
  return [...cfg.proveedores.filter((p) => p.estado !== "pausado"), ...contratistas];
}

export function porId(id: string) { return listar().find((p) => p.id === id); }
export function porWhatsapp(numero: string) { const n = numero.replace(/\D/g, ""); return listar().find((p) => p.whatsapp.replace(/\D/g, "") === n); }

/** Elegibles para una oferta: misma categoría y mismo territorio. Preferidos primero (se les avisa igual a todos). */
export function elegibles(o: { categoria: string; territorio?: string }): Proveedor[] {
  return listar()
    .filter((p) => p.categorias.includes(o.categoria) && (!o.territorio || p.territorios.includes(o.territorio)))
    .sort((a, b) => (a.estado === "preferido" ? -1 : 0) - (b.estado === "preferido" ? -1 : 0));
}

// ── Acceso al portal: enlace mágico firmado (sin contraseñas) ──
const SECRETO = process.env.PORTAL_SECRETO ?? "cambiar-en-produccion";
export function firmar(proveedorId: string) { return crypto.createHmac("sha256", SECRETO).update(proveedorId).digest("hex").slice(0, 24); }
export function verificarFirma(proveedorId: string, firma: string) {
  const ok = firmar(proveedorId);
  return firma.length === ok.length && crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(ok));
}
export function linkPortal(proveedorId: string, base: string) { return `${base}/proveedores?p=${encodeURIComponent(proveedorId)}&k=${firmar(proveedorId)}`; }
