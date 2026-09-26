import "server-only";

import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import postgres from "postgres";

import * as desempeno from "../desempeno/schema";
import * as leads from "../leads/schema";
import * as portal from "../portal/schema";
import * as pulse from "./schema";

// Un solo cliente para Pulse, el Portal AutoFlow (lib/portal) y Desempeño (lib/desempeno): misma base.
const schema = { ...pulse, ...portal, ...desempeno, ...leads };

// Conexión a la base de Pulse.
//  - Con DATABASE_URL (Supabase, transaction pooler :6543): postgres.js con prepare:false.
//  - Sin DATABASE_URL (dev local sin Postgres): PGlite embebido en ./.pulse-db (gitignoreado).
//    Las migraciones se aplican al arrancar (migrate() de drizzle) en ese caso.
// Singleton en globalThis para sobrevivir al HMR en dev.

export type DbPulse = ReturnType<typeof drizzlePg<typeof schema>>;

const g = globalThis as unknown as { __pulseDb?: Promise<DbPulse> };

async function crear(): Promise<DbPulse> {
  // En dev local se usa el pooler de SESIÓN (:5432): el de transacciones (:6543) deja consultas
  // trabadas en "ClientRead" cuando la Mac dispara varias en paralelo (24/sep/2026). Prod no cambia.
  const url = process.env.NODE_ENV === "development" && process.env.DATABASE_URL_DIRECT ? process.env.DATABASE_URL_DIRECT : process.env.DATABASE_URL;
  if (url) {
    const sql = postgres(url, { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 10 });
    return drizzlePg(sql, { schema });
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const path = await import("node:path");
  const client = new PGlite(path.join(process.cwd(), ".pulse-db"));
  const db = drizzlePglite(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db as unknown as DbPulse;
}

export function db(): Promise<DbPulse> {
  if (!g.__pulseDb) g.__pulseDb = crear();
  return g.__pulseDb;
}

export const usaPglite = !process.env.DATABASE_URL;
