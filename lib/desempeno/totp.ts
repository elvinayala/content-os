// Verificación en dos pasos (TOTP, RFC 6238): el código de 6 dígitos de Google/Microsoft Authenticator.
// Puro (solo node:crypto); lo prueba tests/totp.test.mjs con los vectores del RFC.
import { createHmac, randomBytes } from "node:crypto";

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(buf: Uint8Array): string {
  let bits = 0, valor = 0, out = "";
  for (const b of buf) {
    valor = (valor << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALFABETO[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALFABETO[(valor << (5 - bits)) & 31];
  return out;
}

export function desdeBase32(s: string): Buffer {
  const limpio = s.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0, valor = 0;
  const out: number[] = [];
  for (const c of limpio) {
    const i = ALFABETO.indexOf(c);
    if (i < 0) throw new Error("base32 inválido");
    valor = (valor << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const nuevoSecreto = () => base32(randomBytes(20)); // 160 bits

export function hotp(secreto: string, contador: number, digitos = 6): string {
  const c = Buffer.alloc(8);
  c.writeBigUInt64BE(BigInt(contador));
  const h = createHmac("sha1", desdeBase32(secreto)).update(c).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digitos).padStart(digitos, "0");
}

export const contadorDe = (ms: number, paso = 30) => Math.floor(ms / 1000 / paso);

/**
 * Verifica el código aceptando ±1 intervalo (reloj del teléfono un poco adelantado/atrasado).
 * Devuelve el contador usado (para no aceptar el mismo código dos veces) o null.
 */
export function verificarTotp(secreto: string, codigo: string, ahoraMs: number, ultimoUsado = -1): number | null {
  const limpio = codigo.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(limpio)) return null;
  const actual = contadorDe(ahoraMs);
  for (const c of [actual, actual - 1, actual + 1]) {
    if (c <= ultimoUsado) continue;
    if (hotp(secreto, c) === limpio) return c;
  }
  return null;
}

export const urlOtpauth = (secreto: string, cuenta: string, emisor = "Ritmo") =>
  `otpauth://totp/${encodeURIComponent(`${emisor}:${cuenta}`)}?secret=${secreto}&issuer=${encodeURIComponent(emisor)}&algorithm=SHA1&digits=6&period=30`;
