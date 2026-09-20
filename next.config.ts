import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los snapshots y la config viven en data/*.json y se leen con fs en
  // runtime; hay que incluirlos explícitamente en el trace del deploy
  // (Vercel) porque las rutas se arman dinámicamente.
  outputFileTracingIncludes: {
    "/**": ["./data/**", "./.claude/skills/**", "./vault/**"],
  },
  // Pulse: PGlite (Postgres embebido, solo dev sin DATABASE_URL) y postgres.js van
  // como externos del bundle del server.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  experimental: {
    // Pulse: subir PDFs (PROPUESTA) por server action.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
