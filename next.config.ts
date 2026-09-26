import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los snapshots y la config viven en data/*.json y se leen con fs en
  // runtime; hay que incluirlos explícitamente en el trace del deploy
  // (Vercel) porque las rutas se arman dinámicamente.
  outputFileTracingIncludes: {
    "/**": ["./data/**", "./.claude/skills/**", "./vault/**"],
    "/api/cron/leaderboard": ["./public/leaderboard/**", "./public/marcas/level-up-logo-dark.png"],
  },
  // Pulse: PGlite (Postgres embebido, solo dev sin DATABASE_URL) y postgres.js van
  // como externos del bundle del server.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  experimental: {
    // Pulse: subir PDFs (PROPUESTA) por server action.
    serverActions: { bodySizeLimit: "10mb" },
  },
  // Cabeceras de seguridad. HSTS + nosniff + referrer para todo el sitio; para Pulse (datos de
  // clientes) además CSP estricta y prohibición de iframes.
  async headers() {
    const base = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
    ];
    const pulse = [
      ...base,
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://*.supabase.co",
          "font-src 'self' data:",
          "connect-src 'self' https://*.supabase.co" + (process.env.NODE_ENV === "development" ? " ws://localhost:* http://localhost:*" : ""),
          "frame-ancestors 'none'",
          "form-action 'self'",
          "base-uri 'self'",
          "object-src 'none'",
        ].join("; "),
      },
    ];
    return [
      { source: "/pulse", headers: pulse },
      { source: "/pulse/:path*", headers: pulse },
      { source: "/api/pulse/:path*", headers: pulse },
      { source: "/:path*", headers: base },
    ];
  },
};

export default nextConfig;
