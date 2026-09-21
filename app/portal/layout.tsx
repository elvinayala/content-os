import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tu portal AutoFlow · AI Borinquen",
  description: "Tus agentes, tus llamadas, tu embudo y tus solicitudes, en un solo lugar.",
  robots: { index: false, follow: false },
};

// Vista del prospecto/cliente: tema .borinquen (app/globals.css), sin sidebar admin.
// El acceso lo controla proxy.ts (token ?k= → cookie autoflow-portal).
export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="borinquen min-h-svh w-full bg-background text-foreground">{children}</div>;
}
