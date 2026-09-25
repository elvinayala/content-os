/**
 * Firma electrónica propia de Resuelto (23/sep/2026, pedido de Elvin: "sin DocuSign, algo básico pero bien hecho").
 * Parte pura: llenar la plantilla del contrato (kit/afiliacion/generar.py → data/plantillas/contrato-<tipo>.html)
 * con los datos, las firmas y las iniciales; validar lo que manda el celular; armar la hoja de certificado.
 *
 * Marcas de la plantilla: <span data-campo="x">, <span data-check="x">☐</span>, <div data-firma="firmante|resuelto">
 * con un <div class="trazo"> adentro, y <section class="hoja" data-hoja="n" data-titulo="…"> por página.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "../almacen.js";

// "aprendiz" reemplazó a "ayudante" el 24/sep/2026: la Ley 59-2022 no permite plomería sin certificado de aprendiz o licencia.
export type TipoContrato = "plomero" | "aprendiz" | "anexo-nombre";
export const TIPOS: TipoContrato[] = ["plomero", "aprendiz", "anexo-nombre"];
/** Nombre de cada documento para el PDF, el certificado, los avisos y el panel. */
export const NOMBRE_DOC: Record<TipoContrato, string> = { plomero: "Acuerdo de afiliación de plomero", aprendiz: "Acuerdo de aprendiz", "anexo-nombre": "Anexo de corrección del nombre de Resuelto" };

export interface CampoDef { id: string; etiqueta: string; tipo: "texto" | "tel" | "opcion"; opciones?: { valor: string; etiqueta: string; check: string }[]; requerido: boolean; ayuda?: string }
const COMUNES_INICIO: CampoDef[] = [
  { id: "nombre", etiqueta: "Nombre completo", tipo: "texto", requerido: true },
  { id: "telefono", etiqueta: "Teléfono", tipo: "tel", requerido: true },
];
export const CAMPOS: Record<TipoContrato, CampoDef[]> = {
  // 25/sep/2026: la entidad quedó como Resuelto PR Home Services LLC (registro 591463); los ya firmados firman este anexo.
  "anexo-nombre": [...COMUNES_INICIO, { id: "municipio", etiqueta: "Municipio", tipo: "texto", requerido: true }],
  plomero: [
    ...COMUNES_INICIO,
    { id: "direccion", etiqueta: "Dirección", tipo: "texto", requerido: true },
    { id: "municipio", etiqueta: "Municipio", tipo: "texto", requerido: true },
    { id: "licencia", etiqueta: "Licencia de plomero", tipo: "opcion", requerido: true, opciones: [{ valor: "oficial", etiqueta: "Oficial", check: "lic_oficial" }, { valor: "maestro", etiqueta: "Maestro", check: "lic_maestro" }] },
    { id: "lic_num", etiqueta: "Número de licencia", tipo: "texto", requerido: true },
    { id: "colegiacion", etiqueta: "Número de colegiación", tipo: "texto", requerido: false, ayuda: "Si no lo tienes a mano, déjalo en blanco" },
  ],
  aprendiz: [
    ...COMUNES_INICIO,
    { id: "municipio", etiqueta: "Municipio", tipo: "texto", requerido: true },
    { id: "anos", etiqueta: "Años de experiencia", tipo: "texto", requerido: true },
    { id: "cert_num", etiqueta: "Número de tu certificado de aprendiz", tipo: "texto", requerido: true, ayuda: "El que sale en el certificado de la Junta Examinadora" },
    { id: "cert_vence", etiqueta: "Fecha en que vence el certificado", tipo: "texto", requerido: true },
    { id: "escuela", etiqueta: "Escuela donde estás matriculado", tipo: "texto", requerido: true },
  ],
};

const DIR_PLANTILLAS = path.join(RAIZ, "data", "plantillas");
export function plantilla(tipo: TipoContrato): string { return fs.readFileSync(path.join(DIR_PLANTILLAS, `contrato-${tipo}.html`), "utf8"); }

const esc = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** CSS de la plantilla y sus hojas, para mostrarlas en el celular (cada hoja en su propia sombra). */
export function partes(html: string): { css: string; hojas: { n: number; titulo: string; html: string }[] } {
  const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? "";
  const hojas = [...html.matchAll(/<section class="hoja" data-hoja="(\d+)" data-titulo="([^"]*)">([\s\S]*?)<\/section>/g)].map((m) => ({ n: Number(m[1]), titulo: m[2], html: m[3] }));
  return { css, hojas };
}

export interface DatosFirma { [campo: string]: string }
export interface Validado { ok: true; datos: DatosFirma }
/** Normaliza y valida los datos del formulario. Devuelve el primer error en español para mostrarlo. */
export function validarDatos(tipo: TipoContrato, entrada: unknown): Validado | { ok: false; error: string } {
  const d = (entrada && typeof entrada === "object" ? entrada : {}) as Record<string, unknown>;
  const out: DatosFirma = {};
  for (const c of CAMPOS[tipo]) {
    const v = String(d[c.id] ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (c.tipo === "opcion" && v && !c.opciones!.some((o) => o.valor === v)) return { ok: false, error: `Escoge una opción en "${c.etiqueta}".` };
    if (c.tipo === "tel" && v && v.replace(/\D/g, "").length < 10) return { ok: false, error: "El teléfono debe tener 10 dígitos." };
    if (c.requerido && !v) return { ok: false, error: `Falta: ${c.etiqueta}.` };
    out[c.id] = v;
  }
  return { ok: true, datos: out };
}

const PNG = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
/** Firma e iniciales: PNG en data URL, no vacías y de tamaño razonable (~400 KB máx.). */
export function imagenValida(dataUrl: unknown): dataUrl is string {
  return typeof dataUrl === "string" && PNG.test(dataUrl) && dataUrl.length > 400 && dataUrl.length < 550_000;
}

export interface Firmas {
  firmante: string;                                  // PNG data URL
  resuelto: { nombre: string; cargo: string; en: string };
}
function fechaLarga(iso: string, zona = "America/Puerto_Rico") {
  const f = new Date(iso);
  const partesF = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: zona, day: "numeric", month: "numeric", year: "numeric" }).formatToParts(f).map((p) => [p.type, p.value]));
  const mes = MESES[Number(partesF.month) - 1];
  return { dia: partesF.day, mes, ano: partesF.year, corta: `${partesF.day} de ${mes} de ${partesF.year}` };
}

/** Llena la plantilla: campos, casillas, firmas y la fecha/lugar de firma. */
export function llenar(tipo: TipoContrato, html: string, datos: DatosFirma, firmas: Firmas, firmadoEn: string): string {
  const f = fechaLarga(firmadoEn);
  const valores: Record<string, string> = { ...datos, nombre_firma: datos.nombre, lugar: datos.municipio || "", dia: f.dia, mes: f.mes, fecha: f.corta };
  let out = html.replace(/<span class="campo([^"]*)" data-campo="([a-z_]+)"><\/span>/g, (_m, clase, id) =>
    `<span class="campo${clase} lleno" data-campo="${id}">${esc(valores[id] ?? "") || "—"}</span>`);
  const marcados = new Set(CAMPOS[tipo].flatMap((c) => (c.opciones ?? []).filter((o) => o.valor === datos[c.id]).map((o) => o.check)));
  out = out.replace(/<span class="chk" data-check="([a-z_]+)">☐<\/span>/g, (_m, id) => `<span class="chk" data-check="${id}">${marcados.has(id) ? "☒" : "☐"}</span>`);
  out = out.replace(/(<div class="firma" data-firma="firmante"><div class="trazo">)/g, `$1<img class="firma-img" src="${firmas.firmante}" alt="Firma">`);
  const r = fechaLarga(firmas.resuelto.en);
  out = out.replace(/(<div class="firma" data-firma="resuelto"><div class="trazo">)/g, `$1<span class="firma-tipo">${esc(firmas.resuelto.nombre)}</span><span class="firma-meta">Firmado electrónicamente · ${r.corta}</span>`);
  // estilos de lo llenado (van en la plantilla impresa)
  return out.replace("</style>", `.campo.lleno{border-bottom:1px solid #8a97a3;min-width:0;height:auto;padding:0 4px;font-weight:600;color:#0F3D5E}
.firma-img{height:44px;display:block;margin-bottom:-6px}
.firma-tipo{font-family:'Caveat',cursive;font-size:17pt;color:#0F3D5E;display:block;line-height:1}
.firma-meta{display:block;font-size:7pt;color:#5C6670}
.cert td{font-size:9pt;vertical-align:top}.cert td:first-child{color:#5C6670;width:34%}
</style>`).replace("<style>", `<style>@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');`);
}

export const sha256 = (x: string | Buffer) => crypto.createHash("sha256").update(x).digest("hex");

export interface Auditoria {
  id: string; tipo: TipoContrato; nombre: string; telefono: string;
  emitido: { en: string; por: string }; abierto?: { en: string; ip: string }; firmado: { en: string; ip: string; ua: string };
  hojasIniciadas: number[]; hashContenido: string;
}
/** Hoja final de certificado (constancia de la firma): se agrega al PDF como última página. */
export function certificado(a: Auditoria): string {
  const fila = (k: string, v: string) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`;
  const zona = (iso: string) => new Date(iso).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", dateStyle: "long", timeStyle: "medium" }) + " (hora de PR)";
  return `<section class="hoja" data-hoja="99" data-titulo="Certificado"><div class="top"><div><div class="tag">Constancia de firma electrónica</div><h1>Certificado</h1></div></div>
<p>Este documento fue firmado electrónicamente en la plataforma de Resuelto PR Home Services LLC. La persona firmante completó sus datos, dibujó su firma, puso sus iniciales en cada página y aceptó firmar electrónicamente, conforme a la ley de transacciones electrónicas de Puerto Rico.</p>
<table class="cert">${fila("Documento", `${a.id} · ${a.tipo === "plomero" ? "Acuerdo de afiliación de plomero + Reglas de oro" : a.tipo === "aprendiz" ? "Acuerdo de aprendiz + secciones que aplican + Reglas de oro" : NOMBRE_DOC[a.tipo]}`)}
${fila("Firmante", `${a.nombre} · ${a.telefono}`)}
${fila("Emitido por Resuelto", `${zona(a.emitido.en)} · ${a.emitido.por}`)}
${a.abierto ? fila("Abierto por el firmante", `${zona(a.abierto.en)} · IP ${a.abierto.ip}`) : ""}
${fila("Firmado", `${zona(a.firmado.en)} · IP ${a.firmado.ip}`)}
${fila("Dispositivo", a.firmado.ua.slice(0, 160))}
${fila("Iniciales", `Páginas ${a.hojasIniciadas.join(", ")} (todas)`)}
${fila("Huella del contenido (SHA-256)", a.hashContenido)}</table>
<p class="pie">Cualquier cambio al contenido firmado cambia la huella. Resuelto conserva el original.</p></section>`;
}
