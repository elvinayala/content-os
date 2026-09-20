import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los snapshots y la config viven en data/*.json y se leen con fs en
  // runtime; hay que incluirlos explícitamente en el trace del deploy
  // (Vercel) porque las rutas se arman dinámicamente.
  outputFileTracingIncludes: {
    "/**": ["./data/**", "./.claude/skills/**", "./vault/**"],
  },
};

export default nextConfig;
