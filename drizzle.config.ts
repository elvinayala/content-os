import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env.local");
} catch {}

// Con DATABASE_URL_DIRECT/DATABASE_URL apunta a Supabase (DDL por el puerto 5432, session
// mode). Sin ninguna, usa el PGlite local de ./.pulse-db (mismo fallback que lib/pulse/db.ts).
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: ["./lib/pulse/schema.ts", "./lib/portal/schema.ts"],
  out: "./drizzle",
  tablesFilter: ["pulse_*", "autoflow_*"],
  ...(url ? { dbCredentials: { url } } : { driver: "pglite", dbCredentials: { url: "./.pulse-db" } }),
});
