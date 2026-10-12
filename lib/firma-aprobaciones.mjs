// Aprobaciones FIRMADAS (12-oct-2026, M0 de AI Core). Cierra el hueco por el que cualquiera con CRON_SECRET (todos
// los puentes y agentes lo tienen) podía mandar al buzón `de:"elvin"` + `[APROBACIÓN] ok #id` y hacer que Nico
// ejecutara con permisos totales.
//
// Cómo funciona:
//  · Solo el SERVIDOR (Vercel) firma, y solo después de verificar a Elvin (Slack: firma de Slack + su usuario).
//    La llave privada (APROBACIONES_FIRMA_PRIVADA) vive únicamente en Vercel. Nunca en un puente ni en la Mac.
//  · Firma Ed25519 (asimétrica): los puentes VERIFICAN con la llave pública, que no es secreta. Así, aunque Nico
//    (modo total) lea su propio entorno, no puede firmar nada.
//  · Cada firma dice qué se aprueba (tipo, id, decisión), quién (por), por dónde (via), vence a los 15 minutos y
//    trae un nonce de un solo uso.
//  · El buzón (POST /api/agentes) rechaza cualquier mensaje que diga venir de Elvin sin una firma válida, y el puente
//    vuelve a verificar y lleva la cuenta de los nonces usados (no se puede reutilizar una aprobación).
import crypto from "node:crypto";

/** Quién puede aprobar cada tipo de cosa. Solo Elvin aprueba las solicitudes que ejecuta Nico. */
export const AUTORIZADOS = { "nico-solicitud": ["elvin"] };
export const VIGENCIA_MS = 15 * 60 * 1000;
const PREFIJO = "⟦firma ";

/** Llave PÚBLICA de verificación (no es secreta). La privada solo existe en Vercel. */
export const CLAVE_PUBLICA_APROBACIONES = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA3cv42yQ/TJhpLV32Kt1nTMaaI9vRfe96Dhee35EVSxo=
-----END PUBLIC KEY-----
`;

const b64 = (x) => Buffer.from(x).toString("base64url");

/** La llave privada como viene del entorno: PEM, o el PEM en base64 (una sola línea, más cómodo en Vercel). */
export function llavePrivadaDeEnv(valor) {
  const v = String(valor ?? "").trim();
  if (!v) return "";
  return v.startsWith("-----BEGIN") ? v : Buffer.from(v, "base64").toString("utf8");
}

/** "[APROBACIÓN] ok #12 nota" → { decision: "ok", id: "12", nota }. */
export const APROBACION_NICO = /^\[APROBACIÓN\]\s*(ok|no)\s*#?(\d+)\s*([\s\S]*)$/i;
export function leerAprobacionNico(texto) {
  const { texto: limpio, token } = separarFirma(texto);
  const m = limpio.match(APROBACION_NICO);
  return m ? { decision: m[1].toLowerCase(), id: m[2], nota: m[3].trim(), token } : null;
}

/**
 * ¿Se acepta en el buzón un mensaje con este remitente? Nadie puede escribir como Elvin salvo una aprobación firmada
 * por el servidor para exactamente lo que dice el texto. (Los demás remitentes siguen como hoy.)
 */
export function remitentePermitido({ de, para, texto, firmaMac, macObligatoria = false }, clavePublicaPem = CLAVE_PUBLICA_APROBACIONES, ahora = Date.now(), clavePublicaMac = CLAVE_PUBLICA_MAC) {
  if (de === "mac") {
    // La Mac solo es "la Mac de Elvin" con su firma. Sin firma: se rechaza si es obligatoria; si no (transición), entra
    // como NO verificada y no recibe ningún privilegio (el puente de Nico la trata como delegada).
    const v = verificarMensajeMac(firmaMac, { para, texto }, clavePublicaMac, ahora);
    if (v.ok) return { ok: true, verificado: "mac", nonce: v.datos.nonce };
    if (firmaMac || macObligatoria) return { ok: false, motivo: `mensaje "de la Mac" rechazado: ${v.motivo}` };
    return { ok: true, verificado: null };
  }
  if (de !== "elvin") return { ok: true, verificado: null };
  const ap = leerAprobacionNico(texto);
  if (!ap) return { ok: false, motivo: "nadie puede escribir en el buzón como Elvin" };
  const v = verificarAprobacion(ap.token, { tipo: "nico-solicitud", id: ap.id, decision: ap.decision }, clavePublicaPem, ahora);
  return v.ok ? { ok: true, verificado: "elvin", nonce: v.datos.nonce } : { ok: false, motivo: `aprobación rechazada: ${v.motivo}` };
}

/** Firma una decisión. Lo llama SOLO el servidor, después de verificar a la persona. */
export function firmarAprobacion({ tipo, id, decision, por, via }, clavePrivadaPem, { ahora = Date.now(), vigenciaMs = VIGENCIA_MS } = {}) {
  clavePrivadaPem = llavePrivadaDeEnv(clavePrivadaPem);
  if (!clavePrivadaPem) throw new Error("falta la llave privada de firma (APROBACIONES_FIRMA_PRIVADA)");
  const datos = { v: 1, tipo, id: String(id), decision, por, via, exp: ahora + vigenciaMs, nonce: crypto.randomUUID() };
  const cuerpo = b64(JSON.stringify(datos));
  const firma = crypto.sign(null, Buffer.from(cuerpo), crypto.createPrivateKey(clavePrivadaPem));
  return `v1.${cuerpo}.${firma.toString("base64url")}`;
}

/** El token como línea aparte al final del texto del mensaje. */
export const conFirma = (texto, token) => `${texto}\n${PREFIJO}${token}⟧`;

/** Separa el texto y el token (si lo hay). */
export function separarFirma(texto) {
  const m = String(texto ?? "").match(/\n?⟦firma ([A-Za-z0-9._-]+)⟧\s*$/);
  return m ? { texto: String(texto).slice(0, m.index).trimEnd(), token: m[1] } : { texto: String(texto ?? ""), token: null };
}

/**
 * Verifica una aprobación contra lo que se espera ejecutar. No consume el nonce (eso lo hace quien ejecuta, con
 * `usarNonce`). Devuelve { ok, motivo?, datos? }.
 */
export function verificarAprobacion(token, esperado, clavePublicaPem = CLAVE_PUBLICA_APROBACIONES, ahora = Date.now()) {
  if (!token) return { ok: false, motivo: "no trae firma" };
  const partes = String(token).split(".");
  if (partes.length !== 3 || partes[0] !== "v1") return { ok: false, motivo: "firma con formato desconocido" };
  let valida = false;
  try {
    valida = crypto.verify(null, Buffer.from(partes[1]), crypto.createPublicKey(clavePublicaPem), Buffer.from(partes[2], "base64url"));
  } catch {
    valida = false;
  }
  if (!valida) return { ok: false, motivo: "firma inválida (no la hizo el servidor o la alteraron)" };
  let d;
  try {
    d = JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8"));
  } catch {
    return { ok: false, motivo: "firma ilegible" };
  }
  if (d.v !== 1) return { ok: false, motivo: "versión de firma desconocida" };
  if (!(AUTORIZADOS[d.tipo] || []).includes(d.por)) return { ok: false, motivo: `${d.por} no puede aprobar ${d.tipo}` };
  if (typeof d.exp !== "number" || d.exp <= ahora) return { ok: false, motivo: "la aprobación venció" };
  if (esperado) {
    if (esperado.tipo && d.tipo !== esperado.tipo) return { ok: false, motivo: "la firma es de otro tipo de aprobación" };
    if (esperado.id !== undefined && String(d.id) !== String(esperado.id)) return { ok: false, motivo: `la firma es para la #${d.id}, no para la #${esperado.id}` };
    if (esperado.decision && d.decision !== esperado.decision) return { ok: false, motivo: "la firma dice otra decisión" };
  }
  return { ok: true, datos: d };
}

/**
 * Anti-reutilización: marca el nonce como usado. `store` es un objeto { [nonce]: exp } que el puente guarda en su
 * estado. Devuelve false si ya se había usado. Limpia los vencidos.
 */
export function usarNonce(store, nonce, exp, ahora = Date.now()) {
  for (const [n, e] of Object.entries(store)) if (e <= ahora) delete store[n];
  if (!nonce || store[nonce]) return false;
  store[nonce] = exp;
  return true;
}

// ── Credencial de la Mac de Elvin (12-oct) ──────────────────────────────────────────────────────────────────────────
// Los mensajes "de mac" (las sesiones de Claude de la Mac de Elvin) llevan una firma Ed25519 hecha con una llave que
// SOLO vive en el Llavero de esa Mac (servicio aib-dev, cuenta CONTENT_OS_MAC_FIRMA). CRON_SECRET ya no basta para
// hacerse pasar por la Mac: el servidor y el puente de Nico verifican con la llave pública.

/** Llave PÚBLICA de la Mac de Elvin (no es secreta). */
export const CLAVE_PUBLICA_MAC = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAfOpc2E3S4cOsW/VYnl1u5GfYuN4ugb/5JIEmTd2wrWM=
-----END PUBLIC KEY-----
`;
export const VIGENCIA_MAC_MS = 5 * 60 * 1000;
const huella = (texto) => crypto.createHash("sha256").update(String(texto ?? "")).digest("base64url");

/** La firma la hace la Mac al mandar (scripts/agentes.mjs). Cubre de, para y el texto exacto. */
export function firmarMensajeMac({ para, texto }, clavePrivadaPem, { ahora = Date.now(), vigenciaMs = VIGENCIA_MAC_MS } = {}) {
  clavePrivadaPem = llavePrivadaDeEnv(clavePrivadaPem);
  if (!clavePrivadaPem) throw new Error("falta la llave de la Mac");
  const datos = { v: 1, tipo: "buzon-mac", de: "mac", para: String(para), h: huella(texto), exp: ahora + vigenciaMs, nonce: crypto.randomUUID() };
  const cuerpo = b64(JSON.stringify(datos));
  return `v1.${cuerpo}.${crypto.sign(null, Buffer.from(cuerpo), crypto.createPrivateKey(clavePrivadaPem)).toString("base64url")}`;
}

/** ¿Esta firma es de la Mac de Elvin para exactamente este mensaje? */
export function verificarMensajeMac(token, { para, texto }, clavePublicaPem = CLAVE_PUBLICA_MAC, ahora = Date.now()) {
  if (!token) return { ok: false, motivo: "no trae la firma de la Mac" };
  const partes = String(token).split(".");
  if (partes.length !== 3 || partes[0] !== "v1") return { ok: false, motivo: "firma de la Mac con formato desconocido" };
  let valida = false;
  try {
    valida = crypto.verify(null, Buffer.from(partes[1]), crypto.createPublicKey(clavePublicaPem), Buffer.from(partes[2], "base64url"));
  } catch {
    valida = false;
  }
  if (!valida) return { ok: false, motivo: "la firma no es de la Mac de Elvin" };
  let d;
  try { d = JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8")); } catch { return { ok: false, motivo: "firma ilegible" }; }
  if (d.v !== 1 || d.tipo !== "buzon-mac" || d.de !== "mac") return { ok: false, motivo: "la firma no es de un mensaje de la Mac" };
  if (String(d.para) !== String(para)) return { ok: false, motivo: "la firma es para otro destinatario" };
  if (d.h !== huella(texto)) return { ok: false, motivo: "el texto no es el que se firmó" };
  if (typeof d.exp !== "number" || d.exp <= ahora) return { ok: false, motivo: "la firma de la Mac venció" };
  return { ok: true, datos: d };
}
