import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// App de clientes de Level Up (app.levelupmediapr.net): se instala en el teléfono sin App Store ni Play Store.
export const metadata: Metadata = {
  title: { default: "Level Up", template: "%s · Level Up" },
  description: "Tu cuenta con Level Up Media: en qué vamos, tus resultados, tus archivos y tu equipo.",
  manifest: "/cliente/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Level Up", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0b0b0b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function ClienteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`lu-app lu-fondo-app ${sora.variable} ${inter.variable} min-h-svh antialiased`}>{children}</div>;
}
