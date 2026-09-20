import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Hash de clave con scrypt de Node (sin deps). Formato: scrypt$N$saltHex$hashHex.
const N = 16384;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, 64, { N });
  return `scrypt$${N}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verificarPassword(password: string, almacenado: string | null | undefined): boolean {
  if (!almacenado) return false;
  const [algo, nStr, saltHex, hashHex] = almacenado.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const hash = scryptSync(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), 64, { N: Number(nStr) || N });
  const esperado = Buffer.from(hashHex, "hex");
  return hash.length === esperado.length && timingSafeEqual(hash, esperado);
}
