/**
 * Registro y flujo de la firma electrónica: el equipo crea un enlace (/admin/firmas) → el plomero lo abre en el
 * celular, completa, crea su firma e iniciales, inicia cada página y firma → se genera el PDF final con certificado,
 * se guarda en el volumen (data/estado/firmas/) y se avisa a la reclutadora (Slack), a Elvin (Telegram) y a GHL.
 * Resuelto firma al EMITIR el enlace (Elvin Ayala, fundador): quien lo crea lo hace en nombre de Resuelto.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "../almacen.js";
import { config } from "../config.js";
import { plantilla, llenar, certificado, sha256, validarDatos, imagenValida, partes, CAMPOS, type TipoContrato, type DatosFirma } from "./documento.js";
import { htmlAPdf } from "./pdf.js";
import { dmSlack } from "../integraciones/slack.js";
import { upsertContacto, agregarNota } from "../integraciones/crm.js";
import { avisarCoordinador } from "../canales/whatsapp.js";

const DIR = path.join(RAIZ, "data", "estado");
const ARCHIVO = path.join(DIR, "firmas.json");
const DIR_PDF = path.join(DIR, "firmas");

export interface Firma {
  id: string; token: string; tipo: TipoContrato;
  nombre: string; telefono: string; municipio?: string;
  estado: "pendiente" | "firmado" | "anulado";
  emitido: { en: string; por: string };
  abierto?: { en: string; ip: string };
  firmado?: { en: string; ip: string; ua: string; datos: DatosFirma; hashContenido: string; hashPdf: string; archivo: string };
}

const leer = (): Firma[] => { try { return JSON.parse(fs.readFileSync(ARCHIVO, "utf8")); } catch { return []; } };
function guardar(lista: Firma[]) { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(ARCHIVO + ".tmp", JSON.stringify(lista, null, 2)); fs.renameSync(ARCHIVO + ".tmp", ARCHIVO); }
const actualizar = (f: Firma) => { const l = leer().filter((x) => x.id !== f.id); l.push(f); guardar(l); };

export const listar = () => leer().sort((a, b) => b.emitido.en.localeCompare(a.emitido.en));
export const porToken = (t: string) => leer().find((f) => f.token.length === t.length && crypto.timingSafeEqual(Buffer.from(f.token), Buffer.from(t)));
export const enlace = (f: Firma) => `${config.urlPublica}/firmar/${f.token}`;
export const enlacePdf = (f: Firma) => `${config.urlPublica}/firmado/${f.token}.pdf`;

export function crear(d: { tipo: TipoContrato; nombre: string; telefono: string; municipio?: string; por: string }): Firma {
  const lista = leer();
  const f: Firma = { id: "F-" + String(lista.length + 1).padStart(4, "0"), token: crypto.randomBytes(18).toString("base64url"), tipo: d.tipo, nombre: d.nombre.trim(), telefono: d.telefono.replace(/\D/g, "").replace(/^(\d{10})$/, "1$1"), municipio: d.municipio?.trim() || undefined, estado: "pendiente", emitido: { en: new Date().toISOString(), por: d.por } };
  lista.push(f); guardar(lista); return f;
}

/** Lo que ve el celular al abrir el enlace (y se anota la primera apertura). */
export function abrir(f: Firma, ip: string) {
  if (!f.abierto && f.estado === "pendiente") { f.abierto = { en: new Date().toISOString(), ip }; actualizar(f); }
  const { css, hojas } = partes(plantilla(f.tipo));
  const tel = f.telefono.replace(/^1(?=\d{10}$)/, "");
  return { tipo: f.tipo, estado: f.estado, nombre: f.nombre, previos: { nombre: f.nombre, telefono: tel, municipio: f.municipio ?? "" }, campos: CAMPOS[f.tipo], css, hojas, pdf: f.estado === "firmado" ? enlacePdf(f) : null };
}

export async function firmar(f: Firma, cuerpo: any, meta: { ip: string; ua: string }): Promise<{ ok: true; pdf: string } | { ok: false; error: string }> {
  if (f.estado !== "pendiente") return { ok: false, error: f.estado === "firmado" ? "Este contrato ya está firmado." : "Este enlace ya no es válido." };
  const v = validarDatos(f.tipo, cuerpo?.datos);
  if (!v.ok) return v;
  if (!imagenValida(cuerpo?.firma)) return { ok: false, error: "Falta tu firma." };
  if (!imagenValida(cuerpo?.iniciales)) return { ok: false, error: "Faltan tus iniciales." };
  if (cuerpo?.acepto !== true) return { ok: false, error: "Tienes que aceptar firmar electrónicamente." };
  const base = plantilla(f.tipo);
  const hojas = partes(base).hojas.map((h) => h.n);
  const iniciadas: number[] = [...new Set<number>((Array.isArray(cuerpo?.hojasIniciadas) ? cuerpo.hojasIniciadas : []).map(Number))].sort((a, b) => a - b);
  if (hojas.some((n) => !iniciadas.includes(n))) return { ok: false, error: "Falta poner tus iniciales en alguna página." };

  const en = new Date().toISOString();
  const lleno = llenar(f.tipo, base, v.datos, { firmante: cuerpo.firma, resuelto: { nombre: "Elvin Ayala", cargo: "fundador", en: f.emitido.en } }, en);
  const hashContenido = sha256(lleno + cuerpo.firma + cuerpo.iniciales);
  const conCertificado = lleno.replace("</body>", certificado({ id: f.id, tipo: f.tipo, nombre: v.datos.nombre, telefono: v.datos.telefono, emitido: f.emitido, abierto: f.abierto, firmado: { en, ip: meta.ip, ua: meta.ua }, hojasIniciadas: iniciadas, hashContenido }) + "</body>");
  const pdf = await htmlAPdf(conCertificado, { pie: `${f.id} · ${f.tipo === "plomero" ? "Acuerdo de afiliación de plomero" : "Acuerdo de ayudante"} · firmado electrónicamente`, iniciales: cuerpo.iniciales });
  fs.mkdirSync(DIR_PDF, { recursive: true });
  const archivo = path.join(DIR_PDF, `${f.id}.pdf`);
  fs.writeFileSync(archivo, pdf);
  Object.assign(f, { estado: "firmado", nombre: v.datos.nombre, firmado: { en, ip: meta.ip, ua: meta.ua, datos: v.datos, hashContenido, hashPdf: sha256(pdf), archivo: path.basename(archivo) } });
  actualizar(f);
  avisar(f).catch((e) => console.error("firmas: aviso", e));
  return { ok: true, pdf: enlacePdf(f) };
}

export function archivoPdf(f: Firma): string | null {
  if (f.estado !== "firmado" || !f.firmado) return null;
  const p = path.join(DIR_PDF, f.firmado.archivo);
  return fs.existsSync(p) ? p : null;
}

async function avisar(f: Firma) {
  const d = f.firmado!.datos;
  const quien = f.tipo === "plomero" ? `plomero ${d.licencia ?? ""} #${d.lic_num ?? ""}`.trim() : `ayudante · ${d.anos ?? ""} de experiencia`;
  const linea = `✍️ Contrato firmado: ${d.nombre} (${quien}) · ${d.municipio ?? ""} · ${enlacePdf(f)}`;
  await dmSlack(config.slack.reclutamiento, linea);
  await avisarCoordinador(linea);
  const contactId = await upsertContacto({ nombre: d.nombre, telefono: d.telefono || f.telefono, municipio: d.municipio, tags: ["contrato-firmado", f.tipo === "plomero" ? "plomero-firmado" : "ayudante-firmado"] });
  if (contactId) await agregarNota(contactId, `✍️ Firmó electrónicamente el ${f.tipo === "plomero" ? "Acuerdo de afiliación de plomero" : "Acuerdo de ayudante"} (${f.id}) el ${new Date(f.firmado!.en).toLocaleString("es-PR", { timeZone: config.zonaHoraria })}. PDF: ${enlacePdf(f)} · huella ${f.firmado!.hashPdf.slice(0, 16)}…`);
}
