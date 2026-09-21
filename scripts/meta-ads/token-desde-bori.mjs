// Copia el token largo de Meta que Bori guardó al "Conectar Meta" (dueño) a
// .env.local como META_ADS_TOKEN, sin imprimirlo. Lo corre Elvin a mano: el
// agente no puede leer secretos de la DB de producción de Bori por sí solo.
//
//   node scripts/meta-ads/token-desde-bori.mjs            # usa el dueño de Bori
//   node scripts/meta-ads/token-desde-bori.mjs otro@mail   # otra cuenta de Bori
//
// Requiere la CLI de Railway autenticada (ya lo está en esta Mac) y el módulo
// `pg` del repo de Bori (se toma prestado de allí, no se instala nada aquí).
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BORI = "/Users/elvinayala/Documents/Claude/Projects/ai borinquen plataforma";
const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const ENV = resolve(ROOT, ".env.local");
const email = (process.argv[2] || "levelupmediapr@gmail.com").toLowerCase();

// La DATABASE_URL del servicio bori apunta al host interno de Railway
// (postgres.railway.internal), que no resuelve desde la Mac: se usa la pública.
const kv = execSync("npx --yes @railway/cli variables --service Postgres --kv", { cwd: BORI, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const url = (kv.split("\n").find((l) => l.startsWith("DATABASE_PUBLIC_URL=")) || "").slice("DATABASE_PUBLIC_URL=".length).trim();
if (!url) { console.error("No encontré DATABASE_PUBLIC_URL en Railway (servicio Postgres)."); process.exit(1); }

const { Client } = createRequire(resolve(BORI, "package.json"))("pg");
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query("select email, conn_secure->'meta' as meta from users where lower(email)=$1", [email]);
await c.end();
if (!r.rows.length) { console.error("No existe " + email + " en Bori."); process.exit(1); }
const meta = r.rows[0].meta || {};
const blob = meta.token || meta.accessToken || "";
if (!blob) { console.error(email + " no tiene Meta conectado en Bori (campos: " + Object.keys(meta).join(",") + ")."); process.exit(1); }

// Bori guarda el token cifrado (AES-256-GCM, crypto-util.js, clave SECRETS_KEY
// del servicio bori). Se descifra con el mismo módulo y la misma clave.
const kvBori = execSync("npx --yes @railway/cli variables --service bori --kv", { cwd: BORI, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
for (const k of ["SECRETS_KEY", "JWT_SECRET"]) {
  const v = (kvBori.split("\n").find((l) => l.startsWith(k + "=")) || "").slice(k.length + 1).trim();
  if (v) process.env[k] = v;
}
const { decrypt } = createRequire(resolve(BORI, "package.json"))(resolve(BORI, "crypto-util.js"));
const tok = blob.startsWith("v1:") ? decrypt(blob) : blob;
if (!tok) { console.error("No pude descifrar el token (¿SECRETS_KEY distinta?)."); process.exit(1); }
if (!/^[A-Za-z0-9_-]{50,}$/.test(tok)) { console.error("El token descifrado no tiene forma de token de Meta."); process.exit(1); }

let s = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
s = s.replace(/^META_ADS_TOKEN=.*$/m, "").trimEnd() + "\nMETA_ADS_TOKEN=" + tok + "\n";
writeFileSync(ENV, s);
console.log("Listo: META_ADS_TOKEN (" + tok.length + " chars, de " + email + ") guardado en .env.local. No se mostró en pantalla.");
