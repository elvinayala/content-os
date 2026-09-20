import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jarvis HUD · CEO Command Center",
  description:
    "Métricas + Jarvis + Skills + Vault detrás de una sola pantalla.",
};

// La clase .hud scopea el tema navy+neón (mismo branding que el Command
// Center, globals.css). Sin sidebar: el HUD ES la ventana única.
export default function HudLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="hud flex h-svh w-full flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
