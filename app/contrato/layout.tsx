import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = { themeColor: "#050E0A" };
export const metadata: Metadata = { title: "Tu acuerdo · AI Borinquen", robots: { index: false, follow: false } };

export default function ContratoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${outfit.variable} ${inter.variable}`}>{children}</div>;
}
