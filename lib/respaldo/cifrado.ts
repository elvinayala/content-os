// Cifrado de los respaldos: gzip + AES-256-GCM con RESPALDO_CLAVE (32 bytes en base64). Formato:
// "EARS1" (5 bytes) + iv (12) + tag (16) + datos. Sin la clave el archivo no sirve para nada: por eso
// puede vivir fuera (Vercel Blob, la Mac, Drive) aunque tenga nómina, documentos y contratos.
// Puro (solo node:crypto y node:zlib); tests en tests/respaldo.test.mjs.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";

const MAGIC = Buffer.from("EARS1");

export function claveDe(base64: string | undefined): Buffer {
  if (!base64) throw new Error("Falta RESPALDO_CLAVE");
  const k = Buffer.from(base64, "base64");
  if (k.length !== 32) throw new Error("RESPALDO_CLAVE debe ser de 32 bytes (base64)");
  return k;
}

export function cifrar(datos: Buffer | Uint8Array | string, clave: Buffer): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", clave, iv);
  const cuerpo = Buffer.concat([c.update(gzipSync(typeof datos === "string" ? Buffer.from(datos) : datos, { level: 9 })), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), cuerpo]);
}

export function descifrar(archivo: Buffer | Uint8Array, clave: Buffer): Buffer {
  const b = Buffer.from(archivo);
  if (!b.subarray(0, 5).equals(MAGIC)) throw new Error("No es un respaldo cifrado de EA Market");
  const iv = b.subarray(5, 17);
  const tag = b.subarray(17, 33);
  const d = createDecipheriv("aes-256-gcm", clave, iv);
  d.setAuthTag(tag);
  return gunzipSync(Buffer.concat([d.update(b.subarray(33)), d.final()]));
}

// Huella corta para comprobar que dos copias son la misma sin abrirlas.
export const huella = (b: Buffer | Uint8Array) => createHash("sha256").update(b).digest("hex").slice(0, 16);

// Qué archivos del almacenamiento van al respaldo de archivos: todo menos los videos de motion
// (se regeneran), los propios respaldos y la papelera (ya están en el respaldo de la base).
export function archivoRespaldable(nombre: string): boolean {
  return !/^(motion|respaldos|papelera)\//.test(nombre) && !nombre.endsWith("/.emptyFolderPlaceholder");
}

// Rotación: de una lista de "base/YYYY-MM-DD.json.gz.enc", cuáles borrar para quedarse con `n`.
export function sobrantes(nombres: string[], n: number): string[] {
  return [...nombres].filter((x) => /\d{4}-\d{2}-\d{2}/.test(x)).sort().reverse().slice(n);
}

// Compara conteos del respaldo contra la base viva: devuelve las tablas que no cuadran.
export function diferencias(respaldo: Record<string, number>, vivo: Record<string, number>): string[] {
  const tablas = new Set([...Object.keys(respaldo), ...Object.keys(vivo)]);
  return [...tablas].filter((t) => (respaldo[t] ?? -1) !== (vivo[t] ?? -1)).sort();
}
