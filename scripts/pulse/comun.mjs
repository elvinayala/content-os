// Helpers compartidos por los scripts de Pulse (seed, migración). Sin TS ni aliases "@/":
// se corren con `node --env-file-if-exists=.env.local scripts/...`.
import { randomBytes, scryptSync } from "node:crypto";
import path from "node:path";

// Conexión: Supabase (DATABASE_URL_DIRECT o DATABASE_URL) o PGlite local (./.pulse-db),
// el mismo fallback que lib/pulse/db.ts. Devuelve { query(text, params) → rows, close() }.
export async function conectar() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { prepare: false, max: 3 });
    return {
      motor: "postgres",
      query: (text, params = []) => sql.unsafe(text, params),
      close: () => sql.end({ timeout: 5 }),
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const client = new PGlite(path.join(process.cwd(), ".pulse-db"));
  await client.waitReady;
  return {
    motor: "pglite",
    query: async (text, params = []) => (await client.query(text, params)).rows,
    close: () => client.close(),
  };
}

// Mismo formato que lib/pulse/password.ts.
export function hashPassword(password) {
  const N = 16384;
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, 64, { N });
  return `scrypt$${N}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function nuevoId() {
  return Math.random().toString(36).slice(2, 10);
}

export function slugify(texto) {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "tablero"
  );
}

export async function upsertUsuario(db, { email, nombre, rol = "miembro", activo = true, password, color = null, mondayId = null }) {
  const hash = password ? hashPassword(password) : null;
  const rows = await db.query(
    `INSERT INTO pulse_users (email, nombre, rol, activo, password_hash, color, monday_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE SET
       nombre = EXCLUDED.nombre,
       rol = CASE WHEN EXCLUDED.rol = 'admin' THEN 'admin' ELSE pulse_users.rol END,
       activo = CASE WHEN $8 THEN pulse_users.activo ELSE (pulse_users.activo OR EXCLUDED.activo) END,
       password_hash = COALESCE(EXCLUDED.password_hash, pulse_users.password_hash),
       color = COALESCE(pulse_users.color, EXCLUDED.color),
       monday_id = COALESCE(EXCLUDED.monday_id, pulse_users.monday_id)
     RETURNING id, email, nombre, rol, activo`,
    [email.toLowerCase().trim(), nombre, rol, activo ?? false, hash, color, mondayId, activo === undefined],
  );
  return rows[0];
}
