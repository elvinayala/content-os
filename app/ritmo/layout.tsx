import type { Metadata, Viewport } from "next";

// Ritmo: asistencia y desempeño del equipo (app aparte de Pulse; mismas cuentas por dentro).
export const metadata: Metadata = {
  title: { default: "Ritmo", template: "%s · Ritmo" },
  description: "Asistencia y desempeño del equipo",
  manifest: "/ritmo/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Ritmo", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#191c2b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RitmoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="ritmo malla-ritmo min-h-svh antialiased">{children}</div>;
}
