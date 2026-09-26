import type { Viewport } from "next";
import { Inter, Sora } from "next/font/google";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = { themeColor: "#0b0b0b" };

export default function FormularioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${sora.variable} ${inter.variable}`}>{children}</div>;
}
