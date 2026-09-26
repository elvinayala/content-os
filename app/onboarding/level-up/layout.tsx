import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Bienvenido a Level Up Media",
  description: "5 minutos para preparar tu estrategia con Level Up Media.",
  robots: { index: false, follow: false },
  metadataBase: new URL("https://levelupmedia.vercel.app"),
  openGraph: { title: "Bienvenido a Level Up Media", description: "Vamos a preparar tu estrategia. 5 minutos.", siteName: "Level Up Media", type: "website" },
};
export const viewport: Viewport = { themeColor: "#0b0b0b" };

export default function OnboardingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${sora.variable} ${inter.variable}`}>{children}</div>;
}
