/** Usuarios del portal de operación (Elvin, gerente de proyectos, reclutamiento). Claves con scrypt; sesión en cookie firmada. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { RAIZ } from "../almacen.js";

export type Rol = "admin" | "gerente" | "reclutamiento";
export interface Staff { email: string; nombre: string; rol: Rol; salt: string; hash: string; activo: boolean; creado: string; ultimaEntrada?: string; temporal?: boolean }
const ARCH = path.join(RAIZ, "data", "estado", "staff.json");
const SECRETO = process.env.PORTAL_SECRETO ?? "cambiar-en-produccion";
const leer = (): Staff[] => { try { return JSON.parse(fs.readFileSync(ARCH, "utf8")); } catch { return []; } };
const guardar = (l: Staff[]) => { fs.writeFileSync(ARCH + ".tmp", JSON.stringify(l, null, 2)); fs.renameSync(ARCH + ".tmp", ARCH); };
const hashDe = (clave: string, salt: string) => crypto.scryptSync(clave, salt, 32).toString("hex");

export function listar() { return leer().map(({ salt, hash, ...r }) => r); }
export function crear(d: { email: string; nombre: string; rol: Rol; clave: string }) {
  const l = leer(); const email = d.email.trim().toLowerCase();
  if (d.clave.length < 8) throw new Error("La clave debe tener al menos 8 caracteres.");
  const salt = crypto.randomBytes(16).toString("hex");
  const u: Staff = { email, nombre: d.nombre.trim(), rol: d.rol, salt, hash: hashDe(d.clave, salt), activo: true, creado: new Date().toISOString() };
  guardar([...l.filter((x) => x.email !== email), u]); return u;
}
/** Clave nueva (temporal = al entrar le pide cambiarla). */
export function ponerClave(email: string, clave: string, temporal = false) {
  if (clave.length < 8) throw new Error("La clave debe tener al menos 8 caracteres.");
  const l = leer(); const u = l.find((x) => x.email === email.trim().toLowerCase()); if (!u) throw new Error("No existe ese usuario.");
  u.salt = crypto.randomBytes(16).toString("hex"); u.hash = hashDe(clave, u.salt); u.temporal = temporal || undefined; guardar(l); return true;
}
export function cambiarActivo(email: string, activo: boolean) { const l = leer(); const u = l.find((x) => x.email === email); if (u) { u.activo = activo; guardar(l); } }
export function autenticar(email: string, clave: string): Staff | null {
  const l = leer(); const u = l.find((x) => x.email === email.trim().toLowerCase() && x.activo);
  const salt = u?.salt ?? "0".repeat(32); const h = hashDe(clave, salt); // mismo costo exista o no (anti-enumeración)
  if (!u || !crypto.timingSafeEqual(Buffer.from(h), Buffer.from(u.hash))) return null;
  u.ultimaEntrada = new Date().toISOString(); guardar(l); return u;
}
export function crearSesion(email: string, dias = 30) {
  const exp = Date.now() + dias * 86400_000; const base = `${Buffer.from(email).toString("base64url")}.${exp}`;
  return `${base}.${crypto.createHmac("sha256", SECRETO).update("portal:" + base).digest("base64url")}`;
}
export function leerSesion(cookieHeader?: string): Staff | null {
  const v = /(?:^|;\s*)rs=([^;]+)/.exec(cookieHeader ?? "")?.[1]; if (!v) return null;
  const [e, exp, firma] = v.split("."); if (!e || !exp || !firma) return null;
  const ok = crypto.createHmac("sha256", SECRETO).update("portal:" + `${e}.${exp}`).digest("base64url");
  if (firma.length !== ok.length || !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(ok)) || Number(exp) < Date.now()) return null;
  const email = Buffer.from(e, "base64url").toString(); return leer().find((x) => x.email === email && x.activo) ?? null;
}
