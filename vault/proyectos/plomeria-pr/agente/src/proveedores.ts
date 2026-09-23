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
  estado: "activo" | "verified" | "preferido" | "pausado" | "pendiente";
  calendar_id?: string;
  municipio?: string;
  licencia?: string;          // "maestro 1234" / "oficial 5678"
  alta?: string;              // ISO de cuando se dio de alta
}

const cfgPath = path.join(RAIZ, "data", "proveedores.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8")) as { tiempo_para_aceptar_min: { trabajo: number; proyecto: number }; proveedores: Proveedor[] };
export const TIEMPO_ACEPTAR_MIN = cfg.tiempo_para_aceptar_min;

// ── Registro de plomeros en el VOLUMEN (data/estado/plomeros.json): se dan de alta sin redesplegar ──
// Se siembra una vez desde data/proveedores.json; los que tienen datos de relleno entran como "pendiente"
// (no reciben trabajos ni cuentan para la cobertura).
const REG = path.join(RAIZ, "data", "estado", "plomeros.json");
const esRelleno = (p: Proveedor) => /^1787000000$/.test(p.whatsapp.replace(/\D/g, "")) || (p as any).licencia === "PENDIENTE";
function leerRegistro(): Proveedor[] {
  if (!fs.existsSync(REG)) {
    const semilla = cfg.proveedores.map((p) => (esRelleno(p) ? { ...p, estado: "pendiente" as const } : p));
    fs.mkdirSync(path.dirname(REG), { recursive: true });
    fs.writeFileSync(REG, JSON.stringify(semilla, null, 2));
  }
  return JSON.parse(fs.readFileSync(REG, "utf8")) as Proveedor[];
}
function guardarRegistro(list: Proveedor[]) { fs.writeFileSync(REG + ".tmp", JSON.stringify(list, null, 2)); fs.renameSync(REG + ".tmp", REG); }
/** Todos los plomeros del registro, en cualquier estado (para el admin). */
export function plomeros(): Proveedor[] { return leerRegistro(); }
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
/** Da de alta (o reactiva) un plomero. El territorio sale del municipio. */
export function altaPlomero(d: { nombre: string; whatsapp: string; municipio: string; licencia?: string; email?: string; territoriosExtra?: string[] }): Proveedor {
  const list = leerRegistro();
  const wa = d.whatsapp.replace(/\D/g, "").replace(/^(\d{10})$/, "1$1");
  const existente = list.find((p) => p.whatsapp.replace(/\D/g, "") === wa);
  const t = territorioDe(d.municipio);
  const territorios = [...new Set([t, ...(d.territoriosExtra ?? [])].filter((x): x is string => !!x))];
  if (existente) {
    Object.assign(existente, { nombre: d.nombre, municipio: d.municipio, licencia: d.licencia ?? existente.licencia, email: d.email ?? existente.email, territorios: territorios.length ? territorios : existente.territorios, estado: "activo" });
    guardarRegistro(list); return existente;
  }
  let id = slug(d.nombre.split(" ").slice(0, 2).join(" ")) || "plomero"; let n = 2;
  while (list.some((p) => p.id === id)) id = `${slug(d.nombre)}-${n++}`;
  const p: Proveedor = { id, tipo: "plomero", nombre: d.nombre, whatsapp: wa, email: d.email, categorias: ["plomeria"], territorios, estado: "activo", municipio: d.municipio, licencia: d.licencia, alta: new Date().toISOString() };
  list.push(p); guardarRegistro(list); return p;
}
export function cambiarEstadoPlomero(id: string, estado: Proveedor["estado"]) {
  const list = leerRegistro(); const p = list.find((x) => x.id === id); if (!p) return undefined;
  p.estado = estado; guardarRegistro(list); return p;
}
/** Plomero activo que cubre un territorio (el primero; la oferta igual sale a todos los del territorio). */
export function plomeroActivoDe(territorioId: string): Proveedor | undefined {
  return leerRegistro().find((p) => p.estado === "activo" && p.categorias.includes("plomeria") && p.territorios.includes(territorioId));
}

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
  return [...leerRegistro().filter((p) => p.estado !== "pausado" && p.estado !== "pendiente"), ...contratistas];
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
