import "server-only";

import crypto from "node:crypto";

import { notificarCEO } from "../notificar-ceo";
import { dmSlack } from "../pulse/slack-dm";
import { leerArchivoLocal, storageLocal, subirArchivo, urlFirmada } from "../pulse/storage";
import { dinero, hojas, imagenValida, validarDatos } from "./documento";
import { pdfContrato } from "./pdf";
import { baseUrl, guardarFirma, type ContratoAib } from "./repo";

const sha256 = (x: string | Uint8Array) => crypto.createHash("sha256").update(x).digest("hex");

export const enlaceContrato = (c: Pick<ContratoAib, "token">, host: string | null = null) => `${baseUrl(host)}/contrato/${c.token}`;
export const enlacePdf = (c: Pick<ContratoAib, "token">, host: string | null = null) => `${baseUrl(host)}/api/contrato/${c.token}/pdf`;

export async function firmarContrato(c: ContratoAib, cuerpo: Record<string, unknown> | null, meta: { ip: string; ua: string }): Promise<{ ok: true; pdf: string } | { ok: false; error: string }> {
  if (c.estado !== "pendiente") return { ok: false, error: c.estado === "firmado" ? "Este contrato ya está firmado." : "Este enlace ya no es válido. Pídele a AI Borinquen uno nuevo." };
  const v = validarDatos(cuerpo?.datos);
  if (!v.ok) return v;
  if (!imagenValida(cuerpo?.firma)) return { ok: false, error: "Falta tu firma." };
  if (!imagenValida(cuerpo?.iniciales)) return { ok: false, error: "Faltan tus iniciales." };
  if (cuerpo?.acepto !== true) return { ok: false, error: "Tienes que aceptar firmar electrónicamente." };
  const en = new Date().toISOString();
  const hs = hojas(c.oferta, v.v, en);
  const iniciadas = new Set((Array.isArray(cuerpo?.hojasIniciadas) ? cuerpo.hojasIniciadas : []).map(Number));
  if (hs.some((h) => !iniciadas.has(h.n))) return { ok: false, error: "Falta poner tus iniciales en alguna página." };

  const hashContenido = sha256(JSON.stringify(hs) + cuerpo.firma + cuerpo.iniciales);
  const pdf = await pdfContrato({ codigo: c.codigo, hojas: hs, firma: cuerpo.firma as string, iniciales: cuerpo.iniciales as string, firmante: `${v.v.nombre} · ${v.v.email} · ${v.v.telefono}`, emitido: c.emitido, abierto: c.abierto, firmado: { en, ...meta }, hashContenido });
  const ruta = `aib-contratos/${c.codigo}-${c.token.slice(0, 8)}.pdf`;
  await subirArchivo(ruta, pdf, "application/pdf");
  const ok = await guardarFirma(c.id, { en, ip: meta.ip, ua: meta.ua, datos: v.v, hashContenido, hashPdf: sha256(pdf) }, ruta);
  if (!ok) return { ok: false, error: "Este contrato ya está firmado." };
  return { ok: true, pdf: enlacePdf(c) };
}

/** Aviso al que lo emitió (DM del bot por Slack) y a Elvin (Telegram + Slack). Nunca rompe la firma. */
export async function avisarFirma(c: ContratoAib, nombre: string) {
  if (c.emitido.prueba) return;
  const o = c.oferta, linea = `✍️ Contrato de AI Borinquen firmado · ${c.codigo}\n${nombre}${o.cliente.negocio ? ` · ${o.cliente.negocio}` : ""} · total ${dinero(o.costos.total)}${o.costos.hoy && o.costos.hoy !== o.costos.total ? ` (hoy ${dinero(o.costos.hoy)})` : ""}\nPDF: ${enlacePdf(c)}`;
  await Promise.allSettled([
    notificarCEO(linea),
    c.emitido.porEmail ? dmSlack(c.emitido.porEmail, linea) : Promise.resolve(false),
  ]);
}

/** El PDF firmado: link firmado de 5 min en Supabase; en local, los bytes. */
export async function archivoPdf(c: ContratoAib): Promise<{ url: string } | { bytes: Buffer } | null> {
  if (c.estado !== "firmado" || !c.pdfRuta) return null;
  if (storageLocal) return { bytes: await leerArchivoLocal(c.pdfRuta) };
  const url = await urlFirmada(c.pdfRuta, 300);
  return url ? { url } : null;
}
